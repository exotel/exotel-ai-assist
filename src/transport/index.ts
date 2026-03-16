import { WorkerInboundMessage } from "../types";

type TransportMessageHandler = (msg: WorkerInboundMessage) => void;

// Internal-only message used for the leader-sync handshake.
// Never forwarded to the controller.
type InternalMessage = WorkerInboundMessage | { type: "JOIN" };

export interface ITransport {
  connect(url: string, authToken: string): void;
  disconnect(): void;
  send(payload: string): void;
  onMessage(handler: TransportMessageHandler): void;
  destroy(): void;
}

export class BroadcastChannelTransport implements ITransport {
  private channel: BroadcastChannel;
  private socket: WebSocket | null = null;
  private isLeader = false;
  private socketConnected = false;
  private handler: TransportMessageHandler | null = null;
  private pendingUrl: string | null = null;
  private pendingAuthToken: string | null = null;
  private lockReleaser: (() => void) | null = null;

  /**
   * @param sessionHash - A hash of all connection-relevant params (see
   *   Utils.hashParams). Tabs with identical params share one WebSocket;
   *   any differing param produces a different hash and therefore a fully
   *   independent connection.
   */
  constructor(sessionHash: string) {
    const channelName = `exotel-ai-assist:${sessionHash}`;
    const lockName = `exotel-ai-assist-leader:${sessionHash}`;

    this.channel = new BroadcastChannel(channelName);
    this.channel.onmessage = (ev: MessageEvent<InternalMessage>) => {
      const data = ev.data;

      if (this.isLeader) {
        // A new follower tab has opened. If our socket is already connected,
        // broadcast CONNECTED so the follower can sync its status immediately.
        if (data.type === "JOIN" && this.socketConnected) {
          this.channel.postMessage({ type: "CONNECTED" } satisfies WorkerInboundMessage);
        }
        return;
      }

      // Follower: forward every message except JOIN to the controller handler.
      if (data.type !== "JOIN") {
        this.handler?.(data as WorkerInboundMessage);
      }
    };

    this._electLeader(lockName);

    // Announce presence so the current leader can send us the current state.
    // BroadcastChannel never delivers to the sender itself, so this is safe
    // regardless of whether this tab ends up being the leader.
    this.channel.postMessage({ type: "JOIN" } satisfies InternalMessage);
  }

  private _electLeader(lockName: string): void {
    navigator.locks
      .request(lockName, { ifAvailable: false }, (lock) => {
        if (lock) {
          this.isLeader = true;
          if (this.pendingUrl && this.pendingAuthToken) {
            this._openSocket(this.pendingUrl, this.pendingAuthToken);
            this.pendingUrl = null;
            this.pendingAuthToken = null;
          }
          // Hold the lock for the lifetime of this transport instance.
          return new Promise<void>((resolve) => {
            this.lockReleaser = resolve;
          });
        }
        return Promise.resolve();
      })
      .catch(() => {
        // Navigator Locks not supported — every tab owns its own WebSocket.
        this.isLeader = true;
      });
  }

  private _openSocket(url: string, authToken: string): void {
    if (this.socket) {
      this.socket.close(1000, "reconnecting");
    }

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.socketConnected = true;

      this.socket!.send(JSON.stringify({ type: "auth", access_token: authToken }));

      const msg: WorkerInboundMessage = { type: "CONNECTED" };
      this.handler?.(msg);
      this.channel.postMessage(msg);
    };

    this.socket.onmessage = (ev) => {
      const msg: WorkerInboundMessage = { type: "MESSAGE", payload: ev.data as string };
      this.handler?.(msg);
      this.channel.postMessage(msg);
    };

    this.socket.onerror = () => {
      const msg: WorkerInboundMessage = { type: "ERROR", message: "WebSocket error" };
      this.handler?.(msg);
      this.channel.postMessage(msg);
    };

    this.socket.onclose = (ev) => {
      this.socketConnected = false;
      const msg: WorkerInboundMessage = { type: "DISCONNECTED", code: ev.code };
      this.handler?.(msg);
      this.channel.postMessage(msg);
      this.socket = null;
    };
  }

  connect(url: string, authToken: string): void {
    if (this.isLeader) {
      this._openSocket(url, authToken);
    } else {
      this.pendingUrl = url;
      this.pendingAuthToken = authToken;
    }
  }

  disconnect(): void {
    if (this.isLeader && this.socket) {
      this.socket.close(1000, "disconnect_requested");
      this.socket = null;
    }
  }

  send(payload: string): void {
    if (this.isLeader && this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(payload);
    }
  }

  onMessage(handler: TransportMessageHandler): void {
    this.handler = handler;
  }

  destroy(): void {
    this.disconnect();
    this.channel.close();
    this.lockReleaser?.();
  }
}

export function createTransport(sessionHash: string): ITransport {
  return new BroadcastChannelTransport(sessionHash);
}

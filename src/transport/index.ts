import { WorkerInboundMessage } from "../types";

type TransportMessageHandler = (msg: WorkerInboundMessage) => void;

/**
 * ITransport — minimal interface that BroadcastChannelTransport satisfies.
 */
export interface ITransport {
  connect(url: string): void;
  disconnect(): void;
  send(payload: string): void;
  onMessage(handler: TransportMessageHandler): void;
  destroy(): void;
}

// ---------------------------------------------------------------------------
// BroadcastChannel + Navigator Locks transport
// ---------------------------------------------------------------------------

const BC_CHANNEL_NAME = "exotel-ai-assist";
const LOCK_NAME = "exotel-ai-assist-leader";

export class BroadcastChannelTransport implements ITransport {
  private channel: BroadcastChannel;
  private socket: WebSocket | null = null;
  private isLeader = false;
  private handler: TransportMessageHandler | null = null;
  private pendingUrl: string | null = null;
  private lockReleaser: (() => void) | null = null;

  constructor() {
    this.channel = new BroadcastChannel(BC_CHANNEL_NAME);
    this.channel.onmessage = (ev: MessageEvent<WorkerInboundMessage>) => {
      if (!this.isLeader) {
        this.handler?.(ev.data);
      }
    };
    this._electLeader();
  }

  private _electLeader(): void {
    navigator.locks
      .request(LOCK_NAME, { ifAvailable: false }, (lock) => {
        if (lock) {
          this.isLeader = true;
          if (this.pendingUrl) {
            this._openSocket(this.pendingUrl);
            this.pendingUrl = null;
          }
          // Hold lock indefinitely while this tab is the leader
          return new Promise<void>((resolve) => {
            this.lockReleaser = resolve;
          });
        }
        return Promise.resolve();
      })
      .catch(() => {
        // Navigator Locks not available — fall back to direct WebSocket per tab
        this.isLeader = true;
      });
  }

  private _openSocket(url: string): void {
    if (this.socket) {
      this.socket.close(1000, "reconnecting");
    }
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
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

    this.socket.onclose = () => {
      const msg: WorkerInboundMessage = { type: "DISCONNECTED" };
      this.handler?.(msg);
      this.channel.postMessage(msg);
      this.socket = null;
    };
  }

  connect(url: string): void {
    if (this.isLeader) {
      this._openSocket(url);
    } else {
      this.pendingUrl = url;
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

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createTransport(): ITransport {
  return new BroadcastChannelTransport();
}

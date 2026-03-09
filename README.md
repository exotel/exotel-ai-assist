# @exotel-npm-dev/exotel-ai-assist

Real-time AI suggestions, live transcript, and sentiment analysis for Exotel calls — delivered over WebSocket.

## Features

- **One WebSocket per browser session** — uses `SharedWorker` (with `BroadcastChannel` + Navigator Locks fallback) so multiple open tabs share a single connection
- **Auto-reconnect** with exponential back-off
- **Live `callSid` switching** — closing the old connection and opening a new one automatically
- **Framework-agnostic** — works in Vue, Angular, vanilla JS, or plain HTML
- **React subpath** for React apps that want to avoid bundling React twice
- **Headless controller** subpath for raw data with no UI

---

## Installation

```bash
npm install @exotel-npm-dev/exotel-ai-assist
```

React is **bundled inside** the default build. You do **not** need React installed for the default entry point.

---

## Quick Start — Plain HTML / Vanilla JS

```html
<div id="ai-assist" style="height: 500px;"></div>

<script type="module">
  import { mountExotelAIAssist } from "@exotel-npm-dev/exotel-ai-assist";

  mountExotelAIAssist(document.getElementById("ai-assist"), {
    authToken: "your-auth-token",
    callSid: "CALL-SID-001",
    // wssBaseUrl is optional — defaults to the Exotel AI Assist backend
  });
</script>
```

### Updating params without remounting

```js
import { updateExotelAIAssistParams } from "@exotel-npm-dev/exotel-ai-assist";

// Triggers reconnect because callSid changed
updateExotelAIAssistParams(container, { callSid: "CALL-SID-002" });
```

### Unmounting

```js
import { unmountExotelAIAssist } from "@exotel-npm-dev/exotel-ai-assist";

unmountExotelAIAssist(container);
```

---

## React App — `/react` subpath

Import from the subpath to avoid bundling React twice:

```tsx
import { ExotelAIAssist } from "@exotel-npm-dev/exotel-ai-assist/react";

function AgentDashboard() {
  return (
    <div style={{ height: 500 }}>
      {/* wssBaseUrl is optional — defaults to the Exotel AI Assist backend */}
      <ExotelAIAssist authToken="your-auth-token" callSid="CALL-SID-001" />
    </div>
  );
}
```

### Using the hook directly

```tsx
import { useExotelAIAssist } from "@exotel-npm-dev/exotel-ai-assist/react";

function MyCustomUI({ callSid }: { callSid: string }) {
  const { status, suggestions, transcripts, sentiment, lastError } = useExotelAIAssist({
    authToken: "your-auth-token",
    callSid,
    // wssBaseUrl defaults to the Exotel AI Assist backend
  });

  return (
    <div>
      <p>Status: {status}</p>
      {suggestions.map((s) => (
        <p key={s.id}>{s.text}</p>
      ))}
    </div>
  );
}
```

### Context Provider (share state across components)

```tsx
import { ExotelAIAssistProvider, useExotelAIAssistContext } from "@exotel-npm-dev/exotel-ai-assist/react";

function App() {
  return (
    <ExotelAIAssistProvider authToken="your-auth-token" callSid="CALL-SID-001">
      <SuggestionsPanel />
      <TranscriptPanel />
    </ExotelAIAssistProvider>
  );
}

function SuggestionsPanel() {
  const { suggestions } = useExotelAIAssistContext();
  return (
    <ul>
      {suggestions.map((s) => (
        <li key={s.id}>{s.text}</li>
      ))}
    </ul>
  );
}
```

---

## Headless Controller — `/controller` subpath

For Vue, Angular, or any other framework where you want raw data with no React UI:

```js
import { ExotelAIAssistController } from "@exotel-npm-dev/exotel-ai-assist/controller";

const ctrl = new ExotelAIAssistController({
  authToken: "your-auth-token",
  callSid: "CALL-SID-001",
  // wssBaseUrl defaults to the Exotel AI Assist backend
  debug: true,
});

ctrl.on("suggestion", (s) => console.log("Suggestion:", s));
ctrl.on("transcript", (t) => console.log("Transcript:", t));
ctrl.on("sentiment", (s) => console.log("Sentiment:", s));
ctrl.on("statusChange", (status) => console.log("Status:", status));
ctrl.on("error", (err) => console.error("Error:", err));

ctrl.connect();

// Later — switch to a new call
ctrl.setParams({ callSid: "CALL-SID-002" });

// Clean up
ctrl.destroy();
```

---

## API Reference

### `mountExotelAIAssist(container, params)`

Mounts the widget into a DOM element.

| Parameter   | Type                   | Required | Description           |
| ----------- | ---------------------- | -------- | --------------------- |
| `container` | `HTMLElement`          | ✓        | Target DOM element    |
| `params`    | `ExotelAIAssistParams` | ✓        | Connection parameters |

### `unmountExotelAIAssist(container)`

Unmounts and cleans up the widget.

### `updateExotelAIAssistParams(container, patch)`

Merges a partial params patch. If `callSid` changes, reconnects automatically.

---

### `ExotelAIAssistController`

Extends `EventEmitter`.

#### Constructor options (`ExotelAIAssistParams`)

| Field                  | Type      | Required | Default                  | Description                                              |
| ---------------------- | --------- | -------- | ------------------------ | -------------------------------------------------------- |
| `authToken`            | `string`  | ✓        | —                        | Bearer token                                             |
| `callSid`              | `string`  | ✓        | —                        | Active call SID                                          |
| `wssBaseUrl`           | `string`  | —        | Exotel AI Assist backend | Override only when pointing at a non-production endpoint |
| `reconnectInterval`    | `number`  | —        | `3000`                   | Base reconnect delay in ms                               |
| `maxReconnectAttempts` | `number`  | —        | `5`                      | Max retries before error                                 |
|                             |

#### Methods

| Method             | Description                                   |
| ------------------ | --------------------------------------------- |
| `connect()`        | Open the WebSocket                            |
| `disconnect()`     | Close cleanly                                 |
| `setParams(patch)` | Merge params; reconnects if `callSid` changes |
| `destroy()`        | Dispose controller and remove all listeners   |
| `getStatus()`      | Returns current `ConnectionStatus`            |

#### Events

| Event          | Payload            | Description                            |
| -------------- | ------------------ | -------------------------------------- |
| `suggestion`   | `Suggestion`       | New AI suggestion                      |
| `transcript`   | `TranscriptLine`   | Live transcript update                 |
| `sentiment`    | `SentimentScore`   | Sentiment update                       |
| `onCallStart`  | `{ callSid }`      | Connection opened                      |
| `onCallEnd`    | `{ callSid }`      | Connection closed                      |
| `statusChange` | `ConnectionStatus` | Status transition                      |
| `error`        | `Error`            | Any error (auth, parse, max-reconnect) |
| `raw`          | `unknown`          | Every raw server message               |

---

### TypeScript Types

```ts
type ConnectionStatus = "idle" | "connecting" | "connected" | "disconnected" | "error";

interface Suggestion {
  id: string;
  text: string;
  confidence: number;
  category?: string;
  timestamp: number;
}

interface TranscriptLine {
  id: string;
  speaker: "agent" | "customer";
  text: string;
  startTime: number;
  endTime: number;
  isFinal: boolean;
}

interface SentimentScore {
  label: "positive" | "neutral" | "negative";
  score: number;
  timestamp: number;
}
```

---

## WebSocket Protocol

### URL

```
wss://<wssBaseUrl>?authToken=<token>&callSid=<sid>&[...extraParams]
```

### Server → Client message envelope

```json
{ "type": "suggestion | transcript | sentiment | ping", "payload": {}, "timestamp": 1712345678901 }
```

### Client → Server messages

```json
{ "type": "pong", "timestamp": 1712345678901 }
{ "type": "params_update", "payload": { "key": "value" } }
```

### Reconnection

- Exponential back-off: `delay = Math.min(baseInterval × 2^attempt, 30 000)`
- Auth failure (close code `4001`): error emitted, **no** retry
- After `maxReconnectAttempts`: `error` emitted with `code = MAX_RECONNECT_EXCEEDED`

---

## License

Apache 2.0

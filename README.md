# @exotel-npm-dev/exotel-ai-assist

Real-time AI suggestions and live transcript for Exotel calls — delivered over WebSocket.

## Features

- **One WebSocket per browser session** — uses `SharedWorker` (with `BroadcastChannel` + Navigator Locks fallback) so multiple open tabs share a single connection
- **Auto-reconnect** with exponential back-off
- **Live `call_sid` switching** — closing the old connection and opening a new one automatically
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

> **Note:** Browsers cannot resolve bare specifiers (`@exotel-npm-dev/...`) in `<script type="module">` without a bundler or an import map. Choose one of the approaches below.

### Option A — Recommended: Vite (or any bundler)

```bash
npm create vite@latest my-app -- --template vanilla
cd my-app
npm install @exotel-npm-dev/exotel-ai-assist
```

```js
// main.js
import { mountExotelAIAssist } from "@exotel-npm-dev/exotel-ai-assist";

mountExotelAIAssist(document.getElementById("ai-assist"), {
  authToken: "your-auth-token",
  call_sid: "CALL-SID-001",
  accountId: "your-account-id",
});
```

### Option B — Import map (no bundler, static server)

Add an import map **before** your module script so the browser knows where to find the package:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <script type="importmap">
      {
        "imports": {
          "@exotel-npm-dev/exotel-ai-assist": "./node_modules/@exotel-npm-dev/exotel-ai-assist/dist/index.js"
        }
      }
    </script>
  </head>
  <body>
    <div id="ai-assist" style="height: 500px;"></div>

    <script type="module">
      import { mountExotelAIAssist } from "@exotel-npm-dev/exotel-ai-assist";

      mountExotelAIAssist(document.getElementById("ai-assist"), {
        authToken: "your-auth-token",
        call_sid: "CALL-SID-001",
        accountId: "your-account-id",
      });
    </script>
  </body>
</html>
```

> Requires a local HTTP server (e.g. `npx serve .`) so that `node_modules` is accessible. Opening `index.html` as a `file://` URL will not work.

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
      <ExotelAIAssist authToken="your-auth-token" call_sid="CALL-SID-001" accountId="your-account-id" />
    </div>
  );
}
```

### Using the hook directly

```tsx
import { useExotelAIAssist } from "@exotel-npm-dev/exotel-ai-assist/react";

function MyCustomUI({ call_sid }: { call_sid: string }) {
  const { status, suggestions, transcripts, lastError } = useExotelAIAssist({
    authToken: "your-auth-token",
    call_sid,
    accountId: "your-account-id",
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
    <ExotelAIAssistProvider authToken="your-auth-token" call_sid="CALL-SID-001" accountId="your-account-id">
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
  call_sid: "CALL-SID-001",
  accountId: "your-account-id",
});

ctrl.on("suggestion", (s) => console.log("Suggestion:", s));
ctrl.on("transcript", (t) => console.log("Transcript:", t));
ctrl.on("statusChange", (status) => console.log("Status:", status));
ctrl.on("error", (err) => console.error("Error:", err));

ctrl.connect();

// Switch to a new call
ctrl.setParams({ call_sid: "CALL-SID-002" });

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

---

### `ExotelAIAssistController`

Extends `EventEmitter`.

#### Constructor options (`ExotelAIAssistParams`)

| Field                  | Type     | Required | Default                  | Description                                              |
| ---------------------- | -------- | -------- | ------------------------ | -------------------------------------------------------- |
| `authToken`            | `string` | ✓        | —                        | Bearer token                                             |
| `call_sid`             | `string` | ✓        | —                        | Active call SID                                          |
| `accountId`            | `string` | ✓        | —                        | Exotel account identifier                                |
| `wssBaseUrl`           | `string` | —        | Exotel AI Assist backend | Override only when pointing at a non-production endpoint |
| `reconnectInterval`    | `number` | —        | `3000`                   | Base reconnect delay in ms                               |
| `maxReconnectAttempts` | `number` | —        | `5`                      | Max retries before error                                 |
| `[customParam]`        | `string` | —        | —                        | Max 3 params you can send                                |

#### Methods

| Method             | Description                                    |
| ------------------ | ---------------------------------------------- |
| `connect()`        | Open the WebSocket                             |
| `disconnect()`     | Close cleanly                                  |
| `setParams(patch)` | Merge params; reconnects if `call_sid` changes |
| `destroy()`        | Dispose controller and remove all listeners    |
| `getStatus()`      | Returns current `ConnectionStatus`             |

#### Events

| Event          | Payload            | Description                            |
| -------------- | ------------------ | -------------------------------------- |
| `suggestion`   | `Suggestion`       | New AI suggestion (capped at last 50)  |
| `transcript`   | `TranscriptLine[]` | Live transcript update                 |
| `sentiment`    | `Sentiment`        | Sentiment label update                 |
| `onCallStart`  | `unknown`          | Connection opened                      |
| `onCallEnd`    | `unknown`          | Connection closed                      |
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
  timestamp: number;
}

interface TranscriptLine {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  isFinal: boolean;
}

interface Sentiment {
  label: "positive" | "neutral" | "negative";
  timestamp: number;
}
```

---

## WebSocket Protocol

### URL

When `wssBaseUrl` is provided it overrides the host + path portion:

```
wss://<wssBaseUrl>?[customParam1=value1&customParam2=value2&...]
```

### Reconnection

- Exponential back-off: `delay = Math.min(baseInterval × 2^attempt, 30 000)`
- After `maxReconnectAttempts`: `error` emitted with `code = MAX_RECONNECT_EXCEEDED`

---

## License

Apache 2.0

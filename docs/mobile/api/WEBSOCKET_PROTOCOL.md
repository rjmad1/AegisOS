# WebSocket Protocol Specification: AegisOS Mobile

This document details the real-time communication protocols running on the `wss://{host}/ws` WebSocket interface.

---

## 1. Connection Lifecycle

### Handshake & Authentication
WebSockets are established over mTLS. A valid JWT access token must be passed in the query parameter during the handshake:
```http
GET wss://host:3000/ws?token=eyJhbGciOi... HTTP/1.1
Connection: Upgrade
Upgrade: websocket
Sec-WebSocket-Protocol: aegis-v2
```

### Ping-Pong Heartbeat
To keep cellular NAT mappings alive and detect half-open sockets:
*   The **server** sends a ping frame every **30 seconds**.
*   The **client** must respond with a pong frame within **10 seconds**.
*   If a pong is missed, the server terminates the socket immediately.

---

## 2. Frame Envelope
All text frames sent across the WebSocket are JSON payloads wrapped in the following envelope:
```json
{
  "event": "subscribe",
  "channel": "telemetry",
  "payload": {},
  "timestamp": 1718290380
}
```

### Protocol Operations
*   `subscribe`: Subscribe to updates on a specific channel.
*   `unsubscribe`: Unsubscribe from a channel.
*   `message`: Event payload broadcast from the server or action trigger from client.
*   `error`: Server warning.

---

## 3. Channels & Payloads

### Channel: `telemetry`
Provides live metrics. Frequency is regulated automatically: 5Hz when connected via Wi-Fi/LAN, throttling down to 1Hz when the client indicates cellular data via the `client_network` header.

*   **Subscription Request**:
    ```json
    {
      "event": "subscribe",
      "channel": "telemetry"
    }
    ```
*   **Broadcast Frame**:
    ```json
    {
      "event": "message",
      "channel": "telemetry",
      "payload": {
        "cpu": { "usage": 15.8, "cores": [12.0, 18.2, 14.1, 19.1] },
        "gpu": { "usage": 68.4, "temp": 72, "vramUsed": 6284, "vramTotal": 8192 },
        "memory": { "used": 12842, "total": 16384 },
        "activeAgents": 3
      },
      "timestamp": 1718290382
    }
    ```

### Channel: `agents:{agentId}:logs`
Provides live execution logs from a running agent.

*   **Subscription Request**:
    ```json
    {
      "event": "subscribe",
      "channel": "agents:agent_9281_x:logs"
    }
    ```
*   **Broadcast Frame**:
    ```json
    {
      "event": "message",
      "channel": "agents:agent_9281_x:logs",
      "payload": {
        "timestamp": "2026-07-13T20:50:00Z",
        "stream": "stdout",
        "line": "Executing tool 'mcp_file_writer' at /src/main.ts",
        "level": "info"
      },
      "timestamp": 1718290400
    }
    ```

---

## 4. Reconnection & Backpressure

### Backpressure Limits
*   The server buffers up to 1000 telemetry frames per connection. If a slow client exceeds this limit, older telemetry frames are dropped immediately (lossy channel).
*   For the `approvals` and `agent.state_changed` logs, frames are marked lossless and queued persistently in memory or Redis until acknowledged.

### Exponential Backoff
If disconnected, the client must apply an exponential backoff retry:
*   Initial delay: **1.0 second**.
*   Multiplier: **1.5x**.
*   Max delay: **60 seconds**.
*   Jitter: **Random factor of +/- 10%**.

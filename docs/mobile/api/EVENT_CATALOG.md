# AegisOS Event Catalog: Mobile & Integration

This catalog details the messages transmitted across the workstation Event Bus (`event-bus.ts`) that trigger push notifications, sync delta builds, or WebSocket broadcasts.

---

## 1. Device Core Events

### Topic: `device.paired`
*   **Producer**: `AuthService`
*   **Consumers**: `NotificationService`, `AuditService`
*   **Payload Schema**:
    ```json
    {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "type": "object",
      "required": ["deviceId", "deviceName", "fingerprint", "userId", "timestamp"],
      "properties": {
        "deviceId": { "type": "string", "format": "uuid" },
        "deviceName": { "type": "string" },
        "fingerprint": { "type": "string", "description": "Client certificate SHA-256 fingerprint" },
        "userId": { "type": "string", "format": "uuid" },
        "timestamp": { "type": "integer" }
      }
    }
    ```

### Topic: `device.revoked`
*   **Producer**: `AdminService`
*   **Consumers**: `SyncService`, `PushNotificationWorker`
*   **Payload Schema**:
    ```json
    {
      "type": "object",
      "required": ["deviceId", "reason", "timestamp"],
      "properties": {
        "deviceId": { "type": "string", "format": "uuid" },
        "reason": { "type": "string", "example": "User initiated remote wipe" },
        "timestamp": { "type": "integer" }
      }
    }
    ```

---

## 2. Human-in-the-Loop (HITL) Events

### Topic: `approval.requested`
*   **Producer**: `AgentRuntime`
*   **Consumers**: `ApprovalService`, `PushNotificationWorker`
*   **Payload Schema**:
    ```json
    {
      "type": "object",
      "required": ["approvalId", "executionId", "nodeId", "workflowName", "command", "riskLevel", "timestamp"],
      "properties": {
        "approvalId": { "type": "string" },
        "executionId": { "type": "string" },
        "nodeId": { "type": "string" },
        "workflowName": { "type": "string" },
        "command": { "type": "string" },
        "riskLevel": { "type": "string", "enum": ["Low", "Medium", "High", "Critical"] },
        "timestamp": { "type": "integer" }
      }
    }
    ```

### Topic: `approval.resolved`
*   **Producer**: `ApprovalService`
*   **Consumers**: `AgentRuntime`, `AuditService`
*   **Payload Schema**:
    ```json
    {
      "type": "object",
      "required": ["approvalId", "decision", "deviceId", "deviceSignature", "timestamp"],
      "properties": {
        "approvalId": { "type": "string" },
        "decision": { "type": "string", "enum": ["Approved", "Rejected"] },
        "deviceId": { "type": "string", "format": "uuid" },
        "deviceSignature": { "type": "string", "description": "ECDSA signature verification artifact" },
        "timestamp": { "type": "integer" }
      }
    }
    ```

---

## 3. Telemetry Snapshot

### Topic: `telemetry.snapshot`
*   **Producer**: `TelemetryService`
*   **Consumers**: `WebSocketHub`
*   **Payload Schema**:
    ```json
    {
      "type": "object",
      "required": ["cpuUsage", "memoryUsage", "gpuUsage", "vramUsage", "hostStatus", "timestamp"],
      "properties": {
        "cpuUsage": { "type": "number" },
        "memoryUsage": { "type": "number" },
        "gpuUsage": { "type": "number" },
        "vramUsage": { "type": "number" },
        "hostStatus": { "type": "string", "enum": ["Online", "Offline", "Maintenance"] },
        "timestamp": { "type": "integer" }
      }
    }
    ```

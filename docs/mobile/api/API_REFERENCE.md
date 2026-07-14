# API Reference: AegisOS Mobile Companion API (v2)

This reference outlines the request formats, parameters, responses, and constraints for the `/api/v2/mobile/*` namespace.

---

## Global API Constraints

### Required Headers
All requests (excluding `/auth/pair`) require the following headers:
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
X-Request-ID: <UUID>
X-AegisOS-Client-Version: 1.0.0
```

### Rate Limiting Headers
Every response includes the following rate-limiting parameters:
```http
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 298
X-RateLimit-Reset: 1718290442
```
*   **Global limit**: 150 requests / 60 seconds (per IP).
*   **Authenticated limit**: 300 requests / 60 seconds (per device session).
*   **Sync limit**: 4 requests / 60 seconds (per device).

---

## 1. Authentication & Device Pairing

### `POST /auth/pair`
*   **Purpose**: Register a new device and exchange certificate.
*   **Request Payload**:
    ```json
    {
      "pairingToken": "PAIR-982-127-XYZ",
      "deviceId": "b7352d19-d912-421b-80df-8efce92cf262",
      "devicePublicKey": "-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...",
      "deviceName": "Aegis Operator iPhone"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "clientCertificate": "-----BEGIN CERTIFICATE-----\nMIIBtzCCAVWgAwIBAgII...",
      "caCertificate": "-----BEGIN CERTIFICATE-----\nMIIBszCCATqgAwIBAgII..."
    }
    ```

### `POST /auth/session`
*   **Purpose**: Establish JWT session. Must be made over mTLS.
*   **Request Payload**:
    ```json
    {
      "deviceId": "b7352d19-d912-421b-80df-8efce92cf262",
      "challenge": "4a7f920de63b",
      "signature": "304402202f3a..."
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "rfr_9281a...",
      "expiresAt": 1718294400
    }
    ```

---

## 2. Synchronization Engine

### `GET /sync`
*   **Purpose**: Pull delta sync payload since the last sync anchor timestamp.
*   **Parameters**:
    *   `anchor` (Query, Optional): Unix epoch millisecond timestamp representing last known sync point.
*   **Response (200 OK)**:
    ```json
    {
      "nextAnchor": 1718290390,
      "changes": {
        "conversations": [
          {
            "id": "e229c19b-cbfd-4621-b0db-6e76e19df123",
            "title": "Local workspace index repair",
            "status": "Active",
            "updatedAt": 1718290385
          }
        ],
        "approvals": [
          {
            "id": "app_98218",
            "executionId": "exec_3301",
            "nodeId": "mcp_terminal_0",
            "workflowName": "Workspace Clean",
            "command": "rm -rf node_modules",
            "status": "Pending",
            "riskLevel": "High",
            "createdAt": "2026-07-13T20:00:00Z"
          }
        ],
        "notifications": []
      }
    }
    ```

### `POST /sync/push`
*   **Purpose**: Flush the offline action queue back to the host workstation.
*   **Request Payload**:
    ```json
    {
      "actions": [
        {
          "actionId": "8f8c2e64-fa2d-4c37-8898-0c31671f28b2",
          "type": "APPROVAL_RESOLVE",
          "payload": {
            "approvalId": "app_98218",
            "decision": "Approved",
            "deviceSignature": "3045022100e47..."
          },
          "timestamp": 1718290383
        }
      ]
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "results": [
        {
          "actionId": "8f8c2e64-fa2d-4c37-8898-0c31671f28b2",
          "status": "Success"
        }
      ]
    }
    ```

---

## 3. Human-in-the-Loop (HITL) Queue

### `GET /approvals`
*   **Purpose**: Returns the active queues of approval items pending operator authorization.
*   **Response (200 OK)**:
    ```json
    [
      {
        "id": "app_98218",
        "executionId": "exec_3301",
        "nodeId": "mcp_terminal_0",
        "workflowName": "Workspace Clean",
        "command": "rm -rf node_modules",
        "status": "Pending",
        "riskLevel": "High",
        "createdAt": "2026-07-13T20:00:00Z"
      }
    ]
    ```

### `POST /approvals/{id}/resolve`
*   **Purpose**: Certify or reject a pending agent action with Secure Enclave keys.
*   **Payload**:
    ```json
    {
      "decision": "Approved",
      "deviceSignature": "3045022100e47cfefd..."
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "status": "Dispatched"
    }
    ```

---

## 4. Telemetry & Host Metrics

### `GET /telemetry`
*   **Purpose**: Fetch single summary snapshot of the workstation host. Use as connection test or fallback.
*   **Response (200 OK)**:
    ```json
    {
      "cpuUsage": 12.4,
      "memoryUsage": 43.1,
      "gpuUsage": 0.0,
      "vramUsage": 0.0,
      "hostStatus": "Online",
      "timestamp": 1718290390
    }
    ```

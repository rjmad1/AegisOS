# AegisOS Error Catalog: Mobile API (v2)

This catalog defines the standardized error model, status codes, and recovery procedures returned by `/api/v2/mobile/*`.

---

## Standard Error Schema
All error responses return a `4xx` or `5xx` HTTP status code with the following JSON schema:
```json
{
  "code": "ERR_AUTH_EXPIRED",
  "message": "The session token has expired. Please refresh the session.",
  "timestamp": "2026-07-13T20:45:00.000Z",
  "details": [
    "JWT expired at 1718294400"
  ]
}
```

---

## Error Classifications

### 1. Authentication Errors (1000–1999)

| Error Code | HTTP Status | Description | Client Mitigation |
| :--- | :--- | :--- | :--- |
| `ERR_AUTH_EXPIRED` | 401 Unauthorized | JWT access token has expired. | Attempt token rotation using POST `/auth/refresh`. |
| `ERR_AUTH_INVALID` | 401 Unauthorized | JWT signature or claims are invalid. | Invalidate local session cache and prompt authentication. |
| `ERR_PAIR_EXPIRED` | 403 Forbidden | QR pairing token has expired (expires in 5 minutes). | Prompt user to generate a new QR code on the Web Console. |
| `ERR_PAIR_INVALID` | 400 Bad Request | Pairing token is invalid or checksum fails. | Request user to re-scan the QR code. |
| `ERR_CERT_UNTRUSTED` | 403 Forbidden | Client certificate is missing or rejected during mTLS handshake. | Revoke local certificate and prompt pairing process. |

### 2. Synchronization & Data Errors (2000–2999)

| Error Code | HTTP Status | Description | Client Mitigation |
| :--- | :--- | :--- | :--- |
| `ERR_SYNC_ANCHOR_FUTURE` | 400 Bad Request | Client anchor timestamp is in the future relative to server time. | Discard local anchor, sync from 0, check device clock skew. |
| `ERR_SYNC_CONFLICT` | 409 Conflict | Delta sync push matches a record modified on the host. | Run conflict resolution handler (e.g. Host Wins, Ask User). |
| `ERR_OFFLINE_QUEUE_CORRUPT` | 422 Unprocessable | Ingested action payload failed server Zod validation. | Drop corrupt action, log diagnostic details, continue queue. |

### 3. Command Execution & HITL Errors (3000–3999)

| Error Code | HTTP Status | Description | Client Mitigation |
| :--- | :--- | :--- | :--- |
| `ERR_APPROVAL_EXPIRED` | 410 Gone | The approval action timed out or was revoked by the agent runtime. | Show disabled approval card: "Expired". |
| `ERR_APPROVAL_RESOLVED` | 409 Conflict | The approval has already been accepted or rejected. | Update local database cache, disable card actions. |
| `ERR_SIGNATURE_INVALID` | 400 Bad Request | Cryptographic verification of client's ECDSA signature failed on server. | Log integrity failure, verify Secure Enclave state. |

### 4. Rate Limiting & Infrastructure Errors (4000–4999)

| Error Code | HTTP Status | Description | Client Mitigation |
| :--- | :--- | :--- | :--- |
| `ERR_RATE_LIMIT` | 429 Too Many Requests | The device exceeded API rate limits. | Apply exponential backoff before retrying (look at `Retry-After`). |
| `ERR_HOST_UNREACHABLE` | 503 Service Unavailable| Workstation daemon is unreachable or under maintenance. | Keep app in Offline Mode, queue changes in SQLCipher. |

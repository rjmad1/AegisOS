# API Guidelines

## Versioning

All API endpoints are versioned under `/api/v1/`. Breaking changes require a new version (`/api/v2/`).

### URL Structure
```
/api/v1/{resource}
/api/v1/{resource}/{id}
/api/v1/{resource}/{id}/{sub-resource}
```

## Authentication

All API requests (except auth endpoints) require one of:
- **Cookie**: `ops_auth_token` (set by login flow)
- **Bearer token**: `Authorization: Bearer <jwt>`
- **API key**: `x-api-key` header with `x-api-signature` and `x-api-timestamp`

## Request/Response Format

### Content Type
- Request: `application/json`
- Response: `application/json`

### Success Response
```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 100
  }
}
```

### Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": [
      { "field": "name", "message": "Name is required" }
    ]
  }
}
```

## HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST creating a resource |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error, malformed input |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Resource state conflict |
| 413 | Payload Too Large | Request body exceeds 5MB limit |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unhandled server error |

## Rate Limiting

- Default: 150 requests per 60-second window per IP
- Rate limit headers included in responses:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## Security Headers

All responses include:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy: default-src 'self'; ...`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`
- `Strict-Transport-Security: max-age=31536000` (production only)

## API Resources

| Resource | Base Path | Methods |
|----------|-----------|---------|
| Authentication | `/api/v1/auth/` | POST login, POST token/introspect |
| Workflows | `/api/v1/workflows/` | GET, POST, PUT, DELETE |
| Executions | `/api/v1/executions/` | GET, POST |
| Models | `/api/v1/models/` | GET |
| Knowledge | `/api/v1/knowledge/` | GET, POST, DELETE |
| Artifacts | `/api/v1/artifacts/` | GET, POST, DELETE |
| Infrastructure | `/api/v1/infrastructure/` | GET |
| Configuration | `/api/v1/configuration/` | GET, PUT |
| Diagnostics | `/api/v1/diagnostics/` | GET |
| Secrets | `/api/v1/admin/secrets/` | GET, POST, DELETE |
| Users | `/api/v1/admin/users/` | GET, POST, PUT, DELETE |

## OpenAPI Specification

The full OpenAPI 3.0 specification is available at [docs/openapi-spec.json](openapi-spec.json).

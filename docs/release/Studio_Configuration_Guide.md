# AegisOS Studio Beta Configuration Guide

This document describes the environment variables and configurations available for tuning the AegisOS Studio Beta interface.

---

## Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | SQLite database URI on disk | `file:./databases/aegis.db` |
| `DATABASE_PROVIDER` | Driver provider type (`sqlite`, `postgres`) | `sqlite` |
| `OLLAMA_API_BASE` | Local Ollama daemon url | `http://127.0.0.1:11434` |
| `LITELLM_PROXY_BASE`| LiteLLM endpoint url | `http://127.0.0.1:4000` |
| `NODE_ENV` | Mode environment flag | `production` |

---

## Studio Home Dashboard Tuning
The onboarding tutorial status is saved on client machines in local storage. To force-restart the tutorial overlay:
- In the browser console, run: `localStorage.removeItem("onboarding:completed");`
- Re-navigate or refresh the `/dashboard` route.

---

## Observability Latency Polling
The GPU and system metric monitors poll every 10 seconds to compile the Workspace Briefing card. To modify this interval, update the interval frequency inside `src/app/(console)/dashboard/page.tsx`.

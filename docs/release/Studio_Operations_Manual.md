# AegisOS Studio Operations Manual

This manual details the standard operating procedures (SOPs) for maintaining, scaling, and diagnosing AegisOS Studio.

---

## 1. System Architecture
AegisOS Studio is a standard Next.js 16 app designed to run locally or inside container systems (Docker/Kubernetes).
- **Frontend**: Next.js App Router, Tailwind CSS, Lucide icons, Zustands store.
- **Backend API**: Next.js route handlers querying SQLite via Prisma Client.
- **Local AI Daemon**: Ollama binding.
- **Proxy Routing**: LiteLLM routing proxy gateway.

---

## 2. Daily Health Audits
- **GPU Status**: Utilization should average < 40% when idle. Temperatures should stay below 80°C.
- **Database size**: compactions run automatically at 02:00 AM daily to minimize file bloat.
- **Knowledge index**: Freshness should stay above 95%. Rebuild indices weekly.

---

## 3. Disaster Recovery
- **Database Corruptions**: Revert to the nightly backup:
  `copy databases/aegis.db.bak databases/aegis.db`
- **Model Starvation**: If VRAM utilization is 100% and generation latency spikes, click "Purge VRAM" in the Chief of Staff panel to force-expire model context weights.

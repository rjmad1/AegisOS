# AegisOS Studio Beta Upgrade Guide

## Scope
This guide describes the steps required to safely transition local developer environments and server environments from the v0.4.0 prototype to the v0.5.0-beta.1 Studio environment.

---

## Prerequisites
- Node.js version 18.x or 20.x.
- SQLite or PostgreSQL databases backup completed.
- Ollama local daemon running.

---

## Upgrade Steps

### 1. Stop Active Runtimes
Stop any active next dev instances or container clusters:
```bash
docker-compose down
```

### 2. Backup Databases
Make a copy of your local SQLite database:
```bash
copy databases/aegis.db databases/aegis.db.bak
```

### 3. Fetch Dependencies
Install the latest packages and compile TS compiler files:
```bash
npm install
```

### 4. Run Migrations
Run prisma database sync to update schema schemas:
```bash
npx prisma db push
```

### 5. Build Production Bundle
Verify that compilation compiles correctly:
```bash
npm run build
```

---

## Verification
Upon launching the dashboard, check the top bar to verify the v0.5.0 version badge is active. Start the first-run Onboarding guide to confirm all components are operational.

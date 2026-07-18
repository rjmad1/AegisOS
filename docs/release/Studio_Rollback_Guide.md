# AegisOS Studio Beta Rollback Guide

## Context
In the event that the v0.5.0-beta.1 deployment encounters fatal runtime crashes, database locks, or UI streaming blackout issues, execute the following steps to roll back to the stable v0.4.0 baseline.

---

## Rollback Procedure

### 1. Stop Current Studio Run
Shut down all console processes:
```bash
npm run stop
```

### 2. Restore Database Backup
Restore the SQLite database file:
```bash
copy databases/aegis.db.bak databases/aegis.db
```

### 3. Revert Source Code
Revert code changes in git:
```bash
git checkout HEAD~1 -- src/
```

### 4. Rebuild Environment
Re-install dependencies and build compilation files:
```bash
npm install
npm run build
```

---

## Verification
Confirm the version badge in the UI console shows the v0.4.0 string and verify baseline mission controls load properly.

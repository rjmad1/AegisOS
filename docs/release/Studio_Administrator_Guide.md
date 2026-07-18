# AegisOS Studio Administrator Guide

This guide describes configurations and capabilities reserved for administrators in AegisOS.

---

## Access Control & Security
AegisOS uses a zero-trust RBAC model.
- **Roles**: Administrators, Operators, Viewers, Auditors.
- **Permissions**: Defined as a JSON string inside the `User` DB table.
- **Session Policies**: Sessions expire after 30 minutes of idle status. CSRF filters protect state-mutating POST endpoints.

---

## Approvals Management
- Workflow nodes tagged with `Human Approval` pause execution and generate `WorkflowApproval` records in SQLite.
- Administrators can review, approve, or reject these requests directly from the Dashboard Home page.

---

## System Configuration
Global settings are stored in the `Config` table.
- Use `/admin` portal (or modify SQLite `Config` row) to change default ports, request rate limits, and directory folders.

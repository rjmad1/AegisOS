# AegisOS Studio Beta Troubleshooting Guide

This guide identifies common failure cases in the AegisOS Studio console and provides step-by-step remediation procedures.

---

## Troubleshooting Guide

### 1. Offline Mode Banner is Active
- **Symptom**: A red warning banner at the top of the dashboard says `[OFFLINE MODE]`.
- **Cause**: Browser lost connection or `navigator.onLine` returned false.
- **Remediation**: Check your network connection. Click "Verify" on the banner to force-trigger re-evaluations of online status.

### 2. Workspace Briefing Engine Fails to Load
- **Symptom**: The Workspace Briefing card displays `Compiling latest workspace events...` permanently or shows an error.
- **Cause**: Node service port is saturated or LiteLLM gateway is unresponsive.
- **Remediation**: 
  1. Open SRE Copilot drawer (Ctrl+Shift+O).
  2. Navigate to "Remediate" tab.
  3. Select "Restart LiteLLM routing proxy gateway" and click Run.

### 3. VRAM Pressure Alerts on GPU Status
- **Symptom**: Chief of Staff reports high GPU load and VRAM warnings.
- **Cause**: Simultaneous Gemma 2 and Llama 3 weights loaded in Ollama.
- **Remediation**:
  1. Under Chief of Staff suggestions, click "Purge VRAM".
  2. Or run command: `curl http://127.0.0.1:11434/api/generate -d '{"model": "gemma2:9b", "keep_alive": 0}'`

### 4. Mission Replay Player Has No Missions
- **Symptom**: Replay Console shows "No Mission Selected".
- **Cause**: No missions have been run in this workspace.
- **Remediation**: Click "Launch Mission" on the dashboard, wait for it to execute, then return to the Replay page.

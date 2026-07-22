# AegisOS Knowledge Base: 11_KNOWN_LIMITATIONS.md

## Hardware & System Limitations
1. **Single-GPU Context Memory Ceilings**: Local workstations with $\le 8\text{GB}$ VRAM require model quantization ($\le \text{Q4\_K\_M}$) or active cloud spillover for context windows exceeding 16k tokens.
2. **Air-Gapped Cloud Bursting**: In true air-gapped environments with no WAN egress, cloud spillover to Azure OpenAI / Anthropic is automatically disabled, requiring prompt context truncation or local offloading to secondary workstation nodes.
3. **PowerShell Windows Bootstrapping**: Windows workstation automated initialization depends on PowerShell 7.x execution policies (`Bootstrap.ps1`).

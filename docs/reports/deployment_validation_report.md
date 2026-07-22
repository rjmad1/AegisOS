# Deployment Validation Report

## 1. Objective
Provide production-ready reference deployments that are fully validated and documented, replacing ad-hoc environment setups.

## 2. Reference Environments
The following profiles will be certified and maintained as code:

1. **Developer Workstation:** Local Docker Compose with mocked LLM providers for rapid extension development.
2. **Small Team:** Single-node Docker Swarm or lightweight k3s cluster.
3. **Enterprise:** Highly Available Kubernetes (EKS/GKE/AKS) with external managed databases and Redis.
4. **Air-Gapped:** Fully offline Kubernetes deployment with local model weights and private registries.
5. **GPU Workstation:** High-performance local environment optimized for massive local context windows via Ollama.

## 3. Required Deliverables per Profile
Each certified deployment profile must contain:
- Architecture Diagram
- Infrastructure Prerequisites
- Installation Scripts
- Validation Checks (`aegis verify-infra`)
- Rollback Procedures
- Backup & Restore Procedures
- Upgrade Procedures
- Monitoring Dashboards (Grafana/OTel)
- Troubleshooting Guides

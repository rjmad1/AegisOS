# UAWOS Mobile Command Center: Glossary

This document provides definitions for technical terms, protocols, and architectural acronyms used within the UAWOS Mobile ecosystem.

---

| Term | Category | Definition |
|---|---|---|
| **UAWOS** | Platform | **Universal AI Work Operating System**. A local-first, privacy-preserving runtime designed to orchestrate AI models, agents, databases, and workflows. |
| **AegisOS** | Component | An AI Agent gateway and host that manages Model Context Protocol (MCP) integrations, parses prompt contexts, and coordinates agent actions. |
| **LiteLLM** | Component | A multi-model routing proxy that load-balances prompt payloads across multiple Ollama instances and handles fallbacks and retries. |
| **Ollama** | Component | A local inference engine that compiles and executes GGUF format model weights on physical GPU hardware. |
| **OmniRoute** | Component | An infrastructure performance metrics console that logs routing pathways, latency, token costs, and hardware utilization. |
| **MCP** | Protocol | **Model Context Protocol**. An open standard that enables AI models to securely fetch context from local filesystems, databases, git repositories, and web services. |
| **RAG** | Architecture | **Retrieval-Augmented Generation**. A technique that enhances LLM responses by retrieving relevant semantic chunks from a vector database before processing the prompt. |
| **SLM** | Architecture | **Small Language Model**. A lightweight AI model (typically 100M to 3B parameters) designed to execute on resource-constrained devices like mobile phones. |
| **mTLS** | Security | **Mutual Transport Layer Security**. A process where both the client and host verify each other's cryptographic certificates before establishing a secure TCP connection. |
| **SQLCipher** | Security | An open-source extension that provides transparent, 256-bit AES encryption for SQLite database files on disk. |
| **E2EE** | Security | **End-to-End Encryption**. A communication model where data is encrypted on the sender's device and decrypted only by the final recipient, preventing interception. |
| **HITL** | Operational | **Human-in-the-Loop**. A safety model where autonomous agents must pause and request explicit authorization from a human operator before executing high-risk commands. |
| **MINT** | Feature | **Manual Intervention**. A capability that allows an operator to inject custom thoughts or instructions directly into an active agent's memory mid-run. |
| **Tailscale** | Network | A zero-config mesh VPN service that secures communication between devices using the WireGuard protocol. |
| **SSE** | Network | **Server-Sent Events**. A protocol enabling web servers to push real-time updates (like text token streams) to a client over a single HTTP connection. |
| **WCAG** | Standard | **Web Content Accessibility Guidelines**. A set of international standards designed to ensure web and mobile applications are accessible to users with disabilities. |

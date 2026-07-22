# AegisOS Multi-Language SDK Documentation

This document describes the structure and usage of the dynamically generated client libraries for AegisOS.

## Supported Clients
1. **TypeScript / JavaScript**: Dynamic Promise-based client supporting real-time WebSocket event streaming.
2. **Python**: Sync/async HTTP client with retry decorators.
3. **Go**: Struct-mapped high-performance client.
4. **C# / .NET**: HttpClient client with System.Text.Json bindings.
5. **Java**: Native net.http client.

## Core Services Exposed
- **Model Ingress API**: Dispatches inference prompts to routed providers.
- **Workflow Orchestration**: Launches, monitors, and cancels execution workflows.
- **Event Streaming**: Registers custom callbacks on platform and connector events.
- **Security & RBAC**: Provides JWT payload authorization controls.

// src/app/api/v1/developer/grpc/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    grpcStatus: "active",
    reflectionEnabled: true,
    endpoint: "localhost:50051",
    services: [
      {
        serviceName: "aegisos.v1.DeveloperService",
        methods: [
          { name: "ListMarketplace", requestType: "MarketplaceRequest", responseType: "MarketplaceResponse", streaming: false },
          { name: "InstallPackage", requestType: "InstallRequest", responseType: "InstallResponse", streaming: false },
          { name: "StreamExtensionEvents", requestType: "EventSubscriptionRequest", responseType: "ExtensionLifecycleEvent", streaming: true }
        ]
      },
      {
        serviceName: "aegisos.v1.AgentOrchestrationService",
        methods: [
          { name: "SpawnAgentStream", requestType: "AgentSpawnRequest", responseType: "AgentConsoleChunk", streaming: true }
        ]
      }
    ],
    protobufSchema: `
syntax = "proto3";
package aegisos.v1;

message MarketplaceRequest {
  string filter_type = 1;
}

message MarketplaceResponse {
  repeated PackageItem items = 1;
}

message PackageItem {
  string id = 1;
  string name = 2;
  string version = 3;
  string type = 4;
}

message InstallRequest {
  string id = 1;
  string license_key = 2;
}

message InstallResponse {
  bool success = 1;
  string message = 2;
}
    `.trim()
  });
}

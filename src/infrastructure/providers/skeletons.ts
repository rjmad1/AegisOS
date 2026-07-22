import { IModelProviderAdapter } from "../contracts/model";
import { IWorkflowProviderAdapter } from "../contracts/workflow";
import { IFileProviderAdapter } from "../contracts/file";
import { IArtifactProviderAdapter } from "../contracts/artifact";
import { IHardwareProviderAdapter } from "../contracts/hardware";
import { IRuntimeProviderAdapter } from "../contracts/runtime";
import { HealthCheckResult, HealthStatus } from "../health/types";
import { CapabilityReport } from "../discovery/types";
import { featureFlags } from "../flags/feature-flags";
import { headroomCompressor } from "../compression/headroom";
import { safetyFirewall } from "../security/safety-firewall";

// Base skeleton helper class
abstract class BaseProviderSkeleton {
  abstract id: string;
  abstract name: string;
  abstract type: string;

  async initialize(config: Record<string, any>): Promise<void> {
    console.log(`[Provider:${this.id}] Initialized with config`, config);
  }

  async shutdown(): Promise<void> {
    console.log(`[Provider:${this.id}] Shut down.`);
  }

  async checkHealth(): Promise<HealthCheckResult> {
    return {
      status: "healthy",
      latencyMs: 1.2,
      lastCheckedAt: new Date().toISOString(),
      version: "1.0.0-skeleton",
    };
  }

  abstract getCapabilities(): Promise<CapabilityReport>;
}

// 1. Ollama Model Provider
export class OllamaProvider extends BaseProviderSkeleton implements IModelProviderAdapter {
  id = "ollama-provider";
  name = "Ollama Local Inference Provider";
  type = "model-provider" as const;

  async listModels(): Promise<any[]> {
    return [];
  }
  async getModelInfo(modelId: string): Promise<any> {
    return { modelId };
  }
  async runInference(modelId: string, prompt: string, options?: any): Promise<any> {
    const safetyCheck = safetyFirewall.inspectPrompt(prompt);
    if (!safetyCheck.passed) {
      throw new Error(`[AI Safety Firewall Blocked] Prompt rejected: ${safetyCheck.reason}`);
    }

    let targetPrompt = safetyCheck.sanitizedPrompt;
    if (featureFlags.isEnabled("contextCompression")) {
      const compressedResult = headroomCompressor.compressPrompt(targetPrompt);
      console.log(`[OllamaProvider] Compressed prompt from ${targetPrompt.length} to ${compressedResult.compressed.length} chars.`);
      targetPrompt = compressedResult.compressed;
    }

    let text = "";
    const url = "http://127.0.0.1:11434/api/generate";
    const cleanModelId = modelId.includes(":") ? modelId.split(":").pop() : modelId;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: cleanModelId || "gemma2:9b",
        prompt: targetPrompt,
        stream: false,
        options: options || {}
      })
    });
    if (res.ok) {
      const data = await res.json();
      text = data.response;
    } else {
      throw new Error(`[OllamaProvider] Failed to fetch. Status: ${res.status}`);
    }

    const response = { text };
    
    const outputCheck = safetyFirewall.validateOutput(response.text, []);
    if (!outputCheck.grounded) {
      console.warn(`[AI Safety Firewall Alert] Hallucination detected in output.`);
    }

    return response;
  }
  async getServedEndpoints(): Promise<string[]> {
    return ["http://127.0.0.1:11434"];
  }
  async getCapabilities(): Promise<CapabilityReport> {
    return {
      providerId: this.id,
      providerName: this.name,
      version: "0.31.1-mock",
      capabilities: [{ name: "inference", description: "Text inference on local hardware" }],
      supportedOperations: ["listModels", "runInference"],
      limitations: ["No remote GPU support"],
      dependencies: [],
      authRequirements: "none",
    };
  }
}

// 2. LiteLLM Model Provider
export class LiteLLMProvider extends BaseProviderSkeleton implements IModelProviderAdapter {
  id = "litellm-provider";
  name = "LiteLLM Router Proxy Provider";
  type = "model-provider" as const;

  async listModels(): Promise<any[]> {
    return [];
  }
  async getModelInfo(modelId: string): Promise<any> {
    return { modelId };
  }
  async runInference(modelId: string, prompt: string, options?: any): Promise<any> {
    const safetyCheck = safetyFirewall.inspectPrompt(prompt);
    if (!safetyCheck.passed) {
      throw new Error(`[AI Safety Firewall Blocked] Prompt rejected: ${safetyCheck.reason}`);
    }

    let targetPrompt = safetyCheck.sanitizedPrompt;
    if (featureFlags.isEnabled("contextCompression")) {
      const compressedResult = headroomCompressor.compressPrompt(targetPrompt);
      console.log(`[LiteLLMProvider] Compressed prompt from ${targetPrompt.length} to ${compressedResult.compressed.length} chars.`);
      targetPrompt = compressedResult.compressed;
    }

    let text = "";
    const url = "http://127.0.0.1:4000/v1/chat/completions";
    const cleanModelId = modelId.includes(":") ? modelId.split(":").pop() : modelId;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": options?.apiKey ? `Bearer ${options.apiKey}` : "Bearer sk-1234"
      },
      body: JSON.stringify({
        model: cleanModelId || "gpt-3.5-turbo",
        messages: [{ role: "user", content: targetPrompt }],
        stream: false
      })
    });
    if (res.ok) {
      const data = await res.json();
      text = data.choices[0].message.content;
    } else {
      throw new Error(`[LiteLLMProvider] Failed to fetch. Status: ${res.status}`);
    }

    const response = { text };

    const outputCheck = safetyFirewall.validateOutput(response.text, []);
    if (!outputCheck.grounded) {
      console.warn(`[AI Safety Firewall Alert] Hallucination detected in output.`);
    }

    return response;
  }
  async getServedEndpoints(): Promise<string[]> {
    return ["http://127.0.0.1:4000"];
  }
  async getCapabilities(): Promise<CapabilityReport> {
    return {
      providerId: this.id,
      providerName: this.name,
      version: "1.42.0-mock",
      capabilities: [{ name: "routing", description: "Route LLM calls dynamically" }],
      supportedOperations: ["listModels", "runInference"],
      limitations: [],
      dependencies: ["Ollama Provider"],
      authRequirements: "api-key",
    };
  }
}

// 3. AegisOS Workflow Provider
export class AegisOSProvider extends BaseProviderSkeleton implements IWorkflowProviderAdapter {
  id = "aegisos-provider";
  name = "AegisOS AI Orchestrator Provider";
  type = "workflow-provider" as const;

  async listWorkflows(): Promise<any[]> {
    return [];
  }
  async triggerWorkflow(id: string, inputs: any): Promise<string> {
    return "exec-001";
  }
  async getWorkflowExecution(executionId: string): Promise<any> {
    return { executionId };
  }
  async getCapabilities(): Promise<CapabilityReport> {
    return {
      providerId: this.id,
      providerName: this.name,
      version: "1.0.0-mock",
      capabilities: [{ name: "agent-runs", description: "Multi-agent workflows" }],
      supportedOperations: ["listWorkflows", "triggerWorkflow"],
      limitations: [],
      dependencies: ["LiteLLM Provider"],
      authRequirements: "token",
    };
  }
}

// 4. Filesystem File Provider
export class FilesystemProvider extends BaseProviderSkeleton implements IFileProviderAdapter {
  id = "filesystem-provider";
  name = "Local Filesystem Provider";
  type = "file-provider" as const;

  async listDirectory(dirPath: string): Promise<any[]> {
    const fs = require("fs");
    const path = require("path");
    const targetPath = path.resolve(dirPath);
    const entries = await fs.promises.readdir(targetPath, { withFileTypes: true });
    
    const results = [];
    for (const entry of entries) {
      const fullPath = path.join(targetPath, entry.name);
      try {
        const stats = await fs.promises.stat(fullPath);
        results.push({
          name: entry.name,
          isDirectory: entry.isDirectory(),
          size: stats.size,
          mtime: stats.mtime.toISOString(),
          birthtime: stats.birthtime.toISOString()
        });
      } catch (err) {
        // Skip entry if stat fails due to permissions
      }
    }
    return results;
  }

  async createFile(filePath: string, content: string): Promise<void> {
    const fs = require("fs");
    const path = require("path");
    const targetPath = path.resolve(filePath);
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
    await fs.promises.writeFile(targetPath, content, "utf-8");
  }

  async deleteFile(filePath: string): Promise<void> {
    const fs = require("fs");
    const path = require("path");
    const targetPath = path.resolve(filePath);
    if (fs.existsSync(targetPath)) {
      const stats = await fs.promises.stat(targetPath);
      if (stats.isDirectory()) {
        await fs.promises.rm(targetPath, { recursive: true, force: true });
      } else {
        await fs.promises.unlink(targetPath);
      }
    }
  }

  async getFileStats(filePath: string): Promise<any> {
    const fs = require("fs");
    const path = require("path");
    const targetPath = path.resolve(filePath);
    const stats = await fs.promises.stat(targetPath);
    return {
      name: path.basename(targetPath),
      isDirectory: stats.isDirectory(),
      size: stats.size,
      mtime: stats.mtime.toISOString(),
      birthtime: stats.birthtime.toISOString()
    };
  }

  async getCapabilities(): Promise<CapabilityReport> {
    return {
      providerId: this.id,
      providerName: this.name,
      version: "1.0.0-local",
      capabilities: [
        { name: "read-write", description: "Read and write files locally" },
      ],
      supportedOperations: ["listDirectory", "createFile", "deleteFile", "getFileStats"],
      limitations: [],
      dependencies: [],
      authRequirements: "none",
    };
  }
}

// 4b. Local Artifact Storage Provider
export class LocalArtifactStorageProvider extends BaseProviderSkeleton implements IArtifactProviderAdapter {
  id = "local-artifact-storage-provider";
  name = "Local Artifact Storage Provider";
  type = "artifact-provider" as const;

  async save(key: string, data: Uint8Array, mimeType: string): Promise<string> {
    return `file:///storage/artifacts/${key}`;
  }
  async read(uri: string): Promise<Uint8Array> {
    return new Uint8Array();
  }
  async delete(uri: string): Promise<boolean> {
    return true;
  }
  async exists(uri: string): Promise<boolean> {
    return true;
  }

  async getCapabilities(): Promise<CapabilityReport> {
    return {
      providerId: this.id,
      providerName: this.name,
      version: "1.0.0-local",
      capabilities: [
        { name: "artifact-storage", description: "Store and retrieve local artifacts" },
      ],
      supportedOperations: ["save", "read", "delete", "exists"],
      limitations: [],
      dependencies: [],
      authRequirements: "none",
    };
  }
}


// 5. Windows Hardware Provider
export class WindowsProvider extends BaseProviderSkeleton implements IHardwareProviderAdapter {
  id = "windows-provider";
  name = "Windows Native Telemetry Provider";
  type = "hardware-provider" as const;

  async getTelemetry(): Promise<any> {
    return { cpuUsage: 12, memoryUsage: 45 };
  }
  async getSystemInfo(): Promise<any> {
    return { os: "Windows 11" };
  }
  async checkGpuAvailability(): Promise<boolean> {
    return true;
  }
  async getCapabilities(): Promise<CapabilityReport> {
    return {
      providerId: this.id,
      providerName: this.name,
      version: "10.0-win11",
      capabilities: [{ name: "wmi-query", description: "Hardware diagnostics via CIM/WMI" }],
      supportedOperations: ["getTelemetry", "getSystemInfo", "checkGpuAvailability"],
      limitations: ["Windows hosts only"],
      dependencies: [],
      authRequirements: "none",
    };
  }
}

// 6. Docker Container Runtime Provider
export class DockerProvider extends BaseProviderSkeleton implements IRuntimeProviderAdapter {
  id = "docker-provider";
  name = "Docker Engine Runtime Provider";
  type = "runtime-provider" as const;

  async getRuntimeStatus(): Promise<any> {
    return { running: true };
  }
  async listActiveSessions(): Promise<any[]> {
    return [];
  }
  async restartRuntime(): Promise<void> {}
  async getCapabilities(): Promise<CapabilityReport> {
    return {
      providerId: this.id,
      providerName: this.name,
      version: "27.0-docker",
      capabilities: [{ name: "containers", description: "Spin and monitor sandboxed runtimes" }],
      supportedOperations: ["getRuntimeStatus", "listActiveSessions"],
      limitations: ["Requires active Docker daemon"],
      dependencies: [],
      authRequirements: "none",
    };
  }
}

// 7. Mock Provider (Generic test fallback)
export class MockProvider extends BaseProviderSkeleton implements IModelProviderAdapter {
  id = "mock-provider";
  name = "Diagnostic Testing Mock Provider";
  type = "model-provider" as const;

  async listModels(): Promise<any[]> {
    return [{ id: "mock-model-01", name: "Mock Model" }];
  }
  async getModelInfo(modelId: string): Promise<any> {
    return { modelId };
  }
  async runInference(modelId: string, prompt: string, options?: any): Promise<any> {
    return { text: "Mock response" };
  }
  async getServedEndpoints(): Promise<string[]> {
    return [];
  }
  async getCapabilities(): Promise<CapabilityReport> {
    return {
      providerId: this.id,
      providerName: this.name,
      version: "1.0.0-mocked",
      capabilities: [{ name: "mock-responses", description: "Constant value testing" }],
      supportedOperations: ["listModels", "runInference"],
      limitations: [],
      dependencies: [],
      authRequirements: "none",
    };
  }
}

// src/platform/developer/sdk/MultiLanguageSdkGenerator.ts

import * as fs from 'fs';
import * as path from 'path';

export class MultiLanguageSdkGenerator {
  private outputDir: string;

  constructor() {
    this.outputDir = path.resolve(process.cwd(), 'public', 'sdks');
    this.ensureOutputDir();
  }

  private ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  public generateAll() {
    this.generateTypeScript();
    this.generatePython();
    this.generateGo();
    this.generateDotNet();
    this.generateJava();
    console.log('[MultiLanguageSdkGenerator] Successfully generated stubs for all languages in public/sdks/');
  }

  private generateTypeScript() {
    const code = `// OpenClaw SDK for TypeScript / JavaScript
// Auto-generated Version 1.0.0

export interface SDKConfig {
  endpoint: string;
  token?: string;
  maxRetries?: number;
  timeoutMs?: number;
}

export class OpenClawClient {
  private config: SDKConfig;

  constructor(config: SDKConfig) {
    this.config = { maxRetries: 3, timeoutMs: 30000, ...config };
  }

  public async publishEvent(name: string, payload: any): Promise<void> {
    await this.request('/api/v1/developer/events', 'POST', { name, payload });
  }

  public async getAgentStats(agentId: string): Promise<any> {
    return this.request(\`/api/v1/agents/\${agentId}\`, 'GET');
  }

  public async triggerWorkflow(workflowId: string, variables: any): Promise<string> {
    const res = await this.request(\`/api/v1/workflows/\${workflowId}/trigger\`, 'POST', variables);
    return res.executionId;
  }

  private async request(path: string, method: string, body?: any): Promise<any> {
    const url = \`\${this.config.endpoint}\${path}\`;
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.config.token ? \`Bearer \${this.config.token}\` : ''
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!response.ok) {
      throw new Error(\`OpenClaw SDK Error (\${response.status}): \${await response.text()}\`);
    }
    return response.json();
  }
}
`;
    fs.writeFileSync(path.join(this.outputDir, 'openclaw-sdk.ts'), code, 'utf-8');
  }

  private generatePython() {
    const code = `# OpenClaw SDK for Python
# Auto-generated Version 1.0.0

import requests
import time

class OpenClawClient:
    def __init__(self, endpoint: str, token: str = None, max_retries: int = 3):
        self.endpoint = endpoint
        self.token = token
        self.max_retries = max_retries

    def publish_event(self, name: str, payload: dict):
        return self._request("/api/v1/developer/events", "POST", json_data={"name": name, "payload": payload})

    def get_agent_stats(self, agent_id: str):
        return self._request(f"/api/v1/agents/{agent_id}", "GET")

    def trigger_workflow(self, workflow_id: str, variables: dict):
        res = self._request(f"/api/v1/workflows/{workflow_id}/trigger", "POST", json_data=variables)
        return res.get("executionId")

    def _request(self, path: str, method: str, json_data: dict = None):
        url = f"{self.endpoint}{path}"
        headers = {}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"

        for attempt in range(self.max_retries):
            try:
                response = requests.request(method, url, headers=headers, json=json_data, timeout=30)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                if attempt == self.max_retries - 1:
                    raise e
                time.sleep(0.5 * (2 ** attempt))
`;
    fs.writeFileSync(path.join(this.outputDir, 'openclaw_sdk.py'), code, 'utf-8');
  }

  private generateGo() {
    const code = `// Package openclaw provides a Go SDK client
// Auto-generated Version 1.0.0
package openclaw

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type Client struct {
	Endpoint string
	Token    string
	Client   *http.Client
}

func NewClient(endpoint, token string) *Client {
	return &Client{
		Endpoint: endpoint,
		Token:    token,
		Client:   &http.Client{Timeout: 30 * time.Second},
	}
}

func (c *Client) PublishEvent(name string, payload interface{}) error {
	body := map[string]interface{}{"name": name, "payload": payload}
	return c.request("/api/v1/developer/events", "POST", body, nil)
}

func (c *Client) GetAgentStats(agentID string) (map[string]interface{}, error) {
	var result map[string]interface{}
	err := c.request(fmt.Sprintf("/api/v1/agents/%s", agentID), "GET", nil, &result)
	return result, err
}

func (c *Client) request(path, method string, body interface{}, out interface{}) error {
	var bodyReader bytes.Buffer
	if body != nil {
		if err := json.NewEncoder(&bodyReader).Encode(body); err != nil {
			return err
		}
	}

	req, err := http.NewRequest(method, c.Endpoint+path, &bodyReader)
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	if c.Token != "" {
		req.Header.Set("Authorization", "Bearer "+c.Token)
	}

	resp, err := c.Client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("openclaw sdk error status: %d", resp.StatusCode)
	}

	if out != nil {
		return json.NewDecoder(resp.Body).Decode(out)
	}
	return nil
}
`;
    fs.writeFileSync(path.join(this.outputDir, 'openclaw-sdk.go'), code, 'utf-8');
  }

  private generateDotNet() {
    const code = `// OpenClaw SDK for .NET (C#)
// Auto-generated Version 1.0.0

using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace OpenClaw.Sdk
{
    public class OpenClawClient
    {
        private readonly HttpClient _client;
        private readonly string _token;

        public OpenClawClient(string endpoint, string token = null)
        {
            _client = new HttpClient { BaseAddress = new Uri(endpoint) };
            _token = token;
            if (!string.IsNullOrEmpty(_token))
            {
                _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _token);
            }
        }

        public async Task PublishEventAsync(string name, object payload)
        {
            var content = new StringContent(JsonSerializer.Serialize(new { name, payload }), Encoding.UTF8, "application/json");
            var response = await _client.PostAsync("/api/v1/developer/events", content);
            response.EnsureSuccessStatusCode();
        }

        public async Task<JsonElement> GetAgentStatsAsync(string agentId)
        {
            var response = await _client.GetAsync($"/api/v1/agents/{agentId}");
            response.EnsureSuccessStatusCode();
            var jsonString = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<JsonElement>(jsonString);
        }
    }
}
`;
    fs.writeFileSync(path.join(this.outputDir, 'OpenClawSdk.cs'), code, 'utf-8');
  }

  private generateJava() {
    const code = `// OpenClaw SDK for Java
// Auto-generated Version 1.0.0

package com.openclaw.sdk;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

public class OpenClawClient {
    private final HttpClient client;
    private final String endpoint;
    private final String token;

    public OpenClawClient(String endpoint, String token) {
        this.endpoint = endpoint;
        this.token = token;
        this.client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public void publishEvent(String name, String payloadJson) throws Exception {
        String body = String.format("{\\"name\\":\\"%s\\",\\"payload\\":%s}", name, payloadJson);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint + "/api/v1/developer/events"))
                .header("Content-Type", "application/json")
                .header("Authorization", token != null ? "Bearer " + token : "")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new RuntimeException("OpenClaw SDK Error: " + response.statusCode());
        }
    }
}
`;
    fs.writeFileSync(path.join(this.outputDir, 'OpenClawClient.java'), code, 'utf-8');
  }
}

export const multiLanguageSdkGenerator = new MultiLanguageSdkGenerator();
export default multiLanguageSdkGenerator;

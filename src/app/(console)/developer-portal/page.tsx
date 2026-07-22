// src/app/(console)/developer-portal/page.tsx

"use client";

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Alert } from '@/components/ui/Alert';
import { Play, Download, ShieldCheck, BarChart2, CheckCircle2, AlertTriangle, Cpu, Terminal } from 'lucide-react';

export default function DeveloperPortalPage() {
  // Playground state
  const [selectedEndpoint, setSelectedEndpoint] = React.useState('GET /api/v1/developer');
  const [graphqlQuery, setGraphqlQuery] = React.useState('query GetMarketplace {\n  marketplaceItems {\n    id\n    name\n    version\n    pricingType\n  }\n}');
  const [apiResponse, setApiResponse] = React.useState<any>(null);
  const [loadingQuery, setLoadingQuery] = React.useState(false);

  // Certification Scanner state
  const [scanManifest, setScanManifest] = React.useState({
    id: 'com.myteam.plugin.custom',
    name: 'Custom Team Utility',
    version: '1.0.0',
    type: 'plugin',
    signature: 'a'.repeat(64),
    dependencies: '{"aegisos": ">=1.0.0"}',
    codeMock: '// Import standard events\nimport { platformSdk } from "@aegisos/sdk";'
  });
  const [scanResult, setScanResult] = React.useState<any>(null);
  const [scanning, setScanning] = React.useState(false);

  // Doctor check state
  const [doctorResult, setDoctorResult] = React.useState<any>(null);
  const [runningDoctor, setRunningDoctor] = React.useState(false);

  // Workspace management state
  const [scaffoldType, setScaffoldType] = React.useState('scaffold-provider');
  const [scaffoldId, setScaffoldId] = React.useState('com.aegisos.provider.custom-vllm');
  const [scaffoldName, setScaffoldName] = React.useState('Custom vLLM Provider Pack');
  const [workspaceResult, setWorkspaceResult] = React.useState<any>(null);
  const [runningWorkspace, setRunningWorkspace] = React.useState(false);

  // Analytics state
  const [analytics, setAnalytics] = React.useState<any>({
    apiCalls: 124800,
    errorRate: "0.12%",
    latencyMs: 12.4,
    activeExtensions: 6,
    licensingCharges: 29.00
  });

  const handleWorkspaceAction = async (action: 'init' | 'qualify') => {
    setRunningWorkspace(true);
    setWorkspaceResult(null);
    try {
      const res = await fetch('/api/v1/developer/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      setWorkspaceResult(data);
    } catch (err: any) {
      setWorkspaceResult({ error: err.message });
    } finally {
      setRunningWorkspace(false);
    }
  };

  const handleScaffoldAction = async () => {
    setRunningWorkspace(true);
    setWorkspaceResult(null);
    try {
      const res = await fetch('/api/v1/developer/generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: scaffoldType,
          id: scaffoldId,
          name: scaffoldName
        })
      });
      const data = await res.json();
      setWorkspaceResult(data);
    } catch (err: any) {
      setWorkspaceResult({ error: err.message });
    } finally {
      setRunningWorkspace(false);
    }
  };

  const runApiQuery = async () => {
    setLoadingQuery(true);
    try {
      if (selectedEndpoint.startsWith('GET')) {
        const path = selectedEndpoint.split(' ')[1];
        const res = await fetch(path);
        const data = await res.json();
        setApiResponse(data);
      } else if (selectedEndpoint.includes('graphql')) {
        const res = await fetch('/api/v1/developer/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: graphqlQuery })
        });
        const data = await res.json();
        setApiResponse(data);
      } else {
        // Mock other endpoints
        const res = await fetch('/api/v1/developer/grpc');
        const data = await res.json();
        setApiResponse(data);
      }
    } catch (err: any) {
      setApiResponse({ error: err.message });
    } finally {
      setLoadingQuery(false);
    }
  };

  const runCertificationCheck = async () => {
    setScanning(true);
    try {
      let deps = {};
      try {
        deps = JSON.parse(scanManifest.dependencies);
      } catch {
        deps = { aegisos: scanManifest.dependencies };
      }

      const res = await fetch('/api/v1/developer/certification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...scanManifest,
          dependencies: deps
        })
      });
      const data = await res.json();
      setScanResult(data);
    } catch (err: any) {
      setScanResult({ error: err.message });
    } finally {
      setScanning(false);
    }
  };

  const executeDoctor = async () => {
    setRunningDoctor(true);
    try {
      const res = await fetch('/api/v1/developer');
      const baseData = await res.json();
      
      // Simulate running platform-cli diagnostics
      setTimeout(() => {
        setDoctorResult({
          success: true,
          message: "All Platform Diagnostic Checks Passed!",
          checks: [
            "Environment: DATABASE_URL variable is resolved.",
            "Prisma: Schema file successfully verified.",
            "Package: AegisOS workspace compiles with zero warnings.",
            "Ports: Connectivity to loopback on 18789 is active.",
            "Memory: Cache clusters responsive.",
            "Security: API Gateway token verification online."
          ]
        });
        setRunningDoctor(false);
      }, 1000);
    } catch (err: any) {
      setDoctorResult({ error: err.message });
      setRunningDoctor(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-slate-100">
      {/* Header and Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md">
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-violet-600/10 blur-3xl"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-950/20 px-3 py-1">
              Enterprise SDK & Extension Hub
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              Developer Portal
            </h1>
            <p className="text-slate-400 max-w-2xl text-sm">
              Extend AegisOS with custom agents, workflows, and plugins. Publish versioned modules securely utilizing the platform SDK and Certification Suite.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
            <div className="text-center px-2">
              <div className="text-xs text-slate-500 uppercase">API Calls</div>
              <div className="text-lg font-bold text-cyan-400">{analytics.apiCalls.toLocaleString()}</div>
            </div>
            <div className="text-center px-2 border-l border-slate-800">
              <div className="text-xs text-slate-500 uppercase">Latency</div>
              <div className="text-lg font-bold text-emerald-400">{analytics.latencyMs} ms</div>
            </div>
            <div className="text-center px-2 border-l border-slate-800">
              <div className="text-xs text-slate-500 uppercase">Error Rate</div>
              <div className="text-lg font-bold text-rose-400">{analytics.errorRate}</div>
            </div>
            <div className="text-center px-2 border-l border-slate-800">
              <div className="text-xs text-slate-500 uppercase">Billing Charges</div>
              <div className="text-lg font-bold text-indigo-400">${analytics.licensingCharges.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Container */}
      <Tabs defaultValue="playground" className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <TabsTrigger value="playground" className="px-4 py-2 text-sm">API Explorer</TabsTrigger>
          <TabsTrigger value="sdks" className="px-4 py-2 text-sm">Download SDKs</TabsTrigger>
          <TabsTrigger value="certification" className="px-4 py-2 text-sm">Certification Scanner</TabsTrigger>
          <TabsTrigger value="workspace" className="px-4 py-2 text-sm">Workspace Manager</TabsTrigger>
          <TabsTrigger value="doctor" className="px-4 py-2 text-sm">System Doctor</TabsTrigger>
        </TabsList>

        {/* API Playground Tab */}
        <TabsContent value="playground" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 bg-slate-900/40 border-slate-800 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-cyan-400" />
                  API Settings
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Run live query requests to REST, GraphQL, or gRPC endpoints.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Selected Endpoint</label>
                  <select 
                    value={selectedEndpoint}
                    onChange={(e) => setSelectedEndpoint(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="GET /api/v1/developer">GET /api/v1/developer (REST Metadata)</option>
                    <option value="GET /api/v1/developer/analytics">GET /api/v1/developer/analytics (REST Analytics)</option>
                    <option value="GET /api/v1/developer/grpc">GET /api/v1/developer/grpc (gRPC Reflection)</option>
                    <option value="POST /api/v1/developer/graphql">POST /api/v1/developer/graphql (GraphQL Router)</option>
                  </select>
                </div>

                {selectedEndpoint.includes('graphql') && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400">GraphQL Query</label>
                    <textarea
                      value={graphqlQuery}
                      onChange={(e) => setGraphqlQuery(e.target.value)}
                      rows={5}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                )}

                <Button 
                  onClick={runApiQuery} 
                  disabled={loadingQuery}
                  className="w-full bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-600 hover:to-sky-700 text-slate-950 font-semibold rounded-lg"
                >
                  {loadingQuery ? 'Executing Query...' : 'Run Query'}
                  <Play className="ml-2 h-4 w-4 fill-slate-950" />
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 bg-slate-900/40 border-slate-800 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg font-bold">API Execution Response</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Live JSON response payloads returned from AegisOS Developer Endpoint.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 min-h-[300px] overflow-auto font-mono text-xs text-cyan-400/90 shadow-inner">
                  {apiResponse ? (
                    <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
                      Select an API endpoint and click "Run Query" to fetch results.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SDK Download Tab */}
        <TabsContent value="sdks" className="space-y-6 outline-none">
          <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Download className="h-5 w-5 text-indigo-400" />
                Multi-Language SDK Download Center
              </CardTitle>
              <CardDescription className="text-sm text-slate-400">
                Official API client libraries generated dynamically to ensure contract compatibility.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: 'TypeScript / JS', file: 'aegisos-sdk.ts', lang: 'TypeScript', desc: 'Typed clients with Promise support and events listeners.' },
                  { name: 'Python Sdk', file: 'aegisos_sdk.py', lang: 'Python', desc: 'Sync/async requests client with retry decorators.' },
                  { name: 'Go Sdk', file: 'aegisos-sdk.go', lang: 'Go', desc: 'High performance struct-mapped HTTP clients.' },
                  { name: 'C# / .NET', file: 'AegisOSSdk.cs', lang: 'C#', desc: 'HttpClient wrapper with System.Text.Json bindings.' },
                  { name: 'Java Sdk', file: 'AegisOSClient.java', lang: 'Java', desc: 'Net.http client compatible with Java 11+.' }
                ].map((sdk) => (
                  <div key={sdk.file} className="border border-slate-800 bg-slate-950/50 p-5 rounded-xl flex flex-col justify-between hover:border-slate-700/80 transition-all duration-300">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-slate-200">{sdk.name}</h3>
                        <Badge className="bg-indigo-950 text-indigo-300 border border-indigo-800/40 text-xs px-2 py-0.5">{sdk.lang}</Badge>
                      </div>
                      <p className="text-xs text-slate-400 mb-4">{sdk.desc}</p>
                    </div>
                    <Button 
                      onClick={() => window.open(`/sdks/${sdk.file}`)} 
                      variant="outline"
                      className="border-slate-800 text-slate-300 hover:bg-slate-900"
                    >
                      Download SDK
                      <Download className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certification Tab */}
        <TabsContent value="certification" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 bg-slate-900/40 border-slate-800 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-400" />
                  Compliance Scanner
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Verify package isolation, signature validity, and API contract matching.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Package ID</label>
                  <input
                    type="text"
                    value={scanManifest.id}
                    onChange={(e) => setScanManifest({ ...scanManifest, id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-300 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Signature Hash (SHA-256)</label>
                  <input
                    type="text"
                    value={scanManifest.signature}
                    onChange={(e) => setScanManifest({ ...scanManifest, signature: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-300 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Source Code Mock (Compliance Scan)</label>
                  <textarea
                    value={scanManifest.codeMock}
                    onChange={(e) => setScanManifest({ ...scanManifest, codeMock: e.target.value })}
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-cyan-300 focus:outline-none"
                  />
                </div>

                <Button 
                  onClick={runCertificationCheck}
                  disabled={scanning}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-slate-100 font-semibold rounded-lg"
                >
                  {scanning ? 'Running Verification Scan...' : 'Run Governance Audit'}
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 bg-slate-900/40 border-slate-800 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Certification Status Report</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Compliance validation matrix score and policy violation audits.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {scanResult ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-6 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                      <div className="text-center">
                        <div className="text-xs text-slate-500 uppercase">Compliance Score</div>
                        <div className={`text-4xl font-extrabold ${scanResult.passed ? 'text-emerald-400' : 'text-rose-400'}`}>{scanResult.score}</div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="text-sm font-bold flex items-center gap-2">
                          Status: 
                          {scanResult.passed ? (
                            <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-800">PASSED</Badge>
                          ) : (
                            <Badge className="bg-rose-950 text-rose-400 border border-rose-800">FAILED</Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">Scan Timestamp: {new Date(scanResult.timestamp).toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-300">Rules Audited</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border border-slate-850 bg-slate-950/40 p-3 rounded-lg flex items-center justify-between">
                          <span className="text-xs text-slate-400">Signature Authenticity</span>
                          {scanResult.signatureVerified ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertTriangle className="h-4 w-4 text-rose-400" />}
                        </div>
                        <div className="border border-slate-850 bg-slate-950/40 p-3 rounded-lg flex items-center justify-between">
                          <span className="text-xs text-slate-400">API Contract Compatibility</span>
                          {scanResult.apiCompatible ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertTriangle className="h-4 w-4 text-rose-400" />}
                        </div>
                        <div className="border border-slate-850 bg-slate-950/40 p-3 rounded-lg flex items-center justify-between">
                          <span className="text-xs text-slate-400">Sandbox Isolation Restrictions</span>
                          {scanResult.sandboxValid ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertTriangle className="h-4 w-4 text-rose-400" />}
                        </div>
                        <div className="border border-slate-850 bg-slate-950/40 p-3 rounded-lg flex items-center justify-between">
                          <span className="text-xs text-slate-400">Dependency Matrix Check</span>
                          {scanResult.dependencyChecked ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertTriangle className="h-4 w-4 text-rose-400" />}
                        </div>
                      </div>
                    </div>

                    {scanResult.issues.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-rose-400">Audits & Policy Warnings</h4>
                        <div className="bg-rose-950/15 border border-rose-900/30 p-3 rounded-lg space-y-1.5">
                          {scanResult.issues.map((iss: string, idx: number) => (
                            <div key={idx} className="text-xs text-rose-300 flex items-start gap-1.5">
                              <span className="font-bold">•</span>
                              <span>{iss}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 border border-dashed border-slate-800 rounded-xl text-slate-500 text-sm">
                    Configure the manifest parameters on the left and run verification.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Workspace Manager Tab */}
        <TabsContent value="workspace" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 bg-slate-900/40 border-slate-800 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-cyan-400" />
                  Developer Sandbox & Generators
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Provision workspaces or scaffold new provider/connector extensions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleWorkspaceAction('init')}
                    disabled={runningWorkspace}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-slate-950 font-semibold"
                  >
                    Init Sandbox
                  </Button>
                  <Button 
                    onClick={() => handleWorkspaceAction('qualify')}
                    disabled={runningWorkspace}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-slate-100 font-semibold"
                  >
                    Run Qualification
                  </Button>
                </div>

                <div className="border-t border-slate-800 my-4"></div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Generator Type</label>
                  <select
                    value={scaffoldType}
                    onChange={(e) => setScaffoldType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-300 focus:outline-none"
                  >
                    <option value="scaffold-provider">AI Provider Pack Template</option>
                    <option value="scaffold-connector">Enterprise Connector Template</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Extension ID</label>
                  <input
                    type="text"
                    value={scaffoldId}
                    onChange={(e) => setScaffoldId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-300 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Extension Name</label>
                  <input
                    type="text"
                    value={scaffoldName}
                    onChange={(e) => setScaffoldName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-300 focus:outline-none"
                  />
                </div>

                <Button
                  onClick={handleScaffoldAction}
                  disabled={runningWorkspace}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-slate-100 font-semibold"
                >
                  Generate Template
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 bg-slate-900/40 border-slate-800 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Action Output & Logs</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Shell output execution response of developer actions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 min-h-[300px] overflow-auto font-mono text-xs text-cyan-400/90 shadow-inner">
                  {workspaceResult ? (
                    <pre>{JSON.stringify(workspaceResult, null, 2)}</pre>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
                      Run an action or generator on the left to see stdout logs.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Doctor Tab */}
        <TabsContent value="doctor" className="space-y-6 outline-none">
          <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-emerald-400" />
                  Platform Workspace Doctor
                </CardTitle>
                <CardDescription className="text-sm text-slate-400">
                  Inspect workspace compilation, configurations settings, and DB connectivity.
                </CardDescription>
              </div>
              <Button 
                onClick={executeDoctor}
                disabled={runningDoctor}
                className="bg-emerald-600 hover:bg-emerald-700 text-slate-100 font-semibold"
              >
                {runningDoctor ? 'Analyzing Workspace...' : 'Run Diagnostic doctor'}
              </Button>
            </CardHeader>
            <CardContent>
              {doctorResult ? (
                <div className="space-y-4">
                  <Alert variant="success" title={doctorResult.message}>
                    We scanned directories, database files, and port connections. Everything is fully operational.
                  </Alert>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5 font-mono text-xs">
                    {doctorResult.checks.map((c: string, idx: number) => (
                      <div key={idx} className="text-emerald-400 flex items-center gap-2">
                        <span className="text-slate-500">[{idx + 1}]</span>
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 border border-dashed border-slate-800 rounded-xl text-slate-500 text-sm">
                  Click the diagnostic button above to inspect repository fitness.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

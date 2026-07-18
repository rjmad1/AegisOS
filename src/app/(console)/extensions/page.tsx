// src/app/(console)/extensions/page.tsx

"use client";

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Dialog } from '@/components/ui/Dialog';
import { 
  Puzzle, 
  Layers, 
  Database, 
  GitFork, 
  Activity, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Trash2, 
  Play, 
  Square, 
  User, 
  Cpu, 
  Tag, 
  HelpCircle, 
  FileText,
  Upload,
  Workflow
} from 'lucide-react';

export default function ExtensionsManagerPage() {
  const [activeTab, setActiveTab] = React.useState<'manager' | 'capabilities' | 'registries' | 'dependencies' | 'update'>('manager');
  const [extensions, setExtensions] = React.useState<any[]>([]);
  const [dependencyGraph, setDependencyGraph] = React.useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // Registry browser state
  const [selectedRegistry, setSelectedRegistry] = React.useState<'agents' | 'prompts' | 'workflows' | 'tools'>('agents');
  const [registryData, setRegistryData] = React.useState<any[]>([]);
  const [registryLoading, setRegistryLoading] = React.useState(false);

  // New Extension JSON state
  const [newManifestJson, setNewManifestJson] = React.useState<string>(JSON.stringify({
    id: "com.aegisos.ext.custom",
    name: "Custom Agent Tool Extension",
    version: "1.0.0",
    author: "Enterprise Platform Admin",
    description: "Declaratively extends the platform with custom agent execution scopes and prompts.",
    dependencies: { "aegisos": ">=1.0.0" },
    capabilities: ["custom-text-agent"],
    permissions: ["*"],
    agents: [
      {
        agentId: "custom-agent",
        name: "Custom Dynamic Assistant",
        role: "Answers specialized enterprise queries",
        models: ["smollm:135m"]
      }
    ],
    prompts: [
      {
        name: "custom-helper-prompt",
        purpose: "Assists with specific domain queries",
        template: "You are a custom AI assistant. Answer the user in a professional manner."
      }
    ],
    signature: "d".repeat(64)
  }, null, 2));

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/extensions');
      const data = await res.json();
      if (res.ok) {
        setExtensions(data.extensions || []);
        setDependencyGraph(data.dependencyGraph || { nodes: [], edges: [] });
      }
    } catch (err) {
      console.error("Failed to load extension data", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const loadRegistry = async () => {
    setRegistryLoading(true);
    try {
      let url = '';
      if (selectedRegistry === 'agents') url = '/api/v1/agents';
      else if (selectedRegistry === 'prompts') url = '/api/v1/optimization'; // optimization/route lists prompts/drafts
      else if (selectedRegistry === 'workflows') url = '/api/v1/workflows';
      else if (selectedRegistry === 'tools') url = '/api/v1/tools';

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        // Map payloads consistently
        if (selectedRegistry === 'agents') {
          setRegistryData(data.map ? data : data.agents || []);
        } else if (selectedRegistry === 'prompts') {
          // fetch prompts lists templates
          const templatesRes = await fetch('/api/v1/optimization');
          const templatesData = await templatesRes.json();
          setRegistryData(templatesData.templates || []);
        } else if (selectedRegistry === 'workflows') {
          setRegistryData(data.workflows || []);
        } else if (selectedRegistry === 'tools') {
          setRegistryData(data.tools || []);
        }
      }
    } catch (err) {
      console.error("Failed to load registry data", err);
    } finally {
      setRegistryLoading(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'registries') {
      loadRegistry();
    }
  }, [activeTab, selectedRegistry]);

  const handleAction = async (id: string, action: 'activate' | 'deactivate' | 'uninstall') => {
    setActionLoading(`${id}-${action}`);
    setMessage(null);
    try {
      const res = await fetch('/api/v1/extensions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message || `Successfully executed ${action}`, type: 'success' });
        loadData();
      } else {
        setMessage({ text: data.error || `Failed to execute ${action}`, type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Network error occurred.", type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleInstallCustom = async () => {
    setMessage(null);
    try {
      const manifest = JSON.parse(newManifestJson);
      setActionLoading('install-custom');
      const res = await fetch('/api/v1/extensions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'install',
          id: manifest.id,
          manifest
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: `Extension ${manifest.name} installed and activated successfully!`, type: 'success' });
        loadData();
        setActiveTab('manager');
      } else {
        setMessage({ text: data.error || "Failed to install custom extension.", type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: `Failed to parse/install package: ${err.message}`, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-slate-100">
      {/* Title Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md">
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-cyan-600/10 blur-3xl"></div>
        
        <div className="space-y-2">
          <Badge className="bg-cyan-950 text-cyan-300 border border-cyan-800/40 text-xs px-2.5 py-0.5">
            Runtime Engine Active
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-300 to-indigo-400 bg-clip-text text-transparent">
            Capability & Extension Framework
          </h1>
          <p className="text-slate-400 max-w-2xl text-sm">
            Orchestrate runtime extensions, inspect active capabilities, browse registers, and verify dependencies without modifying AegisOS core.
          </p>
        </div>
      </div>

      {/* Message alert */}
      {message && (
        <Alert 
          variant={message.type === 'success' ? 'success' : 'destructive'} 
          title={message.type === 'success' ? 'Success' : 'Error'}
          className="rounded-xl"
        >
          {message.text}
        </Alert>
      )}

      {/* Tabs list */}
      <div className="flex border-b border-slate-850 pb-px gap-1">
        {[
          { id: 'manager', label: 'Extension Manager', icon: Puzzle },
          { id: 'capabilities', label: 'Capability Browser', icon: Layers },
          { id: 'registries', label: 'Registry Activation', icon: Database },
          { id: 'dependencies', label: 'Dependency Graph', icon: GitFork },
          { id: 'update', label: 'Install / Update SDK', icon: Upload }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 text-xs font-semibold px-4 py-3 border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-400 bg-slate-900/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-950/20'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content wrapper */}
      <div className="pt-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-3">
            <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin" />
            <span className="text-slate-400 text-sm">Loading dynamic extensions...</span>
          </div>
        ) : (
          <>
            {/* Tab: Extension Manager */}
            {activeTab === 'manager' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  {extensions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
                      <Puzzle className="h-10 w-10 text-slate-600 mb-2" />
                      No runtime extensions are currently installed.
                    </div>
                  ) : (
                    extensions.map((ext) => (
                      <Card key={ext.id} className="bg-slate-900/30 border-slate-800 backdrop-blur-md flex flex-col md:flex-row justify-between p-6 gap-6 hover:border-slate-700 transition-all duration-300">
                        <div className="space-y-4 flex-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h3 className="text-lg font-bold text-slate-200">{ext.manifest.name}</h3>
                            <Badge className="bg-slate-950 text-slate-400 border border-slate-800 font-mono text-xs">{ext.manifest.id}</Badge>
                            <Badge className={`text-xs px-2.5 py-0.5 font-bold ${
                              ext.status === 'activated' 
                                ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-800/40' 
                                : 'bg-slate-950 text-slate-500 border border-slate-800'
                            }`}>
                              {ext.status.toUpperCase()}
                            </Badge>
                            <Badge className={`text-xs px-2.5 py-0.5 font-bold ${
                              ext.health === 'healthy' 
                                ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40' 
                                : 'bg-rose-950/40 text-rose-400 border border-rose-800/40'
                            }`}>
                              {ext.health.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <p className="text-xs text-slate-400 leading-relaxed">{ext.manifest.description}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono text-slate-400">
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-widest">Version</span>
                              <span>{ext.manifest.version}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-widest">Author</span>
                              <span>{ext.manifest.author}</span>
                            </div>
                            {ext.activatedAt && (
                              <div>
                                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-widest">Activated</span>
                                <span>{new Date(ext.activatedAt).toLocaleTimeString()}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-widest">Permissions</span>
                              <span className="truncate block max-w-[150px]" title={ext.manifest.permissions.join(', ')}>
                                {ext.manifest.permissions.join(', ')}
                              </span>
                            </div>
                          </div>

                          {ext.errorMessage && (
                            <div className="bg-rose-950/30 border border-rose-900/40 rounded-lg p-3 text-xs text-rose-300 font-mono">
                              <strong>Error:</strong> {ext.errorMessage}
                            </div>
                          )}
                        </div>

                        {/* Lifecycle controls */}
                        <div className="flex md:flex-col justify-end gap-2.5 min-w-[160px]">
                          {ext.status !== 'activated' ? (
                            <Button 
                              onClick={() => handleAction(ext.id, 'activate')}
                              disabled={actionLoading === `${ext.id}-activate`}
                              className="bg-cyan-600 hover:bg-cyan-700 text-slate-100 flex items-center justify-center gap-2 text-xs"
                            >
                              <Play className="h-3.5 w-3.5" />
                              Activate
                            </Button>
                          ) : (
                            <Button 
                              onClick={() => handleAction(ext.id, 'deactivate')}
                              disabled={actionLoading === `${ext.id}-deactivate`}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-750 flex items-center justify-center gap-2 text-xs"
                            >
                              <Square className="h-3.5 w-3.5" />
                              Deactivate
                            </Button>
                          )}
                          <Button 
                            onClick={() => handleAction(ext.id, 'uninstall')}
                            disabled={actionLoading === `${ext.id}-uninstall`}
                            className="bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 border border-rose-900/40 flex items-center justify-center gap-2 text-xs"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Uninstall
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab: Capability Browser */}
            {activeTab === 'capabilities' && (
              <div className="space-y-6">
                <Card className="bg-slate-900/30 border-slate-800 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-slate-200">Registered Platform Capabilities</CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      View capabilities registered dynamically by extensions alongside AegisOS core capabilities.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Core Capabilities */}
                      <div className="border border-slate-800 bg-slate-950/30 rounded-xl p-4 space-y-3">
                        <Badge className="bg-indigo-950 text-indigo-400 border border-indigo-850">Core Platform</Badge>
                        <h4 className="text-sm font-bold">Execution & Planning</h4>
                        <p className="text-xs text-slate-400">AST parsing, context reference aggregation, subagent orchestration</p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {["planning", "scheduling", "spawning", "writing", "patching", "compiling", "reviews"].map((cap) => (
                            <Badge key={cap} className="bg-slate-900 text-slate-400 border border-slate-800 text-[10px]">{cap}</Badge>
                          ))}
                        </div>
                      </div>

                      {/* Dynamic capabilities from Extensions */}
                      {extensions.filter(e => e.status === 'activated').map(ext => (
                        <div key={ext.id} className="border border-slate-800 bg-slate-950/30 rounded-xl p-4 space-y-3">
                          <Badge className="bg-cyan-950 text-cyan-400 border border-cyan-850">Extension: {ext.manifest.name}</Badge>
                          <h4 className="text-sm font-bold">Contributed Capabilities</h4>
                          <p className="text-xs text-slate-400">{ext.manifest.description}</p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {ext.manifest.capabilities.map((cap: string) => (
                              <Badge key={cap} className="bg-slate-900 text-cyan-400 border border-slate-800 text-[10px]">{cap}</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tab: Registry Activation */}
            {activeTab === 'registries' && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2 border-b border-slate-850 pb-4">
                  {[
                    { id: 'agents', label: 'Agent Registry', icon: Cpu },
                    { id: 'prompts', label: 'Prompt Registry', icon: Tag },
                    { id: 'workflows', label: 'Workflow Registry', icon: Workflow },
                    { id: 'tools', label: 'Tool Registry', icon: HelpCircle }
                  ].map((r) => (
                    <Button
                      key={r.id}
                      onClick={() => setSelectedRegistry(r.id as any)}
                      variant={selectedRegistry === r.id ? 'primary' : 'outline'}
                      className={`text-xs px-4 py-2 rounded-lg border-slate-800 ${
                        selectedRegistry === r.id 
                          ? 'bg-cyan-600 hover:bg-cyan-700 text-slate-100' 
                          : 'text-slate-300 hover:bg-slate-900/40 hover:text-slate-100'
                      }`}
                    >
                      <r.icon className="h-4 w-4 mr-2" />
                      {r.label}
                    </Button>
                  ))}
                </div>

                {registryLoading ? (
                  <div className="flex flex-col items-center justify-center h-48 space-y-2">
                    <RefreshCw className="h-6 w-6 text-cyan-400 animate-spin" />
                    <span className="text-slate-400 text-xs">Loading active registry keys...</span>
                  </div>
                ) : (
                  <Card className="bg-slate-900/30 border-slate-800 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">
                        Activated {selectedRegistry.charAt(0).toUpperCase() + selectedRegistry.slice(1)} Storefront
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-slate-300 text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-widest text-[10px]">
                              <th className="pb-3 pr-4 font-semibold">Identifier</th>
                              <th className="pb-3 pr-4 font-semibold">Name/Purpose</th>
                              <th className="pb-3 pr-4 font-semibold">Config/Models/Details</th>
                            </tr>
                          </thead>
                          <tbody>
                            {registryData.length === 0 ? (
                              <tr>
                                <td colSpan={3} className="py-8 text-center text-slate-500 italic">No keys active.</td>
                              </tr>
                            ) : (
                              registryData.map((item, idx) => (
                                <tr key={idx} className="border-b border-slate-900 hover:bg-slate-950/20">
                                  {/* Agent row mapping */}
                                  {selectedRegistry === 'agents' && (
                                    <>
                                      <td className="py-4 pr-4 font-mono text-cyan-400/80">{item.agentId || item.id}</td>
                                      <td className="py-4 pr-4">
                                        <div className="font-bold">{item.name}</div>
                                        <div className="text-[11px] text-slate-400 mt-0.5">{item.role}</div>
                                      </td>
                                      <td className="py-4 pr-4 font-mono text-[10px]">
                                        <div>Models: {item.models?.join(', ') || item.model}</div>
                                        {item.tools && <div className="text-slate-500 mt-1">Tools: {item.tools.join(', ')}</div>}
                                      </td>
                                    </>
                                  )}
                                  
                                  {/* Prompt row mapping */}
                                  {selectedRegistry === 'prompts' && (
                                    <>
                                      <td className="py-4 pr-4 font-mono text-cyan-400/80">{item.name}</td>
                                      <td className="py-4 pr-4">
                                        <div className="font-bold">{item.purpose}</div>
                                        <div className="text-[10px] text-slate-500 mt-1 line-clamp-1 italic">
                                          Template: &quot;{item.versions?.[item.versions.length - 1]?.content || item.template}&quot;
                                        </div>
                                      </td>
                                      <td className="py-4 pr-4 font-mono text-[10px]">
                                        Active Version: {item.activeVersion || 1}
                                      </td>
                                    </>
                                  )}

                                  {/* Workflow row mapping */}
                                  {selectedRegistry === 'workflows' && (
                                    <>
                                      <td className="py-4 pr-4 font-mono text-cyan-400/80">{item.id}</td>
                                      <td className="py-4 pr-4">
                                        <div className="font-bold">{item.name}</div>
                                        <div className="text-[11px] text-slate-400 mt-0.5">{item.description}</div>
                                      </td>
                                      <td className="py-4 pr-4 font-mono text-[10px]">
                                        Status: <span className="text-emerald-400">{item.status}</span> (v{item.version})
                                      </td>
                                    </>
                                  )}

                                  {/* Tool row mapping */}
                                  {selectedRegistry === 'tools' && (
                                    <>
                                      <td className="py-4 pr-4 font-mono text-cyan-400/80">{item.id || item.name}</td>
                                      <td className="py-4 pr-4">
                                        <div className="font-bold">{item.name}</div>
                                        <div className="text-[11px] text-slate-400 mt-0.5">{item.description}</div>
                                      </td>
                                      <td className="py-4 pr-4 font-mono text-[10px] space-y-1">
                                        <div>Sandbox: <span className="text-amber-500 font-semibold">{item.sandboxLevel || 'full'}</span></div>
                                        <div>Permissions: {item.permissionsRequired?.join(', ') || 'none'}</div>
                                      </td>
                                    </>
                                  )}
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Tab: Dependency Graph */}
            {activeTab === 'dependencies' && (
              <div className="space-y-6">
                <Card className="bg-slate-900/30 border-slate-800 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-slate-200">Extension Dependency Graph</CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Visualization of extension couplings, capabilities offered, and platform core dependencies.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Visual rendering of Node relationships using styling */}
                    <div className="flex flex-col gap-6 max-w-xl mx-auto border border-slate-850 p-6 rounded-2xl bg-slate-950/20 font-mono text-xs">
                      {dependencyGraph.nodes.map((node) => {
                        const targets = dependencyGraph.edges
                          .filter(e => e.source === node.id)
                          .map(e => e.target);

                        return (
                          <div key={node.id} className="border border-slate-800 bg-slate-950 p-4 rounded-xl space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-cyan-400">{node.name}</span>
                              <Badge className={`text-[10px] font-mono ${
                                node.type === 'platform' ? 'bg-indigo-950 text-indigo-400' :
                                node.type === 'capability' ? 'bg-cyan-950 text-cyan-400' : 'bg-slate-900 text-slate-500'
                              }`}>
                                {node.type.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-[10px] text-slate-500">ID: {node.id}</div>
                            {targets.length > 0 && (
                              <div className="pt-2 border-t border-slate-900 space-y-1">
                                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-widest">Depends on / Exposes</span>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {targets.map(t => {
                                    const targetNode = dependencyGraph.nodes.find(n => n.id === t);
                                    return (
                                      <Badge key={t} className="bg-slate-900 text-slate-300 border border-slate-800 text-[10px]">
                                        &rarr; {targetNode ? targetNode.name : t}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tab: Install / Update Custom JSON */}
            {activeTab === 'update' && (
              <div className="space-y-6">
                <Card className="bg-slate-900/30 border-slate-800 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-slate-200">Extension Package SDK & Installer</CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Submit package manifest declarations directly to compile and hot-plug extensions into the AegisOS kernel.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 block">Package Manifest JSON</label>
                      <textarea
                        value={newManifestJson}
                        onChange={(e) => setNewManifestJson(e.target.value)}
                        rows={16}
                        className="w-full font-mono text-xs p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-cyan-400 leading-relaxed"
                      />
                    </div>
                    
                    <Button 
                      onClick={handleInstallCustom}
                      disabled={actionLoading === 'install-custom'}
                      className="bg-cyan-600 hover:bg-cyan-700 text-slate-100 px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 text-xs"
                    >
                      <Upload className="h-4 w-4" />
                      {actionLoading === 'install-custom' ? 'Installing Extension...' : 'Install & Activate Package'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

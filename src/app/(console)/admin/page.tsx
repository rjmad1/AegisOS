"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Users, Key, Settings, ListCollapse, Database, 
  Activity, Play, CheckCircle, AlertTriangle, X, ShieldAlert,
  Server, Zap, Lock, RefreshCw, Eye, Download, Upload, Trash2, Calendar, Archive, ToggleLeft
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";

type TabId = 
  | 'dashboard' | 'users' | 'roles' | 'providers' | 'config' 
  | 'secrets' | 'audit' | 'jobs' | 'backups' | 'diagnostics' 
  | 'maintenance' | 'flags' | 'inventory';

export default function AdministrationConsole() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  
  // Data States
  const [users, setUsers] = useState<any[]>([]);
  const [rolesMatrix, setRolesMatrix] = useState<Record<string, string[]>>({} as any);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [config, setConfig] = useState<any>({});
  const [configHistory, setConfigHistory] = useState<any[]>([]);
  const [secrets, setSecrets] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [inventory, setInventory] = useState<any>({});
  const [license, setLicense] = useState<any>({});
  const [featureFlags, setFeatureFlags] = useState<any[]>([]);

  // Search/Filter states
  const [auditQuery, setAuditQuery] = useState('');
  const [auditCategory, setAuditCategory] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [inventoryQuery, setInventoryQuery] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [newSecretKey, setNewSecretKey] = useState('');
  const [newSecretValue, setNewSecretValue] = useState('');
  
  // Config Form
  const [configNotes, setConfigNotes] = useState('');

  useEffect(() => {
    loadAllData();
  }, [activeTab]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        usersRes, rolesRes, permRes, provRes, configRes, 
        secretsRes, auditRes, jobsRes, backupsRes, diagRes, 
        invRes, licRes, flagsRes
      ] = await Promise.all([
        fetch('/api/v1/admin/users').then(r => r.json()),
        fetch('/api/v1/admin/roles').then(r => r.json()),
        fetch('/api/v1/admin/permissions').then(r => r.json()),
        fetch('/api/v1/admin/providers').then(r => r.json()),
        fetch('/api/v1/admin/configuration').then(r => r.json()),
        fetch('/api/v1/admin/secrets').then(r => r.json()),
        fetch('/api/v1/admin/audit').then(r => r.json()),
        fetch('/api/v1/admin/jobs').then(r => r.json()),
        fetch('/api/v1/admin/backups').then(r => r.json()),
        fetch('/api/v1/admin/diagnostics').then(r => r.json()),
        fetch('/api/v1/admin/inventory').then(r => r.json()),
        fetch('/api/v1/admin/licenses').then(r => r.json()),
        fetch('/api/v1/admin/feature-flags').then(r => r.json())
      ]);

      setUsers(usersRes || []);
      setRolesMatrix(rolesRes || {});
      setPermissions(permRes || []);
      setProviders(provRes || []);
      setConfig(configRes?.config || {});
      setConfigHistory(configRes?.history || []);
      setSecrets(secretsRes || []);
      setAuditLogs(auditRes || []);
      setJobs(jobsRes || []);
      setBackups(backupsRes || []);
      setDiagnostics(diagRes || {});
      setInventory(invRes || {});
      setLicense(licRes || {});
      setFeatureFlags(flagsRes || []);
    } catch (e) {
      console.error('Failed to load administration dataset:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = async (user: any) => {
    const newStatus = user.status === 'Enabled' ? 'Disabled' : 'Enabled';
    setActionLoading(`user-${user.id}`);
    try {
      await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...user, status: newStatus })
      });
      loadAllData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser?.email || !editingUser?.role) return;
    try {
      await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser)
      });
      setShowUserModal(false);
      loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleRolePermission = async (role: string, perm: string) => {
    const currentPerms = rolesMatrix[role] || [];
    const newPerms = currentPerms.includes(perm)
      ? currentPerms.filter(p => p !== perm)
      : [...currentPerms, perm];

    try {
      await fetch('/api/v1/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, permissions: newPerms })
      });
      loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleProvider = async (providerId: string, currentStatus: boolean) => {
    try {
      await fetch('/api/v1/admin/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: providerId, enabled: !currentStatus })
      });
      loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveConfig = async () => {
    try {
      await fetch('/api/v1/admin/configuration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, notes: configNotes })
      });
      setConfigNotes('');
      loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRevertConfig = async (version: number) => {
    try {
      await fetch('/api/v1/admin/configuration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revert', version })
      });
      loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSecretKey || !newSecretValue) return;
    try {
      await fetch('/api/v1/admin/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: newSecretKey, value: newSecretValue })
      });
      setNewSecretKey('');
      setNewSecretValue('');
      setShowSecretModal(false);
      loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSecret = async (key: string) => {
    try {
      await fetch(`/api/v1/admin/secrets?key=${key}`, { method: 'DELETE' });
      loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerJob = async (jobId: string) => {
    setActionLoading(`job-${jobId}`);
    try {
      await fetch('/api/v1/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: jobId })
      });
      setTimeout(loadAllData, 1000);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateBackup = async () => {
    setActionLoading('backup-create');
    try {
      await fetch('/api/v1/admin/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Manual administrator snapshot' })
      });
      loadAllData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFeatureFlag = async (flagId: string, currentStatus: boolean) => {
    try {
      await fetch('/api/v1/admin/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: flagId, enabled: !currentStatus })
      });
      loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRefreshDiagnostics = async () => {
    setActionLoading('diag-refresh');
    await loadAllData();
    setActionLoading(null);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] text-zinc-50 select-none overflow-hidden">
      {/* Vertical Navigation Panel */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-950/70 p-4 flex flex-col space-y-1 overflow-y-auto custom-scrollbar">
        <div className="flex items-center space-x-2 px-3 py-4 mb-4 border-b border-zinc-800">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-sm font-black uppercase tracking-wider text-zinc-300">Governance Plane</span>
        </div>

        {[
          { id: 'dashboard', label: 'Platform Summary', icon: Shield },
          { id: 'users', label: 'User Registry', icon: Users },
          { id: 'roles', label: 'RBAC Policy Matrix', icon: Lock },
          { id: 'providers', label: 'Provider Registry', icon: Server },
          { id: 'config', label: 'Configuration Hub', icon: Settings },
          { id: 'secrets', label: 'Secret Vault', icon: Key },
          { id: 'audit', label: 'Audit Logs Viewer', icon: ShieldAlert },
          { id: 'jobs', label: 'Scheduler Services', icon: Calendar },
          { id: 'backups', label: 'Backup Archive', icon: Archive },
          { id: 'diagnostics', label: 'Diagnostics Center', icon: Activity },
          { id: 'flags', label: 'Feature Switches', icon: ToggleLeft },
          { id: 'inventory', label: 'System Inventory', icon: ListCollapse },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`flex items-center space-x-3 w-full px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                isActive 
                  ? 'bg-primary/20 text-primary border border-primary/30 shadow-md shadow-primary/5' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </aside>

      {/* Main Administrative Control workspace */}
      <main className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-zinc-900/10">
        
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="h-8 w-8 text-primary animate-spin mr-3" />
            <span className="text-zinc-400 font-medium">Synchronizing Governance Metadata...</span>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Maintenance Mode Banner Notification */}
            {config.maintenanceMode && (
              <Alert variant="warning" className="border-amber-500/50 bg-amber-500/10 text-amber-300">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-bold">Maintenance Mode Active</span>: {config.maintenanceBanner}
              </Alert>
            )}

            {/* TAB CONTENT: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight">Platform Control Dashboard</h1>
                  <p className="text-sm text-zinc-400">Core administrative telemetry, licensing constraints, and active server summaries.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card className="bg-zinc-950/40 border-zinc-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Edition Registry</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-black text-zinc-100">{license.edition}</div>
                      <p className="text-xs text-zinc-400 mt-1">Version: {license.version}</p>
                      <p className="text-[10px] text-zinc-500 mt-2 font-mono">{license.licenseKey}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-zinc-950/40 border-zinc-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Active Credentials</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{users.length} Users</div>
                      <p className="text-xs text-zinc-400 mt-1">Enabled roles: {users.filter(u => u.status === 'Enabled').length} active</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-zinc-950/40 border-zinc-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Stored Secrets</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{secrets.length} Keys</div>
                      <p className="text-xs text-zinc-400 mt-1">Encrypted with AES-256-GCM</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-zinc-950/40 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider">Features Enabled in Current License</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2 md:grid-cols-2">
                    {license.features?.map((f: string, idx: number) => (
                      <div key={idx} className="flex items-center space-x-2 text-xs text-zinc-300">
                        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* TAB CONTENT: USERS */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">Authorized User Registry</h1>
                    <p className="text-sm text-zinc-400">Add users, manage active sessions, configure role levels, and disable accounts.</p>
                  </div>
                  <Button 
                    onClick={() => { setEditingUser({ email: '', role: 'Operator', status: 'Enabled', permissions: [] }); setShowUserModal(true); }}
                    className="bg-primary hover:bg-primary/95 text-xs py-1.5"
                  >
                    Add Authorized User
                  </Button>
                </div>

                <div className="flex items-center space-x-3 mb-4">
                  <Input 
                    placeholder="Search users by email or name..." 
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    className="max-w-md bg-zinc-950/40 border-zinc-800"
                  />
                </div>

                <Card className="bg-zinc-950/40 border-zinc-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-400 font-bold bg-zinc-950/30">
                          <th className="p-3">Display Name</th>
                          <th className="p-3">Email Address</th>
                          <th className="p-3">Assigned Role</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Last Active Login</th>
                          <th className="p-3 text-right">Administrative Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-850">
                        {users.filter(u => u.email.toLowerCase().includes(userQuery.toLowerCase()) || u.displayName.toLowerCase().includes(userQuery.toLowerCase())).map(user => (
                          <tr key={user.id} className="hover:bg-zinc-900/30">
                            <td className="p-3 font-semibold">{user.displayName}</td>
                            <td className="p-3 font-mono">{user.email}</td>
                            <td className="p-3">
                              <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 font-bold uppercase text-[9px]">
                                {user.role}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${user.status === 'Enabled' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                {user.status}
                              </span>
                            </td>
                            <td className="p-3 text-zinc-400">
                              {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                            </td>
                            <td className="p-3 text-right space-x-2">
                              <button 
                                onClick={() => { setEditingUser(user); setShowUserModal(true); }}
                                className="text-primary hover:underline font-semibold"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleToggleUser(user)}
                                disabled={actionLoading === `user-${user.id}`}
                                className={`${user.status === 'Enabled' ? 'text-red-400 hover:text-red-300' : 'text-emerald-400 hover:text-emerald-300'} font-semibold`}
                              >
                                {user.status === 'Enabled' ? 'Disable' : 'Enable'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* TAB CONTENT: ROLE MATRIX */}
            {activeTab === 'roles' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight">RBAC Matrix Policy Editor</h1>
                  <p className="text-sm text-zinc-400">Map permission scopes against roles dynamically. Permissions propagate instantly.</p>
                </div>

                <Card className="bg-zinc-950/40 border-zinc-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-950/30">
                          <th className="p-4 font-bold">Permission Scope</th>
                          {Object.keys(rolesMatrix).map(role => (
                            <th key={role} className="p-4 font-bold text-center uppercase tracking-wider">{role}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-850">
                        {permissions.map(perm => (
                          <tr key={perm} className="hover:bg-zinc-900/30">
                            <td className="p-3 font-semibold text-zinc-300">{perm}</td>
                            {Object.keys(rolesMatrix).map(role => {
                              const hasPerm = rolesMatrix[role]?.includes(perm);
                              const isReadOnlyAdmin = role === 'Administrator';
                              return (
                                <td key={role} className="p-3 text-center">
                                  <input 
                                    type="checkbox"
                                    checked={hasPerm}
                                    disabled={isReadOnlyAdmin}
                                    onChange={() => handleToggleRolePermission(role, perm)}
                                    className="rounded border-zinc-700 bg-zinc-900 text-primary focus:ring-primary/20 h-4 w-4"
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* TAB CONTENT: PROVIDERS */}
            {activeTab === 'providers' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight">Infrastructure Provider Registry</h1>
                  <p className="text-sm text-zinc-400">Monitor capability providers, dependency paths, registrations, and enable/disable services.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {providers.map(p => (
                    <Card key={p.id} className="bg-zinc-950/40 border-zinc-800 hover:border-zinc-700 transition-all">
                      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <div>
                          <CardTitle className="text-sm font-bold text-zinc-100">{p.name}</CardTitle>
                          <CardDescription className="text-[10px] font-mono text-zinc-500 mt-0.5">ID: {p.id} &bull; v{p.version}</CardDescription>
                        </div>
                        <Switch 
                          checked={p.enabled}
                          onChange={() => handleToggleProvider(p.id, p.enabled)}
                        />
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500">Provider Category:</span>
                          <span className="font-mono text-zinc-300">{p.type}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500">Registration:</span>
                          <Badge variant="success" className="text-[9px] py-0">{p.registrationStatus}</Badge>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-zinc-500 block">Capabilities:</span>
                          <div className="flex flex-wrap gap-1">
                            {p.capabilities?.map((c: string) => (
                              <span key={c} className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400">{c}</span>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: CONFIGURATION */}
            {activeTab === 'config' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight">Configuration Hub</h1>
                  <p className="text-sm text-zinc-400">Configure global service limits, ports, session settings, and export/import configuration snapshots.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <div className="md:col-span-2 space-y-6">
                    <Card className="bg-zinc-950/40 border-zinc-800">
                      <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase">Active Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-1">
                            <label className="text-xs text-zinc-500 block">HTTP Service Port</label>
                            <Input 
                              type="number"
                              value={config.port || 3000}
                              onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value, 10) })}
                              className="bg-zinc-950 border-zinc-800"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-zinc-500 block">Rate Limit Threshold (req/min)</label>
                            <Input 
                              type="number"
                              value={config.rateLimitMax || 150}
                              onChange={(e) => setConfig({ ...config, rateLimitMax: parseInt(e.target.value, 10) })}
                              className="bg-zinc-950 border-zinc-800"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-zinc-500 block">Session Expiry Timeout (mins)</label>
                            <Input 
                              type="number"
                              value={config.sessionTimeoutMinutes || 480}
                              onChange={(e) => setConfig({ ...config, sessionTimeoutMinutes: parseInt(e.target.value, 10) })}
                              className="bg-zinc-950 border-zinc-800"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs text-zinc-500 block">Change Description Notes</label>
                          <Input 
                            placeholder="Describe configuration modifications for audit logging..."
                            value={configNotes}
                            onChange={(e) => setConfigNotes(e.target.value)}
                            className="bg-zinc-950 border-zinc-800"
                          />
                        </div>

                        <Button 
                          onClick={handleSaveConfig}
                          className="bg-primary hover:bg-primary/95 text-xs py-1.5"
                        >
                          Commit Configuration Changes
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card className="bg-zinc-950/40 border-zinc-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold uppercase">Configuration History</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {configHistory.map(h => (
                          <div key={h.version} className="p-2.5 rounded border border-zinc-850 bg-zinc-950/30 text-xs space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-primary">Version #{h.version}</span>
                              <span className="text-[10px] text-zinc-500">{new Date(h.timestamp).toLocaleDateString()}</span>
                            </div>
                            <p className="text-zinc-400 text-[11px] italic">"{h.notes}"</p>
                            <div className="flex justify-between items-center pt-2">
                              <span className="text-[9px] text-zinc-500">By: {h.changedBy}</span>
                              <button 
                                onClick={() => handleRevertConfig(h.version)}
                                className="text-[10px] text-primary hover:underline font-bold"
                              >
                                Revert
                              </button>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SECRETS */}
            {activeTab === 'secrets' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">Secrets Vault</h1>
                    <p className="text-sm text-zinc-400">Register Google OAuth credentials, API keys, and certificates. Encrypted at rest, never shown in plaintext.</p>
                  </div>
                  <Button 
                    onClick={() => { setNewSecretKey(''); setNewSecretValue(''); setShowSecretModal(true); }}
                    className="bg-primary hover:bg-primary/95 text-xs py-1.5"
                  >
                    Add Safe Secret
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {secrets.map(s => (
                    <Card key={s.key} className="bg-zinc-950/40 border-zinc-800">
                      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <div>
                          <CardTitle className="text-xs font-mono font-bold text-zinc-300">{s.key}</CardTitle>
                          <CardDescription className="text-[10px] text-zinc-500 mt-1">Updated: {new Date(s.updatedAt).toLocaleString()}</CardDescription>
                        </div>
                        <button 
                          onClick={() => handleDeleteSecret(s.key)}
                          className="text-zinc-500 hover:text-red-400 p-1 shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center space-x-2 bg-zinc-950/50 p-2 rounded border border-zinc-850 font-mono text-xs text-zinc-400">
                          <Lock className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                          <span>{s.value}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: AUDIT LOGS */}
            {activeTab === 'audit' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight">Governance Audit Viewer</h1>
                  <p className="text-sm text-zinc-400">Searchable log tracking authentication events, configuration changes, and administrative actions.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                  <Input 
                    placeholder="Search logs by action, details, user, or IP..."
                    value={auditQuery}
                    onChange={(e) => setAuditQuery(e.target.value)}
                    className="flex-1 bg-zinc-950/40 border-zinc-800"
                  />
                  <Select 
                    value={auditCategory}
                    onChange={(e) => setAuditCategory(e.target.value)}
                    className="w-48 bg-zinc-950 border-zinc-800"
                  >
                    <option value="">All Categories</option>
                    <option value="authentication">Authentication</option>
                    <option value="authorization">Authorization</option>
                    <option value="configuration">Configuration</option>
                    <option value="provider">Provider</option>
                    <option value="security">Security</option>
                    <option value="administration">Administration</option>
                  </Select>
                </div>

                <Card className="bg-zinc-950/40 border-zinc-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[11px] font-mono">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-400 font-bold bg-zinc-950/30">
                          <th className="p-3">Timestamp</th>
                          <th className="p-3">User</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Action</th>
                          <th className="p-3">Details</th>
                          <th className="p-3">IP Address</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-850">
                        {auditLogs.filter(log => {
                          const matchesQuery = !auditQuery || 
                            log.action.toLowerCase().includes(auditQuery.toLowerCase()) || 
                            log.details.toLowerCase().includes(auditQuery.toLowerCase()) || 
                            log.userId.toLowerCase().includes(auditQuery.toLowerCase());
                          const matchesCat = !auditCategory || log.category === auditCategory;
                          return matchesQuery && matchesCat;
                        }).map(log => (
                          <tr key={log.id} className="hover:bg-zinc-900/30">
                            <td className="p-2.5 text-zinc-500">{new Date(log.timestamp).toLocaleString()}</td>
                            <td className="p-2.5 font-bold text-zinc-300">{log.userId}</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-extrabold border ${
                                log.category === 'security' || log.category === 'authorization'
                                  ? 'border-red-500/20 bg-red-500/5 text-red-400'
                                  : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                              }`}>
                                {log.category}
                              </span>
                            </td>
                            <td className="p-2.5 text-primary font-semibold">{log.action}</td>
                            <td className="p-2.5 text-zinc-400 max-w-sm truncate" title={log.details}>{log.details}</td>
                            <td className="p-2.5 text-zinc-500">{log.ipAddress}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* TAB CONTENT: SCHEDULER JOBS */}
            {activeTab === 'jobs' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight">Job Scheduler Control</h1>
                  <p className="text-sm text-zinc-400">View and manually execute recurring administrative maintenance, backup, and health check jobs.</p>
                </div>

                <div className="grid gap-4">
                  {jobs.map(job => (
                    <Card key={job.id} className="bg-zinc-950/40 border-zinc-800">
                      <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-bold text-zinc-100">{job.name}</h3>
                            <Badge variant={job.enabled ? 'success' : 'secondary'} className="text-[9px] py-0 uppercase">
                              {job.enabled ? 'Active' : 'Disabled'}
                            </Badge>
                          </div>
                          <p className="text-xs text-zinc-400">Cron: <code className="bg-zinc-900 px-1 py-0.5 rounded">{job.cronExpression}</code> &bull; Next Run: {job.nextRun ? new Date(job.nextRun).toLocaleString() : 'Never'}</p>
                          {job.message && (
                            <p className="text-[10px] text-zinc-500 italic mt-1 font-mono">Last status: {job.message}</p>
                          )}
                        </div>

                        <div className="flex items-center space-x-3 shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            job.status === 'running' 
                              ? 'bg-blue-500/10 text-blue-400 animate-pulse' 
                              : job.status === 'success' 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {job.status.toUpperCase()}
                          </span>
                          <Button 
                            variant="outline"
                            onClick={() => handleTriggerJob(job.id)}
                            disabled={actionLoading === `job-${job.id}` || job.status === 'running'}
                            leftIcon={<Play className="h-3 w-3 text-primary" />}
                            className="text-xs py-1 px-3 border-zinc-800"
                          >
                            Run Now
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: BACKUPS */}
            {activeTab === 'backups' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">Backup Archive</h1>
                    <p className="text-sm text-zinc-400">Trigger immediate full backups, view snapshot histories, and run file integrity verifications.</p>
                  </div>
                  <Button 
                    onClick={handleCreateBackup}
                    disabled={actionLoading === 'backup-create'}
                    leftIcon={<RefreshCw className={`h-3 w-3 ${actionLoading === 'backup-create' ? 'animate-spin' : ''}`} />}
                    className="bg-primary hover:bg-primary/95 text-xs py-1.5"
                  >
                    Create Backup Snapshot
                  </Button>
                </div>

                <div className="grid gap-4">
                  {backups.map(bak => (
                    <Card key={bak.id} className="bg-zinc-950/40 border-zinc-800">
                      <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-xs font-mono font-bold text-zinc-200">{bak.filename}</h3>
                            <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-500/5 text-[9px] py-0 font-extrabold">
                              INTEGRITY: {bak.integrity}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-zinc-400">{bak.notes}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">Date: {new Date(bak.createdDate).toLocaleString()} &bull; Size: {(bak.sizeBytes / 1024 / 1024).toFixed(2)} MB</p>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <Button variant="outline" className="text-xs py-1 px-3 border-zinc-800">
                            Download
                          </Button>
                          <Button variant="outline" className="text-xs py-1 px-3 border-zinc-850 text-red-400 hover:text-red-300">
                            Restore
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: DIAGNOSTICS */}
            {activeTab === 'diagnostics' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">Diagnostics Center</h1>
                    <p className="text-sm text-zinc-400">Unified view of CPU, GPU, Network sockets, Database sizes, and physical writable logs.</p>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={handleRefreshDiagnostics}
                    leftIcon={<RefreshCw className={`h-4 w-4 ${actionLoading === 'diag-refresh' ? 'animate-spin' : ''}`} />}
                    className="border-zinc-800 text-xs py-1.5"
                  >
                    Refresh Telemetry
                  </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="bg-zinc-950/40 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold uppercase">Runtime Process & Memory</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Uptime:</span>
                        <span className="font-bold text-zinc-300">{(diagnostics.runtime?.uptimeSeconds / 3600).toFixed(2)} hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Node version:</span>
                        <span className="font-mono text-zinc-300">{diagnostics.runtime?.nodeVersion}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Memory usage:</span>
                        <span className="font-bold text-zinc-300">{((diagnostics.runtime?.memoryTotalBytes - diagnostics.runtime?.memoryFreeBytes) / 1024 / 1024 / 1024).toFixed(2)} GB / {(diagnostics.runtime?.memoryTotalBytes / 1024 / 1024 / 1024).toFixed(0)} GB</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-zinc-950/40 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold uppercase">Network Ports Binding</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Active listening ports:</span>
                        <span className="font-mono text-primary font-bold">{diagnostics.network?.listeningPorts?.join(', ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Active socket handles:</span>
                        <span className="font-bold text-zinc-300">{diagnostics.network?.activeSockets}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-zinc-950/40 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold uppercase">Databases Storage Space</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Disk capacity:</span>
                        <span className="font-bold text-zinc-300">{(diagnostics.database?.totalSizeDiskBytes / 1024).toFixed(2)} KB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Avg write delay:</span>
                        <span className="font-mono text-emerald-400 font-bold">{diagnostics.database?.activeWriteLatencyMs} ms</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* TAB CONTENT: FEATURE FLAGS */}
            {activeTab === 'flags' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight">Feature Toggles Matrix</h1>
                  <p className="text-sm text-zinc-400">Activate or deactivate experimental AI modules, UI layouts, and provider versions instantly.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {featureFlags.map(flag => (
                    <Card key={flag.id} className="bg-zinc-950/40 border-zinc-800">
                      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <div>
                          <CardTitle className="text-sm font-bold text-zinc-200">{flag.name}</CardTitle>
                          <CardDescription className="text-[10px] uppercase font-bold text-zinc-500 mt-1">Category: {flag.category}</CardDescription>
                        </div>
                        <Switch 
                          checked={flag.enabled}
                          onChange={() => handleToggleFeatureFlag(flag.id, flag.enabled)}
                        />
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-zinc-400 mt-1">{flag.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: MAINTENANCE */}
            {activeTab === 'maintenance' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight">Platform Maintenance Configuration</h1>
                  <p className="text-sm text-zinc-400">Put the platform in read-only mode, deploy warning headers, or schedule maintenance periods.</p>
                </div>

                <Card className="bg-zinc-950/40 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase">Maintenance States</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-200">Maintenance Mode Active</h4>
                        <p className="text-[11px] text-zinc-500 mt-0.5">Blocks non-admin users from connecting to the console workspace.</p>
                      </div>
                      <Switch 
                        checked={config.maintenanceMode || false}
                        onChange={() => setConfig({ ...config, maintenanceMode: !config.maintenanceMode })}
                      />
                    </div>

                    <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-200">Read-Only Mode Lock</h4>
                        <p className="text-[11px] text-zinc-500 mt-0.5">Enforces write validations to prevent databases/checkpoints mutation.</p>
                      </div>
                      <Switch 
                        checked={config.readOnlyMode || false}
                        onChange={() => setConfig({ ...config, readOnlyMode: !config.readOnlyMode })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-zinc-400 block font-semibold">Banner Alert Message</label>
                      <Input 
                        value={config.maintenanceBanner || ''}
                        onChange={(e) => setConfig({ ...config, maintenanceBanner: e.target.value })}
                        className="bg-zinc-950 border-zinc-800"
                      />
                    </div>

                    <Button 
                      onClick={handleSaveConfig}
                      className="bg-primary hover:bg-primary/95 text-xs py-1.5"
                    >
                      Save Maintenance Settings
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* TAB CONTENT: INVENTORY */}
            {activeTab === 'inventory' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight">System Module Inventory</h1>
                  <p className="text-sm text-zinc-400">Outline tree displaying routes, commands, widgets, events, and databases registered with the Platform Kernel.</p>
                </div>

                <div className="flex items-center space-x-3 mb-4">
                  <Input 
                    placeholder="Filter inventory entities..." 
                    value={inventoryQuery}
                    onChange={(e) => setInventoryQuery(e.target.value)}
                    className="max-w-md bg-zinc-950/40 border-zinc-800"
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="bg-zinc-950/40 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold uppercase">Kernel Modules & Routes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar text-xs font-mono">
                      <div>
                        <span className="font-bold text-primary text-xs">Modules list:</span>
                        <ul className="list-disc pl-4 space-y-1 mt-1 text-zinc-400">
                          {inventory.modules?.filter((m: any) => m.name.toLowerCase().includes(inventoryQuery.toLowerCase())).map((m: any) => (
                            <li key={m.id}>{m.name} (v{m.version}) &mdash; {m.description}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <span className="font-bold text-primary text-xs">Registered navigation paths:</span>
                        <ul className="list-disc pl-4 space-y-1 mt-1 text-zinc-400">
                          {inventory.routes?.filter((r: any) => r.path.toLowerCase().includes(inventoryQuery.toLowerCase())).map((r: any) => (
                            <li key={r.path}>{r.path} &bull; target Module: {r.moduleId}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-zinc-950/40 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold uppercase">Commands & Event Handlers</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar text-xs font-mono">
                      <div>
                        <span className="font-bold text-primary text-xs">Command shortcuts registered:</span>
                        <ul className="list-disc pl-4 space-y-1 mt-1 text-zinc-400">
                          {inventory.commands?.filter((c: any) => c.title.toLowerCase().includes(inventoryQuery.toLowerCase())).map((c: any) => (
                            <li key={c.id}>{c.title} (ID: {c.id})</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <span className="font-bold text-primary text-xs">Active database files:</span>
                        <ul className="list-disc pl-4 space-y-1 mt-1 text-zinc-400">
                          {inventory.databases?.filter((d: any) => d.toLowerCase().includes(inventoryQuery.toLowerCase())).map((d: any) => (
                            <li key={d}>{d}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      {/* MODAL: ADD / EDIT USER */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 bg-zinc-950 border border-zinc-850 rounded-xl shadow-2xl glass-panel relative">
            <button 
              onClick={() => setShowUserModal(false)}
              className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200 mb-4">Authorized User Settings</h3>
            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-zinc-500">Email Address</label>
                <Input 
                  value={editingUser?.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  placeholder="name@domain.com"
                  required
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
              <div className="space-y-1">
                <label className="text-zinc-500">Display Name</label>
                <Input 
                  value={editingUser?.displayName || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                  placeholder="John Doe"
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
              <div className="space-y-1">
                <label className="text-zinc-500">Assigned Role</label>
                <Select 
                  value={editingUser?.role || 'Operator'}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="bg-zinc-900 border-zinc-800"
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Operator">Operator</option>
                  <option value="Viewer">Viewer</option>
                  <option value="Auditor">Auditor</option>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-zinc-500">Lockout / Status</label>
                <Select 
                  value={editingUser?.status || 'Enabled'}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                  className="bg-zinc-900 border-zinc-800"
                >
                  <option value="Enabled">Enabled</option>
                  <option value="Disabled">Disabled</option>
                </Select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowUserModal(false)}
                  className="border-zinc-800"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary text-zinc-950 font-bold"
                >
                  Save User
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SECRET */}
      {showSecretModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 bg-zinc-950 border border-zinc-850 rounded-xl shadow-2xl glass-panel relative">
            <button 
              onClick={() => setShowSecretModal(false)}
              className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200 mb-4">Register Safe Key</h3>
            <form onSubmit={handleSaveSecret} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-zinc-500">Key Name</label>
                <Input 
                  value={newSecretKey}
                  onChange={(e) => setNewSecretKey(e.target.value.toUpperCase())}
                  placeholder="GOOGLE_CLIENT_ID"
                  required
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
              <div className="space-y-1">
                <label className="text-zinc-500">Secret Plaintext Value</label>
                <Input 
                  type="password"
                  value={newSecretValue}
                  onChange={(e) => setNewSecretValue(e.target.value)}
                  placeholder="Type secret value..."
                  required
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowSecretModal(false)}
                  className="border-zinc-800"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary text-zinc-950 font-bold"
                >
                  Encrypt & Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

"use client";

import * as React from "react";
import { 
  Shield, ShieldAlert, ShieldCheck, Activity, Users, Lock, CheckSquare, 
  Play, RefreshCw, Terminal, EyeOff, CheckCircle2, AlertTriangle, XOctagon,
  Smartphone, QrCode, Copy, Check, Plus, Trash2
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Loading";
import { Dialog } from "@/components/ui/Dialog";

interface SecurityStats {
  activeSessions: number;
  lockouts: number;
  securityViolations: number;
  totalAuditLogs: number;
  complianceRating: number;
  threatLevel: "Normal" | "Elevated" | "High" | "Critical";
  lastUpdated: string;
}

interface ComplianceControl {
  id: string;
  name: string;
  category: string;
  status: "Passed" | "Failed" | "Warning";
  description: string;
  evidence: string;
}

interface ComplianceReport {
  standard: string;
  score: number;
  passedCount: number;
  totalCount: number;
  controls: ComplianceControl[];
}

interface PenetrationReport {
  scanId: string;
  timestamp: string;
  score: number;
  findings: {
    testId: string;
    name: string;
    target: string;
    result: "Passed" | "Failed";
    details: string;
  }[];
}

export default function SecurityDashboardPage() {
  const [stats, setStats] = React.useState<SecurityStats | null>(null);
  const [compliance, setCompliance] = React.useState<Record<string, ComplianceReport> | null>(null);
  const [penHistory, setPenHistory] = React.useState<PenetrationReport[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [runningPenTest, setRunningPenTest] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"compliance" | "pentest" | "audits" | "devices">("compliance");
  const [auditLogs, setAuditLogs] = React.useState<any[]>([]);

  // Mobile devices states
  const [devices, setDevices] = React.useState<any[]>([]);
  const [loadingDevices, setLoadingDevices] = React.useState(false);
  const [pairingModalOpen, setPairingModalOpen] = React.useState(false);
  const [pairingChallenge, setPairingChallenge] = React.useState<{ token: string; code: string; expiresAt: string; endpoints: any[] } | null>(null);
  const [copiedCode, setCopiedCode] = React.useState(false);

  const fetchDevices = async () => {
    try {
      setLoadingDevices(true);
      const res = await fetch("/api/v1/mobile/auth/devices");
      if (res.ok) {
        const data = await res.json();
        setDevices(data);
      }
    } catch (e) {
      console.error("Failed to fetch mobile devices:", e);
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleApproveDevice = async (deviceId: string) => {
    try {
      const res = await fetch("/api/v1/mobile/auth/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      });
      if (res.ok) {
        await fetchDevices();
        await fetchSecurityData();
      }
    } catch (e) {
      console.error("Failed to approve device:", e);
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    try {
      const res = await fetch(`/api/v1/mobile/auth/device/${deviceId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchDevices();
        await fetchSecurityData();
      }
    } catch (e) {
      console.error("Failed to revoke device:", e);
    }
  };

  const handleGenerateChallenge = async () => {
    try {
      const res = await fetch("/api/v1/mobile/auth/pair");
      if (res.ok) {
        const challenge = await res.json();
        setPairingChallenge(challenge);
        setPairingModalOpen(true);
      }
    } catch (e) {
      console.error("Failed to generate pairing challenge:", e);
    }
  };

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      const [statsRes, compRes, penRes] = await Promise.all([
        fetch("/api/v1/security/stats"),
        fetch("/api/v1/compliance"),
        fetch("/api/v1/security/penetration")
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (compRes.ok) setCompliance(await compRes.json());
      if (penRes.ok) setPenHistory(await penRes.json());

      // Fetch audit logs
      const auditsRes = await fetch("/api/v1/events");
      if (auditsRes.ok) {
        const events = await auditsRes.json();
        setAuditLogs(events.slice(0, 10)); // Show last 10
      }
    } catch (e) {
      console.error("Failed to load security metrics", e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSecurityData();
  }, []);

  const triggerPenTest = async () => {
    try {
      setRunningPenTest(true);
      const res = await fetch("/api/v1/security/penetration", { method: "POST" });
      if (res.ok) {
        const newReport = await res.json();
        setPenHistory(prev => [newReport, ...prev]);
        fetchSecurityData(); // Refresh stats
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRunningPenTest(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      const res = await fetch("/api/v1/auth/session/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      });
      if (res.ok) {
        fetchSecurityData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-3">
        <Spinner />
        <p className="text-xs text-muted-foreground animate-pulse">Analyzing security posture...</p>
      </div>
    );
  }

  const threatVariants = {
    Normal: { badge: "success", text: "text-emerald-500", glow: "shadow-emerald-500/20" },
    Elevated: { badge: "warning", text: "text-amber-500", glow: "shadow-amber-500/20" },
    High: { badge: "warning", text: "text-orange-500", glow: "shadow-orange-500/20" },
    Critical: { badge: "destructive", text: "text-rose-500", glow: "shadow-rose-500/20" },
  };

  const threatLevel = stats?.threatLevel || "Normal";
  const threatInfo = threatVariants[threatLevel];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Security Operations Center</h1>
          <p className="text-sm text-muted-foreground">
            Zero Trust boundary orchestration, compliance audits, and real-time threat intelligence.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            leftIcon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchSecurityData}
            disabled={loading}
          >
            Refresh posturing
          </Button>
        </div>
      </div>

      {/* Hero Security Alert Bar */}
      <div className={`p-4 rounded-lg border border-border/40 bg-card/40 glass-panel flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md ${threatInfo.glow}`}>
        <div className="flex items-center space-x-3.5">
          <div className={`p-2 rounded-lg bg-background/50`}>
            {threatLevel === "Normal" ? (
              <ShieldCheck className="h-6 w-6 text-emerald-500 animate-pulse" />
            ) : (
              <ShieldAlert className={`h-6 w-6 ${threatInfo.text} animate-bounce`} />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-foreground">Infrastructure Threat Status:</span>
              <Badge variant={threatInfo.badge as any}>{threatLevel}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Continuous authorization is actively validating boundaries. Client requests are checked on loopback.
            </p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground text-right">
          Last Scan: {stats ? new Date(stats.lastUpdated).toLocaleTimeString() : "-"}
        </div>
      </div>

      {/* Main KPI metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card glow>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Compliance Rating</CardTitle>
            <CheckSquare className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{stats?.complianceRating}%</div>
            <p className="text-xs text-muted-foreground mt-1">SOC2, ISO27001, NIST standards</p>
          </CardContent>
        </Card>

        <Card glow>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeSessions} Active</div>
            <p className="text-xs text-muted-foreground mt-1">Token validation active</p>
          </CardContent>
        </Card>

        <Card glow>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Blocked Violations</CardTitle>
            <Activity className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.securityViolations} Blocked</div>
            <p className="text-xs text-muted-foreground mt-1">Safety firewall alerts</p>
          </CardContent>
        </Card>

        <Card glow>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Locked IPs</CardTitle>
            <Lock className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.lockouts} Locked</div>
            <p className="text-xs text-muted-foreground mt-1">Brute-force lockout manager</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Layout */}
      <div className="space-y-4">
        <div className="flex border-b border-border/40 space-x-6 overflow-x-auto custom-scrollbar">
          {[
            { id: "compliance", label: "Compliance Matrices", icon: CheckCircle2 },
            { id: "pentest", label: "Penetration Testing Suite", icon: Terminal },
            { id: "audits", label: "Audit Ledger & Sessions", icon: Shield },
            { id: "devices", label: "Mobile Devices", icon: Smartphone }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center space-x-2 pb-2.5 text-sm font-semibold border-b-2 transition-all shrink-0 ${
                activeTab === t.id 
                  ? "border-primary text-foreground" 
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content 1: Compliance */}
        {activeTab === "compliance" && compliance && (
          <div className="grid gap-6 md:grid-cols-3">
            {Object.entries(compliance).map(([key, report]) => (
              <Card key={key} className="flex flex-col h-full">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm font-bold">{key}</CardTitle>
                      <CardDescription className="text-[11px] truncate max-w-[200px]">
                        {report.standard}
                      </CardDescription>
                    </div>
                    <Badge variant={report.score === 100 ? "success" : "warning"}>
                      {report.score}% Passed
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                  <div className="h-1.5 w-full bg-accent/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${report.score}%` }}
                    />
                  </div>
                  <div className="space-y-2.5">
                    {report.controls.map((control) => (
                      <div key={control.id} className="p-2.5 rounded border border-border/20 bg-accent/5 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold text-foreground">{control.id}: {control.name}</span>
                          <Badge 
                            variant={control.status === "Passed" ? "success" : control.status === "Failed" ? "destructive" : "warning"}
                            className="text-[9px] px-1.5 py-0"
                          >
                            {control.status}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{control.description}</p>
                        <p className="text-[10px] font-mono text-emerald-500/90 dark:text-emerald-400 bg-background/40 p-1 rounded mt-1 truncate">
                          {control.evidence}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tab Content 2: Penetration Testing */}
        {activeTab === "pentest" && (
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Security Scanner</CardTitle>
                <CardDescription>Automated validator simulating attacks against auth, injection, and secrets.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="info" title="Zero Trust Verification">
                  The pentest suite validates prompt injection blocking, PII scrubbing, token introspection security, and secrets encryption.
                </Alert>
                <Button
                  className="w-full"
                  leftIcon={runningPenTest ? <RefreshCw className="animate-spin" /> : <Play />}
                  onClick={triggerPenTest}
                  disabled={runningPenTest}
                >
                  {runningPenTest ? "Running Penetration Scan..." : "Trigger Security Audit"}
                </Button>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Audit Run Results History</CardTitle>
                <CardDescription>Records of recent automated security audits.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {penHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Terminal className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">No penetration audits run yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                    {penHistory.map((run, idx) => (
                      <div key={run.scanId || idx} className="p-3 border border-border/40 rounded-lg bg-accent/5 space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-foreground">Scan Run #{penHistory.length - idx}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(run.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <Badge variant={run.score === 100 ? "success" : "warning"}>
                            Score: {run.score}% Passed
                          </Badge>
                        </div>
                        <div className="grid gap-2">
                          {run.findings?.map((finding, fIdx) => (
                            <div key={finding.testId || fIdx} className="flex items-start justify-between p-2 bg-background/50 rounded border border-border/20 text-xs">
                              <div>
                                <span className="font-semibold text-foreground mr-1">{finding.testId}</span>
                                <span className="text-muted-foreground">{finding.name}</span>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{finding.details}</p>
                              </div>
                              <Badge variant={finding.result === "Passed" ? "success" : "destructive"} className="text-[9px]">
                                {finding.result}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab Content 3: Audit Logs & Sessions */}
        {activeTab === "audits" && (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Active Sessions */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Active User Sessions</CardTitle>
                <CardDescription>Revoke access tokens and invalidate active cookie credentials.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-2.5 rounded border border-border/40 bg-accent/5 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-foreground block">System Admin Session</span>
                    <span className="text-muted-foreground text-[10px]">ID: usr-admin-01 &bull; Active Now</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => revokeSession("")}>
                    Revoke
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Audit Logs */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>SOC Event Audit Log</CardTitle>
                <CardDescription>Real-time security logs from databases/event_audit.json</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {auditLogs.map((log) => {
                    const isAlert = ["Security Violation", "Unauthorized Access", "Login Failure"].includes(log.eventType);
                    return (
                      <div key={log.id} className="p-2 border border-border/20 rounded bg-background/50 flex items-start justify-between gap-3 text-xs">
                        <div className="flex items-start space-x-2 truncate">
                          {isAlert ? (
                            <AlertTriangle className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="truncate">
                            <span className="font-bold text-foreground mr-1">{log.eventType}</span>
                            <span className="text-muted-foreground">{log.details}</span>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {log.userEmail || "System"} &bull; {log.ipAddress || "127.0.0.1"}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab Content 4: Mobile Device Management */}
        {activeTab === "devices" && (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Action Card: Add Device */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Onboard Companion App</CardTitle>
                <CardDescription>Authorize a mobile device running the AegisOS App for zero-trust remote signing.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="info" title="Zero Trust Security Model">
                  Mobile devices act as hardware-backed cryptographic signing co-processors. Approval requires console credentials elevation.
                </Alert>
                <Button
                  className="w-full"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={handleGenerateChallenge}
                >
                  Pair New Companion Device
                </Button>
              </CardContent>
            </Card>

            {/* Devices Table Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Registered Hardware Devices</CardTitle>
                <CardDescription>List of currently paired and pending operator devices.</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingDevices && devices.length === 0 ? (
                  <div className="flex justify-center py-6">
                    <Spinner />
                  </div>
                ) : devices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Smartphone className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">No companion devices registered yet.</p>
                  </div>
                ) : (
                  <div className="border border-border/20 rounded-lg overflow-hidden bg-background/20">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-accent/10 border-b border-border/20">
                            <th className="p-3 font-semibold text-muted-foreground">Device Details</th>
                            <th className="p-3 font-semibold text-muted-foreground">Fingerprint</th>
                            <th className="p-3 font-semibold text-muted-foreground">Status</th>
                            <th className="p-3 font-semibold text-muted-foreground text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {devices.map((dev) => (
                            <tr key={dev.id} className="border-b border-border/10 last:border-0 hover:bg-accent/5">
                              <td className="p-3">
                                <div className="font-bold text-foreground">{dev.name}</div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                  ID: {dev.id.slice(0, 8)}... &bull; Paired: {new Date(dev.createdAt).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="p-3 font-mono text-[10px] text-muted-foreground text-left">
                                {dev.fingerprint.slice(0, 12)}...{dev.fingerprint.slice(-12)}
                              </td>
                              <td className="p-3">
                                <Badge 
                                  variant={
                                    dev.status === "APPROVED" 
                                      ? "success" 
                                      : dev.status === "PENDING" 
                                      ? "warning" 
                                      : "destructive"
                                  }
                                  className="text-[9px] px-1.5 py-0.5"
                                >
                                  {dev.status}
                                </Badge>
                              </td>
                              <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                                {dev.status === "PENDING" && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-7 text-[10px] border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                                    onClick={() => handleApproveDevice(dev.id)}
                                  >
                                    Approve
                                  </Button>
                                )}
                                {dev.status !== "REVOKED" && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 text-[10px] text-rose-500 hover:bg-rose-500/10"
                                    leftIcon={<Trash2 className="h-3 w-3" />}
                                    onClick={() => handleRevokeDevice(dev.id)}
                                  >
                                    Revoke
                                  </Button>
                                )}
                                {dev.status === "REVOKED" && (
                                  <span className="text-[10px] text-muted-foreground italic pr-2">Revoked</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Dialog for Pairing Challenge Onboarding */}
      <Dialog
        isOpen={pairingModalOpen}
        onClose={() => setPairingModalOpen(false)}
        title="Pair Companion App"
        description="Scan this QR code in the AegisOS companion app or type the manual pairing code."
        size="md"
      >
        {pairingChallenge && (
          <div className="flex flex-col items-center justify-center p-4 space-y-6">
            {/* Connection Address Headers */}
            <div className="w-full text-center space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block">Workstation Endpoints</span>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {pairingChallenge.endpoints?.map((ep: any, idx: number) => (
                  <code key={idx} className="text-[10px] bg-background border border-border/30 rounded px-1.5 py-0.5 font-mono text-cyan-400">
                    {ep.ip}:{process.env.PORT || "3000"}
                  </code>
                ))}
              </div>
            </div>

            {/* Offline-friendly dynamic canvas QR code / Online API Image */}
            <div className="relative flex items-center justify-center h-48 w-48 bg-white border border-border rounded-xl p-3 shadow-inner group">
              {/* Fallback to QR server API, with direct SVG / canvas offline instructions */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=0E1329&data=${encodeURIComponent(
                  JSON.stringify({
                    pairingToken: pairingChallenge.token,
                    endpoints: pairingChallenge.endpoints
                  })
                )}`}
                alt="Onboarding QR Code"
                className="h-full w-full object-contain"
                onError={(e) => {
                  // Direct offline representation if connection fails
                  e.currentTarget.style.display = "none";
                  const fallback = document.getElementById("qr-fallback");
                  if (fallback) fallback.style.display = "flex";
                }}
              />
              <div
                id="qr-fallback"
                className="absolute inset-0 flex-col items-center justify-center hidden bg-slate-900 border border-slate-700/60 rounded-xl p-4 text-center space-y-2"
              >
                <QrCode className="h-10 w-10 text-cyan-500 animate-pulse" />
                <p className="text-[10px] text-muted-foreground font-semibold">Offline Mode Active</p>
                <p className="text-[9px] text-slate-400 leading-tight">Please use the Manual Pairing Code shown below.</p>
              </div>
            </div>

            {/* Manual Code Form Card */}
            <div className="w-full bg-accent/5 border border-border/20 rounded-lg p-3.5 flex flex-col items-center space-y-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block">Manual Pairing Code Fallback</span>
              <div className="flex items-center space-x-3 bg-background border border-border/40 rounded px-4 py-2 text-lg font-bold font-mono tracking-widest text-cyan-400">
                <span>{pairingChallenge.code}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(pairingChallenge.code);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent/40 rounded transition-all ml-1.5"
                >
                  {copiedCode ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Pairing challenge expires at: {new Date(pairingChallenge.expiresAt).toLocaleTimeString()} (10-minute TTL)
              </p>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

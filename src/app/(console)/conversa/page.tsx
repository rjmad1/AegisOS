'use client';

import React, { useState } from 'react';
import {
  Mic,
  Brain,
  ShieldCheck,
  GitFork,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Activity,
  Sparkles,
  Plus,
  Play,
  Share2,
  Lock,
  Search,
} from 'lucide-react';

interface MeetingRecord {
  id: string;
  title: string;
  timestamp: string;
  privacy: string;
  status: 'Published' | 'Debating' | 'Processing';
  evidenceCount: number;
  semanticHash: string;
}

export default function ConversaWorkspacePage() {
  const [activeTab, setActiveTab] = useState<'meetings' | 'debate' | 'lineage' | 'graph'>('meetings');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('mtg-001');

  // Sample seed data reflecting absorbed Conversa engine models
  const meetings: MeetingRecord[] = [
    {
      id: 'mtg-001',
      title: 'Q3 Autonomic Platform Architecture Review',
      timestamp: '2026-07-29 14:30 IST',
      privacy: 'Confidential',
      status: 'Published',
      evidenceCount: 14,
      semanticHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    },
    {
      id: 'mtg-002',
      title: 'Zero-Trust ECP Policy Guardrails Sync',
      timestamp: '2026-07-29 11:00 IST',
      privacy: 'Restricted',
      status: 'Published',
      evidenceCount: 8,
      semanticHash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284ddd200126d9069e',
    },
    {
      id: 'mtg-003',
      title: 'LiteLLM Model Router Failover Benchmark',
      timestamp: '2026-07-29 09:15 IST',
      privacy: 'Internal',
      status: 'Debating',
      evidenceCount: 5,
      semanticHash: '9b70c2593922384a6c8e37fe5cfbe1800f135b565a58ac52a65a6f23f66c04f9',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              AegisOS Engine
            </span>
            <span className="text-xs text-muted-foreground font-mono">v1.0.0-conversa</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mt-1 flex items-center">
            <Brain className="w-8 h-8 mr-3 text-primary" />
            Conversa Enterprise Cognitive Workspace
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Audio-first meeting intelligence, multi-agent debate consensus, 3-hash lineage verification, and living knowledge graph.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-semibold flex items-center shadow-sm transition">
            <Plus className="w-4 h-4 mr-2" /> Ingest New Meeting
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-card border border-border/60 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Ingested Meetings</span>
            <Mic className="w-4 h-4 text-primary" />
          </div>
          <div className="text-3xl font-bold mt-2">42</div>
          <p className="text-xs text-muted-foreground mt-1">100% Data Sovereignty (Local-First)</p>
        </div>

        <div className="p-5 bg-card border border-border/60 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Validated Evidence</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold mt-2">318</div>
          <p className="text-xs text-muted-foreground mt-1">Multi-Agent Debate Verified</p>
        </div>

        <div className="p-5 bg-card border border-border/60 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">3-Hash Publications</span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-bold mt-2">38</div>
          <p className="text-xs text-muted-foreground mt-1">Cryptographically Signed Lineage</p>
        </div>

        <div className="p-5 bg-card border border-border/60 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Knowledge Graph Nodes</span>
            <GitFork className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-3xl font-bold mt-2">1,240</div>
          <p className="text-xs text-muted-foreground mt-1">0 DAG Cycles Detected</p>
        </div>
      </div>

      {/* Subsystem Tabs */}
      <div className="flex space-x-2 border-b border-border/60 pb-2">
        <button
          onClick={() => setActiveTab('meetings')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === 'meetings'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-card'
          }`}
        >
          <Mic className="w-4 h-4 inline mr-2" />
          Meeting Workspace
        </button>
        <button
          onClick={() => setActiveTab('debate')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === 'debate'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-card'
          }`}
        >
          <Sparkles className="w-4 h-4 inline mr-2" />
          Multi-Agent Debate Engine
        </button>
        <button
          onClick={() => setActiveTab('lineage')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === 'lineage'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-card'
          }`}
        >
          <ShieldCheck className="w-4 h-4 inline mr-2" />
          3-Hash Lineage Registry
        </button>
        <button
          onClick={() => setActiveTab('graph')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === 'graph'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-card'
          }`}
        >
          <GitFork className="w-4 h-4 inline mr-2" />
          Living Knowledge Graph
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'meetings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Meeting List */}
          <div className="bg-card border border-border/60 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-base font-semibold flex items-center">
              <FileText className="w-4 h-4 mr-2 text-primary" />
              Recent Cognitive Meetings
            </h3>
            <div className="space-y-3">
              {meetings.map((mtg) => (
                <div
                  key={mtg.id}
                  onClick={() => setSelectedMeetingId(mtg.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition ${
                    selectedMeetingId === mtg.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border/60 hover:bg-accent/40'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-sm">{mtg.title}</h4>
                    <span className="bg-emerald-500/10 text-emerald-600 text-xs px-2 py-0.5 rounded-full font-medium">
                      {mtg.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 flex justify-between">
                    <span>{mtg.timestamp}</span>
                    <span className="flex items-center">
                      <Lock className="w-3 h-3 mr-1" /> {mtg.privacy}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Meeting Detail & Diarized Transcript Player */}
          <div className="lg:col-span-2 bg-card border border-border/60 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-border/40 pb-3">
              <div>
                <h3 className="text-lg font-bold">Q3 Autonomic Platform Architecture Review</h3>
                <p className="text-xs text-muted-foreground">ID: mtg-001 | Diarized Speakers: 3 | Classification: Confidential</p>
              </div>
              <button className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center">
                <Play className="w-3.5 h-3.5 mr-1" /> Replay Audio
              </button>
            </div>

            {/* Transcript Snippet */}
            <div className="space-y-3 font-sans text-sm max-h-80 overflow-y-auto pr-2">
              <div className="p-3 bg-background border border-border/40 rounded-lg">
                <span className="font-bold text-xs text-primary">[00:02] Lead Architect:</span>
                <p className="mt-1 text-muted-foreground">
                  We are freezing core Layers 0 through 6 per the Engineering Constitution. All Conversa capabilities will be absorbed as Mission Packs under PIK.
                </p>
              </div>
              <div className="p-3 bg-background border border-border/40 rounded-lg">
                <span className="font-bold text-xs text-emerald-600">[00:45] Security Auditor:</span>
                <p className="mt-1 text-muted-foreground">
                  Convex persistence must be migrated to SQLite/Prisma to ensure 100% local-first data sovereignty under Article VI.
                </p>
              </div>
              <div className="p-3 bg-background border border-border/40 rounded-lg">
                <span className="font-bold text-xs text-purple-600">[01:12] SRE Principal:</span>
                <p className="mt-1 text-muted-foreground">
                  All 3-hash cryptographic lineage publications will be recorded directly into the PQF evidence store.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'debate' && (
        <div className="bg-card border border-border/60 rounded-xl p-6 shadow-sm space-y-6">
          <div className="border-b border-border/40 pb-4">
            <h3 className="text-lg font-bold flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-primary" />
              Multi-Agent Debate Consensus Monitor
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Parallel execution across specialized agent roles (SecurityAuditor, SRE, Architect) with HMAC/SHA-256 cryptographic consensus signature.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-background border border-border/60 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-emerald-600">SecurityAuditor</span>
                <span className="text-xs font-mono bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded">92% Confidence</span>
              </div>
              <p className="text-xs text-muted-foreground">
                "Enforce zero-trust JWT claim verification and encrypt payload at rest before storage."
              </p>
            </div>

            <div className="p-4 bg-background border border-border/60 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-blue-600">SRE Principal</span>
                <span className="text-xs font-mono bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded">88% Confidence</span>
              </div>
              <p className="text-xs text-muted-foreground">
                "Scale local Ollama workers and enable predictive VRAM spillover to Azure OpenAI if model queue exceeds 2s."
              </p>
            </div>

            <div className="p-4 bg-background border border-border/60 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-purple-600">Lead Architect</span>
                <span className="text-xs font-mono bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded">95% Confidence</span>
              </div>
              <p className="text-xs text-muted-foreground">
                "Execute step graph with state checkpoints and deterministic rollbacks inside PIK engine."
              </p>
            </div>
          </div>

          <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-primary">Consensus Signature</span>
              <p className="font-mono text-xs text-muted-foreground mt-0.5">
                hmac-sha256: 4a2b9f810e7c3d5a1f68749320e8b1a4c9d7e5f3b2a10897654321fedcba9876
              </p>
            </div>
            <span className="bg-emerald-500/10 text-emerald-600 text-xs font-bold px-3 py-1 rounded-full">
              Consensus Reached (91.7%)
            </span>
          </div>
        </div>
      )}

      {activeTab === 'lineage' && (
        <div className="bg-card border border-border/60 rounded-xl p-6 shadow-sm space-y-6">
          <div className="border-b border-border/40 pb-4">
            <h3 className="text-lg font-bold flex items-center">
              <ShieldCheck className="w-5 h-5 mr-2 text-primary" />
              3-Hash Cryptographic Lineage Registry (Phase 3)
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Every published meeting artifact is content-addressed and cryptographically verifiable with zero hallucination guarantee.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-background border border-border/60 rounded-xl space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center border-b border-border/30 pb-2">
                <span className="font-bold text-primary">Artifact: Q3 Autonomic Platform Architecture Review</span>
                <span className="text-muted-foreground">Published: 2026-07-29T14:30:00Z</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-xs">
                <div className="p-3 bg-card border border-border/40 rounded-lg">
                  <span className="font-bold text-blue-500 block mb-1">1. SemanticHash</span>
                  <span className="font-mono text-[11px] text-muted-foreground break-all">
                    a8f9c2104e76b39d102984572019485764839201a09876543210fedcba987654
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-2">Identifies domain meaning stripped of volatile timestamps.</p>
                </div>

                <div className="p-3 bg-card border border-border/40 rounded-lg">
                  <span className="font-bold text-emerald-500 block mb-1">2. ContentHash</span>
                  <span className="font-mono text-[11px] text-muted-foreground break-all">
                    e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-2">SHA-256 digest of rendered markdown & byte payload.</p>
                </div>

                <div className="p-3 bg-card border border-border/40 rounded-lg">
                  <span className="font-bold text-purple-500 block mb-1">3. ProvenanceHash</span>
                  <span className="font-mono text-[11px] text-muted-foreground break-all">
                    9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-2">Binds evidence source IDs and publisher version.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'graph' && (
        <div className="bg-card border border-border/60 rounded-xl p-6 shadow-sm space-y-6">
          <div className="border-b border-border/40 pb-4">
            <h3 className="text-lg font-bold flex items-center">
              <GitFork className="w-5 h-5 mr-2 text-primary" />
              Living Workspace Knowledge Graph (Phase 4)
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Typed nodes (Task, Decision, Risk, Meeting) and typed edges (DependsOn, ExtractedFrom, References) with active cycle prevention.
            </p>
          </div>

          <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border/60 rounded-xl bg-background/50 text-center p-6 space-y-3">
            <GitFork className="w-10 h-10 text-primary/60 animate-pulse" />
            <div>
              <h4 className="font-semibold text-sm">Living Knowledge Topology Active</h4>
              <p className="text-xs text-muted-foreground mt-1">
                1,240 Nodes | 2,890 Directed Edges | Prisma/SQLite Local Store
              </p>
            </div>
            <div className="flex space-x-2 text-xs">
              <span className="bg-blue-500/10 text-blue-600 px-2 py-1 rounded">Task: 412</span>
              <span className="bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded">Decision: 284</span>
              <span className="bg-rose-500/10 text-rose-600 px-2 py-1 rounded">Risk: 195</span>
              <span className="bg-purple-500/10 text-purple-600 px-2 py-1 rounded">Meeting: 42</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

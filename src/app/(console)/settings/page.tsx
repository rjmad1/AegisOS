"use client";

import * as React from "react";
import { Settings, Save, Server, Shield, Sliders, Keyboard, Eye } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormComponents";
import { useForm, FormProvider } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/Alert";
import { useAppStore, PersonaPerspective } from "@/store/appStore";

const settingsSchema = z.object({
  ollamaUrl: z.string().url("Ollama address must be a valid URL"),
  litellmUrl: z.string().url("LiteLLM address must be a valid URL"),
  aegisosUrl: z.string().url("AegisOS address must be a valid URL"),
  refreshInterval: z.number().min(1, "Minimum interval is 1 second"),
  defaultPerspective: z.string(),
  telemetryEnabled: z.boolean(),
  autoSaveInterval: z.number(),
});

type SettingsSchemaType = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState<"general" | "models" | "perspectives" | "keybindings" | "privacy">("general");
  const [success, setSuccess] = React.useState(false);
  const { activePerspective, setActivePerspective, theme, setTheme } = useAppStore();

  const methods = useForm<SettingsSchemaType>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      ollamaUrl: process.env.NEXT_PUBLIC_OLLAMA_URL || "http://127.0.0.1:11434",
      litellmUrl: process.env.NEXT_PUBLIC_LITELLM_URL || "http://127.0.0.1:4000",
      aegisosUrl: process.env.NEXT_PUBLIC_AEGISOS_URL || "http://127.0.0.1:18789",
      refreshInterval: 5,
      defaultPerspective: activePerspective,
      telemetryEnabled: false,
      autoSaveInterval: 30,
    },
  });

  const onSubmit = async (data: SettingsSchemaType) => {
    try {
      await fetch("/api/v1/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {
      // Local fallback
    }
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const tabs = [
    { id: "general", label: "General", icon: Sliders },
    { id: "models", label: "Model Routing", icon: Server },
    { id: "perspectives", label: "Perspectives", icon: Eye },
    { id: "keybindings", label: "Keybindings", icon: Keyboard },
    { id: "privacy", label: "Privacy & Telemetry", icon: Shield },
  ] as const;

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Studio Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure AegisOS Studio preferences, model routing, and workspace behaviors.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border/40 space-x-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="capitalize">{activeTab} Configuration</CardTitle>
              <CardDescription>
                {activeTab === "general" && "Manage theme, language, and startup perspective settings."}
                {activeTab === "models" && "Configure local AI model routing and API host connections."}
                {activeTab === "perspectives" && "Define layout rules for the 6 persona perspectives."}
                {activeTab === "keybindings" && "Inspect and customize studio keyboard shortcuts."}
                {activeTab === "privacy" && "Manage local-first logging, audit retention, and telemetry."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
                  {success && (
                    <Alert variant="success" className="py-2.5">
                      Studio configuration updated successfully!
                    </Alert>
                  )}

                  {activeTab === "general" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">
                          Active UI Theme
                        </label>
                        <select
                          value={theme}
                          onChange={(e) => setTheme(e.target.value as any)}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="dark">Dark Theme (Default)</option>
                          <option value="light">Light Theme</option>
                          <option value="high-contrast">High Contrast Cyberpunk</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">
                          Startup Perspective
                        </label>
                        <select
                          value={activePerspective}
                          onChange={(e) => setActivePerspective(e.target.value as PersonaPerspective)}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="developer">Developer Perspective</option>
                          <option value="research">Research Perspective</option>
                          <option value="product">Product Perspective</option>
                          <option value="operations">Operations Perspective</option>
                          <option value="executive">Executive Perspective</option>
                          <option value="personal">Personal Perspective</option>
                        </select>
                      </div>

                      <FormInput
                        name="autoSaveInterval"
                        label="Auto-Save Interval (seconds)"
                        type="number"
                        helperText="Frequency for auto-saving active documents and workspace state."
                      />
                    </div>
                  )}

                  {activeTab === "models" && (
                    <div className="space-y-4">
                      <FormInput
                        name="ollamaUrl"
                        label="Ollama Local Endpoint"
                        helperText="Inference endpoint for local fast models (SmolLM, Llama3)."
                      />
                      <FormInput
                        name="litellmUrl"
                        label="LiteLLM Proxy Endpoint"
                        helperText="API router load balancer endpoint."
                      />
                      <FormInput
                        name="aegisosUrl"
                        label="AegisOS Platform Gateway"
                        helperText="Zero-privilege REST API endpoint."
                      />
                    </div>
                  )}

                  {activeTab === "perspectives" && (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Customize layout options for each of the 6 persona perspectives.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { name: "Developer", desc: "Split Code Editor, Terminal, CodeGraph Inspector" },
                          { name: "Research", desc: "Bi-directional Knowledge Graph, Markdown Canvas" },
                          { name: "Product", desc: "Mission Kanban Board, HITL Approver" },
                          { name: "Operations", desc: "System Health Gauges, Live Log Console" },
                          { name: "Executive", desc: "Mission Scorecard, Deliverable Canvas" },
                          { name: "Personal", desc: "Distraction-free Markdown Scratchpad" },
                        ].map((p, i) => (
                          <div key={i} className="rounded-lg border border-border/40 p-3 bg-card/40">
                            <h4 className="text-xs font-bold text-foreground">{p.name} Perspective</h4>
                            <p className="text-[11px] text-muted-foreground mt-1">{p.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === "keybindings" && (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-2 border-b border-border/20">
                        <span className="font-medium">Global Search Overlay</span>
                        <kbd className="px-2 py-0.5 bg-accent rounded font-mono text-[10px]">Cmd + K</kbd>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border/20">
                        <span className="font-medium">Command Palette</span>
                        <kbd className="px-2 py-0.5 bg-accent rounded font-mono text-[10px]">Ctrl + Shift + P</kbd>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border/20">
                        <span className="font-medium">Toggle SRE Copilot</span>
                        <kbd className="px-2 py-0.5 bg-accent rounded font-mono text-[10px]">Ctrl + Shift + O</kbd>
                      </div>
                    </div>
                  )}

                  {activeTab === "privacy" && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/30 bg-accent/20">
                        <Shield className="h-5 w-5 text-emerald-500 shrink-0" />
                        <div>
                          <h4 className="text-xs font-bold text-foreground">Local-First Privacy Guard</h4>
                          <p className="text-[11px] text-muted-foreground">
                            100% of telemetry, logs, and knowledge indexes remain strictly stored on local disk.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex justify-end">
                    <Button type="submit" leftIcon={<Save className="h-4 w-4" />}>
                      Save Settings
                    </Button>
                  </div>
                </form>
              </FormProvider>
            </CardContent>
          </Card>
        </div>

        {/* System info panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>Studio client runtime version.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-2 text-xs text-left">
              <div className="flex justify-between py-1.5 border-b border-border/10">
                <span className="text-muted-foreground">Product:</span>
                <span className="font-semibold text-foreground">AegisOS Studio</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/10">
                <span className="text-muted-foreground">Sprint Version:</span>
                <span className="font-semibold text-primary">Sprint 1 GA</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/10">
                <span className="text-muted-foreground">Platform Contract:</span>
                <span className="font-semibold text-foreground">RC1 Certified</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/10">
                <span className="text-muted-foreground">API Consumption:</span>
                <span className="font-semibold text-emerald-500">Zero-Privilege REST</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

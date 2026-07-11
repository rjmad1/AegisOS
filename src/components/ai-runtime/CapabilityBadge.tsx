"use client";

import * as React from "react";
import { cn } from "@/utils/cn";
import type { CapabilityName } from "@/types/ai-runtime";
import {
  Wrench, Eye, Brain, Database, Zap, FileJson, FunctionSquare,
  Layers, Image, AudioLines, Video, Thermometer, SlidersHorizontal,
  Fingerprint, LayoutList, MessageSquare, Code,
} from "lucide-react";

const capabilityConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  "tool-calling": { icon: Wrench, color: "bg-orange-500/15 text-orange-400 border-orange-500/30", label: "Tool Calling" },
  "vision": { icon: Eye, color: "bg-purple-500/15 text-purple-400 border-purple-500/30", label: "Vision" },
  "reasoning": { icon: Brain, color: "bg-blue-500/15 text-blue-400 border-blue-500/30", label: "Reasoning" },
  "embeddings": { icon: Database, color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30", label: "Embeddings" },
  "streaming": { icon: Zap, color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", label: "Streaming" },
  "json-mode": { icon: FileJson, color: "bg-green-500/15 text-green-400 border-green-500/30", label: "JSON Mode" },
  "function-calling": { icon: FunctionSquare, color: "bg-orange-500/15 text-orange-400 border-orange-500/30", label: "Function Calling" },
  "parallel-tool-calls": { icon: Layers, color: "bg-pink-500/15 text-pink-400 border-pink-500/30", label: "Parallel Tools" },
  "image-input": { icon: Image, color: "bg-purple-500/15 text-purple-400 border-purple-500/30", label: "Image Input" },
  "audio-input": { icon: AudioLines, color: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30", label: "Audio Input" },
  "video-input": { icon: Video, color: "bg-red-500/15 text-red-400 border-red-500/30", label: "Video Input" },
  "temperature": { icon: Thermometer, color: "bg-amber-500/15 text-amber-400 border-amber-500/30", label: "Temperature" },
  "top-p": { icon: SlidersHorizontal, color: "bg-teal-500/15 text-teal-400 border-teal-500/30", label: "Top-P" },
  "seed": { icon: Fingerprint, color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", label: "Seed" },
  "structured-output": { icon: LayoutList, color: "bg-violet-500/15 text-violet-400 border-violet-500/30", label: "Structured Output" },
  "chat": { icon: MessageSquare, color: "bg-sky-500/15 text-sky-400 border-sky-500/30", label: "Chat" },
  "completion": { icon: MessageSquare, color: "bg-slate-500/15 text-slate-400 border-slate-500/30", label: "Completion" },
  "code-generation": { icon: Code, color: "bg-lime-500/15 text-lime-400 border-lime-500/30", label: "Code Gen" },
};

interface CapabilityBadgeProps {
  capability: CapabilityName;
  supported?: boolean;
  compact?: boolean;
  className?: string;
}

export const CapabilityBadge: React.FC<CapabilityBadgeProps> = ({ capability, supported = true, compact = false, className }) => {
  const config = capabilityConfig[capability] || { icon: Zap, color: "bg-gray-500/15 text-gray-400 border-gray-500/30", label: capability };
  const Icon = config.icon;

  if (!supported) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium transition-colors",
        config.color,
        !supported && "opacity-30",
        className
      )}
      title={config.label}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {!compact && <span>{config.label}</span>}
    </span>
  );
};

export default CapabilityBadge;

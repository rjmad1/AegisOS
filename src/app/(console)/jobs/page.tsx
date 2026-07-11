"use client";

import * as React from "react";
import { Briefcase, Play, Square, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function JobsPage() {
  const [jobs, setJobs] = React.useState([
    {
      id: "job-01",
      name: "Vector Store Indexing",
      description: "Chunk and embed documents from local knowledge folder.",
      status: "running",
      progress: 68,
      duration: "1m 15s",
      type: "Index",
    },
    {
      id: "job-02",
      name: "LLM LoRA Fine-Tuning",
      description: "Fine-tune Gemma-9b on workstation operations logs.",
      status: "running",
      progress: 12,
      duration: "10m 45s",
      type: "Fine-tune",
    },
    {
      id: "job-03",
      name: "System Diagnostic Scan",
      description: "Run automated hardware benchmark checks.",
      status: "completed",
      progress: 100,
      duration: "45s",
      type: "Diagnostic",
    },
  ]);

  const handleStop = (id: string) => {
    setJobs(
      jobs.map((job) =>
        job.id === id ? { ...job, status: "failed" as const } : job
      )
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Active Jobs</h1>
        <p className="text-sm text-muted-foreground">
          Index pipelines and background model optimizations.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {jobs.map((job) => (
          <Card key={job.id} glow={job.status === "running"}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {job.type}
                </span>
                {job.status === "running" ? (
                  <Badge variant="info" className="animate-pulse">
                    Running
                  </Badge>
                ) : job.status === "completed" ? (
                  <Badge variant="success">Succeeded</Badge>
                ) : (
                  <Badge variant="destructive">Aborted</Badge>
                )}
              </div>
              <CardTitle className="text-base mt-1.5">{job.name}</CardTitle>
              <CardDescription>{job.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-left">
              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Progress</span>
                  <span>{job.progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-accent/40 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Elapsed Duration: <strong className="text-foreground">{job.duration}</strong></span>
                <span>Job ID: <code className="text-foreground">{job.id}</code></span>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              {job.status === "running" ? (
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full text-xs font-semibold"
                  leftIcon={<Square className="h-3.5 w-3.5" />}
                  onClick={() => handleStop(job.id)}
                >
                  Terminate Job
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-semibold"
                  disabled
                >
                  Finished
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

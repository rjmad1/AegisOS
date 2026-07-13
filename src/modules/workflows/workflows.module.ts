import { PlatformModule } from "@/platform/kernel/types";
import { GitBranch, Activity } from "lucide-react";

export const workflowsModule: PlatformModule = {
  id: "workflows",
  name: "Workflows & Automation",
  version: "1.0.0",
  domain: "operations",
  description: "Orchestrate scheduled and event-driven multi-agent pipelines, approvals, and dynamic provider integrations.",

  routes: [
    { path: "/workflows", moduleId: "workflows", label: "Workflows Registry" },
    { path: "/executions", moduleId: "workflows", label: "Executions Monitor" },
    { path: "/automation", moduleId: "workflows", label: "Automation Center" }
  ],

  navItems: [
    {
      id: "nav-workflows",
      label: "Workflows",
      href: "/workflows",
      icon: GitBranch,
      group: "Operations",
      order: 6
    },
    {
      id: "nav-automation",
      label: "Automation Center",
      href: "/automation",
      icon: Activity,
      group: "Operations",
      order: 7
    }
  ],

  commands: [
    {
      id: "cmd.workflows.create",
      title: "Create Workflow",
      category: "operations",
      action: () => {
        window.location.href = "/workflows?action=create";
      }
    },
    {
      id: "cmd.workflows.open",
      title: "Open Workflow Explorer",
      category: "operations",
      action: () => {
        window.location.href = "/workflows";
      }
    },
    {
      id: "cmd.workflows.run",
      title: "Run Workflow Execution",
      category: "operations",
      action: () => {
        window.location.href = "/workflows?action=run";
      }
    },
    {
      id: "cmd.executions.view",
      title: "View Executions Monitor",
      category: "operations",
      action: () => {
        window.location.href = "/executions";
      }
    },
    {
      id: "cmd.approvals.view",
      title: "View Pending Approvals",
      category: "operations",
      action: () => {
        window.location.href = "/automation?tab=approvals";
      }
    },
    {
      id: "cmd.schedules.view",
      title: "View Scheduled Automations",
      category: "operations",
      action: () => {
        window.location.href = "/automation?tab=schedules";
      }
    }
  ],

  searchProviders: [
    {
      id: "search-workflows-registry",
      name: "Workflow & Executions Search",
      category: "jobs",
      search: async (query: string) => {
        const q = query.toLowerCase();
        const results: any[] = [];

        try {
          // 1. Search Workflows
          const workflowsRes = await fetch(`/api/v1/workflows?search=${encodeURIComponent(query)}`);
          if (workflowsRes.ok) {
            const workflowsData = await workflowsRes.json();
            const workflows = workflowsData.workflows || workflowsData;
            if (Array.isArray(workflows)) {
              workflows.forEach((w: any) => {
                if (w.name.toLowerCase().includes(q) || w.description.toLowerCase().includes(q)) {
                  results.push({
                    id: `wf-${w.id}`,
                    title: `Workflow: ${w.name}`,
                    description: `Version: ${w.version} | Status: ${w.status} | ${w.description}`,
                    href: `/workflows/${w.id}`,
                    category: "jobs",
                    score: 1.0
                  });
                }
              });
            }
          }

          // 2. Search Executions
          const executionsRes = await fetch(`/api/v1/executions?search=${encodeURIComponent(query)}`);
          if (executionsRes.ok) {
            const executionsData = await executionsRes.json();
            const executions = executionsData.executions || executionsData;
            if (Array.isArray(executions)) {
              executions.slice(0, 100).forEach((exec: any) => {
                if (exec.id.toLowerCase().includes(q) || exec.workflowName.toLowerCase().includes(q) || exec.status.toLowerCase().includes(q)) {
                  results.push({
                    id: `exec-${exec.id}`,
                    title: `Execution: ${exec.workflowName} (${exec.id.substring(0, 8)})`,
                    description: `Status: ${exec.status.toUpperCase()} | Created: ${new Date(exec.createdAt).toLocaleString()}`,
                    href: `/executions/${exec.id}`,
                    category: "jobs",
                    score: 0.9
                  });
                }
              });
            }
          }

          // 3. Search Templates
          const templatesRes = await fetch(`/api/v1/workflows/templates`);
          if (templatesRes.ok) {
            const templates = await templatesRes.json();
            if (Array.isArray(templates)) {
              templates.forEach((t: any) => {
                if (t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) {
                  results.push({
                    id: `tpl-${t.id}`,
                    title: `Template: ${t.name}`,
                    description: `Version: ${t.version} | ${t.description}`,
                    href: `/workflows?template=${t.id}`,
                    category: "jobs",
                    score: 0.8
                  });
                }
              });
            }
          }

          // 4. Search Schedules
          const schedulesRes = await fetch(`/api/v1/workflows/schedules`);
          if (schedulesRes.ok) {
            const schedules = await schedulesRes.json();
            if (Array.isArray(schedules)) {
              schedules.forEach((s: any) => {
                if (s.name.toLowerCase().includes(q) || s.workflowId.toLowerCase().includes(q)) {
                  results.push({
                    id: `sched-${s.id}`,
                    title: `Schedule: ${s.name}`,
                    description: `Type: ${s.type.toUpperCase()} | Cron: ${s.cronExpression || "N/A"} | Enabled: ${s.enabled}`,
                    href: `/automation?tab=schedules&id=${s.id}`,
                    category: "jobs",
                    score: 0.7
                  });
                }
              });
            }
          }

          // 5. Search Approvals
          const approvalsRes = await fetch(`/api/v1/workflows/approvals`);
          if (approvalsRes.ok) {
            const approvals = await approvalsRes.json();
            if (Array.isArray(approvals)) {
              approvals.forEach((app: any) => {
                if (app.id.toLowerCase().includes(q) || app.workflowName.toLowerCase().includes(q) || app.status.toLowerCase().includes(q)) {
                  results.push({
                    id: `app-${app.id}`,
                    title: `Approval Gate: ${app.workflowName}`,
                    description: `Status: ${app.status.toUpperCase()} | Approvers: ${app.approvers.join(", ")}`,
                    href: `/automation?tab=approvals&id=${app.id}`,
                    category: "jobs",
                    score: 0.85
                  });
                }
              });
            }
          }

        } catch (e) {
          console.error("[WorkflowSearch] Search provider query failed:", e);
        }

        return results;
      }
    }
  ],

  lifecycle: {
    onInit: async () => {
      // Platform-wide backend workflow ticks run server-side via Next.js instrumentation
    },
    onDestroy: async () => {
      // Handled server-side
    }
  }
};

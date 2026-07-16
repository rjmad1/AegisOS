"use client";

import * as React from "react";
import { Settings, Save, Server, Globe } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormComponents";
import { useForm, FormProvider } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/Alert";

const settingsSchema = z.object({
  ollamaUrl: z.string().url("Ollama address must be a valid URL"),
  litellmUrl: z.string().url("LiteLLM address must be a valid URL"),
  aegisosUrl: z.string().url("AegisOS address must be a valid URL"),
  refreshInterval: z.number().min(1, "Minimum interval is 1 second"),
});

type SettingsSchemaType = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const [success, setSuccess] = React.useState(false);

  const methods = useForm<SettingsSchemaType>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      ollamaUrl: process.env.NEXT_PUBLIC_OLLAMA_URL || "http://127.0.0.1:11434",
      litellmUrl: process.env.NEXT_PUBLIC_LITELLM_URL || "http://127.0.0.1:4000",
      aegisosUrl: process.env.NEXT_PUBLIC_AEGISOS_URL || "http://127.0.0.1:18789",
      refreshInterval: 5,
    },
  });

  const onSubmit = (data: SettingsSchemaType) => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure API connections and console preferences.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Infrastructure Connection Hub</CardTitle>
              <CardDescription>Target endpoints for operational background workers.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
                  {success && (
                    <Alert variant="success" className="py-2.5">
                      System settings updated successfully!
                    </Alert>
                  )}

                  <FormInput
                    name="ollamaUrl"
                    label="Ollama Server Endpoint"
                    helperText="Inference endpoint for serving models."
                  />

                  <FormInput
                    name="litellmUrl"
                    label="LiteLLM Router Endpoint"
                    helperText="API load-balancer and alias router."
                  />

                  <FormInput
                    name="aegisosUrl"
                    label="AegisOS Gateway Endpoint"
                    helperText="MCP host routing cluster proxy."
                  />

                  <FormInput
                    name="refreshInterval"
                    label="Telemetry Refresh Interval (seconds)"
                    type="number"
                    helperText="Interval between active host query scans."
                  />

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      leftIcon={<Save className="h-4 w-4" />}
                    >
                      Save Configuration
                    </Button>
                  </div>
                </form>
              </FormProvider>
            </CardContent>
          </Card>
        </div>

        {/* Console info panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Console Details</CardTitle>
              <CardDescription>Host system settings metadata.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-2 text-xs text-left">
              <div className="flex justify-between py-1.5 border-b border-border/10">
                <span className="text-muted-foreground">App Name:</span>
                <span className="font-semibold text-foreground">AI Operations Console</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/10">
                <span className="text-muted-foreground">Client Version:</span>
                <span className="font-semibold text-primary">v1.0.0</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/10">
                <span className="text-muted-foreground">Node Environment:</span>
                <span className="font-semibold text-foreground">v24.16.0</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/10">
                <span className="text-muted-foreground">Next.js Engine:</span>
                <span className="font-semibold text-foreground">v16.2.10</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

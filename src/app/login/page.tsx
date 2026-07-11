"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Cpu, Lock, User as UserIcon } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/appStore";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormComponents";
import { Alert } from "@/components/ui/Alert";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginSchemaType = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, initialize, isLoading: authLoading } = useAuthStore();
  const { setTheme } = useAppStore();
  const [error, setError] = React.useState<string | null>(null);

  // Initialize Auth State on load
  React.useEffect(() => {
    initialize();
  }, [initialize]);

  // If already authenticated, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const methods = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginSchemaType) => {
    setError(null);
    const success = await login(data.username, data.password);
    if (success) {
      router.push("/dashboard");
    } else {
      setError("Invalid username or password. Use 'admin' / 'AdminPassword123!'");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background Neon Glows */}
      <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

      <Card className="w-full max-w-md p-2 shadow-2xl relative z-10 glass-panel-glow">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary mb-3">
            <Cpu className="h-6 w-6 animate-pulse-slow" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">AI Operations Console</CardTitle>
          <CardDescription>
            Enter administrator credentials to access local infrastructure.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="py-2.5">
                  {error}
                </Alert>
              )}

              <FormInput
                name="username"
                label="Username"
                placeholder="admin"
                disabled={authLoading}
                className="pl-3"
              />

              <FormInput
                name="password"
                label="Password"
                type="password"
                placeholder="••••••••••••"
                disabled={authLoading}
                className="pl-3"
              />

              <Button
                type="submit"
                className="w-full mt-2"
                isLoading={authLoading}
              >
                Sign In to Console
              </Button>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
      
      <p className="mt-8 text-center text-xs text-muted-foreground relative z-10">
        Raja's Personal AI Workstation &copy; 2026. All rights reserved.
      </p>
    </div>
  );
}

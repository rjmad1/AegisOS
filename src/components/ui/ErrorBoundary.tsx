"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "./Button";
import { Card } from "./Card";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="flex flex-col items-center justify-center p-8 text-center border-destructive/20 bg-destructive/5 space-y-4 m-4">
          <div className="rounded-full bg-destructive/20 p-3">
            <AlertTriangle className="h-6 w-6 text-destructive" aria-label="Error Icon" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-destructive">Something went wrong</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {this.state.error?.message || "An unexpected error occurred while rendering this component."}
            </p>
          </div>
          <Button variant="outline" onClick={this.handleReset} leftIcon={<RefreshCcw className="h-4 w-4" />}>
            Try again
          </Button>
        </Card>
      );
    }

    return this.props.children;
  }
}

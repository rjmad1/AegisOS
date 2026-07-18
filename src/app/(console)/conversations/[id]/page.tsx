"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { AIWorkspace } from "@/components/workspace/AIWorkspace";

export default function ConversationWorkspacePage() {
  const params = useParams();
  const id = params.id as string;

  return <AIWorkspace threadId={id} />;
}

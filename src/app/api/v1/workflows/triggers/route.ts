import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const triggers = [
    { type: "manual", name: "Manual Trigger", description: "Triggered manually by a user or API call" },
    { type: "schedule", name: "Schedule Trigger", description: "Triggered on a cron schedule or time interval" },
    { type: "event", name: "Event Trigger", description: "Triggered by system event (e.g. ArtifactCreated, ConversationStarted)" },
    { type: "filesystem", name: "Filesystem Event", description: "Triggered when files change on disk" },
    { type: "webhook", name: "Webhook API", description: "Triggered by external HTTP POST webhook request" }
  ];
  return Response.json(triggers);
}

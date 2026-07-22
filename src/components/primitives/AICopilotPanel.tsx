import React, { useState } from "react";
import { useConsoleKernel } from "../../platform/console/ConsoleKernel";
import { Sparkles, MessageSquare, ChevronRight, Zap } from "lucide-react";
import { Button } from "../ui/Button";
import { ConsoleActionDispatcher } from "../../platform/console/ActionDispatcher";

export function AICopilotPanel() {
  const { domainSchema, activeEntity } = useConsoleKernel();
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant", text: string }>>([
    { role: "assistant", text: "I am your contextual Copilot. How can I help you navigate this console?" }
  ]);
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMsgs = [...messages, { role: "user", text: input }];
    setMessages(newMsgs as any);
    setInput("");
    
    try {
      const contextStr = activeEntity 
        ? `the ${domainSchema?.entities[activeEntity]?.labelPlural} view in the ${domainSchema?.label} domain`
        : `the ${domainSchema?.label || 'General'} domain`;
        
      // Ensure the AI invokes only pre-registered commands via the dispatcher
      const result = await ConsoleActionDispatcher.dispatch(
        "ai:assist", 
        { query: input, context: contextStr },
        { userId: "system_user", userRole: "operator", tenantId: "default" }
      );
      
      if (result.outcome === 'FAILURE') {
        throw new Error(result.data?.reason || "Execution failed");
      }
      
      setMessages([...newMsgs, { 
        role: "assistant", 
        text: `Command accepted by governance layer (Execution ID: ${result.data?.executionId}). Tracking execution progress...` 
      }] as any);
      
    } catch (e: any) {
      setMessages([...newMsgs, { 
        role: "assistant", 
        text: `Action rejected by policy engine: ${e.message}` 
      }] as any);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card/10 text-sm">
      <div className="flex items-center gap-2 p-4 border-b border-border/20 bg-primary/5">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="font-bold text-foreground">AI Copilot</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === "assistant" ? "items-start" : "items-end"}`}>
            <div className={`p-3 rounded-lg max-w-[90%] ${m.role === "assistant" ? "bg-muted/50 text-muted-foreground border border-border/40" : "bg-primary text-primary-foreground"}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-3 border-t border-border/20 bg-background/50">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask Copilot..." 
            className="flex-1 bg-muted/50 border border-border/50 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button size="icon" variant="secondary" onClick={handleSend} className="shrink-0 h-8 w-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-2 mt-2">
          <button className="text-[10px] bg-accent/50 text-muted-foreground px-2 py-1 rounded flex items-center gap-1 hover:text-foreground">
            <Zap className="w-3 h-3" /> Summarize
          </button>
          <button className="text-[10px] bg-accent/50 text-muted-foreground px-2 py-1 rounded flex items-center gap-1 hover:text-foreground">
            <MessageSquare className="w-3 h-3" /> Diagnose
          </button>
        </div>
      </div>
    </div>
  );
}

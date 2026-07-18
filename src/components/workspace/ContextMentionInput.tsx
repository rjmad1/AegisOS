"use client";

import * as React from "react";
import { AtSign, FileText, FolderGit2, Target, Puzzle, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useConversationStore } from "@/store/conversationStore";
import type { ContextMention } from "@/types/ai-workspace";

const mentionTypeIcons: Record<string, React.ElementType> = {
  document: FileText,
  repository: FolderGit2,
  artifact: FileText,
  mission: Target,
  extension: Puzzle,
  memory: FileText,
};

const mentionTypeColors: Record<string, string> = {
  document: "text-emerald-400",
  repository: "text-cyan-400",
  artifact: "text-amber-400",
  mission: "text-primary",
  extension: "text-purple-400",
  memory: "text-pink-400",
};

export const ContextMentionInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}> = ({ value, onChange, onSend, disabled }) => {
  const { attachedMentions, attachMention, removeMention, loadContextSuggestions } = useConversationStore();
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<ContextMention[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = React.useState(false);
  const [mentionQuery, setMentionQuery] = React.useState("");
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = React.useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Detect @ trigger in input
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChange(val);

    const lastAtIndex = val.lastIndexOf("@");
    if (lastAtIndex >= 0 && (lastAtIndex === 0 || val[lastAtIndex - 1] === " ")) {
      const query = val.slice(lastAtIndex + 1);
      setMentionQuery(query);
      setShowSuggestions(true);
      setLoadingSuggestions(true);
      loadContextSuggestions(query).then((results) => {
        setSuggestions(results);
        setLoadingSuggestions(false);
      });
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectMention = (mention: ContextMention) => {
    attachMention(mention);
    // Remove the @query from the input text
    const lastAtIndex = value.lastIndexOf("@");
    if (lastAtIndex >= 0) {
      onChange(value.slice(0, lastAtIndex).trimEnd() + " ");
    }
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) {
        onSend();
      }
    }
    if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      {/* Attached Mentions Chips */}
      {attachedMentions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pt-3 pb-1">
          {attachedMentions.map((mention) => {
            const Icon = mentionTypeIcons[mention.type] || FileText;
            const color = mentionTypeColors[mention.type] || "text-muted-foreground";
            return (
              <span
                key={mention.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/30 border border-border/40 text-xs font-medium group"
              >
                <Icon className={`h-3 w-3 ${color} shrink-0`} />
                <span className="truncate max-w-[140px]">{mention.title}</span>
                <button
                  onClick={() => removeMention(mention.id)}
                  className="p-0.5 rounded-full hover:bg-destructive/20 hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Input Field */}
      <div className="relative flex items-end gap-2 px-4 pb-4 pt-2">
        <div className="relative flex-1">
          <textarea
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder='Ask anything... Type @ to reference context, or try "Analyze this repository."'
            disabled={disabled}
            rows={1}
            className="w-full resize-none bg-accent/20 border border-border/60 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground/60 min-h-[48px] max-h-[200px] transition-all custom-scrollbar"
            style={{ height: "auto", minHeight: "48px" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 200) + "px";
            }}
          />

          {/* @ Button */}
          <button
            onClick={() => {
              onChange(value + "@");
              setShowSuggestions(true);
              setLoadingSuggestions(true);
              loadContextSuggestions("").then((results) => {
                setSuggestions(results);
                setLoadingSuggestions(false);
              });
              inputRef.current?.focus();
            }}
            className="absolute right-3 bottom-3 p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title="Attach context reference (@)"
          >
            <AtSign className="h-4 w-4" />
          </button>
        </div>

        {/* Send Button */}
        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="flex items-center justify-center px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-lg shadow-primary/20"
        >
          Send
        </button>
      </div>

      {/* Suggestions Popup */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute bottom-full left-4 right-4 mb-2 bg-card border border-border/60 rounded-xl shadow-xl overflow-hidden z-50 max-h-64 overflow-y-auto custom-scrollbar"
        >
          <div className="p-2 border-b border-border/20">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">
              Reference Context {mentionQuery && `· "${mentionQuery}"`}
            </span>
          </div>

          {loadingSuggestions ? (
            <div className="p-4 text-center text-xs text-muted-foreground">Loading context suggestions...</div>
          ) : suggestions.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No matching context items found. Try typing a keyword after @.
            </div>
          ) : (
            <div className="py-1">
              {suggestions.map((suggestion) => {
                const Icon = mentionTypeIcons[suggestion.type] || FileText;
                const color = mentionTypeColors[suggestion.type] || "text-muted-foreground";
                return (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSelectMention(suggestion)}
                    className="flex items-start gap-3 w-full px-3 py-2.5 text-left hover:bg-accent/40 transition-colors group"
                  >
                    <div className={`p-1.5 rounded-md bg-accent/30 border border-border/30 ${color} shrink-0 mt-0.5 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground truncate">{suggestion.title}</span>
                        <Badge variant="outline" className="text-[8px] font-mono capitalize shrink-0">
                          {suggestion.type}
                        </Badge>
                      </div>
                      {suggestion.subtitle && (
                        <p className="text-[10px] text-muted-foreground truncate">{suggestion.subtitle}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

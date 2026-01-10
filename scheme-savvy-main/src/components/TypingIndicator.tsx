import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-soft">
        <Bot className="w-4 h-4" />
      </div>
      <div className="chat-bubble-assistant px-4 py-3 shadow-soft">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-pulse" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-pulse" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-pulse" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

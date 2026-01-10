import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/Header";
import { ChatMessage, Message, Source } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { TypingIndicator } from "@/components/TypingIndicator";
import { SuggestionChips } from "@/components/SuggestionChips";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { EmptyState } from "@/components/EmptyState";
import { DocumentLibrary } from "@/components/DocumentLibrary";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { sendMessage, ChatResponse } from "@/lib/api/chat";

export default function Index() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('english');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Build conversation history for context
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Call the real chat API
      const response: ChatResponse = await sendMessage(content, conversationHistory, language);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.content,
        sources: response.sources?.length > 0 ? response.sources : undefined,
        sourceLabel: response.sourceLabel || undefined,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Notify if new knowledge was indexed
      if (response.newKnowledgeIndexed) {
        toast({
          title: "Knowledge Base Updated",
          description: "New official content has been indexed for future queries.",
        });
      }
    } catch (error) {
      console.error("Chat error:", error);

      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I encountered an error processing your request. Please try again or rephrase your question.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);

      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <Header currentLanguage={language} onLanguageChange={setLanguage} />

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 pb-4">
        {/* Disclaimer */}
        <div className="mb-4">
          <DisclaimerBanner currentLanguage={language} />
        </div>

        {/* Document Library */}
        <div className="mb-4">
          <DocumentLibrary />
        </div>

        {/* Chat Messages */}
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-[calc(100vh-440px)] sm:h-[calc(100vh-460px)]" ref={scrollRef}>
            <div className="space-y-4 py-4">
              {messages.length === 0 ? (
                <EmptyState currentLanguage={language} />
              ) : (
                messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isLatest={index === messages.length - 1}
                    currentLanguage={language}
                  />
                ))
              )}
              {isLoading && <TypingIndicator />}
            </div>
          </ScrollArea>
        </div>

        {/* Suggestions (show only when no messages) */}
        {messages.length === 0 && (
          <div className="mb-4">
            <SuggestionChips onSelect={handleSendMessage} disabled={isLoading} currentLanguage={language} />
          </div>
        )}

        {/* Input */}
        <ChatInput onSend={handleSendMessage} isLoading={isLoading} currentLanguage={language} />

        {/* Footer */}
        <footer className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by official government documents • Self-updating knowledge base • Responses are informational only
          </p>
        </footer>
      </main>
    </div>
  );
}

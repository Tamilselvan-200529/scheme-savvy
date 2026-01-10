import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Mic, MicOff, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  currentLanguage?: string;
}

export function ChatInput({ onSend, isLoading, disabled, currentLanguage = 'english' }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const getPlaceholder = () => {
    if (isListening) {
      switch (currentLanguage) {
        case 'tamil': return "கேட்டுக்கொண்டிருக்கிறேன்... (Listening...)";
        case 'hindi': return "सुन रहा हूँ... (Listening...)";
        default: return "Listening...";
      }
    }
    switch (currentLanguage) {
      case 'tamil': return "அரசு திட்டங்கள் பற்றி கேளுங்கள்...";
      case 'hindi': return "सरकारी योजनाओं के बारे में पूछें...";
      default: return "Ask about government schemes...";
    }
  };

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Set language based on current selection
      let lang = 'en-US';
      if (currentLanguage === 'tamil') lang = 'ta-IN';
      if (currentLanguage === 'hindi') lang = 'hi-IN';

      recognitionRef.current.lang = lang;
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + "px";
    }
  }, [input]);

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className={`flex items-end gap-3 p-4 bg-card rounded-2xl shadow-medium border transition-colors ${isListening ? 'border-primary ring-1 ring-primary/50' : 'border-border/50'}`}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholder()}
          disabled={isLoading || disabled}
          rows={1}
          className="flex-1 resize-none bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm leading-relaxed max-h-[150px]"
        />

        <div className="flex items-center gap-2">
          {/* Voice Input Button */}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={toggleListening}
            disabled={isLoading || disabled}
            className={`h-9 w-9 rounded-xl transition-all ${isListening ? 'bg-red-500/10 text-red-600 animate-pulse' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
            title="Voice Input"
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>

          {/* Send Button */}
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading || disabled}
            className={`h-9 w-9 rounded-xl transition-all duration-300 ${input.trim()
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-100'
                : 'bg-muted text-muted-foreground scale-95 opacity-50'
              }`}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
      {isListening && (
        <div className="absolute -top-8 left-0 right-0 flex justify-center">
          <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-bounce">
            • Listening ({currentLanguage === 'tamil' ? 'தமிழ்' : currentLanguage === 'hindi' ? 'हिंदी' : 'English'})...
          </span>
        </div>
      )}
    </form>
  );
}

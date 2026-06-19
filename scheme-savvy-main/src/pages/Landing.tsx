import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, MessageSquare, Globe2, ArrowRight, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/logo.jpg" alt="Scheme Savvy Logo" className="w-12 h-12 object-contain rounded-xl" />
            <span className="font-heading font-bold text-xl tracking-tight text-foreground hidden sm:block">Scheme Savvy</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button onClick={() => navigate('/chat')} className="rounded-full px-6 shadow-glow">
              Chat Now <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        {/* Decorative Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 blur-[120px] rounded-full opacity-50 -z-10 animate-float" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/20 blur-[100px] rounded-full opacity-50 -z-10 animate-pulse-soft" />

        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/80 border border-border/50 text-sm font-medium text-muted-foreground mb-4 shadow-soft animate-fade-in">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>AI-Powered Government Assistant</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold font-heading tracking-tight text-foreground leading-[1.1] animate-slide-up" style={{ animationDelay: '100ms' }}>
            Navigate Govt Schemes with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Confidence.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '200ms' }}>
            Scheme Savvy breaks down complex government programs into simple, actionable insights. Ask questions in your preferred language and get answers backed by official verified documents.
          </p>

          <div className="pt-8 flex items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <Button size="lg" onClick={() => navigate('/chat')} className="h-14 px-8 rounded-full text-lg shadow-glow hover:scale-105 transition-transform">
              Start Chatting <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-secondary/30 border-t border-border/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">Why use Scheme Savvy?</h2>
            <p className="text-muted-foreground">Built to make government services accessible to everyone.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-card p-8 rounded-3xl border border-border/50 shadow-soft hover:shadow-glow transition-all hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Verified Information</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every answer is cross-checked against official government portals and PDFs using our intelligent Knowledge Base.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-card p-8 rounded-3xl border border-border/50 shadow-soft hover:shadow-glow transition-all hover:-translate-y-1" style={{ animationDelay: '100ms' }}>
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                <Globe2 className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">Multi-Lingual Support</h3>
              <p className="text-muted-foreground leading-relaxed">
                Comfortably ask questions and receive detailed answers in English, Tamil, or Hindi with native formatting.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-card p-8 rounded-3xl border border-border/50 shadow-soft hover:shadow-glow transition-all hover:-translate-y-1" style={{ animationDelay: '200ms' }}>
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
                <MessageSquare className="w-7 h-7 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Conversational AI</h3>
              <p className="text-muted-foreground leading-relaxed">
                No more confusing forms. Just chat naturally like you would with a knowledgeable friend or expert.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border/40">
        <p>© {new Date().getFullYear()} Scheme Savvy. All rights reserved.</p>
      </footer>
    </div>
  );
}

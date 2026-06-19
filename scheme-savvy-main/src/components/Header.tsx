import { Bot, Shield } from "lucide-react";
import { DocumentLibrary } from "@/components/DocumentLibrary";
import { ThemeToggle } from "@/components/ThemeToggle";

interface HeaderProps {
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
}

export function Header({ currentLanguage, onLanguageChange }: HeaderProps) {
  const languages = [
    { id: 'english', label: 'English', flag: '🇬🇧' },
    { id: 'tamil', label: 'தமிழ்', flag: '🇮🇳' },
    { id: 'hindi', label: 'हिंदी', flag: '🇮🇳' }
  ];

  return (
    <header className="relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />

      <div className="relative px-4 py-6 sm:px-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center justify-center gap-4">
              {/* Logo/Icon */}
              <div 
                className="relative cursor-pointer group" 
                onClick={() => window.location.href = '/'}
                title="Back to Home"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-background border border-border/50 flex items-center justify-center shadow-soft group-hover:shadow-glow transition-all overflow-hidden">
                  <img src="/logo.jpg" alt="Scheme Savvy Logo" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center shadow-soft">
                  <Shield className="w-3 h-3 text-accent-foreground" />
                </div>
              </div>

              {/* Title */}
              <div className="text-center sm:text-left">
                <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                  {currentLanguage === 'tamil' ? 'ஸ்கீம் சாவி' :
                    currentLanguage === 'hindi' ? 'स्कीम सेवी' :
                      'Scheme Savvy'}
                </h1>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                  <span className="text-2xl">🇮🇳</span>
                  <p className="text-sm text-muted-foreground">
                    {currentLanguage === 'tamil' ? 'அரசு திட்டங்களுக்கான உங்கள் உதவியாளர்' :
                      currentLanguage === 'hindi' ? 'सरकारी योजनाओं के लिए आपका सहायक' :
                        'Government Scheme Assistant'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <DocumentLibrary />
              
              {/* Language Switcher */}
              <div className="flex bg-secondary/50 p-1 rounded-lg border border-border/50 backdrop-blur-sm">
                {languages.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => onLanguageChange(lang.id)}
                    className={`
                      px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2
                      ${currentLanguage === lang.id
                        ? 'bg-background text-foreground shadow-sm scale-105'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                      }
                    `}
                  >
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tricolor accent line */}
          <div className="mt-6 flex justify-center sm:justify-start gap-0.5">
            <div className="h-1 w-16 rounded-full bg-[hsl(28,95%,55%)]" />
            <div className="h-1 w-16 rounded-full bg-card" />
            <div className="h-1 w-16 rounded-full bg-accent" />
          </div>
        </div>
      </div>
    </header>
  );
}

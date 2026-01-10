import { ShieldAlert, X } from "lucide-react";
import { useState } from "react";

interface DisclaimerBannerProps {
  currentLanguage: string;
}

export function DisclaimerBanner({ currentLanguage = 'english' }: DisclaimerBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const getDisclaimerText = () => {
    if (currentLanguage === 'tamil') {
      return (
        <p className="text-xs text-secondary-foreground leading-relaxed">
          <strong className="font-semibold">அதிகாரப்பூர்வ ஆதாரங்கள் மட்டும்:</strong> பதில்கள்
          அரசு ஆவணங்கள் மற்றும் சரிபார்க்கப்பட்ட இணையதளங்களில் (india.gov.in) இருந்து மட்டுமே பெறப்படுகின்றன.
          இது தகவல் மட்டுமே - சட்ட ஆலோசனை அல்ல.
        </p>
      );
    }
    if (currentLanguage === 'hindi') {
      return (
        <p className="text-xs text-secondary-foreground leading-relaxed">
          <strong className="font-semibold">केवल आधिकारिक स्रोत:</strong> उत्तर केवल सरकारी दस्तावेजों
          और सत्यापित पोर्टलों (india.gov.in) पर आधारित हैं।
          यह केवल जानकारी है - कानूनी सलाह नहीं।
        </p>
      );
    }
    return (
      <p className="text-xs text-secondary-foreground leading-relaxed">
        <strong className="font-semibold">Official Sources Only:</strong> Answers are
        grounded in official government PDFs and verified portals (india.gov.in, pmindia.gov.in).
        No blogs, no guessing, no hallucination. This is informational only — not legal advice.
        Verify through official channels before acting.
      </p>
    );
  };

  return (
    <div className="bg-secondary/80 border border-primary/20 rounded-xl px-4 py-3 animate-fade-in">
      <div className="flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          {getDisclaimerText()}
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss disclaimer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

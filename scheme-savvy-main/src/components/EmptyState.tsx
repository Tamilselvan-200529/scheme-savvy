import { Layers, FileText, Globe, ShieldCheck, ListOrdered, Link } from "lucide-react";

interface EmptyStateProps {
  currentLanguage?: string;
}

const translations = {
  english: {
    title: "Government Scheme Directory",
    subtitle: "Ask about any category below. I'll list Central & State schemes with official sources.",
    categories: [
      { name: "Agriculture", examples: "PM-KISAN, PMFBY" },
      { name: "Housing", examples: "PMAY-U, PMAY-G" },
      { name: "Education", examples: "NSP, CSSS" },
      { name: "Healthcare", examples: "Ayushman Bharat" },
      { name: "Employment", examples: "PMKVY, MGNREGA" },
      { name: "Women & Child", examples: "Beti Bachao, PMMVY" },
    ],
    howTitle: "How I Respond:",
    steps: [
      { title: "Step 1: Classification", subtitle: "Central vs State schemes" },
      { title: "Step 2: Enumeration", subtitle: "List all relevant schemes" },
      { title: "Step 3: Details", subtitle: "Purpose, eligibility, benefits" },
      { title: "Step 4: Citations", subtitle: "Official URLs & PDFs" }
    ],
    sources: "Official Sources Only:"
  },
  tamil: {
    title: "அரசு திட்டங்கள் வழிகாட்டி",
    subtitle: "எந்த வகையை பற்றியும் கேட்கவும். மத்திய மற்றும் மாநில திட்டங்களை அதிகாரப்பூர்வ ஆதாரங்களுடன் தருகிறேன்.",
    categories: [
      { name: "விவசாயம்", examples: "பிஎம் கிசான், பயிர் காப்பீடு" },
      { name: "வீட்டுவசதி", examples: "PMAY நகர்ப்புறம்/கிராமப்புறம்" },
      { name: "கல்வி", examples: "உதவித்தொகை திட்டங்கள்" },
      { name: "சுகாதாரம்", examples: "ஆயுஷ்மான் பாரத்" },
      { name: "வேலைவாய்ப்பு", examples: "PMKVY, MGNREGA" },
      { name: "பெண்கள் & குழந்தைகள்", examples: "பெட்டி பச்சாவோ" },
    ],
    howTitle: "நான் எப்படி பதிலளிக்கிறேன்:",
    steps: [
      { title: "படி 1: வகைப்பாடு", subtitle: "மத்திய vs மாநில திட்டங்கள்" },
      { title: "படி 2: பட்டியல்", subtitle: "தொடர்புடைய திட்டங்கள் பட்டியல்" },
      { title: "படி 3: விவரங்கள்", subtitle: "நோக்கம், தகுதி, நன்மைகள்" },
      { title: "படி 4: ஆதாரங்கள்", subtitle: "அரசு இணையதளங்கள் & PDF" }
    ],
    sources: "அதிகாரப்பூர்வ ஆதாரங்கள் மட்டும்:"
  },
  hindi: {
    title: "सरकारी योजना निर्देशिका",
    subtitle: "किसी भी श्रेणी के बारे में पूछें। मैं आधिकारिक स्रोतों के साथ केंद्र और राज्य योजनाओं को सूचीबद्ध करूंगा।",
    categories: [
      { name: "कृषि", examples: "पीएम किसान, फसल बीमा" },
      { name: "आवास", examples: "PMAY शहरी/ग्रामीण" },
      { name: "शिक्षा", examples: "छात्रवृत्ति योजनाएं" },
      { name: "स्वास्थ्य", examples: "आयुष्मान भारत" },
      { name: "रोजगार", examples: "PMKVY, मनरेगा" },
      { name: "महिला और बाल", examples: "बेटी बचाओ, PMMVY" },
    ],
    howTitle: "मैं कैसे जवाब देता हूं:",
    steps: [
      { title: "चरण 1: वर्गीकरण", subtitle: "केंद्र बनाम राज्य योजनाएं" },
      { title: "चरण 2: सूचीकरण", subtitle: "सभी प्रासंगिक योजनाओं की सूची" },
      { title: "चरण 3: विवरण", subtitle: "उद्देश्य, पात्रता, लाभ" },
      { title: "चरण 4: संदर्भ", subtitle: "आधिकारिक URL और PDF" }
    ],
    sources: "केवल आधिकारिक स्रोत:"
  }
};

export function EmptyState({ currentLanguage = 'english' }: EmptyStateProps) {
  const t = translations[currentLanguage as keyof typeof translations] || translations.english;

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4 shadow-soft">
        <Layers className="w-8 h-8 text-primary" />
      </div>

      <h2 className="font-heading text-xl font-semibold text-foreground mb-2 text-center">
        {t.title}
      </h2>
      <p className="text-muted-foreground text-center max-w-md mb-6 text-sm">
        {t.subtitle}
      </p>

      {/* Scheme Categories */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-lg mb-6">
        {t.categories.map((cat) => (
          <div
            key={cat.name}
            className="p-3 bg-card rounded-lg border border-border/50 shadow-soft hover:border-primary/30 transition-colors"
          >
            <p className="font-medium text-sm text-foreground">{cat.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{cat.examples}</p>
          </div>
        ))}
      </div>

      {/* How I Work */}
      <div className="w-full max-w-lg bg-muted/30 rounded-xl border border-border/30 p-4 mb-4">
        <p className="text-xs font-semibold text-foreground mb-3">{t.howTitle}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <ListOrdered className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-foreground">{t.steps[0].title}</p>
              <p className="text-[10px] text-muted-foreground">{t.steps[0].subtitle}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-foreground">{t.steps[1].title}</p>
              <p className="text-[10px] text-muted-foreground">{t.steps[1].subtitle}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-foreground">{t.steps[2].title}</p>
              <p className="text-[10px] text-muted-foreground">{t.steps[2].subtitle}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Link className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-foreground">{t.steps[3].title}</p>
              <p className="text-[10px] text-muted-foreground">{t.steps[3].subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Knowledge Sources */}
      <div className="w-full max-w-lg p-3 bg-card rounded-xl border border-border/30">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="w-3.5 h-3.5 text-accent" />
          <p className="text-xs font-medium text-foreground">{t.sources}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["india.gov.in", "pmindia.gov.in", "scholarships.gov.in", "umang.gov.in", "State Portals"].map((domain) => (
            <span
              key={domain}
              className="inline-flex items-center px-2 py-0.5 bg-muted rounded text-[10px] text-muted-foreground"
            >
              {domain}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Home, GraduationCap, Heart, Briefcase, Sprout, Users } from "lucide-react";

interface SuggestionChipsProps {
  onSelect: (suggestion: string) => void;
  disabled?: boolean;
  currentLanguage?: string;
}

const translations = {
  english: {
    title: "Explore scheme categories:",
    items: [
      { label: "Agriculture", query: "List all Central Government agriculture schemes for farmers" },
      { label: "Housing", query: "List all housing schemes under PMAY" },
      { label: "Education", query: "List all scholarship schemes for students" },
      { label: "Healthcare", query: "List all central government health schemes" },
      { label: "Employment", query: "List all employment and skill development schemes" },
      { label: "Women & Child", query: "List all women and child welfare schemes" },
    ]
  },
  tamil: {
    title: "திட்ட வகைகளை ஆராயுங்கள்:",
    items: [
      { label: "விவசாயம்", query: "விவசாயிகளுக்கான மத்திய அரசு திட்டங்களை பட்டியலிடு" },
      { label: "வீட்டுவசதி", query: "PMAY கீழ் உள்ள அனைத்து வீட்டுவசதி திட்டங்களையும் பட்டியலிடு" },
      { label: "கல்வி", query: "மாணவர்களுக்கான உதவித்தொகை திட்டங்களை பட்டியலிடு" },
      { label: "சுகாதாரம்", query: "மத்திய அரசின் சுகாதார திட்டங்களை பட்டியலிடு" },
      { label: "வேலைவாய்ப்பு", query: "வேலைவாய்ப்பு மற்றும் திறன் மேம்பாட்டு திட்டங்களை பட்டியலிடு" },
      { label: "பெண்கள் & குழந்தைகள்", query: "பெண்கள் மற்றும் குழந்தைகள் நலத்திட்டங்களை பட்டியலிடு" },
    ]
  },
  hindi: {
    title: "योजना श्रेणियां देखें:",
    items: [
      { label: "कृषि", query: "किसानों के लिए सभी केंद्र सरकार की योजनाओं की सूची बनाएं" },
      { label: "आवास", query: "पीएमएवाई के तहत सभी आवास योजनाओं की सूची बनाएं" },
      { label: "शिक्षा", query: "छात्रों के लिए सभी छात्रवृत्ति योजनाओं की सूची बनाएं" },
      { label: "स्वास्थ्य", query: "सभी केंद्र सरकार की स्वास्थ्य योजनाओं की सूची बनाएं" },
      { label: "रोजगार", query: "सभी रोजगार और कौशल विकास योजनाओं की सूची बनाएं" },
      { label: "महिला और बाल", query: "सभी महिला और बाल कल्याण योजनाओं की सूची बनाएं" },
    ]
  }
};

const icons = [Sprout, Home, GraduationCap, Heart, Briefcase, Users];

export function SuggestionChips({ onSelect, disabled, currentLanguage = 'english' }: SuggestionChipsProps) {
  const t = translations[currentLanguage as keyof typeof translations] || translations.english;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground font-medium">
        {t.title}
      </p>
      <div className="flex flex-wrap gap-2">
        {t.items.map((suggestion, index) => {
          const Icon = icons[index];
          return (
            <Button
              key={suggestion.label}
              variant="secondary"
              size="sm"
              onClick={() => onSelect(suggestion.query)}
              disabled={disabled}
              className="gap-2 rounded-full hover:bg-primary/10 hover:text-primary hover:border-primary/20 border border-transparent transition-all duration-200"
            >
              <Icon className="w-3.5 h-3.5" />
              {suggestion.label}
            </Button>
          )
        })}
      </div>
    </div>
  );
}

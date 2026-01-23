import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Code, FileCode, Braces, Hash, Terminal, Globe } from "lucide-react";

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const languages = [
  { value: "javascript", label: "JavaScript", icon: Braces },
  { value: "typescript", label: "TypeScript", icon: FileCode },
  { value: "html", label: "HTML", icon: Globe },
  { value: "css", label: "CSS", icon: Hash },
  { value: "python", label: "Python", icon: Terminal },
  { value: "json", label: "JSON", icon: Code },
  { value: "markdown", label: "Markdown", icon: FileCode },
  { value: "sql", label: "SQL", icon: Terminal },
];

const LanguageSelector = ({ value, onChange }: LanguageSelectorProps) => {
  const selectedLang = languages.find((l) => l.value === value);
  const Icon = selectedLang?.icon || Code;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px] bg-cyber-mid border-border text-foreground font-rajdhani">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <SelectValue placeholder="Tilni tanlang" />
        </div>
      </SelectTrigger>
      <SelectContent className="bg-cyber-mid border-border">
        {languages.map((lang) => {
          const LangIcon = lang.icon;
          return (
            <SelectItem
              key={lang.value}
              value={lang.value}
              className="text-foreground hover:bg-muted focus:bg-muted cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <LangIcon className="h-4 w-4 text-primary" />
                <span>{lang.label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export default LanguageSelector;

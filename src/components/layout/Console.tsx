import { useTranslation } from "react-i18next";
import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

export default function Console() {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`border-t border-border bg-card transition-all duration-200 ${
        isExpanded ? "h-64" : "h-10"
      }`}
    >
      {/* Console Header */}
      <div className="h-10 flex items-center px-3 justify-between">
        <span className="text-sm font-medium text-foreground">
          {t("layout.console")}
        </span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-accent rounded transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Console Content */}
      {isExpanded && (
        <div className="h-[calc(100%-2.5rem)] overflow-auto p-4">
          <p className="text-sm text-muted-foreground">
            Matrix results will be displayed here (Week 6+)
          </p>
        </div>
      )}
    </div>
  );
}







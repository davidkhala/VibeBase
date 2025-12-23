import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import { ChevronUp, ChevronDown, Eraser } from "lucide-react";
import { useConsoleStore, LogLevel } from "@/stores/consoleStore";

export default function Console() {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const { logs, clearLogs } = useConsoleStore();
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isExpanded) {
      consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isExpanded]);

  const getLevelColor = (level: LogLevel): string => {
    switch (level) {
      case "INFO":
        return "text-blue-500";
      case "SUCCESS":
        return "text-green-500";
      case "WARNING":
        return "text-yellow-500";
      case "ERROR":
        return "text-red-500";
      case "SAVE":
        return "text-purple-500";
      case "DELETE":
        return "text-orange-500";
      case "CREATE":
        return "text-cyan-500";
      case "UPDATE":
        return "text-indigo-500";
      case "EXECUTE":
        return "text-pink-500";
      case "GIT":
        return "text-emerald-500";
      default:
        return "text-muted-foreground";
    }
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div
      className={`border-t border-border bg-card transition-all duration-200 ${isExpanded ? "h-64" : "h-10"
        }`}
    >
      {/* Console Header */}
      <div className="h-10 flex items-center px-3 justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {t("layout.console")}
          </span>
          {logs.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({logs.length})
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {logs.length > 0 && (
            <button
              onClick={clearLogs}
              className="p-1 hover:bg-accent rounded transition-colors"
              title={t("console.clear")}
            >
              <Eraser className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
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
      </div>

      {/* Console Content */}
      {isExpanded && (
        <div className="h-[calc(100%-2.5rem)] overflow-auto p-2 font-mono text-xs bg-black/5 dark:bg-black/20">
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {t("console.noLogs") || "No logs yet"}
            </div>
          ) : (
            <div className="space-y-0.5">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2 hover:bg-accent/50 px-1 py-0.5 rounded"
                >
                  <span className="text-muted-foreground flex-shrink-0">
                    {formatTime(log.timestamp)}
                  </span>
                  <span className={`font-semibold flex-shrink-0 ${getLevelColor(log.level)}`}>
                    [{log.level}]
                  </span>
                  <span className="text-foreground flex-1">{log.message}</span>
                </div>
              ))}
              <div ref={consoleEndRef} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

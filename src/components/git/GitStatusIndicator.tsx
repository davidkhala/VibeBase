import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { GitBranch, AlertCircle, CheckCircle } from "lucide-react";
import { useGitStore } from "../../stores/gitStore";

interface GitStatusIndicatorProps {
  onGitClick: () => void;
}

export default function GitStatusIndicator({ onGitClick }: GitStatusIndicatorProps) {
  const { t } = useTranslation();
  const { workspacePath, status, refreshStatus } = useGitStore();
  const [isGitRepo, setIsGitRepo] = useState<boolean | null>(null);

  useEffect(() => {
    if (!workspacePath) {
      setIsGitRepo(null);
      return;
    }

    // 自动检测 git 仓库状态
    const checkGitStatus = async () => {
      try {
        await refreshStatus();
        setIsGitRepo(true);
      } catch (error) {
        // Git 仓库未初始化或检测失败
        console.debug("Git not initialized:", error);
        setIsGitRepo(false);
      }
    };

    checkGitStatus();
  }, [workspacePath, refreshStatus]);

  if (!workspacePath || isGitRepo === null) {
    return null;
  }

  const totalChanges = status
    ? status.staged.length + status.unstaged.length + status.untracked.length
    : 0;

  return (
    <button
      type="button"
      onClick={onGitClick}
      className="w-full px-2 py-1.5 hover:bg-accent rounded transition-colors flex items-center gap-2 text-xs"
      title={
        isGitRepo
          ? status
            ? t("git.statusTooltip", {
                branch: status.current_branch,
                changes: totalChanges,
              })
            : t("git.title")
          : t("git.notInitialized")
      }
    >
      {isGitRepo ? (
        <>
          <GitBranch className="w-3.5 h-3.5 text-primary" />
          {status && (
            <>
              <span className="text-muted-foreground truncate flex-1 text-left">
                {status.current_branch}
              </span>
              {totalChanges > 0 ? (
                <span className="flex items-center gap-1 text-amber-600">
                  <AlertCircle className="w-3 h-3" />
                  <span>{totalChanges}</span>
                </span>
              ) : (
                <CheckCircle className="w-3 h-3 text-green-600" />
              )}
              {status.ahead > 0 && (
                <span className="text-blue-600">↑{status.ahead}</span>
              )}
              {status.behind > 0 && (
                <span className="text-orange-600">↓{status.behind}</span>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground truncate flex-1 text-left">
            {t("git.notInitialized")}
          </span>
        </>
      )}
    </button>
  );
}

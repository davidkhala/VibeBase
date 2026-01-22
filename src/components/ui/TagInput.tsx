import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";

interface TagInputProps {
  workspacePath?: string;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}

export default function TagInput({ workspacePath, tags, onTagsChange }: TagInputProps) {
  const { t } = useTranslation();
  const [newTag, setNewTag] = useState("");
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load all available tags from workspace
  useEffect(() => {
    loadAvailableTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspacePath]);

  // Filter suggestions based on input
  useEffect(() => {
    const query = newTag.toLowerCase();
    const filtered = availableTags.filter(
      (tag) => 
        !tags.includes(tag) && 
        (query === "" || tag.toLowerCase().includes(query))
    );
    console.log("[TagInput] Filtered suggestions:", {
      query,
      availableTags: availableTags.length,
      currentTags: tags.length,
      filtered: filtered.length
    });
    setFilteredSuggestions(filtered);
    setSelectedIndex(0);
    
    // Show suggestions if input is focused and there are suggestions
    if (document.activeElement === inputRef.current && filtered.length > 0) {
      console.log("[TagInput] Auto-showing suggestions");
      setShowSuggestions(true);
    }
  }, [newTag, availableTags, tags]);

  const loadAvailableTags = async () => {
    if (!workspacePath) {
      console.log("[TagInput] No workspace path, skipping tag load");
      setAvailableTags([]);
      return;
    }
    
    try {
      console.log("[TagInput] Loading tags for workspace:", workspacePath);
      const allTags = await invoke<string[]>("get_all_tags", {
        workspacePath: workspacePath,
      });
      console.log("[TagInput] Loaded tags:", allTags);
      setAvailableTags(allTags || []);
    } catch (error) {
      console.error("[TagInput] Failed to load available tags:", error);
      setAvailableTags([]);
    }
  };

  const handleAddTag = (tag?: string) => {
    const tagToAdd = tag || newTag.trim();
    if (tagToAdd && !tags.includes(tagToAdd)) {
      onTagsChange([...tags, tagToAdd]);
      setNewTag("");
      setShowSuggestions(false);
      inputRef.current?.focus();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (showSuggestions && filteredSuggestions.length > 0) {
        handleAddTag(filteredSuggestions[selectedIndex]);
      } else {
        handleAddTag();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase">
        {t("metadata.tags")}
      </h4>

      {/* Tag input with autocomplete */}
      <div className="relative">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              console.log("[TagInput] Input focused, showing suggestions");
              setShowSuggestions(true);
            }}
            onBlur={() => {
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            className="flex-1 px-2 py-1.5 text-sm bg-background border border-input rounded focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder={t("metadata.add_tag_placeholder")}
          />
          <button
            type="button"
            onClick={() => handleAddTag()}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            {t("metadata.add_tag")}
          </button>
        </div>

        {/* Autocomplete suggestions */}
        {showSuggestions && (
          <div
            ref={suggestionsRef}
            onMouseDown={(e) => e.preventDefault()} // Prevent input blur when clicking
            className="absolute z-[9999] mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-64 overflow-auto"
          >
            {filteredSuggestions.length > 0 ? (
              <>
                {/* Header */}
                <div className="px-3 py-2 border-b border-border bg-muted/50">
                  <div className="text-xs font-medium text-muted-foreground">
                    {newTag.trim() 
                      ? `${filteredSuggestions.length} ${t("metadata.matching_tags")}`
                      : `${filteredSuggestions.length} ${t("metadata.available_tags")}`
                    }
                  </div>
                </div>
                
                {/* Tag list */}
                <div className="py-1">
                  {filteredSuggestions.map((tag, index) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddTag(tag)}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                        index === selectedIndex
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{tag}</span>
                        <span className="text-xs text-muted-foreground">
                          {t("metadata.click_to_add")}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                {availableTags.length === 0 
                  ? t("metadata.no_tags_yet")
                  : t("metadata.all_tags_added")
                }
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tags display */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-accent text-accent-foreground rounded border border-border"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-destructive"
                aria-label={`Remove ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

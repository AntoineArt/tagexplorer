import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface TagInputProps {
  onAddTag: (tagName: string) => void;
  existingTags?: string[];
}

export function TagInput({ onAddTag, existingTags = [] }: TagInputProps) {
  const [value, setValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const allTags = useQuery(api.tags.listTags) ?? [];

  const filteredSuggestions = allTags
    .filter((tag) =>
      tag.name.includes(value.toLowerCase()) &&
      !existingTags.includes(tag.name)
    )
    .slice(0, 5);

  const handleSubmit = useCallback((tagName: string) => {
    const normalized = tagName.toLowerCase().trim();
    if (normalized && !existingTags.includes(normalized)) {
      onAddTag(normalized);
      setValue("");
      setShowSuggestions(false);
    }
  }, [onAddTag, existingTags]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit(value);
    }
  }, [value, handleSubmit]);

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder="Nouveau tag..."
            className="
              w-full bg-gray-900/50 border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-white
              placeholder:text-gray-600
              focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20
              transition-all duration-200
            "
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs">
            ⏎
          </div>
        </div>
        <button
          onClick={() => handleSubmit(value)}
          disabled={!value.trim()}
          className="
            px-4 py-3 rounded-xl text-sm font-bold
            bg-gradient-to-r from-emerald-600 to-teal-600
            hover:from-emerald-500 hover:to-teal-500
            disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500
            text-white shadow-lg shadow-emerald-500/20
            disabled:shadow-none disabled:cursor-not-allowed
            transition-all duration-200
          "
        >
          +
        </button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && value && (
        <div className="
          absolute z-20 w-full mt-2 py-2
          bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl
          shadow-2xl shadow-black/50
          overflow-hidden
        ">
          {filteredSuggestions.map((tag) => (
            <button
              key={tag._id}
              onClick={() => handleSubmit(tag.name)}
              className="
                w-full px-4 py-2.5 text-left text-sm
                flex items-center gap-3
                hover:bg-emerald-500/10 transition-colors
              "
            >
              <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-emerald-400 text-xs">
                #
              </span>
              <span className="text-gray-300">{tag.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

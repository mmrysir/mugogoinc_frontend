"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { RegionPreset } from "@/constants/regions";

interface SearchableMultiSelectProps {
  id?: string;
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  presets?: RegionPreset[];
  /** Which field from the preset to apply — "countries" or "languages" */
  presetField?: "countries" | "languages";
  accentColor?: string;
  accentBg?: string;
  placeholder?: string;
}

export function SearchableMultiSelect({
  id,
  label,
  options,
  selected,
  onChange,
  presets,
  presetField = "countries",
  accentColor = "#22d3ee",
  accentBg = "rgba(6,182,212,0.15)",
  placeholder = "Search and select…",
}: SearchableMultiSelectProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = useMemo(() => {
    const q = query.toLowerCase();
    return options.filter((opt) => opt.toLowerCase().includes(q));
  }, [options, query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) {
      // Enforce minimum 1 selection
      if (selected.length > 1) onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  const applyPreset = (preset: RegionPreset) => {
    onChange(preset[presetField]);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      {/* Label */}
      <label
        className="block text-xs font-semibold uppercase tracking-wider"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
        <span
          className="ml-1.5 font-normal normal-case"
          style={{ color: "var(--text-muted)", opacity: 0.7 }}
        >
          ({selected.length} selected)
        </span>
      </label>

      {/* Preset Pills */}
      {presets && presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset)}
              className="text-2xs px-2 py-0.5 rounded-full border transition-all"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
                background: "var(--bg-elevated)",
                cursor: "pointer",
                fontSize: "0.68rem",
              }}
            >
              {preset.emoji} {preset.label}
            </button>
          ))}
        </div>
      )}

      {/* Tag Input Box */}
      <div
        id={id}
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        className="flex flex-wrap gap-1 p-2 rounded-xl border min-h-[42px] items-center cursor-text transition-colors"
        style={{
          borderColor: isOpen ? accentColor : "var(--border)",
          background: "var(--bg-elevated)",
          boxShadow: isOpen ? `0 0 0 2px ${accentColor}22` : "none",
        }}
      >
        {selected.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ background: accentBg, color: accentColor }}
          >
            {item}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleOption(item);
              }}
              className="hover:opacity-70 font-bold leading-none"
              style={{ color: accentColor }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={selected.length === 0 ? placeholder : "Add more…"}
          className="flex-1 min-w-[100px] outline-none text-sm bg-transparent"
          style={{ color: "var(--text-primary)", caretColor: accentColor }}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute z-30 w-full mt-1 rounded-xl border shadow-xl overflow-hidden"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border)",
            maxHeight: "220px",
            overflowY: "auto",
          }}
        >
          {filteredOptions.length === 0 ? (
            <div
              className="p-3 text-sm text-center"
              style={{ color: "var(--text-muted)" }}
            >
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = selected.includes(opt);
              return (
                <div
                  key={opt}
                  onClick={() => toggleOption(opt)}
                  className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors"
                  style={{
                    background: isSelected ? `${accentBg}` : "transparent",
                    color: isSelected ? accentColor : "var(--text-primary)",
                    fontWeight: isSelected ? 600 : 400,
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.background = isSelected
                      ? accentBg
                      : "var(--bg-elevated)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.background = isSelected
                      ? accentBg
                      : "transparent")
                  }
                >
                  <span>{opt}</span>
                  {isSelected && (
                    <span style={{ color: accentColor }} className="text-xs font-bold">
                      ✓
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

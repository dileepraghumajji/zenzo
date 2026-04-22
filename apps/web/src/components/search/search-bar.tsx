"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Search, X, Clock, Building2, User } from "lucide-react";
import { cn } from "@zenzo/ui";
import type { SuggestResult } from "./types";

const RECENT_KEY = "zenzo_recent_searches";
const MAX_RECENT = 10;

function getRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function addRecent(q: string) {
  const prev = getRecent().filter((r) => r !== q);
  localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, MAX_RECENT)));
}

function clearRecent() {
  localStorage.removeItem(RECENT_KEY);
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (value: string) => void;
  loading?: boolean;
  placeholder?: string;
  className?: string;
}

type DropdownItem =
  | { kind: "recent"; label: string }
  | { kind: "suggest"; label: string; slug: string; type: "club" | "coach" };

export function SearchBar({
  value,
  onChange,
  onSearch,
  loading,
  placeholder = "Search gyms, coaches, yoga studios...",
  className,
}: SearchBarProps) {
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allItems: DropdownItem[] = value.trim()
    ? suggestions.map((s) => ({ kind: "suggest" as const, ...s }))
    : recent.map((r) => ({ kind: "recent" as const, label: r }));

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) { setSuggestions([]); return; }
    try {
      const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json() as { results: SuggestResult[] };
        setSuggestions(data.results ?? []);
      }
    } catch {
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);
    suggestTimerRef.current = setTimeout(() => fetchSuggestions(value), 300);
    return () => { if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current); };
  }, [value, fetchSuggestions]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleFocus() {
    setRecent(getRecent());
    setOpen(true);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || allItems.length === 0) {
      if (e.key === "Enter" && value.trim()) {
        addRecent(value.trim());
        onSearch(value.trim());
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    } else if (e.key === "Enter") {
      if (activeIndex >= 0) {
        const item = allItems[activeIndex];
        if (item) selectItem(item.label);
      } else if (value.trim()) {
        addRecent(value.trim());
        onSearch(value.trim());
        setOpen(false);
      }
    }
  }

  function selectItem(label: string) {
    onChange(label);
    addRecent(label);
    onSearch(label);
    setOpen(false);
    inputRef.current?.focus();
  }

  function handleClear() {
    onChange("");
    setSuggestions([]);
    setRecent(getRecent());
    setOpen(true);
    inputRef.current?.focus();
  }

  const showDropdown = open && allItems.length > 0;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 size-4 text-muted pointer-events-none z-10" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label="Search"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `sb-item-${activeIndex}` : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-20 py-3 rounded-xl border border-border bg-surface-raised text-body text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/60 transition"
        />
        {loading && (
          <div className="absolute right-9 size-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
        )}
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3.5 text-muted hover:text-heading transition"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1 bg-surface-raised border border-border rounded-xl shadow-lg z-50 overflow-hidden"
        >
          {!value.trim() && recent.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <span className="text-label text-muted">Recent searches</span>
              <button
                onClick={() => { clearRecent(); setRecent([]); }}
                className="text-label text-brand hover:underline"
              >
                Clear history
              </button>
            </div>
          )}
          {allItems.map((item, idx) => (
            <button
              key={idx}
              id={`sb-item-${idx}`}
              role="option"
              aria-selected={idx === activeIndex}
              onMouseEnter={() => setActiveIndex(idx)}
              onClick={() => selectItem(item.label)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                idx === activeIndex ? "bg-surface-subtle" : "hover:bg-surface-subtle"
              )}
            >
              {item.kind === "recent" ? (
                <Clock className="size-3.5 text-muted shrink-0" />
              ) : item.type === "club" ? (
                <Building2 className="size-3.5 text-muted shrink-0" />
              ) : (
                <User className="size-3.5 text-muted shrink-0" />
              )}
              <span className="flex-1 text-body text-heading truncate">{item.label}</span>
              {item.kind === "suggest" && (
                <span className={cn(
                  "shrink-0 text-label px-1.5 py-0.5 rounded-full font-medium",
                  item.type === "club"
                    ? "bg-primary-subtle text-brand"
                    : "bg-surface-subtle text-muted"
                )}>
                  {item.type === "club" ? "Club" : "Coach"}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

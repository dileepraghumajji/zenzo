"use client";

// ThemeToggle — portal theme switcher
//
// Three modes: Light / Dark / System (follows OS).
// Rendered as an icon button that opens a small dropdown.
// Mounted guard prevents SSR/hydration mismatch with useTheme.

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

const THEMES = [
  { value: "light",  label: "Light",  Icon: Sun     },
  { value: "dark",   label: "Dark",   Icon: Moon    },
  { value: "system", label: "System", Icon: Monitor },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only render after hydration to avoid mismatches
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Exact same size as the real button — no layout shift
    return <div className="size-9 rounded-full" aria-hidden />;
  }

  const current = THEMES.find((t) => t.value === theme) ?? THEMES[2];
  const { Icon: CurrentIcon } = current;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label={`Theme: ${current.label}. Click to change.`}
          className="size-9 rounded-full bg-surface-raised flex items-center justify-center hover:bg-border transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <CurrentIcon className="size-4 text-muted" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[148px] overflow-hidden rounded-xl border border-border bg-surface-raised p-1 shadow-lg animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
        >
          {THEMES.map(({ value, label, Icon }) => (
            <DropdownMenu.Item
              key={value}
              onSelect={() => setTheme(value)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-body cursor-pointer select-none outline-none text-foreground hover:bg-surface-subtle hover:text-heading transition-colors"
            >
              <Icon className="size-4 text-muted shrink-0" />
              <span className="flex-1 font-medium">{label}</span>
              {theme === value && (
                <Check className="size-3.5 text-brand shrink-0" />
              )}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

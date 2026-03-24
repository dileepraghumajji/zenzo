import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    // ─── Override defaults ────────────────────────────────────────────────
    fontFamily: {
      sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
      mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
    },

    // ─── Extend (add alongside defaults) ─────────────────────────────────
    extend: {
      colors: {
        // ── SEMANTIC LAYER (Tier 2) ───────────────────────────────────────
        // These are the ONLY tokens components should reference.
        // All map to CSS variables in globals.css.
        // Changing a brand color = update one CSS var. Zero component edits.
        //
        // Convention (follows Tailwind ecosystem standard):
        //   bg-background        → page background
        //   text-foreground      → default body text
        //   text-heading         → h1/h2/h3 text
        //   text-muted           → captions, secondary text
        //   text-inverse         → text on dark/coloured backgrounds
        //   text-brand           → orange text on white (links, active items)
        //   border-border        → default card/input borders (yes, border-border)
        //   ring-ring            → focus rings
        //   bg-primary           → primary button/link background
        //   bg-primary-hover     → primary button hover
        //   text-primary-foreground → text on primary background
        //   bg-primary-subtle    → soft brand tint (forge-50)
        //   bg-destructive       → danger button background
        //   bg-destructive-hover → danger button hover
        //   text-destructive-foreground → text on danger background
        //   bg-success / text-success-foreground / bg-success-accent
        //   bg-warning / text-warning-foreground / bg-warning-accent
        //   bg-error   / text-error-foreground   / bg-error-accent
        //   bg-info    / text-info-foreground    / bg-info-accent

        // Surfaces
        background: "var(--surface-page)",
        surface: {
          subtle: "var(--surface-subtle)",
          brand:  "var(--surface-brand)",
        },

        // Text
        foreground:  "var(--text-secondary)",
        heading:     "var(--text-primary)",
        muted:       "var(--text-tertiary)",
        placeholder: "var(--text-placeholder)",
        inverse:     "var(--text-inverse)",
        brand:       "var(--text-brand)",

        // Borders & rings
        border: "var(--border-default)",
        ring:   "var(--border-focus)",

        // Interactive — primary (Forge orange)
        primary: {
          DEFAULT:    "var(--action-primary-bg)",
          hover:      "var(--action-primary-bg-hover)",
          foreground: "var(--action-primary-text)",
          subtle:     "var(--surface-brand)",
        },

        // Interactive — danger (Flame red)
        destructive: {
          DEFAULT:    "var(--action-danger-bg)",
          hover:      "var(--action-danger-bg-hover)",
          foreground: "var(--action-primary-text)",
        },

        // Status — success (Jade green)
        success: {
          DEFAULT:    "var(--status-success-bg)",
          foreground: "var(--status-success-text)",
          accent:     "var(--status-success-border)",
        },

        // Status — warning (Sand amber)
        warning: {
          DEFAULT:    "var(--status-warning-bg)",
          foreground: "var(--status-warning-text)",
          accent:     "var(--status-warning-border)",
        },

        // Status — error (Flame red, softer bg)
        error: {
          DEFAULT:    "var(--status-error-bg)",
          foreground: "var(--status-error-text)",
          accent:     "var(--status-error-border)",
        },

        // Status — info (Sky blue)
        info: {
          DEFAULT:    "var(--status-info-bg)",
          foreground: "var(--status-info-text)",
          accent:     "var(--status-info-border)",
        },

        // ── PRIMITIVE LAYER (Tier 1) ──────────────────────────────────────
        // Only used in:
        //   1. globals.css to define the CSS variables above
        //   2. Avatar initials palette (purely decorative, not functional UI)
        //   3. This config file
        // NEVER use forge-*, stone-*, jade-*, etc. directly in components.
        //
        // ── Forge — Zenzo brand orange ────────────────────────────────────
        // Not Tailwind's orange. Hue ~22°, deeper at mid-tones, premium.
        // forge-600 passes WCAG AA with white text (4.73:1)
        forge: {
          50:  "#FFF6EC",
          100: "#FFEBD3",
          200: "#FDD1A3",
          300: "#FBAD65",
          400: "#F88030",
          500: "#EF6014", // accent: icons, active nav, progress, focus rings
          600: "#C84A08", // interactive: button bg, links (white text 4.73:1 ✓)
          700: "#A13907", // hover/pressed (white text 6.09:1 ✓)
          800: "#7D2C05",
          900: "#5B2004",
        },

        // ── Stone — warm neutral (slight amber undertone, hue ~25°) ───────
        // Not Tailwind slate (too cold/blue). Coheres with forge without
        // being noticeable on its own.
        stone: {
          0:   "#FFFFFF",
          50:  "#FAF9F7",
          100: "#F4F3F0",
          200: "#E9E7E3", // borders, dividers
          300: "#D4D0CA", // strong borders
          400: "#A8A39A", // placeholder (never real text)
          500: "#78746C", // secondary text  (4.67:1 ✓ WCAG AA)
          600: "#5A5650", // labels, meta    (6.72:1 ✓ WCAG AAA)
          700: "#3C3935", // body text       (10.2:1 ✓)
          800: "#252320", // headings        (14.1:1 ✓)
          900: "#151310", // max contrast
        },

        // ── Jade — success / present / confirmed ──────────────────────────
        // Deeper than Tailwind green-500 (#22C55E which fails AA for text).
        // jade-700 on white: 5.05:1 ✓ WCAG AA
        jade: {
          50:  "#F0FDF5",
          100: "#DCFAE8",
          500: "#16A34A", // icons, decorative borders
          700: "#15803D", // text on white ✓
        },

        // ── Sand — warning / expiring ─────────────────────────────────────
        // Amber, clearly distinct from forge orange (hue ~38°).
        // sand-700 on white: 5.02:1 ✓ WCAG AA
        sand: {
          50:  "#FFFBEB",
          500: "#D97706", // icons, decorative
          700: "#B45309", // text on white ✓
        },

        // ── Flame — error / absent / overdue / danger ─────────────────────
        // Strong unambiguous red. Not pink, not tomato.
        // flame-500 on white: 4.84:1 ✓ WCAG AA
        flame: {
          50:  "#FFF1F2",
          100: "#FFE4E6",
          500: "#DC2626", // icons, borders, buttons
          700: "#B91C1C", // text on white ✓
        },

        // ── Sky — info / neutral notice ───────────────────────────────────
        // The only cool color. Provides visual relief vs warm palette.
        // sky-500 on white: 4.52:1 ✓ WCAG AA
        sky: {
          50:  "#EFF9FF",
          500: "#0284C7",
          700: "#0369A1",
        },
      },

      borderRadius: {
        sm:   "4px",
        md:   "8px",
        lg:   "12px",
        xl:   "16px",
        full: "9999px",
      },

      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,0.05)",
        md: "0 4px 6px -1px rgba(0,0,0,0.07)",
        lg: "0 10px 15px -3px rgba(0,0,0,0.08)",
        xl: "0 20px 25px -5px rgba(0,0,0,0.10)",
      },

      fontSize: {
        // Zenzo type scale — min 13px (legibility on mid-range Android)
        display: ["32px", { lineHeight: "40px", fontWeight: "700" }],
        h1:      ["24px", { lineHeight: "32px", fontWeight: "700" }],
        h2:      ["20px", { lineHeight: "28px", fontWeight: "600" }],
        h3:      ["16px", { lineHeight: "24px", fontWeight: "600" }],
        body:    ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "body-sm": ["13px", { lineHeight: "18px", fontWeight: "400" }],
        caption: ["12px", { lineHeight: "16px", fontWeight: "400" }],
        label:   ["12px", { lineHeight: "16px", fontWeight: "500" }],
        mono:    ["13px", { lineHeight: "18px", fontWeight: "400" }],
      },

      spacing: {
        // 4px base unit — all spacing is multiples of 4
        "0":  "0px",
        "1":  "4px",
        "2":  "8px",
        "3":  "12px",
        "4":  "16px",
        "5":  "20px",
        "6":  "24px",
        "8":  "32px",
        "10": "40px",
        "12": "48px",
        "16": "64px",
      },

      maxWidth: {
        content: "1200px", // max page content width (centered on desktop)
        portal:  "480px",  // member portal — always mobile-width
      },

      screens: {
        // Mobile-first breakpoints
        // mobile: default (< 768px)
        md: "768px",   // tablet
        lg: "1024px",  // desktop
      },

      transitionDuration: {
        fast:     "100ms",
        standard: "150ms",
        medium:   "200ms",
        slow:     "250ms",
      },

      transitionTimingFunction: {
        "ease-decelerate": "cubic-bezier(0, 0, 0.2, 1)",
        "ease-standard":   "cubic-bezier(0.4, 0, 0.2, 1)",
      },

      zIndex: {
        dropdown: "50",
        sticky:   "40",
        topbar:   "40",
        overlay:  "60",
        modal:    "70",
        toast:    "80",
      },
    },
  },
  plugins: [],
};

export default config;

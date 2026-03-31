import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes safely.
 * clsx handles conditionals. twMerge resolves conflicts (bg-red + bg-blue → bg-blue).
 * Every component uses this — never raw string concatenation.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

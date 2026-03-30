// Utility
export { cn } from "./lib/cn";

// ─── Atoms ────────────────────────────────────────────────────────────────────
export { Avatar }       from "./components/avatar";
export { Badge }        from "./components/badge";
export { Button }       from "./components/button";
export { FilterChip }   from "./components/filter-chip";
export { IconButton }   from "./components/icon-button";
export { Input }        from "./components/input";
export { SearchInput }  from "./components/search-input";

// ─── Molecules ────────────────────────────────────────────────────────────────
export { FormField }    from "./components/form-field";

// ─── Compound (Radix-based) ───────────────────────────────────────────────────

// Dialog — modal overlay
export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogFooter,
} from "./components/dialog";

// DropdownMenu — contextual action menus
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuRadioGroup,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "./components/dropdown-menu";

// Select — single-value dropdown
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectLabel,
} from "./components/select";

// Tabs — horizontal tab navigation
export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "./components/tabs";

// Toast — ephemeral feedback messages ("Saved.", "Couldn't save.")
export {
  Toaster,
  useToast,
} from "./components/toast";

// Sheet — bottom sheet (mobile) / side panel (desktop)
export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  SheetFooter,
} from "./components/sheet";

// ─── Types ────────────────────────────────────────────────────────────────────
export type { AvatarProps }      from "./components/avatar";
export type { BadgeProps }       from "./components/badge";
export type { ButtonProps }      from "./components/button";
export type { FilterChipProps }  from "./components/filter-chip";
export type { IconButtonProps }  from "./components/icon-button";
export type { InputProps }       from "./components/input";
export type { SearchInputProps } from "./components/search-input";
export type { FormFieldProps }   from "./components/form-field";

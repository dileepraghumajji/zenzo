"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { createBrowserClient } from "@supabase/ssr";
import { INTEREST_CATEGORIES, RESERVED_USERNAMES } from "@zenzo/database/enums";
import type { Database } from "@zenzo/database";
import { Button, FormField, Input, useToast } from "@zenzo/ui";
import { cn } from "@zenzo/ui";
import { Camera, Check, X, Sun, Moon, Monitor, Loader2 } from "lucide-react";

const CITIES = [
  "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Ahmedabad", "Chennai",
  "Kolkata", "Surat", "Pune", "Jaipur", "Lucknow", "Kanpur", "Nagpur",
  "Indore", "Thane", "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad",
  "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik",
  "Faridabad", "Meerut", "Rajkot", "Kalyan-Dombivli", "Vasai-Virar",
  "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar",
  "Navi Mumbai", "Allahabad", "Ranchi", "Howrah", "Coimbatore",
  "Jabalpur", "Gwalior", "Vijayawada", "Jodhpur", "Madurai", "Raipur",
  "Kota", "Chandigarh", "Guwahati", "Solapur",
];

const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;

interface ProfileData {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  bio: string | null;
  username: string | null;
  avatar_url: string | null;
  city: string | null;
  interests: string[];
}

interface UsernameState {
  checking: boolean;
  available: boolean | null;
  reason: string | null;
}

const THEME_OPTIONS = [
  { value: "light",  label: "Light",  Icon: Sun     },
  { value: "dark",   label: "Dark",   Icon: Moon    },
  { value: "system", label: "System", Icon: Monitor },
] as const;

export function ProfileForm({ profile }: { profile: ProfileData }) {
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [username, setUsername] = useState(profile.username ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(
    new Set(profile.interests)
  );

  const [saving, setSaving] = useState(false);
  const [usernameState, setUsernameState] = useState<UsernameState>({
    checking: false,
    available: null,
    reason: null,
  });
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function toggleInterest(slug: string) {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  const checkUsername = useCallback((value: string) => {
    if (usernameTimer.current) clearTimeout(usernameTimer.current);

    if (!value) {
      setUsernameState({ checking: false, available: null, reason: null });
      return;
    }

    if (!USERNAME_REGEX.test(value)) {
      setUsernameState({ checking: false, available: false, reason: "invalid_format" });
      return;
    }

    if ((RESERVED_USERNAMES as readonly string[]).includes(value)) {
      setUsernameState({ checking: false, available: false, reason: "reserved" });
      return;
    }

    if (value === profile.username) {
      setUsernameState({ checking: false, available: true, reason: null });
      return;
    }

    setUsernameState({ checking: true, available: null, reason: null });
    usernameTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/profile/check-username?u=${encodeURIComponent(value)}`);
        const json = await res.json() as { available: boolean; reason?: string };
        setUsernameState({
          checking: false,
          available: json.available,
          reason: json.reason ?? null,
        });
      } catch {
        setUsernameState({ checking: false, available: null, reason: null });
      }
    }, 400);
  }, [profile.username]);

  function handleAvatarSelect(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPEG, PNG, or WebP allowed");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (usernameState.available === false) {
      toast.error("Fix username before saving");
      return;
    }

    setSaving(true);
    try {
      let finalAvatarUrl = avatarUrl;
      if (pendingFile) {
        const supabase = createBrowserClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const ext = pendingFile.name.split(".").pop() ?? "jpg";
        const path = `avatars/${profile.id}.${ext}`;
        const { error } = await supabase.storage
          .from("user-avatars")
          .upload(path, pendingFile, { upsert: true, contentType: pendingFile.type });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from("user-avatars").getPublicUrl(path);
        finalAvatarUrl = publicUrl;
        setAvatarUrl(publicUrl);
        setPendingFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl("");
      }

      const [profileRes] = await Promise.all([
        fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: fullName,
            phone,
            bio: bio || null,
            username: username || null,
            avatar_url: finalAvatarUrl || null,
            city: city || null,
          }),
        }),
        fetch("/api/users/interests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slugs: Array.from(selectedSlugs), city: city || undefined }),
        }),
      ]);

      if (!profileRes.ok) {
        const err = await profileRes.json() as { error?: string };
        if (err.error === "username_taken") {
          toast.error("That username is already taken");
          return;
        }
        throw new Error(err.error ?? "Failed to save");
      }

      toast.success("Profile saved");
      router.refresh();
    } catch {
      toast.error("Couldn't save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const initials = fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  const usernameHint =
    usernameState.checking ? "Checking…" :
    usernameState.available === true ? "Available" :
    usernameState.reason === "invalid_format" ? "3–30 chars, lowercase letters, numbers, underscores only" :
    usernameState.reason === "reserved" ? "That username is reserved" :
    usernameState.reason === "taken" ? "Already taken" :
    null;

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-h1 font-bold text-heading">Your profile</h1>
        <p className="text-body text-muted mt-1">How others see you on Zenzo</p>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={saving}
          className="relative group"
        >
          {(previewUrl || avatarUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl || avatarUrl}
              alt="Avatar"
              className="size-20 rounded-full object-cover border-2 border-border"
            />
          ) : (
            <div className="size-20 rounded-full bg-primary flex items-center justify-center text-h2 font-bold text-primary-foreground">
              {initials}
            </div>
          )}
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="size-5 text-white" />
          </div>
        </button>
        <p className="text-caption text-muted">Tap to change photo</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleAvatarSelect(file);
          }}
        />
      </div>

      {/* Form fields */}
      <div className="space-y-4">
        <FormField label="Full name" htmlFor="full_name">
          <Input
            id="full_name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
          />
        </FormField>

        <FormField label="Phone" htmlFor="phone">
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="10-digit mobile number"
          />
        </FormField>

        <FormField label="Email" htmlFor="email">
          <Input id="email" value={profile.email} disabled />
        </FormField>

        <div className="space-y-1">
          <FormField label="Username" htmlFor="username">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-body select-none">@</span>
              <Input
                id="username"
                value={username}
                onChange={(e) => {
                  const v = e.target.value.toLowerCase();
                  setUsername(v);
                  checkUsername(v);
                }}
                className="pl-7"
                placeholder="your_username"
              />
              {username && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameState.checking && <Loader2 className="size-4 text-muted animate-spin" />}
                  {!usernameState.checking && usernameState.available === true && (
                    <Check className="size-4 text-success-foreground" />
                  )}
                  {!usernameState.checking && usernameState.available === false && (
                    <X className="size-4 text-error-foreground" />
                  )}
                </div>
              )}
            </div>
          </FormField>
          {usernameHint && (
            <p className={cn(
              "text-caption pl-1",
              usernameState.available === true ? "text-success-foreground" : "text-error-foreground"
            )}>
              {usernameHint}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <FormField label="Bio" htmlFor="bio">
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 160))}
              rows={3}
              placeholder="A short intro about yourself"
              className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-body text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
            />
          </FormField>
          <p className={cn("text-caption pl-1 text-right", bio.length >= 160 ? "text-error-foreground" : "text-muted")}>
            {bio.length}/160
          </p>
        </div>

        <FormField label="City" htmlFor="city">
          <Input
            id="city"
            list="profile-cities-list"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Hyderabad"
          />
          <datalist id="profile-cities-list">
            {CITIES.map((c) => <option key={c} value={c} />)}
          </datalist>
        </FormField>
      </div>

      {/* Interests */}
      <div className="space-y-3">
        <p className="text-label font-medium text-heading">Interests</p>
        <div className="grid grid-cols-4 gap-2">
          {INTEREST_CATEGORIES.map((cat) => {
            const selected = selectedSlugs.has(cat.slug);
            return (
              <button
                key={cat.slug}
                onClick={() => toggleInterest(cat.slug)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                  selected
                    ? "border-brand bg-surface-raised"
                    : "border-transparent bg-surface-raised hover:border-border"
                )}
              >
                <span className="text-xl">{cat.icon}</span>
                <span className={cn("text-[10px] font-medium leading-tight text-center", selected ? "text-foreground" : "text-muted")}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Appearance */}
      <div className="space-y-3">
        <p className="text-label font-medium text-heading">Appearance</p>
        <div className="grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map(({ value, label, Icon }) => {
            const active = theme === value;
            return (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                  active
                    ? "border-brand bg-surface-raised"
                    : "border-transparent bg-surface-raised hover:border-border"
                )}
              >
                <Icon className={cn("size-5", active ? "text-brand" : "text-muted")} />
                <span className={cn("text-[10px] font-medium", active ? "text-foreground" : "text-muted")}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Button fullWidth size="lg" onClick={handleSave} loading={saving} disabled={saving}>
        Save profile
      </Button>
    </div>
  );
}

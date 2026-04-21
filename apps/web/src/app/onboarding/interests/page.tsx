"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { INTEREST_CATEGORIES } from "@zenzo/database";
import type { Database } from "@zenzo/database";
import { Button, FormField, Input, useToast } from "@zenzo/ui";

const CITIES = [
  "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Ahmedabad", "Chennai",
  "Kolkata", "Surat", "Pune", "Jaipur", "Lucknow", "Kanpur", "Nagpur",
  "Indore", "Thane", "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad",
  "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik",
  "Faridabad", "Meerut", "Rajkot", "Kalyan-Dombivli", "Vasai-Virar",
  "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar",
  "Navi Mumbai", "Allahabad", "Ranchi", "Howrah", "Coimbatore",
  "Jabalpur", "Gwalior", "Vijayawada", "Jodhpur", "Madurai", "Raipur",
  "Kota", "Chandigarh", "Guwahati", "Solapur"
];

export default function InterestsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [city, setCity] = useState("");

  useEffect(() => {
    // Check auth and prefill if backing from discover
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      
      const [interestsRes, userRes] = await Promise.all([
        supabase.from("user_interests").select("slug").eq("user_id", user.id),
        supabase.from("users").select("city").eq("id", user.id).single()
      ]);
      
      if (interestsRes.data && interestsRes.data.length > 0) {
        setSelectedSlugs(new Set(interestsRes.data.map((i) => i.slug)));
      }
      if (userRes.data?.city) {
        setCity(userRes.data.city);
      }
      
      setLoading(false);
    })();
  }, [router]);

  function toggleInterest(slug: string) {
    setSelectedSlugs(prev => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }

  async function handleSubmit() {
    if (selectedSlugs.size === 0) return;
    setSaving(true);
    
    try {
      const res = await fetch("/api/users/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slugs: Array.from(selectedSlugs),
          city: city.trim() || undefined
        })
      });
      
      if (!res.ok) {
        throw new Error("Failed to save");
      }
      
      router.push("/portal");
      router.refresh();
    } catch {
      toast.error("Couldn't save interests. Please try again.");
      setSaving(false);
    }
  }

  async function handleSkip() {
    setSaving(true);
    try {
      const supabase = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
         await supabase.from("users").update({ onboarding_step: "interests_skipped" }).eq("id", user.id);
      }

      router.push("/portal");
      router.refresh();
    } catch {
      toast.error("Couldn't skip. Please try again.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-subtle flex items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-8 animate-pulse">
          <div className="h-12 w-64 bg-surface-raised rounded mx-auto" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-28 bg-surface-raised rounded-xl" />
            ))}
          </div>
          <div className="h-14 bg-surface-raised rounded mt-8" />
          <div className="h-12 bg-surface-raised rounded mt-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-surface-subtle flex flex-col items-center justify-center p-6 sm:p-8">
      {/* Background Glow */}
      <div 
        className="pointer-events-none absolute top-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full opacity-50 blur-[100px] hidden md:block" 
        style={{ background: "radial-gradient(circle, var(--brand) 0%, transparent 70%)" }}
        aria-hidden="true" 
      />

      <div className="relative w-full max-w-lg">
        <div className="text-center mb-10">
          <h1 className="text-display text-heading mb-2">What are you into?</h1>
          <p className="text-body text-muted">We&apos;ll show you clubs that match.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {INTEREST_CATEGORIES.map((cat) => {
            const isSelected = selectedSlugs.has(cat.slug);
            return (
              <button
                key={cat.slug}
                onClick={() => toggleInterest(cat.slug)}
                className={[
                  "flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all duration-medium outline-none",
                  isSelected
                    ? "border-brand bg-surface-raised shadow-md"
                    : "border-transparent bg-surface-raised hover:bg-surface-elevated hover:border-border-strong",
                  "focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                ].join(" ")}
              >
                <div className={["size-12 rounded-full flex items-center justify-center text-2xl mb-1", cat.color].join(" ")}>
                  {cat.icon}
                </div>
                <span className={["font-medium text-sm", isSelected ? "text-foreground" : "text-muted"].join(" ")}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="bg-surface-raised rounded-xl p-5 mb-8 border border-border shadow-sm">
          <FormField label="Where are you based?" htmlFor="city">
            <Input
              id="city"
              list="cities-list"
              placeholder="e.g. Hyderabad"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <datalist id="cities-list">
              {CITIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </FormField>
        </div>

        <div className="space-y-4">
          <Button 
            fullWidth 
            size="lg" 
            onClick={handleSubmit} 
            disabled={selectedSlugs.size === 0 || saving}
            loading={saving}
          >
            Let&apos;s go &rarr;
          </Button>
          
          <button 
            className="w-full text-center text-sm font-medium text-muted hover:text-foreground transition-colors disabled:opacity-50"
            onClick={handleSkip}
            disabled={saving}
          >
            Skip for now &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@zenzo/ui";

const RADIUS_OPTIONS = [
  { value: 1,  label: "1km" },
  { value: 3,  label: "3km" },
  { value: 5,  label: "5km" },
  { value: 10, label: "10km" },
];

interface NearMeButtonProps {
  onGeoSuccess: (lat: number, lng: number, radius: number) => void;
  onGeoClear: () => void;
  active?: boolean;
}

export function NearMeButton({ onGeoSuccess, onGeoClear, active }: NearMeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(5);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (active && coords) {
      setCoords(null);
      setError(null);
      onGeoClear();
      return;
    }
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        setLoading(false);
        onGeoSuccess(lat, lng, radius);
      },
      () => {
        setLoading(false);
        setError("Location permission denied. Please allow location access.");
      }
    );
  }

  function handleRadiusChange(r: number) {
    setRadius(r);
    if (coords) onGeoSuccess(coords.lat, coords.lng, r);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={handleClick}
        disabled={loading}
        aria-label={
          loading
            ? "Getting your location..."
            : active
            ? "Disable location search"
            : "Search near my location"
        }
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-caption font-medium border transition-all",
          active
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-surface-raised border-border text-muted hover:border-brand/40 hover:text-heading",
          loading && "opacity-70 cursor-not-allowed"
        )}
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <MapPin className={cn("size-3.5", active && "animate-pulse")} />
        )}
        Near Me
      </button>

      {active && coords && (
        <div className="flex gap-1.5">
          {RADIUS_OPTIONS.map((r) => (
            <button
              key={r.value}
              onClick={() => handleRadiusChange(r.value)}
              className={cn(
                "px-2.5 py-1 rounded-full text-label font-medium border transition-all active:scale-95",
                radius === r.value
                  ? "bg-surface-brand border-brand/40 text-brand"
                  : "bg-surface-raised border-border text-muted hover:border-brand/30"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="text-caption text-red-500 mt-1 w-full">{error}</p>
      )}
    </div>
  );
}

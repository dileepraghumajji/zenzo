"use client";

// Leaflet is browser-only. This file is ALWAYS loaded via dynamic({ ssr: false }).
// Top-level imports are safe here — they never run on the server.
import "leaflet/dist/leaflet.css";
import * as L from "leaflet";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import { useEffect, useRef } from "react";
import type { ClubSearchResult } from "./types";

const DEFAULT_CENTER: [number, number] = [17.6868, 83.2185]; // Visakhapatnam
const DEFAULT_ZOOM = 12;

const CATEGORY_COLORS: Record<string, string> = {
  gym:          "#2563eb",
  yoga:         "#16a34a",
  martial_arts: "#dc2626",
  dance:        "#9333ea",
  other:        "#78716c",
};

function pinHtml(color: string): string {
  return `<div style="width:14px;height:14px;background:${color};border-radius:50%;border:2.5px solid white;box-shadow:0 1px 6px rgba(0,0,0,0.4)"></div>`;
}

function popupHtml(club: ClubSearchResult): string {
  const img = club.cover_image_url
    ? `<img src="${club.cover_image_url}" alt="" style="width:100%;height:88px;object-fit:cover;display:block" loading="lazy">`
    : `<div style="width:100%;height:44px;background:#f5f4f0"></div>`;

  const area = club.area
    ? `<p style="font-size:11px;color:#78716c;margin:2px 0 0">${club.area}${club.city ? `, ${club.city}` : ""}</p>`
    : "";

  const rating = club.avg_rating
    ? `<p style="font-size:11px;color:#92400e;margin:3px 0 0">★ ${club.avg_rating.toFixed(1)}${club.review_count ? ` · ${club.review_count} reviews` : ""}</p>`
    : "";

  return (
    `<div style="width:200px;font-family:system-ui;overflow:hidden">` +
    img +
    `<div style="padding:8px 10px 10px">` +
    `<strong style="font-size:13px;display:block;margin-bottom:1px">${club.name}</strong>` +
    area +
    rating +
    `<a href="/clubs/${club.slug}" style="display:inline-block;margin-top:7px;font-size:12px;color:#c84a08;font-weight:600;text-decoration:none">View details →</a>` +
    `</div></div>`
  );
}

export interface SearchMapProps {
  clubs: ClubSearchResult[];
  geo?: { lat: number; lng: number };
  className?: string;
}

export function SearchMap({ clubs, geo, className = "" }: SearchMapProps) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<LeafletMap | null>(null);
  const layerRef      = useRef<LayerGroup | null>(null);
  const interactedRef = useRef(false);

  // ── Initialize map once ────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: [number, number] = geo
      ? [geo.lat, geo.lng]
      : DEFAULT_CENTER;

    const map = L.map(containerRef.current, { center, zoom: DEFAULT_ZOOM });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Track manual interaction so auto-fit doesn't fight the user
    map.on("movestart zoomstart", () => { interactedRef.current = true; });

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current   = map;

    return () => {
      map.remove();
      mapRef.current  = null;
      layerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync markers when clubs list changes ───────────────────────────────────
  useEffect(() => {
    const map   = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    const plotted = clubs.filter((c) => c.location !== null);

    for (const club of plotted) {
      const { lat, lng } = club.location!;
      const color = CATEGORY_COLORS[club.business_type] ?? "#78716c";

      const icon = L.divIcon({
        html:       pinHtml(color),
        iconSize:   [14, 14],
        iconAnchor: [7, 7],
        className:  "",
      });

      L.marker([lat, lng], { icon })
        .addTo(layer)
        .bindPopup(popupHtml(club), { maxWidth: 220, minWidth: 200 });
    }

    // Auto-fit bounds on first paint (never after the user pans/zooms manually)
    if (plotted.length > 0 && !interactedRef.current) {
      const latlngs = plotted.map(
        (c) => [c.location!.lat, c.location!.lng] as [number, number]
      );
      try {
        map.fitBounds(latlngs, { padding: [40, 40], maxZoom: 14 });
      } catch {
        // single-point or degenerate bounds — ignore
      }
    }
  }, [clubs]);

  // ── Fly to new geo location when "Near Me" is enabled ─────────────────────
  useEffect(() => {
    if (!mapRef.current || !geo) return;
    mapRef.current.flyTo([geo.lat, geo.lng], 13, { duration: 1 });
    interactedRef.current = false; // allow auto-fit after relocation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo?.lat, geo?.lng]);

  return <div ref={containerRef} className={className} />;
}

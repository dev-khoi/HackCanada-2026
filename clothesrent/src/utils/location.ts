export interface NominatimAddress {
  house_number?: string;
  road?: string;
  postcode?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  country?: string;
}

export function formatSimpleAddress(address?: NominatimAddress): string {
  if (!address) return "";
  const street = [address.house_number, address.road].filter(Boolean).join(" ").trim();
  const postal = address.postcode?.trim() ?? "";
  const city = (address.city || address.town || address.village || address.county || address.state || "").trim();
  const country = (address.country || "").trim();
  return [street, postal, city, country].filter(Boolean).join(", ");
}

export async function geocodeAddressToCoords(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(trimmed)}`,
    );
    if (!response.ok) return null;
    const data = (await response.json()) as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;
    const lat = Number(data[0].lat);
    const lng = Number(data[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

export async function reverseGeocodeToSimpleAddress(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${encodeURIComponent(
        String(latitude),
      )}&lon=${encodeURIComponent(String(longitude))}`,
    );
    if (!response.ok) return null;
    const data = (await response.json()) as {
      display_name?: string;
      address?: NominatimAddress;
    };
    const simple = formatSimpleAddress(data.address);
    return simple || data.display_name || null;
  } catch {
    return null;
  }
}

// ─── Haversine distance ──────────────────────────────────────────────────────

/** Great-circle distance between two GPS coordinates in kilometres. */
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Formats a km value as a human-readable distance string. */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}

// ─── React hooks ─────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";

export interface UserCoords {
  lat: number;
  lng: number;
}

const COORD_CACHE_KEY = "user_coords_v1";

/**
 * Returns the user's current GPS position (or null if denied / unavailable).
 * Caches in sessionStorage so we only prompt once per session.
 */
export function useUserLocation(): UserCoords | null {
  const [coords, setCoords] = useState<UserCoords | null>(() => {
    try {
      const raw = sessionStorage.getItem(COORD_CACHE_KEY);
      return raw ? (JSON.parse(raw) as UserCoords) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (coords) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c: UserCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        try { sessionStorage.setItem(COORD_CACHE_KEY, JSON.stringify(c)); } catch { /* ignore */ }
      },
      () => { /* denied – stay null */ },
      { maximumAge: 300_000, timeout: 8000 },
    );
  }, [coords]);

  return coords;
}

export type DistanceResult =
  | { status: "loading" }
  | { status: "ok"; km: number; label: string }
  | { status: "unavailable" };

/**
 * Calculates the approximate distance from the user to a listing's address.
 * Geocodes the address via Nominatim and runs a haversine calculation.
 */
export function useListingDistance(listingAddress: string | undefined): DistanceResult {
  const userCoords = useUserLocation();
  const [result, setResult] = useState<DistanceResult>({ status: "loading" });

  useEffect(() => {
    if (!navigator.geolocation) {
      setResult({ status: "unavailable" });
      return;
    }
    if (!listingAddress) {
      setResult({ status: "unavailable" });
      return;
    }
    if (!userCoords) return; // waiting for GPS

    let cancelled = false;
    setResult({ status: "loading" });

    geocodeAddressToCoords(listingAddress).then((listing) => {
      if (cancelled) return;
      if (!listing) { setResult({ status: "unavailable" }); return; }
      const km = haversineKm(userCoords.lat, userCoords.lng, listing.lat, listing.lng);
      setResult({ status: "ok", km, label: formatDistance(km) });
    });

    return () => { cancelled = true; };
  }, [listingAddress, userCoords]);

  return result;
}

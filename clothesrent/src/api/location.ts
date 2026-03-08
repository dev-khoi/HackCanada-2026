import { API_BASE_URL } from "./client";

export interface LocationSuggestion {
  id: string;
  label: string;
}

export async function fetchLocationSuggestions(
  query: string,
): Promise<LocationSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const res = await fetch(
    `${API_BASE_URL}/api/location/suggest?q=${encodeURIComponent(trimmed)}`,
  );
  if (!res.ok) return [];

  const data = (await res.json()) as { suggestions?: string[] };
  const suggestions = data.suggestions ?? [];
  return suggestions.map((label, index) => ({
    id: `backend-${index}-${label}`,
    label,
  }));
}

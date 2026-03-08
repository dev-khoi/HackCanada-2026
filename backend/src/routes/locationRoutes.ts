import { Router, Request, Response } from "express";

type NominatimAddress = {
  house_number?: string;
  road?: string;
  postcode?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  country?: string;
};

function formatSimpleAddress(address?: NominatimAddress): string {
  if (!address) return "";
  const street = [address.house_number, address.road]
    .filter(Boolean)
    .join(" ")
    .trim();
  const postal = address.postcode?.trim() ?? "";
  const city =
    (
      address.city ||
      address.town ||
      address.village ||
      address.county ||
      address.state ||
      ""
    ).trim();
  const country = (address.country || "").trim();
  return [street, postal, city, country].filter(Boolean).join(", ");
}

async function fetchNominatimSuggestions(query: string): Promise<string[]> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=${encodeURIComponent(
      query,
    )}`,
    {
      headers: {
        "User-Agent": "clothesrent-location-proxy/1.0",
        Accept: "application/json",
      },
    },
  );
  if (!res.ok) return [];

  const data = (await res.json()) as Array<{
    display_name: string;
    address?: NominatimAddress;
  }>;
  return data
    .map((entry) => formatSimpleAddress(entry.address) || entry.display_name)
    .filter(Boolean);
}

async function fetchPhotonSuggestions(query: string): Promise<string[]> {
  const res = await fetch(
    `https://photon.komoot.io/api/?limit=5&q=${encodeURIComponent(query)}`,
    {
      headers: {
        "User-Agent": "clothesrent-location-proxy/1.0",
        Accept: "application/json",
      },
    },
  );
  if (!res.ok) return [];

  const data = (await res.json()) as {
    features?: Array<{
      properties?: {
        name?: string;
        street?: string;
        housenumber?: string;
        postcode?: string;
        city?: string;
        country?: string;
      };
    }>;
  };

  const features = data.features ?? [];
  return features
    .map((feature) => {
      const p = feature.properties ?? {};
      const street = [p.street || p.name, p.housenumber]
        .filter(Boolean)
        .join(" ")
        .trim();
      return [street, p.postcode, p.city, p.country]
        .filter((part) => Boolean(part && part.trim()))
        .join(", ");
    })
    .filter(Boolean);
}

const router = Router();

router.get("/suggest", async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || "").trim();
    if (q.length < 3) {
      res.json({ suggestions: [] });
      return;
    }

    const fromNominatim = await fetchNominatimSuggestions(q);
    const suggestions = fromNominatim.length
      ? fromNominatim
      : await fetchPhotonSuggestions(q);

    const deduped = suggestions.filter(
      (item, index, all) => all.findIndex((other) => other === item) === index,
    );
    res.json({ suggestions: deduped.slice(0, 5) });
  } catch {
    res.json({ suggestions: [] });
  }
});

router.get("/geocode", async (req: Request, res: Response) => {
  const q = String(req.query.q ?? "").trim();
  if (!q) { res.status(400).json({ error: "q is required" }); return; }

  if (geocodeCache.has(q)) {
    res.json(geocodeCache.get(q) ?? null);
    return;
  }

  try {
    // Try Photon first (no rate limits), fall back to Nominatim
    const coords = await geocodeWithPhoton(q) ?? await geocodeWithNominatim(q);

    if (geocodeCache.size >= MAX_GEOCODE_CACHE) {
      geocodeCache.delete(geocodeCache.keys().next().value as string);
    }
    geocodeCache.set(q, coords);
    res.json(coords);
  } catch {
    res.status(502).json(null);
  }
});


export default router;

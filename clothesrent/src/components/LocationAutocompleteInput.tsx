import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import "./locationAutocompleteInput.css";
import { formatSimpleAddress, type NominatimAddress } from "../utils/location";
import { fetchLocationSuggestions } from "../api/location";

type Suggestion = {
  id: string;
  label: string;
};

interface Props {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  inputClassName?: string;
}

function toSimplifiedAddress(entry: {
  display_name: string;
  address?: NominatimAddress;
}): string {
  const main = formatSimpleAddress(entry.address);
  return main || entry.display_name;
}

async function fetchNominatimSuggestions(
  query: string,
  signal: AbortSignal,
): Promise<Suggestion[]> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`,
    { signal },
  );
  if (!response.ok) return [];

  const data = (await response.json()) as Array<{
    place_id: number;
    display_name: string;
    address?: NominatimAddress;
  }>;
  const nextSuggestions = data.map((entry) => ({
    id: `nominatim-${entry.place_id}`,
    label: toSimplifiedAddress(entry),
  }));
  return nextSuggestions.filter(
    (item, index, all) =>
      all.findIndex((other) => other.label === item.label) === index,
  );
}

async function fetchPhotonSuggestions(
  query: string,
  signal: AbortSignal,
): Promise<Suggestion[]> {
  const response = await fetch(
    `https://photon.komoot.io/api/?limit=5&q=${encodeURIComponent(query)}`,
    { signal },
  );
  if (!response.ok) return [];

  const data = (await response.json()) as {
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
  const suggestions = features
    .map((feature, index) => {
      const p = feature.properties ?? {};
      const street = [p.street || p.name, p.housenumber].filter(Boolean).join(" ").trim();
      const label = [street, p.postcode, p.city, p.country]
        .filter((part) => Boolean(part && part.trim()))
        .join(", ");
      return {
        id: `photon-${index}-${label}`,
        label,
      };
    })
    .filter((entry) => entry.label.length > 0);

  return suggestions.filter(
    (item, index, all) =>
      all.findIndex((other) => other.label === item.label) === index,
  );
}

export default function LocationAutocompleteInput({
  id,
  value,
  onChange,
  placeholder,
  required = false,
  inputClassName,
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const trimmed = useMemo(() => value.trim(), [value]);

  useEffect(() => {
    const query = trimmed;
    if (query.length < 3) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const fromBackend = await fetchLocationSuggestions(query);
        if (fromBackend.length > 0) {
          setSuggestions(fromBackend);
          return;
        }

        const fromNominatim = await fetchNominatimSuggestions(query, controller.signal);
        if (fromNominatim.length > 0) {
          setSuggestions(fromNominatim);
          return;
        }

        const fromPhoton = await fetchPhotonSuggestions(query, controller.signal);
        setSuggestions(fromPhoton);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [trimmed]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
    setIsOpen(true);
  };

  return (
    <div className="location-autocomplete">
      <input
        id={id}
        type="text"
        className={inputClassName}
        placeholder={placeholder}
        value={value}
        required={required}
        autoComplete="off"
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setIsOpen(false), 120);
        }}
        onChange={handleInputChange}
      />

      {isOpen && (isLoading || suggestions.length > 0) && (
        <div className="location-autocomplete-menu">
          {isLoading && (
            <div className="location-autocomplete-row">Searching...</div>
          )}
          {!isLoading &&
            suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                className="location-autocomplete-row location-autocomplete-option"
                onClick={() => {
                  onChange(suggestion.label);
                  setIsOpen(false);
                }}>
                {suggestion.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

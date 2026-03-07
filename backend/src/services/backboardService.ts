const BACKBOARD_BASE = "https://app.backboard.io/api";
const BACKBOARD_API_KEY = process.env.BACKBOARD_API_KEY || "";

let cachedAssistantId: string | null = null;

async function bbFetch(
  method: string,
  endpoint: string,
  body?: unknown
): Promise<any> {
  const res = await fetch(`${BACKBOARD_BASE}/${endpoint}`, {
    method,
    headers: {
      "X-API-Key": BACKBOARD_API_KEY,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backboard ${method} /${endpoint} failed (${res.status}): ${text}`);
  }
  return res.json();
}

/**
 * Create (or retrieve cached) fashion-matching assistant.
 */
async function getOrCreateAssistant(): Promise<string> {
  if (cachedAssistantId) return cachedAssistantId;

  // Try to find an existing assistant named "FashionMatcher"
  const assistants: any[] = await bbFetch("GET", "assistants");
  const existing = (Array.isArray(assistants) ? assistants : []).find(
    (a: any) => a.name === "FashionMatcher"
  );
  if (existing) {
    cachedAssistantId = existing.assistantId ?? existing.assistant_id;
    return cachedAssistantId!;
  }

  // Create a new one
  const created = await bbFetch("POST", "assistants", {
    name: "FashionMatcher",
    system_prompt:
      "You are a fashion recommendation engine. " +
      "Given a list of clothing descriptions from a user's uploaded images and a catalog of available listings, " +
      "return ONLY a valid JSON array of listing _id strings that best match the user's style. " +
      "Rank by relevance. Return at most 10 IDs. No extra text, just the JSON array.",
  });
  cachedAssistantId = created.assistantId ?? created.assistant_id;
  return cachedAssistantId!;
}

/**
 * Given Gemini descriptions and a catalog of listings,
 * ask Backboard to pick the best matching listing IDs.
 */
export async function recommendListings(
  descriptions: string[],
  listings: Array<{ _id: string; title: string; description: string; tags: string[] }>
): Promise<string[]> {
  if (!BACKBOARD_API_KEY || BACKBOARD_API_KEY === "your_backboard_api_key_here") {
    console.warn("BACKBOARD_API_KEY not set – falling back to keyword search");
    return fallbackKeywordMatch(descriptions, listings);
  }

  try {
    const assistantId = await getOrCreateAssistant();

    // Create a fresh thread for this request
    const thread = await bbFetch("POST", `assistants/${assistantId}/threads`);
    const threadId = thread.threadId ?? thread.thread_id;

    // Build the message
    const catalogSummary = listings
      .map((l) => `ID:${l._id} | ${l.title} | ${l.description} | tags:${l.tags.join(",")}`)
      .join("\n");

    const content =
      `User's clothing style (from uploaded images):\n${descriptions.map((d, i) => `${i + 1}. ${d}`).join("\n")}\n\n` +
      `Available listings:\n${catalogSummary}\n\n` +
      `Return a JSON array of the listing IDs that best match the user's style.`;

    const response = await bbFetch("POST", `threads/${threadId}/messages`, {
      content,
      stream: false,
    });

    const assistantContent: string = response.content || "";

    // Parse the JSON array of IDs from the response
    const match = assistantContent.match(/\[[\s\S]*?\]/);
    if (!match) return [];

    const ids: string[] = JSON.parse(match[0]);
    return ids.filter((id) => typeof id === "string");
  } catch (error: any) {
    console.error("Backboard recommend failed:", error?.message);
    return fallbackKeywordMatch(descriptions, listings);
  }
}

/**
 * Simple keyword overlap fallback when Backboard is unavailable.
 */
function fallbackKeywordMatch(
  descriptions: string[],
  listings: Array<{ _id: string; title: string; description: string; tags: string[] }>
): string[] {
  const keywords = descriptions
    .join(" ")
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2);

  const scored = listings.map((listing) => {
    const haystack = `${listing.title} ${listing.description} ${listing.tags.join(" ")}`.toLowerCase();
    const score = keywords.reduce((s, kw) => s + (haystack.includes(kw) ? 1 : 0), 0);
    return { id: listing._id, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((s) => s.id);
}

export async function searchByStyle(_query: string): Promise<string[]> {
  // Kept for backwards compatibility with searchListingsByStyle controller
  console.log("Backboard searchByStyle called");
  return [];
}

export async function generateBBLink(
  _imageUrl: string,
  _title: string,
  _description: string
): Promise<string | null> {
  console.log("Backboard generateBBLink called");
  return null;
}

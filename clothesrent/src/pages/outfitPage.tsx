import { useState, type FormEvent } from "react";
import { generateOutfit, type OutfitItem } from "../api/listings";
import { buildDisplayUrl } from "../utils/cloudinaryUrl";

const SLOT_LABELS: Record<string, string> = {
  top: "Top",
  bottom: "Bottom",
  outerwear: "Outerwear",
  shoes: "Shoes",
  accessory: "Accessory",
  dress: "Dress",
  fullbody: "Full Body",
  hat: "Hat",
  bag: "Bag",
};

export default function OutfitPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [outfitItems, setOutfitItems] = useState<OutfitItem[]>([]);
  const [stylistNote, setStylistNote] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");
    setOutfitItems([]);
    setStylistNote("");

    try {
      const result = await generateOutfit(trimmed);
      setOutfitItems(result.items);
      setStylistNote(result.stylistNote);
      setHasGenerated(true);
    } catch (err: any) {
      setError(err.message || "Failed to generate outfit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="outfit-page">
      <section className="outfit-hero">
        <div className="section-eyebrow">AI Wardrobe</div>
        <h1 className="font-display outfit-title">
          Describe your <em>look</em>
        </h1>
        <p className="outfit-subtitle">
          Tell us the vibe and we'll build a rentable outfit from real listings near you.
        </p>

        <form className="outfit-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="outfit-input"
            placeholder='e.g. "cozy winter date night in Toronto"'
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn-primary outfit-btn" disabled={loading || !prompt.trim()}>
            {loading ? "Styling..." : "Generate Outfit"}
          </button>
        </form>

        {error && <p className="outfit-error">{error}</p>}
      </section>

      {loading && (
        <section className="outfit-loading">
          <div className="outfit-spinner" />
          <p>Our AI stylist is putting together your look...</p>
        </section>
      )}

      {!loading && hasGenerated && outfitItems.length === 0 && (
        <section className="outfit-empty">
          <p>No matching items found. Try a different prompt or check back when more listings are available.</p>
        </section>
      )}

      {!loading && outfitItems.length > 0 && (
        <section className="outfit-result">
          {stylistNote && <p className="outfit-stylist-note">"{stylistNote}"</p>}

          <div className="outfit-grid">
            {outfitItems.map((item) => {
              const imgUrl = item.listing.cloudinaryUrl
                ? buildDisplayUrl(item.listing.cloudinaryUrl, {
                  width: 400,
                  height: 533,
                  removeBg: item.listing.transformations?.removeBg,
                  replaceBg: item.listing.transformations?.replaceBg ?? undefined,
                  badge: item.listing.transformations?.badge ?? undefined,
                  badgeColor: item.listing.transformations?.badgeColor,
                })
                : "";

              return (
                <a
                  key={item.listingId}
                  href={`/shop?highlight=${item.listingId}`}
                  className="outfit-card"
                >
                  <div className="outfit-card-slot">
                    {SLOT_LABELS[item.slot] || item.slot}
                  </div>
                  <div className="outfit-card-img-wrap">
                    {imgUrl ? (
                      <img src={imgUrl} alt={item.listing.title} className="outfit-card-img" />
                    ) : (
                      <div className="outfit-card-img-placeholder">No Image</div>
                    )}
                  </div>
                  <div className="outfit-card-body">
                    <div className="outfit-card-title">{item.listing.title}</div>
                    <div className="outfit-card-price">${item.listing.price}</div>
                    {item.listing.dailyRate > 0 && (
                      <div className="outfit-card-rate">${item.listing.dailyRate}/day</div>
                    )}
                    <div className="outfit-card-reason">{item.reason}</div>
                  </div>
                </a>
              );
            })}
          </div>

          <div className="outfit-total">
            Total rental:{" "}
            <strong>
              $
              {outfitItems
                .reduce((sum, i) => sum + (i.listing.dailyRate > 0 ? i.listing.dailyRate : i.listing.price), 0)
                .toFixed(2)}
              {outfitItems.some((i) => i.listing.dailyRate > 0) ? "/day" : ""}
            </strong>
          </div>
        </section>
      )}
    </main>
  );
}

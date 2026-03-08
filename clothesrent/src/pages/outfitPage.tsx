import { useState, useEffect, useRef, useCallback, type FormEvent } from "react";
import { generateOutfit, type OutfitItem } from "../api/listings";
import { buildDisplayUrl } from "../utils/cloudinaryUrl";
import { navigate } from "../utils/navigate";
import gsap from "gsap";

/* ─── Clothing conveyor belt ─── */
const CONVEYOR_WORDS = [
  "TOP", "DRESS", "BAG", "SHOE", "COAT", "HAT",
  "SCARF", "BELT", "SKIRT", "BOOT", "GLOVE", "RING",
];

function ClothingConveyor() {
  const words = [...CONVEYOR_WORDS, ...CONVEYOR_WORDS];
  return (
    <div className="outfit-conveyor-wrap" aria-hidden="true">
      <div className="outfit-conveyor">
        {words.map((w, i) => (
          <span key={i} className="outfit-conveyor-item">{w}</span>
        ))}
      </div>
    </div>
  );
}

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
  const [showCheckout, setShowCheckout] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Drag state
  const dragRef = useRef<{
    idx: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    hasMoved: boolean;
  } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");
    setOutfitItems([]);
    setStylistNote("");
    setShowCheckout(false);

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

  // Remove an item from the outfit
  const removeItem = useCallback((idx: number) => {
    const el = cardRefs.current[idx];
    if (el) {
      gsap.to(el, {
        scale: 0,
        opacity: 0,
        y: -30,
        duration: 0.35,
        ease: "back.in(1.8)",
        onComplete: () => {
          setOutfitItems((prev) => prev.filter((_, i) => i !== idx));
        },
      });
    } else {
      setOutfitItems((prev) => prev.filter((_, i) => i !== idx));
    }
  }, []);

  // GSAP entrance animation
  useEffect(() => {
    if (outfitItems.length === 0) return;

    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.fromTo(
        el,
        { y: 60, opacity: 0, scale: 0.85 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.7,
          delay: i * 0.1,
          ease: "power3.out",
        }
      );
    });
  }, [outfitItems]);

  // Drag to rearrange
  const onPointerDown = useCallback((idx: number, e: React.PointerEvent) => {
    const el = cardRefs.current[idx];
    if (!el) return;
    e.preventDefault();

    const rect = el.getBoundingClientRect();
    dragRef.current = {
      idx,
      startX: e.clientX,
      startY: e.clientY,
      origX: rect.left,
      origY: rect.top,
      hasMoved: false,
    };

    gsap.to(el, {
      scale: 1.06,
      boxShadow: "0 20px 50px rgba(37,31,51,0.22)",
      zIndex: 100,
      duration: 0.2,
    });
    el.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;

    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) d.hasMoved = true;

    const el = cardRefs.current[d.idx];
    if (el) {
      gsap.set(el, { x: dx, y: dy });
    }

    // Check for swap
    if (!gridRef.current) return;
    const cards = cardRefs.current;
    const dragEl = cards[d.idx];
    if (!dragEl) return;
    const dragRect = dragEl.getBoundingClientRect();
    const dragCX = dragRect.left + dragRect.width / 2;
    const dragCY = dragRect.top + dragRect.height / 2;

    for (let i = 0; i < cards.length; i++) {
      if (i === d.idx || !cards[i]) continue;
      const r = cards[i]!.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dist = Math.hypot(dragCX - cx, dragCY - cy);

      if (dist < 100) {
        // Swap items
        setOutfitItems((prev) => {
          const next = [...prev];
          [next[d.idx], next[i]] = [next[i], next[d.idx]];
          return next;
        });
        d.idx = i;
        d.startX = e.clientX;
        d.startY = e.clientY;
        gsap.set(dragEl, { x: 0, y: 0 });
        break;
      }
    }
  }, []);

  const onPointerUp = useCallback((_idx: number, e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;

    const el = cardRefs.current[d.idx];
    if (el) {
      gsap.to(el, {
        x: 0,
        y: 0,
        scale: 1,
        boxShadow: "0 6px 24px rgba(37,31,51,0.10)",
        zIndex: 1,
        duration: 0.35,
        ease: "power2.out",
      });
      el.releasePointerCapture(e.pointerId);
    }

    // Click navigation if didn't drag
    if (!d.hasMoved) {
      const item = outfitItems[d.idx];
      if (item) {
        navigate(`/listing/${item.listingId}`);
      }
    }

    dragRef.current = null;
  }, [outfitItems]);

  const totalPrice = outfitItems.reduce(
    (sum, i) => sum + (i.listing.dailyRate > 0 ? i.listing.dailyRate : i.listing.price),
    0
  );

  return (
    <main className="outfit-page">
      <section className="outfit-hero">
        <div className="section-eyebrow">AI Wardrobe</div>
        <h1 className="font-display outfit-title">
          Describe your <em className="outfit-look">look</em>
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

      <ClothingConveyor />

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

      {!loading && outfitItems.length > 0 && !showCheckout && (
        <section className="outfit-result">
          {stylistNote && <p className="outfit-stylist-note">"{stylistNote}"</p>}

          <div className="outfit-board" ref={gridRef}>
            {outfitItems.map((item, i) => {
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
                <div
                  key={`${item.listingId}-${i}`}
                  ref={(el) => { cardRefs.current[i] = el; }}
                  className="outfit-piece"
                  onPointerDown={(e) => onPointerDown(i, e)}
                  onPointerMove={onPointerMove}
                  onPointerUp={(e) => onPointerUp(i, e)}
                  style={{ touchAction: "none" }}
                >
                  <button
                    type="button"
                    className="outfit-piece-x"
                    onClick={(e) => { e.stopPropagation(); removeItem(i); }}
                    aria-label="Remove from outfit"
                  >
                    ×
                  </button>
                  <div className="outfit-piece-slot">
                    {SLOT_LABELS[item.slot] || item.slot}
                  </div>
                  <div className="outfit-piece-img-wrap">
                    {imgUrl ? (
                      <img src={imgUrl} alt={item.listing.title} className="outfit-piece-img" draggable={false} />
                    ) : (
                      <div className="outfit-piece-img-ph">No Image</div>
                    )}
                  </div>
                  <div className="outfit-piece-info">
                    <div className="outfit-piece-name">{item.listing.title}</div>
                    <div className="outfit-piece-price">
                      ${item.listing.dailyRate > 0 ? `${item.listing.dailyRate}/day` : item.listing.price}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="outfit-bottom-bar">
            <div className="outfit-total-label">
              {outfitItems.length} item{outfitItems.length !== 1 ? "s" : ""} · ${totalPrice.toFixed(2)}
              {outfitItems.some((i) => i.listing.dailyRate > 0) ? "/day" : ""}
            </div>
            <button
              type="button"
              className="btn-primary outfit-checkout-btn"
              onClick={() => setShowCheckout(true)}
            >
              Rent This Look
            </button>
          </div>
        </section>
      )}

      {/* ── Checkout View ── */}
      {showCheckout && outfitItems.length > 0 && (
        <section className="outfit-checkout">
          <button
            type="button"
            className="outfit-checkout-back"
            onClick={() => setShowCheckout(false)}
          >
            ← Back to Outfit
          </button>
          <h2 className="font-display outfit-checkout-title">Your Look</h2>
          <p className="outfit-checkout-subtitle">Review each item before renting.</p>

          <div className="outfit-checkout-list">
            {outfitItems.map((item) => {
              const imgUrl = item.listing.cloudinaryUrl
                ? buildDisplayUrl(item.listing.cloudinaryUrl, {
                  width: 300,
                  height: 400,
                  removeBg: item.listing.transformations?.removeBg,
                  replaceBg: item.listing.transformations?.replaceBg ?? undefined,
                })
                : "";

              return (
                <a
                  key={item.listingId}
                  href={`/listing/${item.listingId}`}
                  className="outfit-checkout-item"
                  onClick={(e) => { e.preventDefault(); navigate(`/listing/${item.listingId}`); }}
                >
                  <div className="outfit-checkout-img-wrap">
                    {imgUrl ? (
                      <img src={imgUrl} alt={item.listing.title} className="outfit-checkout-img" />
                    ) : (
                      <div className="outfit-checkout-img-ph">No Image</div>
                    )}
                  </div>
                  <div className="outfit-checkout-meta">
                    <div className="outfit-checkout-slot">
                      {SLOT_LABELS[item.slot] || item.slot}
                    </div>
                    <div className="outfit-checkout-name">{item.listing.title}</div>
                    <div className="outfit-checkout-price">
                      ${item.listing.dailyRate > 0 ? `${item.listing.dailyRate}/day` : item.listing.price}
                    </div>
                    <div className="outfit-checkout-reason">{item.reason}</div>
                  </div>
                  <span className="outfit-checkout-arrow">→</span>
                </a>
              );
            })}
          </div>

          <div className="outfit-checkout-summary">
            <div className="outfit-checkout-total">
              Total: <strong>${totalPrice.toFixed(2)}{outfitItems.some((i) => i.listing.dailyRate > 0) ? "/day" : ""}</strong>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

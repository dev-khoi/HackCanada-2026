import { useState, useEffect } from "react";
import { fetchListingById } from "../api/listings";
import { buildDisplayUrl } from "../utils/cloudinaryUrl";
import { useCart } from "../context/CartContext";
import { useSaves } from "../context/SavesContext";
import type { Listing } from "../types/listing";

export default function ListingDetailPage() {
    const [listing, setListing] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [mode, setMode] = useState<"rent" | "buy">("rent");
    const [days, setDays] = useState(1);
    const [added, setAdded] = useState(false);

    const { addToCart, isInCart } = useCart();
    const { save, unsave, isSaved, boards } = useSaves();
    const [saveBoard, setSaveBoard] = useState("all");

    // Extract listing ID from URL
    const listingId = window.location.pathname.split("/listing/")[1] || "";

    useEffect(() => {
        if (!listingId) {
            setError("No listing ID provided");
            setLoading(false);
            return;
        }

        const load = async () => {
            setLoading(true);
            try {
                const data = await fetchListingById(listingId);
                setListing(data);
                // Default to buy if no daily rate
                if (!data.dailyRate || data.dailyRate <= 0) {
                    setMode("buy");
                }
            } catch (err: any) {
                setError(err.message || "Failed to load listing");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [listingId]);

    const alreadyInCart = listing ? isInCart(listing._id) : false;

    const handleAddToCart = () => {
        if (!listing) return;
        addToCart(listing, mode, mode === "rent" ? days : 1);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    const currentPrice =
        listing && mode === "rent" && listing.dailyRate > 0
            ? listing.dailyRate * days
            : listing?.price ?? 0;

    if (loading) {
        return (
            <main className="ldp-page">
                <div className="ldp-loading">
                    <div className="outfit-spinner" />
                    <p>Loading listing...</p>
                </div>
            </main>
        );
    }

    if (error || !listing) {
        return (
            <main className="ldp-page">
                <div className="ldp-error">
                    <p>{error || "Listing not found"}</p>
                    <a href="/shop" className="btn-primary">Back to Shop</a>
                </div>
            </main>
        );
    }

    const imgUrl = listing.cloudinaryUrl
        ? buildDisplayUrl(listing.cloudinaryUrl, {
            width: 600,
            height: 800,
            removeBg: listing.transformations?.removeBg,
            replaceBg: listing.transformations?.replaceBg ?? undefined,
            badge: listing.transformations?.badge ?? undefined,
            badgeColor: listing.transformations?.badgeColor,
        })
        : "";

    return (
        <main className="ldp-page">
            <a href="/shop" className="ldp-back">← Back to Shop</a>

            <div className="ldp-layout">
                {/* Image */}
                <div className="ldp-image-col">
                    {imgUrl ? (
                        <img src={imgUrl} alt={listing.title} className="ldp-img" />
                    ) : (
                        <div className="ldp-img-placeholder">No Image</div>
                    )}
                </div>

                {/* Details */}
                <div className="ldp-details-col">
                    <div className="ldp-tags">
                        {listing.tags.map((tag) => (
                            <span key={tag} className="ldp-tag">{tag}</span>
                        ))}
                    </div>

                    <h1 className="font-display ldp-title">{listing.title}</h1>
                    <p className="ldp-description">{listing.description}</p>

                    {listing.size && (listing.size.letter || listing.size.waist || listing.size.shoe) && (
                        <div className="ldp-sizes">
                            {listing.size.letter && <span className="ldp-size-pill">Size {listing.size.letter}</span>}
                            {listing.size.waist && <span className="ldp-size-pill">Waist {listing.size.waist}</span>}
                            {listing.size.shoe && <span className="ldp-size-pill">Shoe {listing.size.shoe}</span>}
                        </div>
                    )}

                    {listing.location && (
                        <p className="ldp-location">📍 {listing.location}</p>
                    )}

                    {/* Price */}
                    <div className="ldp-pricing">
                        <div className="ldp-price-main">${listing.price}</div>
                        {listing.dailyRate > 0 && (
                            <div className="ldp-price-rate">${listing.dailyRate}/day rental</div>
                        )}
                    </div>

                    {/* Rent / Buy toggle */}
                    <div className="ldp-mode-toggle">
                        {listing.dailyRate > 0 && (
                            <button
                                type="button"
                                className={`ldp-mode-btn${mode === "rent" ? " active" : ""}`}
                                onClick={() => setMode("rent")}
                            >
                                Rent
                            </button>
                        )}
                        <button
                            type="button"
                            className={`ldp-mode-btn${mode === "buy" ? " active" : ""}`}
                            onClick={() => setMode("buy")}
                        >
                            Buy
                        </button>
                    </div>

                    {/* Day selector for rent */}
                    {mode === "rent" && listing.dailyRate > 0 && (
                        <div className="ldp-days">
                            <label className="ldp-days-label" htmlFor="rental-days">
                                Number of days
                            </label>
                            <div className="ldp-days-control">
                                <button
                                    type="button"
                                    className="ldp-days-btn"
                                    onClick={() => setDays((d) => Math.max(1, d - 1))}
                                >
                                    −
                                </button>
                                <input
                                    id="rental-days"
                                    type="number"
                                    min="1"
                                    max="30"
                                    className="ldp-days-input"
                                    value={days}
                                    onChange={(e) => setDays(Math.max(1, Number(e.target.value)))}
                                />
                                <button
                                    type="button"
                                    className="ldp-days-btn"
                                    onClick={() => setDays((d) => Math.min(30, d + 1))}
                                >
                                    +
                                </button>
                            </div>
                            <div className="ldp-days-total">
                                {days} day{days !== 1 ? "s" : ""} × ${listing.dailyRate} = <strong>${currentPrice.toFixed(2)}</strong>
                            </div>
                        </div>
                    )}

                    {/* Save / Add to Cart */}
                    <div className="ldp-action-row">
                        <button
                            type="button"
                            className={`ldp-save-btn${listing && isSaved(listing._id) ? " ldp-save-btn-active" : ""}`}
                            onClick={() => {
                                if (!listing) return;
                                if (isSaved(listing._id)) {
                                    unsave(listing._id);
                                } else {
                                    save(listing, saveBoard);
                                }
                            }}
                            title={listing && isSaved(listing._id) ? "Unsave" : "Save"}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill={listing && isSaved(listing._id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                        </button>

                        {boards.length > 1 && (
                            <select
                                className="ldp-board-select"
                                value={saveBoard}
                                onChange={(e) => setSaveBoard(e.target.value)}
                            >
                                {boards.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <button
                        type="button"
                        className={`btn-primary ldp-cart-btn${added ? " ldp-cart-btn-added" : ""}`}
                        onClick={handleAddToCart}
                        disabled={alreadyInCart}
                    >
                        {alreadyInCart
                            ? "Already in Cart"
                            : added
                                ? "✓ Added!"
                                : `Add to Cart — $${currentPrice.toFixed(2)}`}
                    </button>

                    <a href="/cart" className="ldp-view-cart">
                        View Cart →
                    </a>

                    {/* Seller info */}
                    <div className="ldp-seller">
                        <div className="ldp-seller-label">Listed by</div>
                        <div className="ldp-seller-id">
                            {listing.sellerId?.slice(0, 20) || "Anonymous"}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

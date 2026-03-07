import { useEffect, useState } from "react";
import { fetchListings, deleteListing, updateListing } from "../api/listings";
import type { Listing } from "../types/listing";
import { buildDisplayUrl } from "../utils/cloudinaryUrl";

interface Props {
  userId: string;
}

export default function ListingsPanel({ userId }: Props) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchListings();
      // Show only the current user's listings
      const mine = userId
        ? data.filter((l) => l.sellerId === userId)
        : data;
      setListings(mine);
    } catch (err: any) {
      setError(err.message || "Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [userId]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    try {
      await deleteListing(id);
      setListings((prev) => prev.filter((l) => l._id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    }
  };

  const handleToggleStatus = async (listing: Listing) => {
    const next = listing.status === "Live" ? "Paused" : "Live";
    try {
      const updated = await updateListing(listing._id, { status: next } as any);
      setListings((prev) =>
        prev.map((l) => (l._id === updated._id ? updated : l))
      );
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  if (loading) {
    return <p className="shop-section-subtitle">Loading listings...</p>;
  }

  if (error) {
    return (
      <div>
        <p className="shop-section-subtitle" style={{ color: "#b44" }}>
          {error}
        </p>
        <button type="button" className="btn-primary" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="shop-listings-toolbar">
        <a href="/shop/new-listing" className="btn-primary shop-create-link">
          Create Listing
        </a>
      </div>

      {listings.length === 0 ? (
        <p className="shop-section-subtitle">
          No listings yet.{" "}
          <a href="/shop/new-listing">Create your first listing</a>
        </p>
      ) : (
        <div className="shop-grid">
          {listings.map((listing) => {
            const displayUrl = listing.cloudinaryUrl
              ? buildDisplayUrl(listing.cloudinaryUrl, {
                  width: 400,
                  height: 533,
                })
              : "";

            return (
              <article key={listing._id} className="shop-card">
                {displayUrl && (
                  <div className="shop-card-img-wrap">
                    <img
                      src={displayUrl}
                      alt={listing.title}
                      className="shop-card-img"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="shop-card-top">
                  <h3 className="shop-card-title">{listing.title}</h3>
                  <span
                    className={`shop-pill shop-pill-${listing.status.toLowerCase()}`}>
                    {listing.status}
                  </span>
                </div>
                <p className="shop-card-meta">{listing.description}</p>
                <p className="shop-card-rate">
                  ${listing.price}
                  {listing.dailyRate > 0 && (
                    <span className="shop-card-daily">
                      {" "}· ${listing.dailyRate}/day
                    </span>
                  )}
                </p>
                {listing.tags.length > 0 && (
                  <div className="shop-card-tags">
                    {listing.tags.map((tag) => (
                      <span key={tag} className="shop-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="shop-card-actions">
                  <button
                    type="button"
                    className="btn-outline shop-action-btn"
                    onClick={() => handleToggleStatus(listing)}>
                    {listing.status === "Live" ? "Pause" : "Go Live"}
                  </button>
                  <button
                    type="button"
                    className="btn-outline shop-action-btn shop-action-btn-danger"
                    onClick={() => handleDelete(listing._id)}>
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

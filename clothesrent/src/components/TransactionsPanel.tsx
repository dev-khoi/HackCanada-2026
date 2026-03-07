import { useEffect, useState } from "react";
import { fetchPurchases } from "../api/listings";
import type { Purchase } from "../types/listing";
import { thumbnailUrl } from "../utils/cloudinaryUrl";

interface Props {
  userId: string;
}

export default function TransactionsPanel({ userId }: Props) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPurchases();
        // Show purchases relevant to this user (as buyer or seller)
        const mine = userId
          ? data.filter(
              (p) => p.buyerId === userId || p.sellerId === userId
            )
          : data;
        setPurchases(mine);
      } catch (err: any) {
        setError(err.message || "Failed to load transactions");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  if (loading) {
    return <p className="shop-section-subtitle">Loading transactions...</p>;
  }

  if (error) {
    return (
      <p className="shop-section-subtitle" style={{ color: "#b44" }}>
        {error}
      </p>
    );
  }

  if (purchases.length === 0) {
    return (
      <p className="shop-section-subtitle">No transactions recorded yet.</p>
    );
  }

  return (
    <div className="shop-table-wrap">
      <table className="shop-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Item</th>
            <th>Price</th>
            <th>Role</th>
            <th>Date</th>
            <th>Tags</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map((purchase) => {
            const role =
              purchase.buyerId === userId ? "Buyer" : "Seller";

            return (
              <tr key={purchase._id}>
                <td>
                  {purchase.cloudinaryUrl && (
                    <img
                      src={thumbnailUrl(purchase.cloudinaryUrl, 64)}
                      alt={purchase.title}
                      className="shop-table-img"
                      loading="lazy"
                    />
                  )}
                </td>
                <td>{purchase.title}</td>
                <td>${purchase.price}</td>
                <td>
                  <span
                    className={`shop-pill shop-pill-${role.toLowerCase()}`}>
                    {role}
                  </span>
                </td>
                <td>
                  {new Date(purchase.purchaseDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                  })}
                </td>
                <td>
                  <div className="shop-card-tags">
                    {purchase.tags.map((tag) => (
                      <span key={tag} className="shop-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

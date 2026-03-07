import { useMemo, useState, useRef } from "react";
import type { FormEvent } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { createListing } from "../api/listings";
import "./sellerUploadPosting.css";

type ListingDraft = {
  title: string;
  description: string;
  price: string;
  dailyRate: string;
  tags: string;
};

const INITIAL_DRAFT: ListingDraft = {
  title: "",
  description: "",
  price: "",
  dailyRate: "",
  tags: "",
};

export default function SellerUploadPosting() {
  const { user } = useAuth0();
  const [draft, setDraft] = useState<ListingDraft>(INITIAL_DRAFT);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = useMemo(() => {
    return Boolean(
      draft.title.trim() &&
        draft.description.trim() &&
        draft.price.trim() &&
        selectedFile
    );
  }, [draft, selectedFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || !selectedFile) return;

    setSubmitting(true);
    setSubmitMessage(null);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("title", draft.title.trim());
      formData.append("description", draft.description.trim());
      formData.append("price", draft.price);
      if (draft.dailyRate) formData.append("dailyRate", draft.dailyRate);
      if (user?.sub) formData.append("sellerId", user.sub);
      if (draft.tags.trim()) {
        draft.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .forEach((tag) => formData.append("tags[]", tag));
      }

      const result = await createListing(formData);
      setSubmitMessage(
        `Listing "${result.item.title}" created successfully! Status: ${result.item.status}`
      );
      setDraft(INITIAL_DRAFT);
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setSubmitError(err.message || "Failed to create listing");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="seller-posting-page">
      <section className="seller-posting-shell">
        <header className="seller-posting-head">
          <a href="/shop" className="seller-posting-back-link">
            Back to Shop
          </a>
          <h1 className="font-display seller-posting-title">
            Create New Listing
          </h1>
          <p className="seller-posting-subtitle">
            Upload your garment photo, then fill in the details. The image will
            be uploaded to Cloudinary and your listing saved to the database.
          </p>
        </header>

        <div className="seller-posting-grid">
          <section className="seller-preview-panel">
            <div className="seller-preview-box">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Selected garment preview"
                  className="seller-preview-image"
                />
              ) : (
                <div className="seller-preview-placeholder">
                  No photo selected yet
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <button
              type="button"
              className="btn-primary"
              style={{ marginTop: "0.75rem" }}
              onClick={() => fileInputRef.current?.click()}>
              {selectedFile ? "Replace Photo" : "Upload Garment Photo"}
            </button>
            {selectedFile && (
              <p className="shop-card-meta" style={{ marginTop: "0.4rem" }}>
                {selectedFile.name}
              </p>
            )}
          </section>

          <form className="seller-posting-form" onSubmit={handleSubmit}>
            <label htmlFor="listing-title" className="seller-field-label">
              Title
            </label>
            <input
              id="listing-title"
              type="text"
              className="seller-field-input"
              placeholder="Obsidian Trench"
              value={draft.title}
              onChange={(e) =>
                setDraft((p) => ({ ...p, title: e.target.value }))
              }
              required
            />

            <label
              htmlFor="listing-description"
              className="seller-field-label">
              Description
            </label>
            <textarea
              id="listing-description"
              className="seller-field-input seller-field-textarea"
              placeholder="Describe style, material, and condition..."
              value={draft.description}
              onChange={(e) =>
                setDraft((p) => ({ ...p, description: e.target.value }))
              }
              rows={5}
              required
            />

            <label htmlFor="listing-price" className="seller-field-label">
              Price ($)
            </label>
            <input
              id="listing-price"
              type="number"
              min="0"
              step="0.01"
              className="seller-field-input"
              placeholder="485"
              value={draft.price}
              onChange={(e) =>
                setDraft((p) => ({ ...p, price: e.target.value }))
              }
              required
            />

            <label htmlFor="listing-dailyrate" className="seller-field-label">
              Daily Rate ($) — optional
            </label>
            <input
              id="listing-dailyrate"
              type="number"
              min="0"
              step="0.01"
              className="seller-field-input"
              placeholder="28"
              value={draft.dailyRate}
              onChange={(e) =>
                setDraft((p) => ({ ...p, dailyRate: e.target.value }))
              }
            />

            <label htmlFor="listing-tags" className="seller-field-label">
              Tags — comma separated, optional
            </label>
            <input
              id="listing-tags"
              type="text"
              className="seller-field-input"
              placeholder="trench, outerwear, minimalist"
              value={draft.tags}
              onChange={(e) =>
                setDraft((p) => ({ ...p, tags: e.target.value }))
              }
            />

            <button
              type="submit"
              className="btn-primary seller-submit-btn"
              disabled={!canSubmit || submitting}>
              {submitting ? "Creating Listing..." : "Create Listing"}
            </button>

            {submitMessage && (
              <p className="seller-submit-message">{submitMessage}</p>
            )}
            {submitError && (
              <p className="seller-error-text">{submitError}</p>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}

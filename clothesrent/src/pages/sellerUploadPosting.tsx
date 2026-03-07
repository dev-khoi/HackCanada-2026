import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { uploadImage, createListing } from "../api/listings";
import type { ImageTransformations } from "../types/listing";
import { DEFAULT_TRANSFORMATIONS } from "../types/listing";
import ImageTransformPanel from "../components/ImageTransformPanel";
import LocationAutocompleteInput from "../components/LocationAutocompleteInput";
import { buildDisplayUrl } from "../utils/cloudinaryUrl";
import { loadUserProfile, type UserProfileData } from "../utils/profileStorage";
import "./sellerUploadPosting.css";

type ListingDraft = {
  title: string;
  description: string;
  price: string;
  dailyRate: string;
  tags: string;
  location: string;
};

const INITIAL_DRAFT: ListingDraft = {
  title: "",
  description: "",
  price: "",
  dailyRate: "",
  tags: "",
  location: "",
};

type Step = "upload" | "transform" | "details";

export default function SellerUploadPosting() {
  const { user } = useAuth0();

  // Step state
  const [step, setStep] = useState<Step>("upload");

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const detailsImageRef = useRef<HTMLImageElement>(null);

  // Cloudinary state (set after upload)
  const [cloudinaryUrl, setCloudinaryUrl] = useState<string | null>(null);
  const [publicId, setPublicId] = useState<string | null>(null);
  const [autoTags, setAutoTags] = useState<string[]>([]);

  // Transform state
  const [transforms, setTransforms] = useState<ImageTransformations>({
    ...DEFAULT_TRANSFORMATIONS,
  });
  const [isDetailsPreviewLoading, setIsDetailsPreviewLoading] = useState(false);

  // Details state
  const [draft, setDraft] = useState<ListingDraft>(INITIAL_DRAFT);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return Boolean(
      draft.title.trim() &&
      draft.description.trim() &&
      draft.price.trim() &&
      draft.location.trim() &&
      cloudinaryUrl &&
      publicId,
    );
  }, [draft, cloudinaryUrl, publicId]);

  const detailsPreviewUrl = useMemo(() => {
    if (!cloudinaryUrl) return null;

    return buildDisplayUrl(cloudinaryUrl, {
      width: 400,
      height: 533,
      removeBg: transforms.removeBg,
      replaceBg: transforms.replaceBg ?? undefined,
      badge: transforms.badge ?? undefined,
      badgeColor: transforms.badgeColor,
    });
  }, [
    cloudinaryUrl,
    transforms.badge,
    transforms.badgeColor,
    transforms.removeBg,
    transforms.replaceBg,
  ]);

  useEffect(() => {
    if (step === "details" && detailsPreviewUrl) {
      setIsDetailsPreviewLoading(!(detailsImageRef.current?.complete ?? false));
    }
  }, [detailsPreviewUrl, step]);

  /** Live-preview of all tags that will be saved: auto-tags + user-entered tags */
  const allTagsPreview = useMemo(() => {
    const userTags = draft.tags.trim()
      ? draft.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    return [...new Set([...autoTags, ...userTags])];
  }, [autoTags, draft.tags]);

  // ── Step 1: Select & Upload ──

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setLocalPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadProgress("Uploading to Cloudinary...");
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const result = await uploadImage(formData);

      setCloudinaryUrl(result.url);
      setPublicId(result.publicId);
      setAutoTags(result.tags);
      setUploadProgress(null);
      setStep("transform");
    } catch (err: any) {
      setSubmitError(err.message || "Upload failed");
      setUploadProgress(null);
    } finally {
      setUploading(false);
    }
  };

  // ── Step 3: Submit Listing ──

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || !cloudinaryUrl || !publicId) return;

    setSubmitting(true);
    setSubmitMessage(null);
    setSubmitError(null);

    try {
      const userTags = draft.tags.trim()
        ? draft.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      const result = await createListing({
        // Creator display name must come from the user's profile name, not email/nickname.
        sellerName: loadUserProfile(user?.sub ?? "", {
          name: "",
          style: "",
          picture: "",
          location: "",
        }).name.trim(),
        title: draft.title.trim(),
        description: draft.description.trim(),
        price: parseFloat(draft.price),
        dailyRate: draft.dailyRate ? parseFloat(draft.dailyRate) : undefined,
        tags: userTags,
        location: draft.location.trim(),
        sellerId: user?.sub,
        cloudinaryUrl,
        publicId,
        autoTags,
        transformations: transforms,
        
      });

      setSubmitMessage(
        `Listing "${result.item.title}" created successfully! Status: ${result.item.status}`,
      );
      // Reset everything
      setDraft(INITIAL_DRAFT);
      setSelectedFile(null);
      setLocalPreviewUrl(null);
      setCloudinaryUrl(null);
      setPublicId(null);
      setAutoTags([]);
      setTransforms({ ...DEFAULT_TRANSFORMATIONS });
      setStep("upload");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setSubmitError(err.message || "Failed to create listing");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUseProfileLocation = () => {
    if (!user?.sub) {
      setLocationMessage("Please sign in to use profile location.");
      return;
    }

    const fallback: UserProfileData = {
      name: user?.name ?? user?.nickname ?? "",
      style: "",
      picture: user?.picture ?? "",
      location: "",
    };
    const profile = loadUserProfile(user.sub, fallback);
    if (!profile.location.trim()) {
      setLocationMessage("No profile location saved yet.");
      return;
    }

    setDraft((prev) => ({ ...prev, location: profile.location }));
    setLocationMessage("Location filled from profile.");
  };

  // ── Step Indicator ──

  const steps: { key: Step; label: string }[] = [
    { key: "upload", label: "1. Upload" },
    { key: "transform", label: "2. Enhance" },
    { key: "details", label: "3. Details" },
  ];

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
            Upload your garment photo, enhance it with AI features, then
            publish.
          </p>
        </header>

        {/* Step indicator */}
        <div className="seller-steps">
          {steps.map((s) => (
            <div
              key={s.key}
              className={`seller-step${step === s.key ? " seller-step--active" : ""}${
                steps.findIndex((x) => x.key === step) >
                steps.findIndex((x) => x.key === s.key)
                  ? " seller-step--done"
                  : ""
              }`}>
              {s.label}
            </div>
          ))}
        </div>

        {/* ── Step 1: Upload ── */}
        {step === "upload" && (
          <div className="seller-posting-grid">
            <section className="seller-preview-panel">
              <div className="seller-preview-box">
                {localPreviewUrl ? (
                  <img
                    src={localPreviewUrl}
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

            <div className="seller-upload-action-panel">
              <h3 className="transform-panel-title">Step 1: Upload Image</h3>
              <p className="transform-panel-subtitle">
                Select a garment photo (JPG, PNG, or WebP), then upload it to
                Cloudinary. The image will be auto-tagged by AI.
              </p>
              <button
                type="button"
                className="btn-primary seller-submit-btn"
                disabled={!selectedFile || uploading}
                onClick={handleUpload}>
                {uploading ? "Uploading..." : "Upload to Cloudinary"}
              </button>
              {uploadProgress && (
                <p className="seller-submit-message">{uploadProgress}</p>
              )}
              {submitError && (
                <p className="seller-error-text">{submitError}</p>
              )}
              {submitMessage && (
                <p className="seller-submit-message">{submitMessage}</p>
              )}
            </div>
          </div>
        )}

        {/* ── Step 2: Transform ── */}
        {step === "transform" && cloudinaryUrl && (
          <div>
            <ImageTransformPanel
              cloudinaryUrl={cloudinaryUrl}
              onChange={setTransforms}
            />
            <div className="seller-step-nav">
              <button
                type="button"
                className="btn-outline"
                onClick={() => setStep("upload")}>
                ← Back
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setStep("details")}>
                Continue to Details →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Details ── */}
        {step === "details" && (
          <div className="seller-posting-grid">
            <section className="seller-preview-panel">
              <div className="seller-preview-box">
                {detailsPreviewUrl && (
                  <>
                    <img
                      ref={detailsImageRef}
                      src={detailsPreviewUrl}
                      alt="Uploaded garment"
                      className={`seller-preview-image${isDetailsPreviewLoading ? " seller-preview-image--loading" : ""}`}
                      onLoad={() => setIsDetailsPreviewLoading(false)}
                      onError={() => setIsDetailsPreviewLoading(false)}
                    />
                    {isDetailsPreviewLoading && (
                      <div
                        className="image-loading-overlay"
                        role="status"
                        aria-live="polite">
                        <span
                          className="image-loading-spinner"
                          aria-hidden="true"
                        />
                        <span className="image-loading-text">
                          Applying image changes...
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
              {allTagsPreview.length > 0 && (
                <div className="shop-card-tags" style={{ marginTop: "0.6rem" }}>
                  {allTagsPreview.map((tag) => (
                    <span key={tag} className="shop-tag">
                      {tag}
                    </span>
                  ))}
                </div>
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

              <section className="seller-location-card">
                <label htmlFor="listing-location" className="seller-field-label">
                  Location
                </label>
                <p className="seller-location-hint">
                  Add your pickup address so nearby users can find this listing.
                </p>
                <LocationAutocompleteInput
                  id="listing-location"
                  inputClassName="seller-field-input"
                  placeholder="e.g. 100 Queen St W, Toronto"
                  value={draft.location}
                  onChange={(next) => {
                    setDraft((p) => ({ ...p, location: next }));
                    setLocationMessage(null);
                  }}
                  required
                />
                <button
                  type="button"
                  className="btn-outline seller-location-btn"
                  onClick={handleUseProfileLocation}>
                  Use Profile Location
                </button>
                {locationMessage && (
                  <p className="seller-location-message">{locationMessage}</p>
                )}
              </section>

              <div className="seller-step-nav" style={{ marginTop: "0.5rem" }}>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setStep("transform")}>
                  ← Back to Enhance
                </button>
                <button
                  type="submit"
                  className="btn-primary seller-submit-btn"
                  disabled={!canSubmit || submitting}>
                  {submitting ? "Creating Listing..." : "Publish Listing"}
                </button>
              </div>

              {submitMessage && (
                <p className="seller-submit-message">{submitMessage}</p>
              )}
              {submitError && (
                <p className="seller-error-text">{submitError}</p>
              )}
            </form>
          </div>
        )}
      </section>
    </main>
  );
}

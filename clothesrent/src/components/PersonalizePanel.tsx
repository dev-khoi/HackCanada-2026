import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  analyzeStyleImages,
  recommendFromStyle,
  recommendFromPrompt,
  getUserStyle,
  saveUserStyle,
} from "../api/listings";
import type { Listing } from "../types/listing";
import { buildDisplayUrl } from "../utils/cloudinaryUrl";

interface Props {
  userId: string;
  fallbackName: string;
  fallbackPicture: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PersonalizePanel({ userId }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [prompt, setPrompt] = useState("");
  const [savedPrompt, setSavedPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [recommendations, setRecommendations] = useState<Listing[]>([]);

  // Load saved style from DB on mount
  useEffect(() => {
    if (!userId) return;
    getUserStyle(userId).then((data) => {
      if (data.prompt) {
        setPrompt(data.prompt);
        setSavedPrompt(data.prompt);
      }
      // Auto-load recommendations from saved prompt
      if (data.prompt || (data.descriptions && data.descriptions.length > 0)) {
        setLoading(true);
        const fetchRecs =
          data.descriptions && data.descriptions.length > 0
            ? recommendFromStyle(data.descriptions)
            : recommendFromPrompt(data.prompt);
        fetchRecs
          .then((r) => {
            setRecommendations(r.recommendations);
            setStatusMessage(`${r.recommendations.length} personalized listing(s) for you.`);
          })
          .catch(() => setStatusMessage("Could not load recommendations."))
          .finally(() => setLoading(false));
      }
    }).catch(() => {});
  }, [userId]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setFiles(selected.slice(0, 10));
    setStatusMessage(`${Math.min(selected.length, 10)} image(s) selected.`);
  };

  const handleImageSearch = async () => {
    if (files.length === 0) return;
    setLoading(true);
    setStatusMessage("Analyzing images & finding matches...");
    setRecommendations([]);

    try {
      const base64Images = await Promise.all(files.map(fileToBase64));
      const analysis = await analyzeStyleImages(base64Images);
      const result = await recommendFromStyle(analysis.descriptions);
      setRecommendations(result.recommendations);
      setStatusMessage(`Found ${result.recommendations.length} matching listing(s).`);

      if (userId) {
        saveUserStyle(userId, { descriptions: analysis.descriptions }).catch(() => {});
      }
    } catch (error: any) {
      setStatusMessage(`Failed: ${error?.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePromptSearch = async () => {
    const q = prompt.trim();
    if (!q) return;
    setLoading(true);
    setStatusMessage("Finding matches...");
    setRecommendations([]);

    try {
      const result = await recommendFromPrompt(q);
      setRecommendations(result.recommendations);
      setStatusMessage(`Found ${result.recommendations.length} matching listing(s).`);
    } catch (error: any) {
      setStatusMessage(`Failed: ${error?.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrompt = async () => {
    const q = prompt.trim();
    if (!q || !userId) return;
    try {
      await saveUserStyle(userId, { prompt: q });
      setSavedPrompt(q);
      setStatusMessage("Style preference saved to your profile!");
    } catch {
      setStatusMessage("Failed to save preference.");
    }
  };

  return (
    <div className="personalize-panel">
      <p className="shop-section-subtitle">
        Get personalized listings based on your style. Use a text prompt or upload inspiration images.
      </p>

      {/* Text prompt section */}
      <div className="personalize-prompt-section">
        <textarea
          className="modal-textarea"
          placeholder="Describe your style... (e.g. minimalist oversized hoodie, dark academia)"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={2}
        />
        {savedPrompt && savedPrompt !== prompt.trim() && (
          <p className="modal-saved-hint">Saved: <em>{savedPrompt}</em></p>
        )}
        <div className="personalize-actions">
          <button
            type="button"
            className="btn-primary shop-action-btn"
            onClick={handlePromptSearch}
            disabled={loading || !prompt.trim()}>
            {loading ? "Searching..." : "Find Matches"}
          </button>
          {userId && (
            <button
              type="button"
              className="btn-outline shop-action-btn"
              onClick={handleSavePrompt}
              disabled={!prompt.trim()}>
              Save Preference
            </button>
          )}
        </div>
      </div>

      {/* Image upload section */}
      <section className="personalize-uploader">
        <div>
          <p className="personalize-uploader-title">Or Upload Inspiration</p>
          <p className="personalize-uploader-meta">JPG, PNG, WEBP · up to 10 photos</p>
        </div>
        <button
          type="button"
          className="btn-outline personalize-browse-btn"
          onClick={() => fileInputRef.current?.click()}>
          Browse Photos
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="personalize-input-file-hidden"
          onChange={handleFileChange}
        />
      </section>

      {files.length > 0 && (
        <div className="personalize-actions">
          <span className="modal-file-count">{files.length} image(s) selected</span>
          <button
            type="button"
            className="btn-primary shop-action-btn"
            onClick={handleImageSearch}
            disabled={loading}>
            {loading ? "Analyzing..." : "Analyze & Recommend"}
          </button>
        </div>
      )}

      {statusMessage && <p className="shop-section-subtitle">{statusMessage}</p>}

      {loading && <p className="shop-section-subtitle">Loading recommendations...</p>}

      {recommendations.length > 0 && (
        <div className="personalize-recommendations">
          <p className="personalize-result-line">
            <strong>Recommended For You ({recommendations.length}):</strong>
          </p>
          <div className="shop-grid">
            {recommendations.map((listing) => {
              const t = listing.transformations;
              const badge = t?.badge || undefined;
              const displayUrl = listing.cloudinaryUrl
                ? buildDisplayUrl(listing.cloudinaryUrl, {
                    width: 400,
                    height: 533,
                    removeBg: t?.removeBg,
                    replaceBg: t?.replaceBg ?? undefined,
                    badge,
                    badgeColor: t?.badgeColor,
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
                  <h3 className="shop-card-title">{listing.title}</h3>
                  <p className="shop-card-meta">{listing.description}</p>
                  <p className="shop-card-rate">
                    ${listing.price}
                    {listing.dailyRate > 0 && (
                      <span className="shop-card-daily"> · ${listing.dailyRate}/day</span>
                    )}
                  </p>
                  {listing.tags.length > 0 && (
                    <div className="shop-card-tags">
                      {listing.tags.slice(0, 5).map((tag) => (
                        <span key={tag} className="shop-tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

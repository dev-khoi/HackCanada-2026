import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  loadUserProfile,
  saveUserProfile,
  type UserProfileData,
} from "../utils/profileStorage";
import { analyzeStyleImages, recommendFromStyle } from "../api/listings";
import type { Listing } from "../types/listing";

interface Props {
  userId: string;
  fallbackName: string;
  fallbackPicture: string;
}

interface PreviewItem {
  key: string;
  name: string;
  url: string;
}

const STYLE_SUGGESTIONS = [
  "Goth",
  "Streetwear",
  "Minimalist",
  "Vintage",
  "Athleisure",
  "Avant-Garde",
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PersonalizePanel({
  userId,
  fallbackName,
  fallbackPicture,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedStyle, setDetectedStyle] = useState("");
  const [manualStyle, setManualStyle] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Listing[]>([]);
  const [isRecommending, setIsRecommending] = useState(false);

  const canAnalyze = files.length > 0 && !isAnalyzing;
  const canSave = !!(detectedStyle || manualStyle.trim());
  const styleToSave = (manualStyle.trim() || detectedStyle).trim();

  const fileNames = useMemo(() => files.map((file) => file.name), [files]);

  useEffect(() => {
    const previews = files.map((file) => ({
      key: `${file.name}-${file.lastModified}-${file.size}`,
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    setPreviewItems(previews);

    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [files]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    const limited = selected.slice(0, 10);
    setFiles(limited);
    setDetectedStyle("");
    setManualStyle("");
    setDescriptions([]);
    setRecommendations([]);
    setStatusMessage(
      selected.length > 10
        ? "Only the first 10 images were selected."
        : `${limited.length} image(s) selected.`,
    );
  };

  const handleAnalyze = async () => {
    if (!canAnalyze) return;
    setIsAnalyzing(true);
    setStatusMessage("Analyzing your clothing with Gemini AI...");
    setDescriptions([]);

    try {
      const base64Images = await Promise.all(files.map(fileToBase64));
      const result = await analyzeStyleImages(base64Images);
      setDescriptions(result.descriptions);
      const styleSummary = result.descriptions.length > 0
        ? result.descriptions[0]
        : "No style detected";
      setDetectedStyle(styleSummary);
      setManualStyle(styleSummary);
      setStatusMessage(`AI returned ${result.descriptions.length} description(s). Finding matching listings...`);

      // Auto-fetch recommendations from Backboard
      setIsRecommending(true);
      try {
        const recResult = await recommendFromStyle(result.descriptions);
        setRecommendations(recResult.recommendations);
        setStatusMessage(
          `AI returned ${result.descriptions.length} description(s). Found ${recResult.recommendations.length} matching listing(s).`
        );
      } catch {
        setStatusMessage(`Descriptions ready. Recommendation service unavailable.`);
      } finally {
        setIsRecommending(false);
      }
    } catch (error: any) {
      setStatusMessage(`Analysis failed: ${error?.message || "Unknown error"}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveStyle = () => {
    if (!styleToSave) return;

    const fallback: UserProfileData = {
      name: fallbackName,
      style: "",
      picture: fallbackPicture,
    };
    const existingProfile = loadUserProfile(userId, fallback);
    saveUserProfile(userId, {
      ...existingProfile,
      style: styleToSave,
    });
    setStatusMessage(`Saved style: ${styleToSave}`);
  };

  return (
    <div className="personalize-panel">
      <p className="shop-section-subtitle">
        Upload up to 10 images. Gemini AI will describe each clothing item.
      </p>

      <section className="personalize-uploader">
        <div>
          <p className="personalize-uploader-title">Inspiration Upload</p>
          <p className="personalize-uploader-meta">
            JPG, PNG, WEBP · up to 10 photos
          </p>
        </div>
        <button
          type="button"
          className="btn-outline personalize-browse-btn"
          onClick={() => fileInputRef.current?.click()}>
          Browse Photos
        </button>
        <input
          ref={fileInputRef}
          id="personalize-images"
          type="file"
          accept="image/*"
          multiple
          className="personalize-input-file-hidden"
          onChange={handleFileChange}
        />
      </section>

      {previewItems.length > 0 && (
        <div className="personalize-thumb-grid">
          {previewItems.map((item, index) => (
            <article key={item.key} className="personalize-thumb-card">
              <img src={item.url} alt={item.name} className="personalize-thumb-img" />
              <p className="personalize-thumb-name">{item.name}</p>
              {descriptions[index] && (
                <p className="personalize-thumb-desc">{descriptions[index]}</p>
              )}
            </article>
          ))}
        </div>
      )}

      {fileNames.length > 0 && (
        <div className="personalize-file-list">
          {fileNames.map((name) => (
            <span key={name} className="shop-tag">
              {name}
            </span>
          ))}
        </div>
      )}

      <div className="personalize-actions">
        <button
          type="button"
          className="btn-primary shop-action-btn"
          onClick={handleAnalyze}
          disabled={!canAnalyze}>
          {isAnalyzing ? "Analyzing..." : "Analyze Style"}
        </button>
      </div>

      {descriptions.length > 0 && (
        <div className="personalize-descriptions">
          <p className="personalize-result-line"><strong>AI Descriptions:</strong></p>
          <ul>
            {descriptions.map((desc, i) => (
              <li key={i}>{desc}</li>
            ))}
          </ul>
        </div>
      )}

      {(detectedStyle || manualStyle) && (
        <div className="personalize-result-card">
          <p className="personalize-result-line">
            AI Style: <strong>{detectedStyle || "No result yet"}</strong>
          </p>

          <label className="personalize-label" htmlFor="manual-style">
            Change Manually
          </label>
          <input
            id="manual-style"
            className="personalize-input"
            value={manualStyle}
            onChange={(event) => setManualStyle(event.target.value)}
            placeholder="e.g. Goth"
          />

          <button
            type="button"
            className="btn-outline shop-action-btn"
            onClick={handleSaveStyle}
            disabled={!canSave}>
            Save Style to Profile
          </button>
        </div>
      )}

      {statusMessage && <p className="shop-section-subtitle">{statusMessage}</p>}

      {isRecommending && (
        <p className="shop-section-subtitle">Finding matching listings...</p>
      )}

      {recommendations.length > 0 && (
        <div className="personalize-recommendations">
          <p className="personalize-result-line">
            <strong>Recommended Listings ({recommendations.length}):</strong>
          </p>
          <div className="personalize-thumb-grid">
            {recommendations.map((listing) => (
              <article key={listing._id} className="personalize-thumb-card">
                <img
                  src={listing.cloudinaryUrl}
                  alt={listing.title}
                  className="personalize-thumb-img"
                />
                <p className="personalize-thumb-name">{listing.title}</p>
                <p className="personalize-thumb-desc">${listing.price}</p>
                <p className="personalize-thumb-desc">{listing.description}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

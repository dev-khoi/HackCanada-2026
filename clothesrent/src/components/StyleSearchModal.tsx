import { useRef, useState, type ChangeEvent } from "react";
import {
  analyzeStyleImages,
  recommendFromStyle,
  recommendFromPrompt,
  saveUserStyle,
  getUserStyle,
} from "../api/listings";
import type { Listing } from "../types/listing";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  auth0Id: string;
  onRecommendations: (listings: Listing[]) => void;
}

type Mode = "images" | "prompt";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function StyleSearchModal({
  isOpen,
  onClose,
  auth0Id,
  onRecommendations,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<Mode>("prompt");
  const [files, setFiles] = useState<File[]>([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [savedPrompt, setSavedPrompt] = useState<string | null>(null);

  // Load saved style on first open
  const loadedRef = useRef(false);
  if (isOpen && !loadedRef.current && auth0Id) {
    loadedRef.current = true;
    getUserStyle(auth0Id).then((data) => {
      if (data.prompt) {
        setSavedPrompt(data.prompt);
        if (!prompt) setPrompt(data.prompt);
      }
    }).catch(() => {});
  }
  if (!isOpen && loadedRef.current) {
    loadedRef.current = false;
  }

  if (!isOpen) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setFiles(selected.slice(0, 10));
    setStatus(
      selected.length > 10
        ? "Only the first 10 images were kept."
        : `${Math.min(selected.length, 10)} image(s) selected.`
    );
  };

  const handleImageSearch = async () => {
    if (files.length === 0) return;
    setLoading(true);
    setStatus("Analyzing images with Gemini AI...");

    try {
      const base64Images = await Promise.all(files.map(fileToBase64));
      const analysis = await analyzeStyleImages(base64Images);
      setStatus(`Got ${analysis.descriptions.length} description(s). Finding matches...`);

      const result = await recommendFromStyle(analysis.descriptions);
      onRecommendations(result.recommendations);
      setStatus(`Found ${result.recommendations.length} matching listing(s).`);

      // Auto-save descriptions to profile
      if (auth0Id) {
        saveUserStyle(auth0Id, { descriptions: analysis.descriptions }).catch(() => {});
      }
    } catch (error: any) {
      setStatus(`Error: ${error?.message || "Search failed"}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePromptSearch = async () => {
    const q = prompt.trim();
    if (!q) return;
    setLoading(true);
    setStatus("Finding matching listings...");

    try {
      const result = await recommendFromPrompt(q);
      onRecommendations(result.recommendations);
      setStatus(`Found ${result.recommendations.length} matching listing(s).`);
    } catch (error: any) {
      setStatus(`Error: ${error?.message || "Search failed"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrompt = async () => {
    const q = prompt.trim();
    if (!q || !auth0Id) return;
    try {
      await saveUserStyle(auth0Id, { prompt: q });
      setSavedPrompt(q);
      setStatus("Style preference saved!");
    } catch {
      setStatus("Failed to save preference.");
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <button type="button" className="modal-close" onClick={onClose}>
          &times;
        </button>

        <h2 className="font-display modal-title">Style Search</h2>
        <p className="modal-subtitle">
          Find listings that match your style using AI
        </p>

        <div className="modal-tabs">
          <button
            type="button"
            className={`modal-tab${mode === "prompt" ? " active" : ""}`}
            onClick={() => setMode("prompt")}>
            Text Prompt
          </button>
          <button
            type="button"
            className={`modal-tab${mode === "images" ? " active" : ""}`}
            onClick={() => setMode("images")}>
            Upload Images
          </button>
        </div>

        {mode === "prompt" && (
          <div className="modal-section">
            <textarea
              className="modal-textarea"
              placeholder="Describe your style... (e.g. minimalist oversized hoodie, dark academia)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
            {savedPrompt && savedPrompt !== prompt.trim() && (
              <p className="modal-saved-hint">
                Saved: <em>{savedPrompt}</em>
              </p>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="btn-primary shop-action-btn"
                onClick={handlePromptSearch}
                disabled={loading || !prompt.trim()}>
                {loading ? "Searching..." : "Find Matches"}
              </button>
              {auth0Id && (
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
        )}

        {mode === "images" && (
          <div className="modal-section">
            <div className="modal-upload-row">
              <button
                type="button"
                className="btn-outline shop-action-btn"
                onClick={() => fileInputRef.current?.click()}>
                Browse Photos
              </button>
              <span className="modal-file-count">
                {files.length > 0
                  ? `${files.length} image(s)`
                  : "JPG, PNG, WEBP · up to 10"}
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="personalize-input-file-hidden"
              onChange={handleFileChange}
            />
            {files.length > 0 && (
              <div className="modal-thumb-row">
                {files.slice(0, 5).map((f) => (
                  <img
                    key={f.name}
                    src={URL.createObjectURL(f)}
                    alt={f.name}
                    className="modal-thumb"
                  />
                ))}
                {files.length > 5 && (
                  <span className="modal-more">+{files.length - 5} more</span>
                )}
              </div>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="btn-primary shop-action-btn"
                onClick={handleImageSearch}
                disabled={loading || files.length === 0}>
                {loading ? "Analyzing..." : "Analyze & Recommend"}
              </button>
            </div>
          </div>
        )}

        {status && <p className="modal-status">{status}</p>}
      </div>
    </div>
  );
}

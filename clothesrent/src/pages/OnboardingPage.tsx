import { useRef, useState, type ChangeEvent } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import {
  saveUserProfile,
  loadUserProfile,
} from "../utils/profileStorage";
import {
  savePublicUserProfile,
  analyzeStyleImages,
  saveUserStyle,
} from "../api/listings";
import LocationAutocompleteInput from "../components/LocationAutocompleteInput";
import "./OnboardingPage.css";

/* ── Size options ── */
const LETTER_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "1X", "2X", "3X"];
const WAIST_SIZES = ["26", "27", "28", "29", "30", "31", "32", "33", "34", "36", "38", "40", "42"];
const SHOE_SIZES = ["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "12", "13", "14"];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function SizeChip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={`ob-size-chip${selected ? " ob-size-chip-active" : ""}`}
      onClick={onToggle}
    >
      {label}
    </button>
  );
}

interface OnboardingPageProps {
  onComplete: () => void;
}

export default function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const { user } = useAuth0();
  const userId = user?.sub ?? "";

  const [step, setStep] = useState(1);

  /* ── Step 1 state ── */
  const picInputRef = useRef<HTMLInputElement>(null);
  const [picture, setPicture] = useState(user?.picture ?? "");
  const [name, setName] = useState(user?.name ?? user?.nickname ?? "");
  const [location, setLocation] = useState("");
  const [style, setStyle] = useState("");
  const [nameError, setNameError] = useState("");

  /* ── Step 2 state ── */
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [selectedWaist, setSelectedWaist] = useState<string | null>(null);
  const [selectedShoe, setSelectedShoe] = useState<string | null>(null);

  const fitInputRef = useRef<HTMLInputElement>(null);
  const [fitFiles, setFitFiles] = useState<File[]>([]);
  const [fitPreviews, setFitPreviews] = useState<string[]>([]);
  const [analyzingFits, setAnalyzingFits] = useState(false);
  const [analyzeStatus, setAnalyzeStatus] = useState("");

  const [saving, setSaving] = useState(false);

  /* ── Handlers ── */
  const handlePicChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPicture(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFitFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []).slice(0, 10);
    setFitFiles(selected);
    setFitPreviews(selected.map((f) => URL.createObjectURL(f)));
    setAnalyzeStatus(`${selected.length} photo(s) selected`);
  };

  const handleContinueStep1 = () => {
    if (!name.trim()) {
      setNameError("Name is required.");
      return;
    }
    setNameError("");
    setStep(2);
  };

  const handleFinish = async () => {
    setSaving(true);

    // Save profile (step 1 data)
    const fallback = loadUserProfile(userId, { name, style, picture, location });
    saveUserProfile(userId, { ...fallback, name, style, picture, location });
    savePublicUserProfile(userId, {
      name,
      picture,
      location,
      email: user?.email,
    }).catch(() => {});

    // Save sizes to localStorage
    const sizes = {
      letter: selectedLetter ?? "",
      waist: selectedWaist ?? "",
      shoe: selectedShoe ?? "",
    };
    localStorage.setItem(
      `clothesrent-sizes-${userId}`,
      JSON.stringify(sizes)
    );

    // Analyze fit photos if uploaded
    if (fitFiles.length > 0) {
      setAnalyzingFits(true);
      setAnalyzeStatus("Analyzing your style...");
      try {
        const base64Images = await Promise.all(fitFiles.map(fileToBase64));
        const analysis = await analyzeStyleImages(base64Images);
        await saveUserStyle(userId, { descriptions: analysis.descriptions });
        setAnalyzeStatus("Style saved!");
      } catch {
        setAnalyzeStatus("Could not analyze photos, but continuing.");
      } finally {
        setAnalyzingFits(false);
      }
    }

    setSaving(false);
    onComplete();
  };

  return (
    <div className="ob-root">
      {/* Progress bar */}
      <div className="ob-progress">
        <div className={`ob-progress-seg${step >= 1 ? " ob-progress-seg-done" : ""}`} />
        <div className={`ob-progress-seg${step >= 2 ? " ob-progress-seg-done" : ""}`} />
      </div>

      {step === 1 && (
        <div className="ob-step">
          <h1 className="ob-title">Set up your profile</h1>

          {/* Avatar upload */}
          <div className="ob-avatar-wrap" onClick={() => picInputRef.current?.click()}>
            {picture ? (
              <img src={picture} alt="Profile" className="ob-avatar-img" />
            ) : (
              <div className="ob-avatar-placeholder">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" fill="#ccc" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="#ccc" />
                </svg>
              </div>
            )}
            <div className="ob-avatar-plus">+</div>
          </div>
          <input
            ref={picInputRef}
            type="file"
            accept="image/*"
            className="ob-hidden-input"
            onChange={handlePicChange}
          />
          <p className="ob-avatar-label">Upload Profile Picture</p>
          <p className="ob-avatar-hint">Receive up to 3× more rentals with a profile picture!</p>

          {/* Name */}
          <label className="ob-label">Full Name</label>
          <input
            className={`ob-input${nameError ? " ob-input-error" : ""}`}
            value={name}
            onChange={(e) => { setName(e.target.value); setNameError(""); }}
            placeholder="Your name"
          />
          {nameError && <p className="ob-error">{nameError}</p>}

          {/* Location */}
          <label className="ob-label">Location</label>
          <LocationAutocompleteInput
            id="onboarding-location"
            inputClassName="ob-input"
            value={location}
            onChange={setLocation}
            placeholder="e.g. Toronto, ON"
          />

          {/* Style */}
          <label className="ob-label">Your Style <span className="ob-label-optional">(optional)</span></label>
          <input
            className="ob-input"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="e.g. Streetwear, Dark academia, Minimalist..."
          />

          <button type="button" className="ob-continue-btn" onClick={handleContinueStep1}>
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="ob-step">
          <h1 className="ob-title">What are your sizes?</h1>
          <p className="ob-subtitle">This helps us tailor your experience. You can change this anytime.</p>

          {/* Clothing letter sizes */}
          <p className="ob-size-group-label">Clothing Size</p>
          <div className="ob-chips">
            {LETTER_SIZES.map((s) => (
              <SizeChip
                key={s}
                label={s}
                selected={selectedLetter === s}
                onToggle={() => setSelectedLetter(selectedLetter === s ? null : s)}
              />
            ))}
          </div>

          {/* Waist sizes */}
          <p className="ob-size-group-label">Waist Size</p>
          <div className="ob-chips">
            {WAIST_SIZES.map((s) => (
              <SizeChip
                key={s}
                label={s}
                selected={selectedWaist === s}
                onToggle={() => setSelectedWaist(selectedWaist === s ? null : s)}
              />
            ))}
          </div>

          {/* Shoe sizes */}
          <p className="ob-size-group-label">Shoe Size (US)</p>
          <div className="ob-chips">
            {SHOE_SIZES.map((s) => (
              <SizeChip
                key={s}
                label={s}
                selected={selectedShoe === s}
                onToggle={() => setSelectedShoe(selectedShoe === s ? null : s)}
              />
            ))}
          </div>

          {/* Fit photo upload */}
          <div className="ob-fits-section">
            <p className="ob-size-group-label">Upload Your Fits <span className="ob-label-optional">(optional — teaches us your style)</span></p>
            <button
              type="button"
              className="ob-upload-btn"
              onClick={() => fitInputRef.current?.click()}
            >
              <span className="ob-upload-icon">↑</span> Browse Photos
            </button>
            <input
              ref={fitInputRef}
              type="file"
              accept="image/*"
              multiple
              className="ob-hidden-input"
              onChange={handleFitFilesChange}
            />
            {fitPreviews.length > 0 && (
              <div className="ob-fit-previews">
                {fitPreviews.map((src, i) => (
                  <img key={i} src={src} alt={`fit ${i + 1}`} className="ob-fit-thumb" />
                ))}
              </div>
            )}
            {analyzeStatus && (
              <p className="ob-analyze-status">{analyzeStatus}</p>
            )}
          </div>

          {/* Bottom buttons */}
          <div className="ob-bottom-row">
            <button type="button" className="ob-back-btn" onClick={() => setStep(1)}>
              ‹
            </button>
            <button
              type="button"
              className="ob-continue-btn ob-finish-btn"
              onClick={handleFinish}
              disabled={saving || analyzingFits}
            >
              {saving || analyzingFits ? "Saving..." : "Finish Setup"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

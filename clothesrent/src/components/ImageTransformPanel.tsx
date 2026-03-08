import { useEffect, useRef, useState } from "react";
import type { ImageTransformations } from "../types/listing";
import { DEFAULT_TRANSFORMATIONS } from "../types/listing";
import { buildDisplayUrl } from "../utils/cloudinaryUrl";

interface Props {
  cloudinaryUrl: string;
  onChange: (transforms: ImageTransformations) => void;
}

export default function ImageTransformPanel({
  cloudinaryUrl,
  onChange,
}: Props) {
  const [transforms, setTransforms] = useState<ImageTransformations>({
    ...DEFAULT_TRANSFORMATIONS,
  });
  const [isEnhancedLoading, setIsEnhancedLoading] = useState(true);
  const enhancedImageRef = useRef<HTMLImageElement>(null);

  const update = (partial: Partial<ImageTransformations>) => {
    const next = { ...transforms, ...partial };
    setTransforms(next);
    onChange(next);
  };

  const previewUrl = buildDisplayUrl(cloudinaryUrl, {
    width: 400,
    height: 533,
    removeBg: transforms.removeBg,
    replaceBg: transforms.replaceBg ?? undefined,
    badge: transforms.badge ?? undefined,
    badgeColor: transforms.badgeColor,
  });

  useEffect(() => {
    setIsEnhancedLoading(!(enhancedImageRef.current?.complete ?? false));
  }, [previewUrl]);

  return (
    <div className="transform-panel">
      <h3 className="transform-panel-title">Enhance Your Photo</h3>
      <p className="transform-panel-subtitle">
        Apply Cloudinary AI features to make your listing stand out.
      </p>

      {/* Two-column: Enhanced preview LEFT, Controls RIGHT */}
      <div className="transform-layout">
        <div className="transform-enhanced-preview">
          <span className="transform-preview-label">Enhanced Preview</span>
          <div className="transform-preview-box transform-preview-box--active">
            <img
              ref={enhancedImageRef}
              src={previewUrl}
              alt="Enhanced preview"
              className={`transform-preview-img${isEnhancedLoading ? " transform-preview-img--loading" : ""}`}
              onLoad={() => setIsEnhancedLoading(false)}
              onError={() => setIsEnhancedLoading(false)}
            />
            {isEnhancedLoading && (
              <div
                className="image-loading-overlay"
                role="status"
                aria-live="polite">
                <span className="image-loading-spinner" aria-hidden="true" />
                <span className="image-loading-text">Applying changes...</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="transform-controls">
          {/* Background Removal */}
          <label className="transform-toggle-row">
            <span className="transform-toggle-label">
              AI Background Removal
              <span className="transform-toggle-hint">
                Removes the background and keeps the garment
              </span>
            </span>
            <input
              type="checkbox"
              className="transform-checkbox"
              checked={transforms.removeBg}
              disabled={!!transforms.replaceBg}
              onChange={(e) => update({ removeBg: e.target.checked })}
            />
          </label>

          {/* Background Replace */}
          <div className="transform-control-group">
            <label className="transform-toggle-row">
              <span className="transform-toggle-label">
                AI Background Replace
                <span className="transform-toggle-hint">
                  Replace the background with an AI-generated scene
                </span>
              </span>
              <input
                type="checkbox"
                className="transform-checkbox"
                checked={!!transforms.replaceBg}
                onChange={(e) =>
                  update({
                    replaceBg: e.target.checked
                      ? "clean white studio background"
                      : null,
                    removeBg: false,
                  })
                }
              />
            </label>
            {transforms.replaceBg !== null && (
              <input
                type="text"
                className="transform-prompt-input"
                placeholder="e.g. minimalist studio, urban street, marble floor..."
                value={transforms.replaceBg}
                onChange={(e) => update({ replaceBg: e.target.value })}
              />
            )}
          </div>

          {/* Smart Crop */}
          <label className="transform-toggle-row">
            <span className="transform-toggle-label">
              Smart Crop
              <span className="transform-toggle-hint">
                Auto-detects the garment and crops around it
              </span>
            </span>
            <input
              type="checkbox"
              className="transform-checkbox"
              checked={transforms.smartCrop}
              onChange={(e) => update({ smartCrop: e.target.checked })}
            />
          </label>

          {/* Conditional Badge */}
          <div className="transform-control-group">
            <label className="transform-toggle-row">
              <span className="transform-toggle-label">
                Badge Overlay
                <span className="transform-toggle-hint">
                  Add a text badge in the top-right corner
                </span>
              </span>
              <input
                type="checkbox"
                className="transform-checkbox"
                checked={!!transforms.badge}
                onChange={(e) =>
                  update({ badge: e.target.checked ? "NEW" : null })
                }
              />
            </label>
            {transforms.badge !== null && (
              <div className="transform-badge-row">
                <input
                  type="text"
                  className="transform-prompt-input transform-badge-text"
                  placeholder="NEW"
                  maxLength={12}
                  value={transforms.badge}
                  onChange={(e) =>
                    update({ badge: e.target.value.toUpperCase() })
                  }
                />
                <label className="transform-color-label">
                  Color
                  <input
                    type="color"
                    className="transform-color-input"
                    value={`#${transforms.badgeColor}`}
                    onChange={(e) =>
                      update({ badgeColor: e.target.value.replace("#", "") })
                    }
                  />
                </label>
              </div>
            )}
          </div>

          {/* Optimization note */}
          <p className="transform-note">
            ✓ Auto quality &amp; format optimization is always applied for fast
            delivery.
          </p>
        </div>
      </div>
    </div>
  );
}

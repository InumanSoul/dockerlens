import { useState } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import type { StorageStats, DockerImage } from "../types";

interface Props {
  stats: StorageStats | null;
  images: DockerImage[];
  dockerRunning: boolean;
  loading: boolean;
  cleaning: boolean;
  limitGb: number;
  onRefresh: () => void;
  onRemoveAll: () => void;
  onNavigateImages: () => void;
  onNavigateSettings: () => void;
}

export function Dashboard({
  stats,
  images,
  dockerRunning,
  loading,
  cleaning,
  limitGb,
  onRefresh,
  onRemoveAll,
  onNavigateImages,
  onNavigateSettings,
}: Props) {
  const [confirmAll, setConfirmAll] = useState(false);

  const handleRingKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onRefresh();
    }
  };

  const usedGb = stats ? stats.unused_bytes / 1_073_741_824 : 0;
  const pct = stats ? Math.min((usedGb / limitGb) * 100, 100) : 0;
  const level = pct >= 90 ? "danger" : pct >= 70 ? "warning" : "normal";

  const ringSize = 250;
  const strokeWidth = 12;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;

  const strokeColor =
    level === "danger" ? "#FF3B30" : level === "warning" ? "#FF9F0A" : "#1C1C1E";

  const handleClearUnused = () => {
    if (!confirmAll) {
      setConfirmAll(true);
      setTimeout(() => setConfirmAll(false), 3000);
      return;
    }
    setConfirmAll(false);
    onRemoveAll();
  };

  // Docker offline state
  if (!loading && !dockerRunning) {
    return (
      <div className="dashboard">
        <button
          className="nav-icon nav-icon-right"
          onClick={onNavigateSettings}
          title="Settings"
        >
          <SettingsIcon size={20} />
        </button>
        <div className="dashboard-offline">
          <p className="offline-title">Docker not running</p>
          <p className="offline-sub">Start Docker Desktop to continue</p>
        </div>
      </div>
    );
  }

  // Empty state (no unused images, not loading)
  if (!loading && stats && images.length === 0) {
    return (
      <div className="dashboard">
        <button
          className="nav-icon nav-icon-right"
          onClick={onNavigateSettings}
          title="Settings"
        >
          <SettingsIcon size={20} />
        </button>
        <div className="dashboard-body">
          <div
            className="ring-container"
            onClick={onRefresh}
            onKeyDown={handleRingKeyDown}
            title="Tap to refresh"
            role="button"
            tabIndex={0}
          >
            <svg
              className="ring-svg"
              width={ringSize}
              height={ringSize}
              viewBox={`0 0 ${ringSize} ${ringSize}`}
              role="img"
              aria-label="0% of storage limit used"
            >
              <circle
                className="ring-track"
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                strokeWidth={strokeWidth}
              />
            </svg>
            <div className="ring-content">
              <span className="ring-label">USED SPACE</span>
              <div className="ring-pct">
                <span className="ring-pct-number">0</span>
                <span className="ring-pct-symbol">%</span>
              </div>
              <div className="ring-detail">
                <span className="ring-detail-used">0GB</span>
                <span className="ring-detail-total"> OF {limitGb.toFixed(1)}GB TOTAL</span>
              </div>
            </div>
          </div>
        </div>
        <div className="dashboard-footer">
          <button className="cta-btn" disabled>
            Nothing to clean
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <button
        className="nav-icon nav-icon-right"
        onClick={onNavigateSettings}
        title="Settings"
      >
        <SettingsIcon size={20} />
      </button>

      <div className="dashboard-body">
        <div
          className={`ring-container ${loading ? "ring-loading" : ""}`}
          onClick={onRefresh}
          onKeyDown={handleRingKeyDown}
          title="Tap to refresh"
          role="button"
          tabIndex={0}
        >
          <svg
            className="ring-svg"
            width={ringSize}
            height={ringSize}
            viewBox={`0 0 ${ringSize} ${ringSize}`}
            role="img"
            aria-label={`${Math.round(pct)}% of storage limit used`}
          >
            <circle
              className="ring-track"
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              strokeWidth={strokeWidth}
            />
            <circle
              className="ring-fill"
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              strokeWidth={strokeWidth}
              stroke={strokeColor}
              strokeDasharray={circumference}
              strokeDashoffset={loading ? circumference * 0.75 : dashOffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="ring-content">
            <span className="ring-label">USED SPACE</span>
            <div className="ring-pct">
              <span className="ring-pct-number">{Math.round(pct)}</span>
              <span className="ring-pct-symbol">%</span>
            </div>
            <div className="ring-detail">
              <span className="ring-detail-used">{usedGb.toFixed(1)}GB</span>
              <span className="ring-detail-total">
                {" "}OF {limitGb.toFixed(1)}GB TOTAL
              </span>
            </div>
          </div>
        </div>

        {images.length > 0 && (
          <button className="see-all-link" onClick={onNavigateImages}>
            See All Images ({images.length}){" "}
            <span aria-hidden="true">&rarr;</span>
          </button>
        )}
      </div>

      <div className="dashboard-footer">
        <button
          className={`cta-btn ${confirmAll ? "cta-confirm" : ""}`}
          onClick={handleClearUnused}
          disabled={cleaning || images.length === 0}
        >
          {cleaning && <span className="btn-spinner" />}
          {confirmAll
            ? "Confirm — remove all?"
            : images.length === 0
              ? "Nothing to clean"
              : "Clear Unused"}
        </button>
      </div>
    </div>
  );
}

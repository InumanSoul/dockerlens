import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { Settings } from "../types";

interface Props {
  settings: Settings;
  onSave: (s: Settings) => void;
  onBack: () => void;
}

export function SettingsPanel({ settings, onSave, onBack }: Props) {
  const [draft, setDraft] = useState(settings);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="settings-panel">
      <div className="view-header">
        <button className="back-btn" onClick={onBack} title="Back">
          <ArrowLeft size={20} />
        </button>
        <span className="view-title">Settings</span>
      </div>

      <div className="settings-body">
        <div className="limit-section">
          <span className="limit-heading">Storage Limit</span>
          <span className="limit-big-value">{draft.limit_gb} GB</span>
          <input
            type="range"
            className="limit-slider-lg"
            min={1}
            max={50}
            step={1}
            value={draft.limit_gb}
            onChange={(e) => setDraft({ ...draft, limit_gb: Number(e.target.value) })}
          />
          <span className="limit-hint">Warn or clean when unused images exceed this</span>
        </div>

        <div className="setting-row">
          <div className="setting-label">
            <span className="setting-title">Auto-clean</span>
            <span className="setting-desc">Automatically remove when limit is hit</span>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={draft.auto_clean}
              onChange={(e) => setDraft({ ...draft, auto_clean: e.target.checked })}
            />
            <div className="toggle-track">
              <div className="toggle-thumb" />
            </div>
          </label>
        </div>
      </div>

      <div className="settings-footer">
        <button className={`save-btn ${saved ? "saved" : ""}`} onClick={handleSave}>
          {saved ? "Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}

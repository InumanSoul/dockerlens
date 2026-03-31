import { useState } from "react";
import type { Settings } from "../types";

interface Props {
  settings: Settings;
  onSave: (s: Settings) => void;
}

const POLL_OPTIONS = [
  { label: "30s", value: 30 },
  { label: "1m", value: 60 },
  { label: "5m", value: 300 },
  { label: "10m", value: 600 },
];

export function SettingsPanel({ settings, onSave }: Props) {
  const [draft, setDraft] = useState(settings);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="settings-panel">
      <div className="setting-row">
        <div className="setting-label">
          <span className="setting-title">Storage limit</span>
          <span className="setting-desc">Warn or clean when unused images exceed this</span>
        </div>
        <div className="limit-control">
          <input
            type="range"
            className="limit-slider"
            min={1}
            max={50}
            step={1}
            value={draft.limit_gb}
            onChange={(e) => setDraft({ ...draft, limit_gb: Number(e.target.value) })}
          />
          <span className="limit-value">{draft.limit_gb} GB</span>
        </div>
      </div>

      <div className="setting-row">
        <div className="setting-label">
          <span className="setting-title">Auto-clean</span>
          <span className="setting-desc">Automatically remove images when limit is hit</span>
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

      {draft.auto_clean && (
        <div className="setting-note warning">
          Auto-clean will permanently remove unused images without confirmation.
        </div>
      )}

      <div className="setting-row">
        <div className="setting-label">
          <span className="setting-title">Poll interval</span>
          <span className="setting-desc">How often to check Docker</span>
        </div>
        <div className="poll-options">
          {POLL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`poll-btn ${draft.poll_interval_secs === opt.value ? "active" : ""}`}
              onClick={() => setDraft({ ...draft, poll_interval_secs: opt.value })}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <button className={`save-btn ${saved ? "saved" : ""}`} onClick={handleSave}>
        {saved ? "Saved!" : "Save settings"}
      </button>
    </div>
  );
}

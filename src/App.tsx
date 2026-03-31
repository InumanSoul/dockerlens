import { useState } from "react";
import { TrayHeader } from "./components/TrayHeader";
import { StorageBar } from "./components/StorageBar";
import { ImageList } from "./components/ImageList";
import { SettingsPanel } from "./components/SettingsPanel";
import { useDockerImages } from "./hooks/useDockerImages";

type Tab = "images" | "settings";

export default function App() {
  const [tab, setTab] = useState<Tab>("images");
  const {
    images,
    stats,
    settings,
    dockerRunning,
    loading,
    cleaning,
    error,
    refresh,
    removeImage,
    removeAll,
    saveSettings,
  } = useDockerImages();

  return (
    <div className="app">
      <TrayHeader
        stats={stats}
        dockerRunning={dockerRunning}
        loading={loading}
        onRefresh={refresh}
      />

      {stats && (
        <div className="storage-section">
          <StorageBar usedBytes={stats.unused_bytes} limitGb={settings.limit_gb} />
        </div>
      )}

      <div className="tab-bar">
        <button
          className={`tab-btn ${tab === "images" ? "active" : ""}`}
          onClick={() => setTab("images")}
        >
          Images
          {images.length > 0 && <span className="tab-badge">{images.length}</span>}
        </button>
        <button
          className={`tab-btn ${tab === "settings" ? "active" : ""}`}
          onClick={() => setTab("settings")}
        >
          Settings
        </button>
      </div>

      <div className="tab-content">
        {error && (
          <div className="error-banner">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        {!dockerRunning && !loading && (
          <div className="docker-offline">
            <p>Docker not detected</p>
            <span>Start Docker Desktop and refresh</span>
          </div>
        )}

        {tab === "images" && dockerRunning && (
          <ImageList
            images={images}
            onRemove={removeImage}
            onRemoveAll={removeAll}
            cleaning={cleaning}
          />
        )}

        {tab === "settings" && (
          <SettingsPanel settings={settings} onSave={saveSettings} />
        )}
      </div>
    </div>
  );
}

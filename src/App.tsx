import { useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { ImageList } from "./components/ImageList";
import { SettingsPanel } from "./components/SettingsPanel";
import { useDockerImages } from "./hooks/useDockerImages";

type View = "dashboard" | "images" | "settings";

export default function App() {
  const [view, setView] = useState<View>("dashboard");
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
    <div className="app-wrapper">
      <div className="notch-arrow" />
      <div className="app">
      {error && (
        <div className="error-banner" role="alert">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
            <path
              d="M7 4v3.5M7 9.5v.5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
          {error}
        </div>
      )}

      <div className="view-container">
        {view === "dashboard" && (
          <Dashboard
            stats={stats}
            images={images}
            dockerRunning={dockerRunning}
            loading={loading}
            cleaning={cleaning}
            limitGb={settings.limit_gb}
            onRefresh={refresh}
            onRemoveAll={removeAll}
            onNavigateImages={() => setView("images")}
            onNavigateSettings={() => setView("settings")}
          />
        )}

        {view === "images" && (
          <ImageList
            images={images}
            onRemove={removeImage}
            onRemoveAll={removeAll}
            cleaning={cleaning}
            onBack={() => setView("dashboard")}
          />
        )}

        {view === "settings" && (
          <SettingsPanel
            settings={settings}
            onSave={saveSettings}
            onBack={() => setView("dashboard")}
          />
        )}
      </div>
      </div>
    </div>
  );
}

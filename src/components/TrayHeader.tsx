import type { StorageStats } from "../types";

interface Props {
  stats: StorageStats | null;
  dockerRunning: boolean;
  loading: boolean;
  onRefresh: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return (bytes / 1_073_741_824).toFixed(1) + " GB";
  if (bytes >= 1_048_576) return (bytes / 1_048_576).toFixed(0) + " MB";
  return (bytes / 1024).toFixed(0) + " KB";
}

export function TrayHeader({ stats, dockerRunning, loading, onRefresh }: Props) {
  return (
    <div className="tray-header">
      <div className="header-left">
        <span className="app-name">DockerLens</span>
      </div>
      <div className="header-right">
        <span className={`status-dot ${dockerRunning ? "online" : "offline"}`} />
        {stats && (
          <span className="storage-badge">{formatBytes(stats.unused_bytes)}</span>
        )}
        <button
          className={`refresh-btn ${loading ? "spinning" : ""}`}
          onClick={onRefresh}
          disabled={loading}
          title="Refresh"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M11.5 7a4.5 4.5 0 1 1-1.3-3.18"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <path d="M11.5 2.5v1.5H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

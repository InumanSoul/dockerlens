import { useState } from "react";
import type { DockerImage } from "../types";
import { ArrowLeft, Trash2 as Trash2Icon } from "lucide-react";

interface Props {
  images: DockerImage[];
  onRemove: (id: string) => void;
  onRemoveAll: () => void;
  cleaning: boolean;
  onBack: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return (bytes / 1_073_741_824).toFixed(1) + " GB";
  if (bytes >= 1_048_576) return (bytes / 1_048_576).toFixed(0) + " MB";
  return (bytes / 1024).toFixed(0) + " KB";
}

function timeAgo(unix: number): string {
  const diff = Math.floor(Date.now() / 1000 - unix);
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  return Math.floor(diff / 86400) + "d ago";
}

export function ImageList({ images, onRemove, onRemoveAll, cleaning, onBack }: Props) {
  const [confirmAll, setConfirmAll] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  if (images.length === 0) {
    return (
      <div className="image-list-wrap">
        <div className="view-header">
          <button className="back-btn" onClick={onBack} title="Back">
            <ArrowLeft size={20} />
          </button>
          <span className="view-title">Images</span>
        </div>
        <div className="empty-state">
          <span className="empty-title">All clean</span>
          <span className="empty-sub">No unused images found</span>
        </div>
      </div>
    );
  }

  const handleRemove = async (id: string) => {
    setRemoving(id);
    await onRemove(id);
    setRemoving(null);
  };

  const handleRemoveAll = () => {
    if (!confirmAll) {
      setConfirmAll(true);
      setTimeout(() => setConfirmAll(false), 3000);
      return;
    }
    setConfirmAll(false);
    onRemoveAll();
  };

  return (
    <div className="image-list-wrap">
      <div className="view-header">
        <button className="back-btn" onClick={onBack} title="Back">
          <ArrowLeft size={20} />
        </button>
        <span className="view-title">Images</span>
      </div>
      <div className="list-toolbar">
        <span className="list-count">{images.length} unused image{images.length !== 1 ? "s" : ""}</span>
        <button
          className={`clean-all-btn ${confirmAll ? "confirm" : ""}`}
          onClick={handleRemoveAll}
          disabled={cleaning}
        >
          {cleaning && <span className="btn-spinner small" />}
          {confirmAll ? "Confirm — remove all?" : "Remove all"}
        </button>
      </div>
      <ul className="image-list">
        {images.map((img) => (
          <li key={img.id} className={`image-row ${removing === img.id ? "removing" : ""}`}>
            <div className="image-info">
              <span className="image-name">
                {img.tags.length > 0 ? img.tags[0] : img.short_id}
              </span>
              <span className="image-meta">
                <span className="image-size">{formatBytes(img.size)}</span>
                <span className="meta-dot">&middot;</span>
                <span>{timeAgo(img.created)}</span>
                <span className="meta-dot">&middot;</span>
                <span className="image-reason">{img.reason}</span>
              </span>
            </div>
            <button
              className="remove-btn"
              onClick={() => handleRemove(img.id)}
              disabled={removing === img.id}
              title="Remove image"
            >
              <Trash2Icon size={16} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

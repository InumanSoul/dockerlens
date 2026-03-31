interface Props {
  usedBytes: number;
  limitGb: number;
}

export function StorageBar({ usedBytes, limitGb }: Props) {
  const usedGb = usedBytes / 1_073_741_824;
  const pct = Math.min((usedGb / limitGb) * 100, 100);
  const level = pct >= 90 ? "danger" : pct >= 70 ? "warning" : "";

  return (
    <div className="storage-bar-wrap">
      <div className="storage-bar-labels">
        <span className="storage-label">Unused images</span>
        <span className={`storage-value ${level}`}>
          {usedGb.toFixed(1)} / {limitGb.toFixed(0)} GB
        </span>
      </div>
      <div className="storage-track">
        <div
          className={`storage-fill ${level}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

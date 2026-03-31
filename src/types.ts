export interface DockerImage {
  id: string;
  short_id: string;
  tags: string[];
  size: number;
  created: number;
  reason: string;
}

export interface StorageStats {
  total_bytes: number;
  unused_bytes: number;
  image_count: number;
}

export interface Settings {
  limit_gb: number;
  auto_clean: boolean;
  poll_interval_secs: number;
  breach_notified: boolean;
}

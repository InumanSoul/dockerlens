import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DockerImage, Settings, StorageStats } from "../types";

interface State {
  images: DockerImage[];
  stats: StorageStats | null;
  settings: Settings;
  dockerRunning: boolean;
  loading: boolean;
  cleaning: boolean;
  error: string | null;
}

const DEFAULT_SETTINGS: Settings = {
  limit_gb: 5,
  auto_clean: false,
  poll_interval_secs: 60,
  breach_notified: false,
};

export function useDockerImages() {
  const [state, setState] = useState<State>({
    images: [],
    stats: null,
    settings: DEFAULT_SETTINGS,
    dockerRunning: false,
    loading: true,
    cleaning: false,
    error: null,
  });

  const isMounted = useRef(true);

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [dockerRunning, images, stats, settings] = await Promise.all([
        invoke<boolean>("is_docker_running"),
        invoke<DockerImage[]>("list_unused_images").catch(() => []),
        invoke<StorageStats>("get_storage_stats").catch(() => null),
        invoke<Settings>("get_settings"),
      ]);
      if (isMounted.current) {
        setState((s) => ({
          ...s,
          dockerRunning,
          images,
          stats,
          settings,
          loading: false,
          error: null,
        }));
      }
    } catch (e) {
      if (isMounted.current) {
        setState((s) => ({
          ...s,
          loading: false,
          dockerRunning: false,
          error: String(e),
        }));
      }
    }
  }, []);

  const removeImage = useCallback(async (imageId: string) => {
    try {
      await invoke("remove_image", { imageId });
      await refresh();
    } catch (e) {
      setState((s) => ({ ...s, error: String(e) }));
    }
  }, [refresh]);

  const removeAll = useCallback(async () => {
    setState((s) => ({ ...s, cleaning: true }));
    try {
      await invoke("remove_all_unused");
      await refresh();
    } catch (e) {
      setState((s) => ({ ...s, error: String(e), cleaning: false }));
    }
    setState((s) => ({ ...s, cleaning: false }));
  }, [refresh]);

  // Save settings and re-poll
  const saveSettings = useCallback(async (settings: Settings) => {
    await invoke("save_settings", { settings });
    setState((s) => ({ ...s, settings }));
  }, []);

  useEffect(() => {
    isMounted.current = true;
    refresh();

    const unListen = listen("docker-stats-updated", () => {
      if (isMounted.current) refresh();
    });

    return () => {
      isMounted.current = false;
      unListen.then((f) => f());
    };
  }, [refresh]);

  return { ...state, refresh, removeImage, removeAll, saveSettings };
}

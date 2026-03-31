use tauri_plugin_store::StoreExt;

use crate::docker::{self, DockerImage, StorageStats};
use crate::settings::Settings;

// ── Docker commands ──────────────────────────────────────────────────────────

#[tauri::command]
pub async fn list_unused_images() -> Result<Vec<DockerImage>, String> {
    docker::list_unused_images().await
}

#[tauri::command]
pub async fn remove_image(image_id: String) -> Result<(), String> {
    docker::remove_image(&image_id).await
}

#[tauri::command]
pub async fn remove_all_unused() -> Result<usize, String> {
    docker::remove_all_unused().await
}

#[tauri::command]
pub async fn get_storage_stats() -> Result<StorageStats, String> {
    docker::get_storage_stats().await
}

#[tauri::command]
pub fn is_docker_running() -> bool {
    docker::socket_path().is_some()
}

// ── Settings commands ────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_settings(app: tauri::AppHandle) -> Result<Settings, String> {
    let store = app
        .store("settings.json")
        .map_err(|e| format!("Store error: {e}"))?;

    let settings = match store.get("settings") {
        Some(v) => serde_json::from_value::<Settings>(v)
            .unwrap_or_default(),
        None => Settings::default(),
    };

    Ok(settings)
}

#[tauri::command]
pub async fn save_settings(app: tauri::AppHandle, settings: Settings) -> Result<(), String> {
    let store = app
        .store("settings.json")
        .map_err(|e| format!("Store error: {e}"))?;

    let value = serde_json::to_value(&settings)
        .map_err(|e| format!("Serialize error: {e}"))?;

    store.set("settings", value);
    store.save().map_err(|e| format!("Save error: {e}"))?;

    Ok(())
}

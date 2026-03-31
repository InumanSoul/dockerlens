mod commands;
mod docker;
mod settings;

use settings::Settings;
use tauri::{
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, WindowEvent,
};
use tauri_plugin_positioner::{Position, WindowExt};
use tauri_plugin_store::StoreExt;

// ── App entry point ──────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Plugins
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_notification::init())
        // Commands
        .invoke_handler(tauri::generate_handler![
            commands::list_unused_images,
            commands::remove_image,
            commands::remove_all_unused,
            commands::get_storage_stats,
            commands::get_settings,
            commands::save_settings,
            commands::is_docker_running,
        ])
        .setup(|app| {
            // ── Hide dock icon on macOS ──────────────────────────────────
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            // ── Build tray icon ──────────────────────────────────────────
            let tray_icon = tauri::image::Image::from_bytes(
                include_bytes!("../icons/32x32@2x.png"),
            )
            .expect("failed to load tray icon");

            TrayIconBuilder::new()
                .icon(tray_icon)
                .icon_as_template(true)
                .tooltip("DockerLens")
                .show_menu_on_left_click(false) // left click = show window
                .on_tray_icon_event(|tray, event| {
                    // Keep positioner in sync with tray state
                    tauri_plugin_positioner::on_tray_event(
                        tray.app_handle(),
                        &event,
                    );

                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        toggle_window(app);
                    }
                })
                .build(app)?;

            // ── Hide window when it loses focus ──────────────────────────
            let window = app.get_webview_window("main").unwrap();
            let win_clone = window.clone();
            window.on_window_event(move |event| {
                if let WindowEvent::Focused(false) = event {
                    win_clone.hide().ok();
                }
            });

            // ── Background polling loop ──────────────────────────────────
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                polling_loop(app_handle).await;
            });

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error building tauri application")
        .run(|_app_handle, event| {
            // Keep running in background when all windows are closed
            if let tauri::RunEvent::ExitRequested { api, .. } = event {
                api.prevent_exit();
            }
        });
}

// ── Window toggle ────────────────────────────────────────────────────────────

fn toggle_window(app: &tauri::AppHandle) {
    let window = match app.get_webview_window("main") {
        Some(w) => w,
        None => return,
    };

    if window.is_visible().unwrap_or(false) {
        window.hide().ok();
    } else {
        let win_for_pos = window.clone();
        if std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            let _ = win_for_pos.move_window(Position::TrayBottomCenter);
        }))
        .is_err()
        {
            let _ = window.center();
        }
        window.show().ok();
        window.set_focus().ok();
    }
}

// ── Background polling ───────────────────────────────────────────────────────

async fn polling_loop(app: tauri::AppHandle) {
    loop {
        // Load current settings
        let settings = load_settings(&app);
        let poll_secs = settings.poll_interval_secs.max(10); // minimum 10s

        tokio::time::sleep(tokio::time::Duration::from_secs(poll_secs)).await;

        // Skip check if Docker isn't available
        if docker::socket_path().is_none() {
            continue;
        }

        match docker::get_storage_stats().await {
            Ok(stats) => {
                let used_gb = stats.unused_bytes as f64 / 1_073_741_824.0;
                let settings = load_settings(&app);

                if used_gb >= settings.limit_gb {
                    if settings.auto_clean {
                        // Auto-clean mode: silently remove and notify result
                        match docker::remove_all_unused().await {
                            Ok(count) => send_notification(
                                &app,
                                "DockerLens: Auto-cleaned",
                                &format!("Removed {count} unused images ({used_gb:.1} GB freed)"),
                            ),
                            Err(e) => send_notification(
                                &app,
                                "DockerLens: Cleanup failed",
                                &e,
                            ),
                        }
                    } else if !settings.breach_notified {
                        // Warn mode: notify once per breach
                        send_notification(
                            &app,
                            "DockerLens: Storage limit hit",
                            &format!(
                                "{used_gb:.1} GB of unused images exceeds your {:.1} GB limit. Open DockerLens to clean up.",
                                settings.limit_gb
                            ),
                        );
                        // Mark as notified so we don't spam
                        let mut s = settings.clone();
                        s.breach_notified = true;
                        save_settings_raw(&app, &s);
                    }
                } else {
                    // Below threshold — reset notification flag
                    let mut s = settings.clone();
                    if s.breach_notified {
                        s.breach_notified = false;
                        save_settings_raw(&app, &s);
                    }
                }

                // Emit event to frontend so the UI can refresh without polling
                app.emit("docker-stats-updated", &stats).ok();
            }
            Err(e) => {
                eprintln!("DockerLens poll error: {e}");
            }
        }
    }
}

fn load_settings(app: &tauri::AppHandle) -> Settings {
    match app.store("settings.json") {
        Ok(store) => match store.get("settings") {
            Some(v) => serde_json::from_value::<Settings>(v).unwrap_or_default(),
            None => Settings::default(),
        },
        Err(_) => Settings::default(),
    }
}

fn save_settings_raw(app: &tauri::AppHandle, settings: &Settings) {
    if let Ok(store) = app.store("settings.json") {
        if let Ok(v) = serde_json::to_value(settings) {
            store.set("settings", v);
            store.save().ok();
        }
    }
}

fn send_notification(app: &tauri::AppHandle, title: &str, body: &str) {
    use tauri_plugin_notification::NotificationExt;
    app.notification()
        .builder()
        .title(title)
        .body(body)
        .show()
        .ok();
}

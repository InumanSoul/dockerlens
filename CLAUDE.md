# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is DockerLens

A macOS menu bar app that monitors and cleans unused Docker images. Built with Tauri v2 (Rust backend + React frontend). Runs as a tray icon (no dock icon), shows a popover window on click.

## Build & Run

```bash
npm install              # frontend deps (first time)
npx tauri dev            # development with hot reload (Vite on :1420 + Rust rebuild)
npx tauri build          # production .app bundle
cargo check --manifest-path src-tauri/Cargo.toml  # Rust-only type check
```

### Key Constraints

- **hyperlocal 0.8** pins hyper to 0.14 — uses `hyper::Client::unix()` and `hyper::Body` which were removed in hyper 1.0. Do not upgrade hyper.
- **tauri-plugin-positioner** `move_window()` panics if the OS hasn't reported tray position yet — wrapped in `catch_unwind` in `toggle_window()`.
- **macOSPrivateApi** is enabled in `tauri.conf.json` for transparent window support.
- Docker socket detection checks `/var/run/docker.sock` first, then `$HOME/.docker/run/docker.sock` (Docker Desktop on macOS).

## Architecture

### Rust Backend (Tauri)

Three modules under `src-tauri/src/`:

- **`lib.rs`** — App entry point. Sets up tray icon, hides dock icon (`ActivationPolicy::Accessory`), manages window toggle/positioning via `tauri-plugin-positioner`, and runs a tokio background polling loop. The polling loop checks unused image size against the user's limit and either auto-cleans or sends a macOS notification (once per breach, reset when usage drops).
- **`docker.rs`** — Direct Docker Engine API client over Unix socket using `hyperlocal`. No Docker CLI dependency. Provides `list_unused_images()`, `remove_image()`, `remove_all_unused()`, `get_storage_stats()`. The `DockerImage` struct carries `tags` and a `reason` field (`"dangling" | "untagged" | "unused"`), but `list_unused_images()` currently only ever emits dangling images (empty tags) — the other reasons are reserved for future use. `get_storage_stats()` sums only unused images, so `total_bytes == unused_bytes`.
- **`commands.rs`** — Thin IPC bridge: each `#[tauri::command]` delegates directly to `docker.rs` or reads/writes settings via `tauri-plugin-store`.
- **`settings.rs`** — `Settings` struct with `limit_gb` (f64), `auto_clean`, `poll_interval_secs` (u64, min 10s, defaults 60), `breach_notified`. Persisted via tauri-plugin-store as `settings.json`. Note: `poll_interval_secs` no longer has a UI control after the minimalist redesign, so the frontend `Settings` interface (`types.ts`) omits it — the field lives Rust-side only.

### Frontend (React + Vite)

Source lives in `src/`. Vite dev server runs on `:1420`.

- **`hooks/useDockerImages.ts`** — Central hook that owns all `invoke()` calls. Fetches images, stats, settings in parallel on mount. Listens for `docker-stats-updated` events from the backend polling loop to auto-refresh.
- **`App.tsx`** — Single-window app with three views switched via local `view` state (not tabs): `dashboard` (default), `images`, `settings`. Dashboard navigates to the other two and back.
- **`components/`** — `Dashboard` (landing view: storage summary + clean-all + nav), `ImageList` (per-image remove + remove-all), `SettingsPanel` (limit + auto-clean). `TrayHeader` and `StorageBar` still exist as files but are orphaned after the minimalist redesign — not imported anywhere. Don't extend them; fold any needed logic into `Dashboard`.
- **`types.ts`** — Shared TypeScript interfaces (`DockerImage`, `StorageStats`, `Settings`) mirroring the Rust structs.
- **`index.css`** — Complete dark-mode styling targeting macOS popover aesthetic. Uses CSS custom properties for theming.

### Data Flow

1. Backend polling loop (`lib.rs`) runs on an interval, checks `docker.rs` for stats, emits `docker-stats-updated` event to frontend.
2. Frontend hook listens for that event and calls `refresh()` which re-invokes all commands in parallel.
3. Settings are persisted via `tauri-plugin-store` and read by both the polling loop (Rust side) and the settings panel (frontend side).

### Tauri Plugins Used

- `tauri-plugin-store` — JSON key-value persistence for settings
- `tauri-plugin-positioner` — Window positioning relative to tray icon
- `tauri-plugin-notification` — macOS notifications for storage alerts

### IPC Commands

| Command | Args | Returns |
|---------|------|---------|
| `list_unused_images` | — | `Vec<DockerImage>` |
| `remove_image` | `imageId: String` | `()` |
| `remove_all_unused` | — | `usize` (count removed) |
| `get_storage_stats` | — | `StorageStats` |
| `is_docker_running` | — | `bool` |
| `get_settings` | — | `Settings` |
| `save_settings` | `settings: Settings` | `()` |

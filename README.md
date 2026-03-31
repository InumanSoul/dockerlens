# DockerLens

A lightweight macOS menu bar app that monitors and cleans unused Docker images. Sits in your tray, shows storage usage at a glance, and lets you reclaim disk space in one click.

![macOS](https://img.shields.io/badge/macOS-Ventura%2B-black?logo=apple)
![Tauri](https://img.shields.io/badge/Tauri-v2-blue)
![License](https://img.shields.io/badge/license-MIT-green)

<p align="center">
  <img src=".github/assets/dockerlens-full.png" width="260" alt="DockerLens — Images tab" />
  <img src=".github/assets/dockerlens-settings.png" width="260" alt="DockerLens — Settings tab" />
  <img src=".github/assets/dockerlens-empty.png" width="260" alt="DockerLens — All clean" />
</p>

## Features

- **Menu bar native** — runs as a tray icon, no dock clutter
- **Real-time monitoring** — background polling detects unused Docker images automatically
- **Storage bar** — visual indicator with warning/danger thresholds
- **One-click cleanup** — remove individual images or all unused at once
- **Auto-clean mode** — automatically remove images when your storage limit is hit
- **macOS notifications** — get alerted when unused images exceed your threshold
- **Configurable** — set storage limits (1-50 GB), poll intervals (30s to 10m)
- **No Docker CLI dependency** — talks directly to the Docker Engine API over Unix socket

## Install

### Download (recommended)

Grab the latest `.dmg` from [Releases](../../releases), open it, and drag DockerLens to Applications.

> **Note:** The app is not yet code-signed. On first launch, right-click the app and select **Open**, then click **Open** in the dialog. You only need to do this once. Alternatively, run:
> ```bash
> xattr -cr ****/Applications/DockerLens.app
> ```

### Homebrew (coming soon)

```bash
brew tap InumanSoul/tap
brew install --cask dockerlens
```

## Usage

1. **Click the tray icon** to open the popover
2. **Images tab** — see all dangling/unused images with size, age, and a delete button
3. **Settings tab** — configure storage limit, auto-clean, and poll interval
4. The app polls Docker in the background and updates automatically

## Requirements

- macOS 13 (Ventura) or later
- Docker Desktop or Docker Engine running

## Building from source

```bash
git clone https://github.com/InumanSoul/dockerlens.git
cd dockerlens
npm install
npx tauri dev            # dev mode with hot reload
npx tauri build          # production .app + .dmg
```

**Prerequisites:** Node.js 20+, Rust (stable), Xcode Command Line Tools.

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Rust, Tauri v2, hyper 0.14 + hyperlocal (Unix socket) |
| Frontend | React 18, TypeScript, Vite |
| Persistence | tauri-plugin-store |
| Notifications | tauri-plugin-notification |

## Contributing

Pull requests welcome. For major changes, open an issue first.

## License

[MIT](LICENSE)

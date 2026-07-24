# LiquidLaunch

A macOS **Launchpad**-style app launcher for Windows 11, matching LiquidDock's
dark liquid glass. Fullscreen frosted overlay, live search, click to launch.

**v0.1 Alpha — Cloudex Labs**

## Run it

```powershell
cd launcher
npm install      # first time only (downloads Electron)
npm start
```

- **Ctrl + Alt + Space** — summon / dismiss the launcher from anywhere
- **Type** — filters apps instantly
- **Enter** — launches the first match
- **Esc** or click empty space — dismiss
- **Ctrl + Alt + Q** — fully quit LiquidLaunch

It stays running in the background after first launch so the hotkey is instant.

## How it works

- **App list:** reads `.lnk` shortcuts from the all-users and current-user
  Start Menu folders, de-dupes, and filters out uninstallers/readmes.
- **Icons:** extracted natively from each shortcut via Electron's
  `app.getFileIcon` — real shell icons, no icon packs needed.
- **Glass:** the window uses Windows 11's native `acrylic` background material,
  with a dark tint + specular search field on top to match the dock.
- **Multi-monitor:** opens on whichever monitor your mouse is on.

## Make it feel native (optional)

- **Launch on the Win key / Start button:** bind `Ctrl+Alt+Space` at the OS
  level, or replace the Start button action with a shortcut to this app. Easiest
  path: create a shortcut to `launcher\start-liquidlaunch.vbs` (below) and pin
  it, or set it to run at login (Win+R → `shell:startup` → drop a shortcut in).
- **Run at login:** put a shortcut to the launcher in the Startup folder so the
  hotkey works from boot.

## Roadmap

- Package as a standalone `.exe` (electron-builder) so it runs without `npm`
- Pages + drag-to-reorder, folders
- Pin the grid to the wallpaper (blur the desktop only, not windows)
- Bind directly to the Start button / a hot corner
- Frequency/recent sorting

## Honesty

This is a real, standalone launcher — the "Launchpad" piece that a taskbar
styler can't provide. v0.1 is a working core: enumerate, search, launch, glass.
It is not yet packaged into a distributable installer; that's the next step.

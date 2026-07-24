# LiquidLaunch + LiquidBoard

A macOS-style desktop for Windows 11, in two layers that sit around LiquidDock
(your taskbar stays exactly as it is):

1. **LiquidBoard** — glass **widgets pinned to the desktop wallpaper**, behind
   your windows (like macOS desktop widgets). Always visible, click-through.
2. **LiquidLaunch** — a **Launchpad** app grid you summon from the **top-left
   hot corner** (slam the mouse into the corner) or `Ctrl+Alt+Space`.

**v0.3 Alpha — Cloudex Labs**

## Run it

```powershell
cd launcher
npm install      # first time only (downloads Electron)
npm start
```

For a real, window-less background run, launch `start-liquidlaunch.vbs` instead
(pin it or add it to `shell:startup`). Boot-on-login + a packaged `.exe` are the
next milestone.

### Controls

- **Top-left corner** (or **Ctrl+Alt+Space**) — open the app launcher
- **Type** — filter apps · **Enter** — launch top match
- **← / →** or **scroll** — flip Launchpad pages
- **Esc** or click empty space — dismiss the launcher
- **Ctrl+Alt+Q** — quit everything

### Clear the desktop (recommended, for the full effect)

The widgets are meant to be the *only* thing on your desktop:

```powershell
# from the repo root
powershell -ExecutionPolicy Bypass -File clear-desktop.ps1 -Hide
```

## Widgets on the board

Clock, Weather (IP-located via open-meteo), System (CPU / memory / battery),
and a month Calendar — glass cards stacked in the top-right of the desktop.

## How the desktop pinning works

Windows hosts the desktop icons in a `SHELLDLL_DefView` window. On this build
(Win11 26200) that lives under **Progman**, so `src/win32-desktop.js` uses
[koffi](https://koffi.dev) (a prebuilt FFI — no compiler needed) to call the
Win32 `SetParent` and re-parent the board window into Progman. That makes it
render on the desktop, beneath normal app windows. The board is transparent and
click-through, so only the cards paint and the desktop stays fully usable.

> `node src/win32-debug.js` dumps the live desktop window tree if pinning ever
> misbehaves after a Windows update.

## Architecture

```
src/
  main.js          orchestrates both windows + hot corner + desktop pin
  win32-desktop.js  koffi Progman/WorkerW pinning
  preload.js        context-isolated bridge (getApps/launch/getSystem/getWeather)
  renderer/         LiquidLaunch — the app grid overlay (acrylic)
  board/            LiquidBoard  — the desktop widgets (transparent, pinned)
```

## Roadmap

- **Next: package to a standalone `.exe`** (electron-builder) + run at login +
  wire the launcher to the Start button
- Drag-to-reorder + folders in the launcher
- More widgets + draggable widget layout on the board
- Per-monitor board

## Self-test

`electron . --smoke` boots both windows headless (renderer + board + icon
pipeline + desktop-pin probe), writes `smoke-result.json`, and quits — verifies
changes without popping any window.

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
- **Apps / Widgets tabs** (or **Tab** key) — switch between the app grid and the
  widgets dashboard
- **Type** — filters apps instantly
- **Enter** — launches the first match
- **← / →** or **scroll** — flip between Launchpad pages
- **Esc** or click empty space — dismiss
- **Ctrl + Alt + Q** — fully quit LiquidLaunch

## Widgets

The Widgets tab shows a live dashboard in matching glass cards:
- **Clock** — live time + full date
- **Weather** — current conditions + temperature (IP-based location via
  open-meteo; shows "Offline" with no network)
- **System** — CPU load, memory used/total, battery %
- **Calendar** — current month with today highlighted

> Privacy note: the weather widget makes an outbound request to determine your
> approximate city from your IP. Nothing is stored. Remove the Weather card (or
> the `get-weather` handler in `src/main.js`) if you'd rather it never reaches
> the network.

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

- **Next: package as a standalone `.exe`** (electron-builder) + run on boot +
  bind to the Start button so it replaces the Windows launcher
- Drag-to-reorder + folders (drag one app onto another)
- Pin the grid to the wallpaper (blur the desktop only, not windows)
- More widgets (media/now-playing, quick toggles, notes) + widget layout config
- Frequency/recent sorting

## Self-test

`electron . --smoke` boots the whole app headless (window + renderer + icon
pipeline + widgets), writes findings to `smoke-result.json`, and quits — used to
verify changes without popping the fullscreen overlay.

## Honesty

This is a real, standalone launcher — the "Launchpad" piece that a taskbar
styler can't provide. v0.1 is a working core: enumerate, search, launch, glass.
It is not yet packaged into a distributable installer; that's the next step.

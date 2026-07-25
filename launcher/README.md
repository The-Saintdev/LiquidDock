# LiquidHome

A macOS-style **desktop shell / launcher** for Windows 11 — a custom home with a
menu bar, widgets, freely-placed photos, a Launchpad app menu, gradients/custom
wallpaper, and a real full-screen takeover. Built on Electron. No native modules.

**Cloudex Labs — MIT**

## Two ways to run

```powershell
cd launcher
npm install          # first time only
npm start            # WINDOWED dev mode (normal closable window)
npm run shell        # TAKEOVER mode (full-screen launcher on the primary monitor)
```

- **Ctrl+Alt+Space** — bring the home forward
- **Ctrl+Alt+Q** — quit (always works)
- Menu-bar **◱** — open Launchpad · **⚙** — Settings
- **Right-click** the desktop — Refresh, New Folder, Display Settings, etc.

## Build a standalone .exe

```powershell
cd launcher
npm run pack         # -> dist/LiquidHome-win32-x64/LiquidHome.exe
```

`npm run pack` uses @electron/packager (no signing, no admin needed). The
resulting `LiquidHome.exe` **defaults to takeover mode** — double-click it and it
becomes your full-screen launcher. Pass `--windowed` to open it as a normal
window instead.

> Move the whole `LiquidHome-win32-x64` folder somewhere stable (e.g.
> `C:\Users\<you>\LiquidHome\`) before setting it to run on boot, so the startup
> path doesn't break.

## Run on boot

Open **Settings (⚙) → "Launch on Windows startup"** and toggle it on. That
registers the current `LiquidHome.exe` to start with Windows (in takeover mode).
Toggle it off to remove it. (Ctrl+Alt+Q always quits a running instance.)

## Settings (no code edits)

Background (6 gradients / Windows wallpaper / **custom image**), app icon size,
Launchpad columns, mac icon tiles, 24-h clock, per-widget show/hide, add desktop
**photos** (drag to move, corner to resize), and launch-on-boot.

## Widgets

Clock, Weather (open-meteo, IP-located), System (CPU/mem/battery), Uptime,
Calendar, Notes (saved), and freely-placed Photos.

## How takeover works (and its one honest limit)

The shell is a normal, **interactive** full-screen window on the primary monitor
— clicks, right-click, and keyboard search all work. It is deliberately **not**
pinned into the Windows wallpaper layer: that layer is display-only, so a pinned
window can't be clicked (an earlier approach; removed). The trade-off: the home
doesn't stay behind your apps automatically like a live wallpaper — it's the home
you return to (Ctrl+Alt+Space), the way macOS Launchpad works. Apps, the taskbar
(LiquidDock), and your password manager all work normally on top of it.

The window is sized 1px short of the monitor so Windows keeps the taskbar visible
over it. External monitors are left as normal Windows.

## Architecture

```
src/
  main.js       window(s), app enumeration, config, IPC, boot toggle, right-click actions
  preload.js    context-isolated bridge
  home/         the shell UI (index.html / style.css / home.js)
iconpack/        optional PNGs named after apps to override icons (you skipped this)
```

## Roadmap

- Drag-to-reorder + folders in Launchpad
- Bind the Start button / a hot corner to bring the home forward
- More widgets (media, quick toggles)
- Signed installer (needs a code-signing cert)

# Changelog

## Unreleased — takeover primary-monitor fix + context menu (2026-07-25)

- **Full-screen fix (real cause):** Progman spans ALL monitors with a negative
  origin (external monitor to the left at x=-1067). Filling its whole client
  landed the shell across both screens ("shifted to one side"). Now
  `pinToDesktop` places the window over the **primary monitor** — screen (0,0)
  sized `SM_CXSCREEN×SM_CYSCREEN`, converted into Progman-client coords via
  `GetWindowRect`. (koffi: added GetWindowRect, GetSystemMetrics.)
- **Custom desktop right-click menu:** since the opaque takeover covers the
  native desktop, added our own mac-style context menu — Refresh, New Folder,
  Open Desktop Folder, Change Wallpaper, Display Settings, Personalize, Terminal,
  Task Manager — wired to real Windows actions (`ms-settings:`, explorer, etc.).

## Unreleased — takeover fill/raise + custom wallpaper (2026-07-25)

- **Takeover now fills the whole desktop:** after `SetParent` into Progman,
  `pinToDesktop` reads Progman's client rect and `MoveWindow`s the shell to the
  real desktop pixels (fixes the dual-monitor/DPI "stuck in a corner" bug), then
  `SetWindowPos(HWND_TOP)` raises it above `SHELLDLL_DefView` so it covers the
  desktop icons — a real takeover. (koffi: added MoveWindow, SetWindowPos,
  GetClientRect + RECT struct.)
- **Custom wallpaper:** Settings → Background → "Custom image…" lets you pick any
  image as the shell wallpaper (saved in config). Works alongside designed
  gradients and the Windows-wallpaper option.

## Unreleased — LiquidHome widgets + gradients + takeover mode (2026-07-25)

- **New widgets:** Uptime, editable **Notes** (persisted), and **Photo frames**
  — rounded slots you fill with your own images via a file picker (saved as data
  URLs in config). All toggleable in Settings.
- **6 gradient presets** (Aurora, Midnight, Sunset, Ocean, Graphite, Rose),
  chosen in Settings when using the designed background.
- **De-branded / more mac:** removed the "LiquidHome" wordmark from the menu bar;
  left side is now just a Launchpad glyph, right side is the mac-style status area.
- **Desktop takeover mode (`npm run shell` / `--shell`):** opaque full-screen
  window pinned behind app windows via `SetParent` into Progman (opaque, so no
  blank-sheet bug). `body.shell` hides the dev window controls. Ctrl+Alt+Q always
  quits. Keyboard focus for Launchpad search in this mode is a known follow-up.
- Main: image picker dialog, `os.uptime()`, expanded persisted config.

- **macOS layout:** added a top **menu bar** (logo, Launchpad, weather/battery/
  clock status, ⚙ settings). Apps moved off the desktop into a **Launchpad**
  overlay (the mac "app menu"), opened from the menu bar; blurred backdrop, live
  search, paged grid. Desktop now shows only widgets.
- **Smaller icons** + optional **macOS squircle tiles** behind each icon.
- **Settings page** (no code edits): background (designed/wallpaper), icon size,
  Launchpad columns, mac tiles on/off, 24-h clock, per-widget show/hide —
  persisted to `liquidhome-config.json` in userData.
- **Icon-pack override:** `launcher/icons/` — drop PNG/SVG/ICO named after an app
  to replace its icon (case/space-insensitive). Applies any mac icon pack with
  no code changes; unmatched apps keep their real icon.
- **Dev-only window controls:** minimize/quit live in the menu bar behind a
  `dev` flag and are hidden in shell mode (`body.shell`) — they won't exist once
  it's the real desktop launcher.

## Unreleased — LiquidHome pivot (2026-07-25)

Reframed from "launcher + pinned widgets" into a single **custom home shell**
(HiOS/XOS-style), after the transparent desktop-pinned board rendered as an
opaque blank sheet over the primary monitor (Windows won't composite per-pixel
alpha for a window re-parented into Progman).

- **Safe dev model:** LiquidHome runs as a **normal, opaque, closable window** —
  it never pins to the desktop or covers the screen. Desktop takeover becomes an
  opt-in mode later, once the design is locked. `win32-desktop.js` kept for that.
- Consolidated the two windows into one `src/home/` shell: designed background,
  top bar (clock + search + minimize/quit), widgets strip (weather/system/
  calendar), and a paged app grid.
- **Switchable background:** our designed gradient ↔ the user's current Windows
  wallpaper (read from `TranscodedWallpaper`), remembered in localStorage.
- Removed `src/renderer/` and `src/board/`; hot-corner + acrylic overlay dropped.
- Global Ctrl+Alt+Q quits; window has visible minimize + quit buttons.

## Unreleased — 2026-07-24

### LiquidLaunch v0.3 — desktop widget layer rearchitecture

Reworked from a single fullscreen popup into two layers around the taskbar:

- **LiquidBoard** — widgets now live **pinned to the desktop wallpaper** (behind
  windows, click-through), not inside a popup. Uses koffi FFI to call Win32
  `SetParent`, re-parenting the transparent board window into Progman. Handles
  the Win11 26200 layout where `SHELLDLL_DefView` sits under Progman (probe
  confirmed `kind: progman`). New `src/win32-desktop.js` + `src/win32-debug.js`.
- **LiquidLaunch** — the app grid is now summoned from the **top-left hot
  corner** (mouse-into-corner polling) or Ctrl+Alt+Space; widgets removed from
  it (they're on the board now).
- Two-window main process; shared preload; `src/board/` added, `src/renderer/`
  slimmed to apps-only.
- Smoke test now boots both windows and includes the desktop-pin probe.
- Dependency: `koffi` (prebuilt, no native compile).

- **New: LiquidLaunch** (`launcher/`) — a real macOS Launchpad-style app launcher
  built in Electron. Frameless fullscreen Windows 11 acrylic overlay, reads
  Start Menu shortcuts (97 apps detected on the dev machine), native icon
  extraction, live search, click/Enter to launch, global hotkey Ctrl+Alt+Space,
  opens on the active monitor. This is the standalone launcher a taskbar styler
  can't provide. v0.1 core: enumerate, search, launch, glass. Not yet packaged
  to an installer.

- **MODS.md correction:** replaced the "Classic Min/Max Animations" suggestion
  with **MacOS Minimize Animation** (Abdullah Masood, v3.1.1+) — the real Apple
  genie minimize + restore/open effect via DWM hook. Added recommended settings.
- Documented that taskbar click-to-minimize is stock Windows 11 behavior (not
  something the theme changed) and listed click-behavior mods for Mac-like clicks.

## v0.3 Alpha — 2026-07-24

- **Active app** now shows accent glow on **both** a wide underline hairline
  (26 px) and the surrounding ring/border (2 px `ActiveRing` gradient).
- Removed the non-firing hover RenderTransform (the shell owns task-button
  transforms; documented in the YAML and in MODS.md).
- **New: LiquidStart** — matching dark-glass Start Menu config
  (`LiquidStart.yaml` → `start-menu-config.json`) for the Windows 11 Start Menu
  Styler mod, with an optional Recommended-feed hide for an apps-first layout.
- **New: `build.ps1` is generic** — one builder now compiles any styler YAML
  (taskbar + start menu) by preserving arbitrary top-level keys.
- **New: `clear-desktop.ps1`** — non-destructive hide/show of desktop icons.
- **New: `MODS.md`** — the full, honestly-labelled macOS conversion stack:
  which existing Windhawk mods to add (Taskbar Dock Animation Plus for hover
  magnification, Classic Min/Max Animations), how to install our Start Menu
  glass, desktop clearing, and widgets guidance.

## v0.2 Alpha — 2026-07-24

- **Material fix:** glass was reading as plain transparent. Raised
  `TintLuminosityOpacity` 0.22 → 0.72 and added real tint so the dock is now a
  frosted milky-glass material you can actually see, not a see-through pane.
  Added `GlassDense` (0.85 luminosity) for tooltips and menus over busy content.
- **Wider + left-biased:** dock is now `HorizontalAlignment=Left` with a 12 px
  left margin and `MaxWidth 1600`, so it shifts left and grows to contain every
  open app icon instead of clipping at 760 px.
- **Active-app indicator:** the foreground app now gets a glowing accent ring
  (1.5 px `ActiveRing` gradient border) plus a bright round accent dot. Inactive
  apps show a small dim dot; the attention state uses Windows' native flash.
- Stronger specular rim (brighter top catch-light).

## v0.1 Alpha — 2026-07-24

First release of LiquidDock.

- Liquid glass material: near-clear luminosity acrylic (`TintOpacity 0.05`,
  `TintLuminosityOpacity 0.22`) with specular gradient rim (bright top
  catch-light, soft bottom rim).
- Floating centered dock pill, radius 20, width-capped at 760 px so it never
  merges with the tray on smaller/main displays.
- Separate floating tray capsule pushed to the right edge (margin `8,0,3,6`).
- Task buttons: radius-13 glass bubbles, hover plate + icon lift/scale
  (`TranslateY -2`, `Scale 1.12`), press squish (`Scale 0.94`).
- Accent-aware glowing underline running indicator (18 px active, 6 px
  inactive, attention state at 55% accent).
- Smooth entrance + reposition theme transitions on task buttons.
- Matching glass on tooltips, thumbnails, hover flyouts, tray overflow,
  context menus, Alt+Tab, snap bar/picker, virtual desktop switcher, and the
  input/language switcher.
- Show-desktop sliver hidden; slim 12 px gripper retained.
- Clock: Segoe UI Variable Display 13 px, date line hidden.
- Click-through enabled outside the pills.

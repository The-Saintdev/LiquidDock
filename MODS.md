# LiquidDock — Full macOS Conversion Stack

This is the complete recipe to make Windows 11 feel like macOS, honestly
labelled by **what actually exists and works** vs. what doesn't. Everything
here runs on [Windhawk](https://windhawk.net) plus our config files, except
where noted.

> **Golden rule:** install one mod, confirm the taskbar/desktop still works,
> then add the next. If anything breaks, Windhawk auto-disables the last mod —
> toggle it off and continue. Nothing here is destructive.

---

## 1. The Dock — DONE ✅ (this repo)

**Mod:** Windows 11 Taskbar Styler
**Config:** `taskbar-config.json` (built from `LiquidDock.yaml`)

Dark liquid glass, floating pill, separate tray capsule, accent hairline +
ring on the active app. See the main [README](README.md).

## 2. macOS hover magnification — USE EXISTING MOD ✅

This is the dock-zoom you asked for. It is **already a stable, maintained
Windhawk mod** — writing our own would just be a worse copy.

**Install:** in Windhawk, search mods for **“Taskbar Dock Animation Plus”**
([mod page](https://windhawk.net/mods/taskbar-dock-animation-plus)) and install
it. It magnifies icons on hover like the macOS Dock, works on all taskbar
positions, and has multi-monitor crash fixes — which matters for your
dual-monitor setup. Run it *alongside* our Taskbar Styler config; they stack.

> This is why LiquidDock's own YAML can't do hover-zoom: the shell owns the
> button transforms. This mod hooks the shell in C++ to win that fight. No
> reason for us to reinvent it.

## 3. macOS window open/close & minimize animation — USE EXISTING MOD ✅

A true macOS “genie” minimize isn’t available, but the closest shipping option:

**Install:** **“Classic Minimize/Maximize Animations”**
([mod page](https://windhawk.net/mods/classic-min-max-animations)) for smoother,
more pronounced window animations. Combined with Windows’ built-in animation
settings (System → About → Advanced system settings → Performance → “Animate
windows when minimizing and maximizing” ON), this is as close to the mac
open/close feel as Windows exposes without a custom DWM hook.

## 4. Start Menu — matching glass, DONE ✅ (this repo)

**Mod:** Windows 11 Start Menu Styler
**Config:** `start-menu-config.json` (built from `LiquidStart.yaml`)

**Install:** open the mod → **Settings** tab → switch to **Textual mode** →
paste the contents of `start-menu-config.json` → **Save**.

This turns the real Start Menu into the same dark liquid glass as the dock,
rounds it, and (optionally, see the commented block in `LiquidStart.yaml`)
hides the Recommended feed for a cleaner, apps-first layout.

> **Honest note on “Launchpad”:** a fullscreen macOS-style app grid is a
> separate *launcher application*, not a style. The styler can only reskin the
> existing menu. If you truly want Launchpad, that’s a different project
> (a standalone app) — tell me and we’ll scope it separately. For most people,
> the glass + apps-first Start below is the 90% win.

## 5. Clear the desktop — DONE ✅ (this repo)

**Script:** `clear-desktop.ps1`

```powershell
powershell -ExecutionPolicy Bypass -File clear-desktop.ps1 -Hide   # clean desktop
powershell -ExecutionPolicy Bypass -File clear-desktop.ps1 -Show   # bring icons back
```

Only hides icon *visibility* — your files in the Desktop folder are never
touched. (Exactly the “not the desktop filepath itself” you meant.)

## 6. Widgets — RECOMMENDATION (not a Windhawk mod)

macOS-style desktop widgets aren’t a taskbar mod; they’re their own layer.
Two honest routes, pick one:

- **Built-in, zero-install:** Windows Widgets board (Win+W). Restyle-able but
  limited, lives in a flyout not on the desktop.
- **Desktop widgets like macOS (recommended for the look you want):**
  [Rainmeter](https://www.rainmeter.net/) with a minimalist glass skin
  (e.g. “Mond” or “Simple Media”) gives always-on desktop clock/weather/system
  widgets that match a glass theme. This is the standard way to get mac-style
  desktop widgets on Windows.

I can write you a matching Rainmeter skin (glass clock + weather) as a follow-up
if you want it — say the word.

---

## Recommended install order

1. Taskbar Styler + `taskbar-config.json`  ✅ *(you have this)*
2. Start Menu Styler + `start-menu-config.json`
3. Taskbar Dock Animation Plus  *(the hover magnification)*
4. Classic Min/Max Animations
5. `clear-desktop.ps1 -Hide`
6. Widgets (Rainmeter glass skin) — optional

## What is genuinely NOT possible without a big custom project

Being straight with you so you don’t chase ghosts:

- A real **genie/suck minimize** animation (needs a custom DWM composition hook).
- A true **Launchpad** fullscreen app grid (needs a standalone launcher app).
- **Wallpaper-adaptive** glass tint & **spring physics** on the dock
  (this is the LiquidDock+ code-mod idea; a real C++ project I can start when
  you want to commit to it — it needs iterative testing on your machine, so it
  won’t be a one-shot paste like the styler configs).

Everything in sections 1–6 is real and ships today.

# LiquidDock

**v0.1 Alpha — Cloudex Labs**

An iOS-style liquid glass dock for Windows 11, built for the
[Windhawk](https://windhawk.net) **Windows 11 Taskbar Styler** mod.

A floating, width-capped glass dock in the center, a separate glass tray
capsule hugging the right edge, specular rim lighting, accent-glow running
indicators, and smooth GPU-composited icon animations — no extra background
apps, no Explorer patching beyond Windhawk itself.

---

## What's in this repo

| File | Purpose |
|---|---|
| `LiquidDock.yaml` | **Source of truth.** Readable, commented theme definition. Edit this. |
| `taskbar-config.json` | Generated, paste-ready Windhawk settings. Never edit by hand. |
| `build.ps1` | Regenerates `taskbar-config.json` from `LiquidDock.yaml`. |
| `reference/frostyglass-config.json` | The FrostyGlass config we used as target-map reference. |

## Design language

Everything visual is driven by 13 constants at the top of `LiquidDock.yaml`:

- **Glass** — a near-clear acrylic. `TintOpacity 0.05` + `TintLuminosityOpacity 0.22`
  is what makes it read as polished glass instead of gray acrylic.
- **Specular** — the liquid-glass signature: a vertical gradient border with a
  bright catch-light on the top edge and a softer one on the bottom rim.
- **Radius 20 / ButtonRadius 13** — big soft radii, nothing sharp.
- **AccentGlow** — running indicators pick up your Windows accent color
  automatically (`SystemAccentColorLight2`), so the theme adapts when you
  change accent.
- **LiquidMotion** — `EntranceThemeTransition` + `RepositionThemeTransition`
  on task buttons. These are XAML *theme transitions*, rendered on the
  compositor thread — that's why opening/closing apps animates smoothly with
  zero added CPU cost.

Change a constant, run `build.ps1`, re-paste — the whole theme follows.

## The multi-monitor fix

The dock is capped at `MaxWidth 760` so on the main (smaller) screen it can
never grow into the tray, and the tray capsule margin is `8,0,3,6` — pushed
almost flush to the right edge, exactly as intended. If you want the dock
tighter or looser, tune `MinWidth` / `MaxWidth` on the first
`Taskbar.TaskbarFrame` rule.

---

## Install (start using it)

1. Install [Windhawk](https://windhawk.net) if you haven't.
2. In Windhawk, install / open **Windows 11 Taskbar Styler**.
3. Go to the mod's **Settings** tab and make sure **Theme** is set to
   **(None)** / empty — LiquidDock replaces FrostyGlass entirely; leaving
   FrostyGlass selected would merge the two.
4. Go to the **Advanced** tab → **Mod settings** box.
5. Open `taskbar-config.json`, select all, copy, and paste it into the box,
   replacing whatever is there.
6. Click **Save settings**. The taskbar restyles live — no reboot needed.

### Rollback

Paste your previous settings back (or just re-select the FrostyGlass theme in
Settings) and save. Windhawk applies instantly. If Explorer ever crashes on a
bad edit, Windhawk auto-disables the mod — fix the value and re-enable.

### Editing workflow

```powershell
# 1. edit LiquidDock.yaml
# 2. rebuild the paste file
powershell -ExecutionPolicy Bypass -File build.ps1
# 3. paste taskbar-config.json into Windhawk Advanced tab -> Save
```

---

## Publish it

1. Create the repo:
   ```powershell
   git init
   git add .
   git commit -m "LiquidDock v0.1 Alpha"
   ```
2. Push to GitHub (`gh repo create LiquidDock --public --source . --push`,
   or create the repo on github.com and `git remote add` + `git push`).
3. Take screenshots on both monitors (dock, tray capsule, hover state,
   Alt+Tab) into a `screenshots/` folder — themes live and die by their
   screenshots.
4. Optional, for real distribution: submit it as a theme to the community
   collection at
   [ramensoftware/windows-11-taskbar-styling-guide](https://github.com/ramensoftware/windows-11-taskbar-styling-guide)
   — fork it, add `Themes/LiquidDock/` containing a `README.md` (with
   screenshot + the settings JSON) and open a pull request. Accepted themes
   show up in the Taskbar Styler theme dropdown for everyone.

---

## What YAML can and cannot animate (honesty section)

Everything here is what the Taskbar Styler engine supports natively:

- ✅ Entrance / reposition animation of icons (smooth, compositor-driven)
- ✅ Hover & press state changes (plates, icon lift/scale, indicator glow)
- ✅ Accent-adaptive colors via `ThemeResource`
- ⏳ True spring physics, dock magnification (macOS-style), real drop shadows,
  and wallpaper-adaptive tinting need code, not styles. That's **LiquidDock+**,
  a future companion Windhawk mod. The theme is architected so LiquidDock+
  only *adds* behavior — the material and layout stay defined here.

## Roadmap

- **v0.1** — Core dock, tray capsule, liquid glass material, hover/press states, motion ← *you are here*
- **v0.2** — Start Menu (via Windhawk Start Menu Styler) in matching glass
- **v0.3** — Notification Center / Quick Settings glass (Windows 11 Styler mods)
- **v1.0** — Polished release, submitted to the community theme collection
- **LiquidDock+** — companion mod: springs, magnification, real shadows

## Credits

- Reference architecture: [FrostyGlass](https://github.com/guidolamanna/win11-taskbar-styler-frostyglass-windhawk) by guidolamanna, based on DockLike.
- Engine: [Windows 11 Taskbar Styler](https://windhawk.net/mods/windows-11-taskbar-styler) by Ramen Software.

MIT licensed. Cloudex Labs.

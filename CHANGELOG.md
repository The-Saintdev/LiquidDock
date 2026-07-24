# Changelog

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

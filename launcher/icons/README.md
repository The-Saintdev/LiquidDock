# Custom app icons (macOS icon pack)

Drop image files here to override the Windows-extracted app icons — this is how
you apply a **macOS icon pack** without editing any code.

- **Name each file after the app**, e.g. `Google Chrome.png`, `Spotify.png`,
  `File Explorer.png`. Matching ignores case, spaces, and punctuation, so
  `googlechrome.png` also matches "Google Chrome".
- Supported: `.png`, `.svg`, `.ico`, `.jpg`. **PNG (512px, transparent)** is best.
- Any app without a matching file keeps its real Windows icon.
- With **Settings → Mac-style icon tiles** on, every icon also gets the macOS
  squircle tile treatment for a uniform look.

Changes apply next time the Launchpad loads (reopen it, or restart LiquidHome).

## Where to get mac-style icons

Use an icon set you have the rights to (for personal use, macOS-style packs from
icon sites like macosicons.com work well — download the PNGs and rename them to
match your app names). Point me at a pack you want and I can help script the
bulk rename/mapping to your installed apps.

# PiggyPath branding assets

The current source is the user-supplied `assets/piggpath-logo.webp`, preserved unchanged. The previous `piggypath-original.png` is historical artwork and is not used by the exporter or app.

`piggypath-master.png` is a transparent 1024 px export; `piggypath-logo.png` is the transparent 576 px in-app export consumed by `BrandLogo`; `piggypath-icon.png` is the opaque 1024 px platform export.

Regenerate with Python 3 and Pillow:

```sh
python scripts/generate-brand-assets.py
node scripts/sync-config.cjs
```

The exporter reads the cream `iconBackground` token from `src/theme/colors.ts`. It trims only empty transparent margins, preserves the artwork, and performs deterministic PNG resizing and centering. Android exports include all five densities and adaptive foregrounds contained inside the 66 dp safe circle. Adaptive backgrounds use the separate `app_icon_background` native color. All iOS catalog exports, including 1024 px, are opaque.

The pink-led theme uses pink buttons and navigation accents, pale pink backgrounds, navy text, green savings indicators, and gold highlights. Launcher icons retain their separate cream background. See `registration/README.md` for the generated flat mascot poses and prompt set.

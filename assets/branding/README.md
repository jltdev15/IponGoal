# PiggyPath branding assets

The user-supplied 1254 px artwork is preserved in `piggypath-original.png`.
`piggypath-master.png` is the clean transparent 1126 px master; `piggypath-logo.png` is the 576 px in-app export; `piggypath-icon.png` is the opaque 1024 px platform export.

The built-in imagegen tool was used with this final cleanup prompt:

> Background-extraction cleanup edit. The edit target still has many unwanted magenta/red/white speckles around the OUTSIDE of the rounded pink square, especially along the very top, bottom and right. Remove EVERY one of these speckles and ragged fringes outside the rounded square. Make the tile outline a clean smooth rounded square. All pixels outside that smooth outline must be fully transparent, including all pink specks at the top and red fragments right side. Preserve the main interior piggy bank, coin and white winding path unchanged. This is an edge repair, not a redesign. Center the rounded square with a small even transparent margin. Do not replicate noise from the reference.

The generated candidates retained edge noise, so the final exports use native CoreGraphics clipping of the original pixels to a smooth rounded boundary. No interior illustration was regenerated. Regenerate all platform exports on macOS from the project root:

```sh
swift -module-cache-path /tmp/piggypath-swift-cache scripts/generate-brand-assets.swift
```

Android adaptive exports keep the complete tile inside the 66 dp safe circle. iOS exports are opaque and include every size referenced by the app icon catalog.

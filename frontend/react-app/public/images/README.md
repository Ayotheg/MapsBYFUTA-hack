# Replaceable Brand & Screen Images

Drop your replacement image files directly into this folder (`public/images/`).
Components like `BrandLogo` and `FallbackImage` check these paths automatically and render clean brand fallbacks when an image file is not present yet.

## Recommended Slots
- `logo-mark.png` — Square app icon / brand mark (recommended 512x512).
- `logo-wordmark-white.png` — White lockup for dark backgrounds (`BrandLogo` with `variant="lockup"` and `tone="dark"`).
- `logo-wordmark-dark.png` — Dark lockup for light backgrounds (`BrandLogo` with `variant="lockup"` and `tone="light"`).
- `campus-preview.jpg` — Placeholder / campus preview image used in hero or place cards.

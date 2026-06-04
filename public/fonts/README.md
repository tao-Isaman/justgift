# Fonts

The UI body text uses **FC Vision** (a Thai typeface by Fontcraft).

It is loaded via `@font-face` in `app/globals.css` with this resolution order:

1. A copy **installed on the machine** (`local("FC Vision")`) — works in dev with no files.
2. **Licensed files placed here**, for production / other machines.
3. Falls back to **Anuphan** (bundled via `next/font`) if neither is available.

To bundle FC Vision, drop your licensed files here using these exact names:

```
public/fonts/
  FCVision-Regular.woff2   (or .ttf)   → weight 400
  FCVision-Medium.woff2    (or .ttf)   → weight 500
  FCVision-Bold.woff2      (or .ttf)   → weight 700
```

> Only add font files you are licensed to use/embed. They are intentionally
> not committed to this repo.

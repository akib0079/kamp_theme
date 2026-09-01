# kamp_theme

Shopify theme for [kampeerwinkelroermond.nl](https://kampeerwinkelroermond.nl/).

Work in progress on the new product page template
(`sections/product-main-alt.liquid`).

## Product page — USP rotator

The `USPs` block on the product page cycles through up to four USPs with a
staggered cross-fade (icon first, text ~70ms behind).

- Configure each USP (icon + rich text) in the theme editor under the `USPs`
  block. Fill in more than one to rotate through them.
- With a single USP filled in, it is repeated so the rotation stays visible.
- `Rotate USPs`, `Time per USP` (2–10s) and `Transition duration` (200–1200ms)
  are editor settings on the same block.

Implementation notes:

- Slides are stacked in one CSS grid cell, so the block keeps the height of the
  tallest USP and never shifts the `Add to cart` button.
- Rotation pauses on hover, when the tab is hidden, and when the block is
  scrolled out of view.
- The first USP renders visible without JavaScript; `prefers-reduced-motion`
  falls back to a plain opacity fade.

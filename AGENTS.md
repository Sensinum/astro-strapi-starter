# Sphere.it static site

This repository is a fully static Astro rebuild of https://sphere.it. Content is JSON under `src/content`, loaded by Astro content collections in `src/content.config.ts`. Styling is the ported WordPress theme in `public/theme`. Do not add Strapi, a CMS client, or form backends.

Regenerate content with `node scripts/transform-content.mjs`.

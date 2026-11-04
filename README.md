# Sphere.it

Static rebuild of [sphere.it](https://sphere.it) on Astro 7. Content lives in the repository as JSON content collections. The build is fully static (`output: 'static'`) and deploys to Vercel with the redirects in `vercel.json`.

There is no Strapi, WordPress, or other CMS at build time or runtime. Contact and newsletter forms from the WordPress site are not included. Speaker and partner calls to action go to [https://virtuslab.com/contact](https://virtuslab.com/contact).

## Develop

```bash
yarn install
yarn dev
yarn build
yarn preview
```

`yarn content` re-runs `scripts/transform-content.mjs` against `scripts/source/sphere-content.json` (the WordPress export). It rewrites `src/content`, downloads referenced uploads into `public/uploads`, and regenerates `vercel.json`.

## Vercel

- Framework preset: Astro
- Build command: `yarn build` (or `npm run build`)
- Output directory: `dist`
- No environment variables are required
- `vercel.json` sets `trailingSlash` and the WordPress redirect list
- Point the production domain at `sphere.it` when you cut over from WordPress

Piwik PRO analytics and its consent manager from the WordPress site are not included.

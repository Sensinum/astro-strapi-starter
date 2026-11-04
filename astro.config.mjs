// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://sphere.it',
  trailingSlash: 'always',
  output: 'static',
  integrations: [sitemap()],
});

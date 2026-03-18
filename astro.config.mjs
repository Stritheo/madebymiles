import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://milessowden.au',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/work/'),
    }),
  ],
  output: 'static',
});

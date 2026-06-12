import { defineConfig } from 'vite';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import handlebars from 'vite-plugin-handlebars';

const SITE_URL = 'https://alpackaconstruction.com';
const PHONE_DISPLAY = '(917) 682-6404';
const PHONE_E164 = '+19176826404';
const SERVICE_AREA = 'the Pocono Mountains and northern NJ';
const HIC_NUMBER = 'PA——';

function sitemapPlugin() {
    return {
        name: 'generate-sitemap',
        closeBundle() {
            const date = new Date().toISOString().split('T')[0];
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
            writeFileSync(resolve('dist/sitemap.xml'), xml);
        },
    };
}

export default defineConfig({
    build: {
        outDir: 'dist',
    },
    plugins: [
        handlebars({
            partialDirectory: resolve('src/partials'),
            context: {
                siteUrl: SITE_URL,
                phoneDisplay: PHONE_DISPLAY,
                phoneE164: PHONE_E164,
                serviceArea: SERVICE_AREA,
                hicNumber: HIC_NUMBER,
            },
        }),
        sitemapPlugin(),
    ],
});

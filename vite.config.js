import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

// Single source of truth for absolute URLs used by SEO tags, robots.txt and sitemap.xml.
// Set VITE_SITE_URL (for example https://www.yourdomain.com) in the production environment.
// If it is not set, tags that need an absolute URL are left out instead of pointing at a wrong host.
const PAGES = [
  { path: '/landing', changefreq: 'weekly', priority: '1.0' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
]

function seo(siteUrl) {
  const base = String(siteUrl || '').trim().replace(/\/+$/, '')
  return {
    name: 'pratyeksha-seo',
    transformIndexHtml(html) {
      if (base) return html.replaceAll('__SITE__', base)
      // No absolute URL known: drop every line that needs one.
      return html.split('\n').filter((l) => !l.includes('__SITE__')).join('\n')
    },
    generateBundle() {
      const day = new Date().toISOString().slice(0, 10)
      const robots = ['User-agent: *', 'Allow: /', 'Disallow: /thank-you', 'Disallow: /api/', 'Disallow: /owner', 'Disallow: /operator', 'Disallow: /kitchen', 'Disallow: /master-admin', base ? `Sitemap: ${base}/sitemap.xml` : '# Set VITE_SITE_URL to emit the Sitemap line', ''].join('\n')
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots })
      if (base) {
        const urls = PAGES.map((p) => `  <url><loc>${base}${p.path}</loc><lastmod>${day}</lastmod><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`).join('\n')
        this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n` })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // `@` → src/ is required by the vendored Bklit chart sources (shadcn-style imports); tailwindcss() only touches CSS that opts in (see src/shared/ui/bklit.css).
  return {
    plugins: [react(), tailwindcss(), seo(env.VITE_SITE_URL)],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    // Production-only trimming: no debugger statements, and console.log/debug calls are dropped (warn/error stay for diagnostics).
    esbuild: mode === 'production' ? { drop: ['debugger'], pure: ['console.log', 'console.debug'], legalComments: 'none' } : {},
    build: {
      target: 'es2020',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          // Stable vendor chunks: app releases no longer invalidate the browser's cached React / animation / HTTP code,
          // and every route shares one copy instead of re-bundling it.
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined
            if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom|@remix-run)\//.test(id)) return 'vendor-react'
            // Two animation libraries are in use (see main.jsx): keep each in its own chunk so a route only ever fetches the one it needs.
            if (/node_modules\/motion\//.test(id)) return 'vendor-motion'                                  // `motion` + its nested framer-motion (portals)
            if (/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(id)) return 'vendor-framer'  // framer-motion v11 (guest, kitchen, landing)
            if (/node_modules\/axios\//.test(id)) return 'vendor-http'
            return undefined
          },
        },
      },
    },
  }
})
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import { LANDING_PAGES, LEGAL_PAGES, FAQS, SITE_NAME, buildGraph } from './src/features/landing/seoData.js'

// Single source of truth for absolute URLs used by SEO tags, robots.txt and sitemap.xml.
// Set VITE_SITE_URL (for example https://www.yourdomain.com) in the production environment.
// If it is not set, tags that need an absolute URL are left out instead of pointing at a wrong host.
const PAGES = [...LANDING_PAGES, ...LEGAL_PAGES]

function seo(siteUrl) {
  const base = String(siteUrl || '').trim().replace(/\/+$/, '').replace(/\/landing$/, '')
  return {
    name: 'pratyeksha-seo',
    transformIndexHtml(html) {
      if (base) return html.replaceAll('__SITE__', base)
      // No absolute URL known: drop every line that needs one.
      return html.split('\n').filter((l) => !l.includes('__SITE__')).join('\n')
    },
    // One real HTML file per landing page: title, description, canonical, Open Graph, JSON-LD and a crawlable <noscript> body,
    // so link previews and crawlers that do not run JavaScript see each page's own content. The SPA still boots on top of it.
    closeBundle() {
      const dist = path.resolve(process.cwd(), 'dist'); const src = path.join(dist, 'index.html')
      if (!fs.existsSync(src)) return
      const html0 = fs.readFileSync(src, 'utf8')
      const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      for (const pg of LANDING_PAGES) {
        const url = `${base}${pg.path}`
        let h = html0
        h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(pg.title)}</title>`)
        h = h.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(pg.description)}" />`)
        if (base) h = h.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`)
        h = h.replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(pg.title)}" />`)
        h = h.replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(pg.description)}" />`)
        if (base) h = h.replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`)
        h = h.replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${esc(pg.title)}" />`)
        h = h.replace(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${esc(pg.description)}" />`)
        const extra = [
          `<meta name="keywords" content="${esc(pg.keywords)}" />`,
          `<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1" />`,
          ...(base ? [`<link rel="alternate" hreflang="en-IN" href="${url}" />`, `<link rel="alternate" hreflang="x-default" href="${url}" />`] : []),
          `<script type="application/ld+json" id="pratyeksha-structured-data">${JSON.stringify(buildGraph(base, pg, { faqs: FAQS, features: LANDING_PAGES[0].points.concat(LANDING_PAGES[1].points) })).replace(/</g, '\\u003c')}</script>`,
        ].join('\n    ')
        h = h.replace('</head>', `    ${extra}\n  </head>`)
        const nav = LANDING_PAGES.map((p) => `<li><a href="${p.path}">${esc(p.crumb)}</a></li>`).join('')
        const body = `<noscript><header><nav aria-label="Primary"><ul>${nav}</ul></nav></header><main><h1>${esc(pg.h1)}</h1><p>${esc(pg.summary)}</p><ul>${pg.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>${pg.key === 'home' ? `<h2>Frequently asked questions</h2>${FAQS.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join('')}` : ''}<p>Contact: <a href="mailto:hello.pratyeksha@gmail.com">hello.pratyeksha@gmail.com</a>, <a href="tel:+918767622654">+91 87676 22654</a>. ${esc(SITE_NAME)}, Maharashtra, India.</p></main></noscript>`
        h = h.replace('<div id="root">', `${body}<div id="root">`)
        const out = path.join(dist, pg.path.replace(/^\//, ''), 'index.html')
        fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, h)
      }
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
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',

      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'ads.txt', 'sitemap.xml'],
      devOptions: {
        enabled: true,
        type: 'module'
      },
      manifest: {
        name: 'MMU Confessions',
        short_name: 'MMU Confess',
        description: 'Anonymous Student Confessions',
        theme_color: '#4F46E5',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
        ],
      },
    }),
  ],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
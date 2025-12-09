import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'ads.txt'],
      manifest: {
        name: 'MMU Confessions',
        short_name: 'MMU Confess',
        description: 'Anonymous Student Confessions',
        theme_color: '#4F46E5',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          },
        ]
      }
    })
  ],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
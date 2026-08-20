import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/sera-dayboard/',
  plugins: [react(), VitePWA({
    registerType: 'prompt',
    includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
    manifest: {
      name: 'Sera Dayboard', short_name: 'Dayboard', description: 'A calm guide for your workday.', id: '/sera-dayboard/',
      theme_color: '#F4F1E8', background_color: '#F4F1E8', display: 'standalone', orientation: 'any', start_url: '/sera-dayboard/', scope: '/sera-dayboard/',
      icons: [
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ]
    },
    workbox: { globPatterns: ['**/*.{js,css,html,ico,png,woff2}'], cleanupOutdatedCaches: true }
  })]
})

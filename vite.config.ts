import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA, type ManifestOptions } from 'vite-plugin-pwa'

const APP_VERSION = '0.0.1'
const manifest: Partial<ManifestOptions> & { version: string } = {
  id: '/quickspend/',
  name: 'QuickSpend',
  short_name: 'QuickSpend',
  description: 'Rýchle zaznamenávanie osobných výdavkov',
  version: APP_VERSION,
  lang: 'sk',
  start_url: '/quickspend/',
  scope: '/quickspend/',
  display: 'standalone',
  orientation: 'portrait-primary',
  background_color: '#fff7fa',
  theme_color: '#9f2857',
  icons: [
    { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
    {
      src: 'pwa-maskable-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
}

export default defineConfig({
  base: '/quickspend/',
  define: { __APP_VERSION__: JSON.stringify(APP_VERSION) },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      manifestFilename: 'manifest.json',
      registerType: 'prompt',
      manifest,
      injectManifest: { globPatterns: ['**/*.{js,css,html,png,svg,woff2}'] },
      devOptions: { enabled: false },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
})

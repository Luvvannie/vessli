import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Vessli',
        short_name: 'Vessli',
        description: 'Marketplace for digital products',
        theme_color: '#FAF8F5',
        background_color: '#FAF8F5',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'vite.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
    }),
  ],
})

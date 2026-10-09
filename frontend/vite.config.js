import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo_refresca.png'],
      manifest: {
        name: 'Refresca Bebidas - Depósito & Delivery',
        short_name: 'Refresca',
        description: 'Depósito de Bebidas Refresca - Entrega rápida de cervejas geladas, destilados, gelo e carvão.',
        theme_color: '#0A0F1D',
        background_color: '#0A0F1D',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/logo_refresca.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logo_refresca.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});

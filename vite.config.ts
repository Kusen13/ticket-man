import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      devOptions: {
        enabled: true,
        type: 'module',
      },
      manifest: {
        name: 'Ticket Man',
        short_name: 'TicketMan',
        description: 'Advanced Ticketing Management System',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'https://ui-avatars.com/api/?name=TM&background=8b5cf6&color=fff&size=192',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://ui-avatars.com/api/?name=TM&background=8b5cf6&color=fff&size=512',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['lucide-react', 'clsx', 'tailwind-merge'],
          utils: ['dayjs', 'browser-image-compression'],
        }
      }
    }
  }
});

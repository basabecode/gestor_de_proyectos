import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({mode}) => ({
  plugins: [react(), tailwindcss()],

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    alias: { '@/': new URL('./src/', import.meta.url).pathname },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/lib/**', 'src/stores/**', 'src/components/board/**'],
    },
  },

  server: {
    port: 3000,
    open: true,
  },

  resolve: {
    alias: {
      '@': '/src',
    },
  },

  build: {
    // Target modern browsers – Vercel edge nodes support ES2020+
    target: 'es2020',

    // Generate sourcemaps in production for error tracking (e.g., Sentry)
    sourcemap: mode === 'production' ? 'hidden' : true,

    // Warn when a chunk exceeds 500 KB
    chunkSizeWarningLimit: 500,

    rollupOptions: {
      output: {
        // Deterministic hashed names → long-lived CDN cache on Vercel
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',

        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-state': ['zustand', '@tanstack/react-query'],
          'vendor-charts': ['recharts'],
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          'vendor-utils': ['date-fns', 'lodash', 'nanoid', 'clsx', 'tailwind-merge'],
          'vendor-data': ['papaparse', 'xlsx'],
          'vendor-forms': ['react-hook-form', 'zod'],
          'vendor-ui': ['framer-motion', 'react-hot-toast', 'lucide-react'],
        },
      },
    },
  },
}))


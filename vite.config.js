import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
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
  server: { port: 3000, open: true },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-state': ['zustand', '@tanstack/react-query'],
          'vendor-charts': ['recharts'],
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          'vendor-utils': ['date-fns', 'lodash', 'nanoid', 'clsx', 'tailwind-merge'],
          'vendor-data': ['papaparse', 'xlsx'],
        },
      },
    },
  },
})

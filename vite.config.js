import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Enable compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // Code splitting for better performance
    rollupOptions: {
      input: {
        main: 'index.html',
        login: 'login.html',
        signup: 'signup.html',
        dashboard: 'dashboard.html',
        admin: 'admin.html',
        deposit: 'deposit.html',
        withdraw: 'withdraw.html',
        settings: 'settings.html',
        verify: 'verify.html'
      },
      output: {
        manualChunks: {
          // Split vendor libraries
          supabase: ['@supabase/supabase-js'],
          chart: ['chart.js'],
          vendor: ['vite']
        }
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging
    sourcemap: false
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['@supabase/supabase-js', 'chart.js']
  }
})

import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
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
      }
    }
  }
})
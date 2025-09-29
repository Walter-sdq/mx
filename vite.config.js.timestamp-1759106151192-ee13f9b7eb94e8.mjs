// vite.config.js
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
var vite_config_default = defineConfig({
  server: {
    port: 3e3,
    host: true
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    // Enable compression
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // Code splitting for better performance
    rollupOptions: {
      input: {
        main: "index.html",
        login: "login.html",
        signup: "signup.html",
        dashboard: "dashboard.html",
        admin: "admin.html",
        deposit: "deposit.html",
        withdraw: "withdraw.html",
        settings: "settings.html",
        verify: "verify.html"
      },
      output: {
        manualChunks: {
          // Split vendor libraries
          supabase: ["@supabase/supabase-js"],
          chart: ["chart.js"],
          vendor: ["vite"]
        }
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1e3,
    // Enable source maps for debugging
    sourcemap: false
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ["@supabase/supabase-js", "chart.js"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiAzMDAwLFxuICAgIGhvc3Q6IHRydWVcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6ICdkaXN0JyxcbiAgICBhc3NldHNEaXI6ICdhc3NldHMnLFxuICAgIC8vIEVuYWJsZSBjb21wcmVzc2lvblxuICAgIG1pbmlmeTogJ3RlcnNlcicsXG4gICAgdGVyc2VyT3B0aW9uczoge1xuICAgICAgY29tcHJlc3M6IHtcbiAgICAgICAgZHJvcF9jb25zb2xlOiB0cnVlLFxuICAgICAgICBkcm9wX2RlYnVnZ2VyOiB0cnVlXG4gICAgICB9XG4gICAgfSxcbiAgICAvLyBDb2RlIHNwbGl0dGluZyBmb3IgYmV0dGVyIHBlcmZvcm1hbmNlXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgaW5wdXQ6IHtcbiAgICAgICAgbWFpbjogJ2luZGV4Lmh0bWwnLFxuICAgICAgICBsb2dpbjogJ2xvZ2luLmh0bWwnLFxuICAgICAgICBzaWdudXA6ICdzaWdudXAuaHRtbCcsXG4gICAgICAgIGRhc2hib2FyZDogJ2Rhc2hib2FyZC5odG1sJyxcbiAgICAgICAgYWRtaW46ICdhZG1pbi5odG1sJyxcbiAgICAgICAgZGVwb3NpdDogJ2RlcG9zaXQuaHRtbCcsXG4gICAgICAgIHdpdGhkcmF3OiAnd2l0aGRyYXcuaHRtbCcsXG4gICAgICAgIHNldHRpbmdzOiAnc2V0dGluZ3MuaHRtbCcsXG4gICAgICAgIHZlcmlmeTogJ3ZlcmlmeS5odG1sJ1xuICAgICAgfSxcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAvLyBTcGxpdCB2ZW5kb3IgbGlicmFyaWVzXG4gICAgICAgICAgc3VwYWJhc2U6IFsnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJ10sXG4gICAgICAgICAgY2hhcnQ6IFsnY2hhcnQuanMnXSxcbiAgICAgICAgICB2ZW5kb3I6IFsndml0ZSddXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIC8vIE9wdGltaXplIGNodW5rIHNpemVcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsXG4gICAgLy8gRW5hYmxlIHNvdXJjZSBtYXBzIGZvciBkZWJ1Z2dpbmdcbiAgICBzb3VyY2VtYXA6IGZhbHNlXG4gIH0sXG4gIC8vIE9wdGltaXplIGRlcGVuZGVuY2llc1xuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBpbmNsdWRlOiBbJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcycsICdjaGFydC5qcyddXG4gIH1cbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBRXRQLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixXQUFXO0FBQUE7QUFBQSxJQUVYLFFBQVE7QUFBQSxJQUNSLGVBQWU7QUFBQSxNQUNiLFVBQVU7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLGVBQWU7QUFBQSxNQUNqQjtBQUFBLElBQ0Y7QUFBQTtBQUFBLElBRUEsZUFBZTtBQUFBLE1BQ2IsT0FBTztBQUFBLFFBQ0wsTUFBTTtBQUFBLFFBQ04sT0FBTztBQUFBLFFBQ1AsUUFBUTtBQUFBLFFBQ1IsV0FBVztBQUFBLFFBQ1gsT0FBTztBQUFBLFFBQ1AsU0FBUztBQUFBLFFBQ1QsVUFBVTtBQUFBLFFBQ1YsVUFBVTtBQUFBLFFBQ1YsUUFBUTtBQUFBLE1BQ1Y7QUFBQSxNQUNBLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQTtBQUFBLFVBRVosVUFBVSxDQUFDLHVCQUF1QjtBQUFBLFVBQ2xDLE9BQU8sQ0FBQyxVQUFVO0FBQUEsVUFDbEIsUUFBUSxDQUFDLE1BQU07QUFBQSxRQUNqQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUVBLHVCQUF1QjtBQUFBO0FBQUEsSUFFdkIsV0FBVztBQUFBLEVBQ2I7QUFBQTtBQUFBLEVBRUEsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLHlCQUF5QixVQUFVO0FBQUEsRUFDL0M7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=

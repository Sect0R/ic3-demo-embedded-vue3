import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      "/icCube": {
        target: "http://localhost:8282/",
        changeOrigin: true,
        secure: false,
        headers: {
          ic3_user_name: "admin",
          ic3_role_name: "administrator"
        }
      }
    }
  }
})

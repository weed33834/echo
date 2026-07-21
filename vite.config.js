import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue(), vueJsx()],
  base: process.env.GITHUB_ACTIONS ? '/echo/' : '/',
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  server: { host: '0.0.0.0', port: 5173 }
})

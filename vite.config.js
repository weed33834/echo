import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue(), vueJsx()],
  base: process.env.GITHUB_ACTIONS ? '/echo/' : '/',
  // public 目录下的文件（manifest.json / sw.js 等）会被原样复制到构建产物根目录，
  // 不经过哈希处理，便于 Service Worker 与 PWA manifest 以固定路径访问
  publicDir: 'public',
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  server: { host: '0.0.0.0', port: 5173 }
})

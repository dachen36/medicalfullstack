import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import os from 'os' // 🌟 1. 引入 Node 内置模块，用来获取当前电脑的主机名

// 🌟 2. 自动拿到你的电脑主机名（DESKTOP-3SMJV16），自动拼成后端的 3000 端口 利用vite 前端转发....
const backendTarget = `http://${os.hostname()}:3000`

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0', // 🌟 3. 让别的电脑能访问你的前端 (5173 端口)
    proxy: {
      // 🌟 4. 转发接口：遇到 /api 自动转给后端的 3000 端口
      '/api': {
        target: backendTarget,
        changeOrigin: true,
      },
      // 🌟 5. 转发静态资源：比如上传的头像 /uploads
      '/uploads': {
        target: backendTarget,
        changeOrigin: true,
      }
    }
  }
})
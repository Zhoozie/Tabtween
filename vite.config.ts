import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// Chrome MV3 扩展构建配置
// - root 指向 src/newtab，使 dev server 直接服务新标签页入口
// - publicDir 指向项目根 public，构建时复制 manifest.json 等静态资源
// - 多入口：newtab（HTML）+ background（Service Worker）
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  root: 'src/newtab',
  publicDir: resolve(__dirname, 'public'),
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    target: 'chrome88',
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    // MV3 禁止动态导入与 eval，使用terser保持单文件可读性
    minify: 'terser',
    rollupOptions: {
      input: {
        newtab: resolve(__dirname, 'src/newtab/index.html'),
        background: resolve(__dirname, 'src/background/index.ts')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
})

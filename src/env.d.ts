/// <reference types="vite/client" />

// 让 IDE 的 TS Server 在未启用 Volar Takeover 时也能识别 .vue 文件的默认导出
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}

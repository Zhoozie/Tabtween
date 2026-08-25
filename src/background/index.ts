// Tabtween 后台 Service Worker 入口
// MV3 限制：禁止使用 DOM/window；使用 self 代替；操作必须 30 秒内完成

console.log('[Tabtween] background service worker booted')

// 安装时初始化默认存储
self.addEventListener('install', () => {
  console.log('[Tabtween] service worker install')
})

self.addEventListener('activate', () => {
  console.log('[Tabtween] service worker activate')
})

// 监听扩展消息（如新标签页与后台通信）
self.addEventListener('message', (event) => {
  const data = event.data
  if (data?.type === 'ping') {
    event.source?.postMessage({ type: 'pong', at: Date.now() })
  }
})

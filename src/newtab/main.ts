import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { useSettingsStore } from '@/newtab/stores/settings'
import { useModeStore } from '@/newtab/stores/mode'
import { useTasksStore } from '@/newtab/stores/tasks'
import '@/newtab/styles/main.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

// 启动时从 Chrome Storage 加载持久化状态
async function bootstrap() {
  const settings = useSettingsStore(pinia)
  const mode = useModeStore(pinia)
  const tasks = useTasksStore(pinia)

  await Promise.all([settings.load(), mode.load(), tasks.load()])

  // 应用初始主题到 <html>
  settings.applyTheme()

  app.mount('#app')
}

void bootstrap()

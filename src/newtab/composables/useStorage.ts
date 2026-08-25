import { onMounted, ref, type Ref } from 'vue'
import { loadData } from '@/newtab/utils/storage'

// 异步加载持久化数据的 composable
// 用法：const data = useStorage<MyType>('key', defaultValue)
export function useStorage<T>(key: string, defaultValue: T): Ref<T> {
  const data = ref<T>(defaultValue) as Ref<T>

  onMounted(async () => {
    const stored = await loadData<T>(key)
    if (stored !== undefined) {
      data.value = stored
    }
  })

  return data
}

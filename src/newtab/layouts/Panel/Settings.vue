<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/newtab/stores/settings'
import { useSearchStore } from '@/newtab/stores/search'
import {
  ABOUT_INFO,
  ACCENT_COLOR_PRESETS,
  CLOCK_COLOR_PRESETS,
  CLOCK_FONT_OPTIONS,
  CLOCK_SIZE_LABELS,
  DEFAULT_SETTINGS,
  FONT_SIZE_LABELS,
  LAYOUT_DENSITY_LABELS,
  SEARCH_BAR_STYLE_LABELS,
  SEARCH_ENGINE_LABELS,
  THEME_LABELS
} from '@/newtab/constant'
import { clearAllData } from '@/newtab/utils/storage'
import { generateId, mergeSettings, validateSettings } from '@/newtab/utils/settings'
import { eventToShortcutString, isValidShortcut } from '@/newtab/utils/keyboard'
import type {
  ClockClickAction,
  ClockDoubleClickAction,
  ClockSettings,
  ClockSize,
  ClockStyle,
  CornerButtonVisibility,
  FontSize,
  LayoutDensity,
  SearchBarStyle,
  SearchCommand,
  SearchEngine,
  SearchEnterBehavior,
  SearchSettings,
  Settings,
  ShortcutKey,
  ThemeMode
} from '@/newtab/types/settings'
import SettingToggle from '@/newtab/components/settings/SettingToggle.vue'
import SettingRadio from '@/newtab/components/settings/SettingRadio.vue'
import SettingSelect from '@/newtab/components/settings/SettingSelect.vue'
import SettingSlider from '@/newtab/components/settings/SettingSlider.vue'
import SettingColorPicker from '@/newtab/components/settings/SettingColorPicker.vue'
import SettingListManager from '@/newtab/components/settings/SettingListManager.vue'

type CategoryId = 'appearance' | 'search' | 'shortcuts' | 'privacy' | 'about'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
  }>(),
  { modelValue: false }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const settingsStore = useSettingsStore()
const searchStore = useSearchStore()
const { settings } = storeToRefs(settingsStore)

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

function close() {
  open.value = false
}

// ============ 分类与导航 ============
const categories = computed<{ id: CategoryId; label: string; icon: string }[]>(() => [
  { id: 'appearance', label: '外观与显示', icon: '🎨' },
  { id: 'search', label: '搜索设置', icon: '🔍' },
  { id: 'shortcuts', label: '快捷键设置', icon: '⌨' },
  { id: 'privacy', label: '隐私与数据', icon: '🔒' },
  { id: 'about', label: '关于', icon: 'ℹ' }
])

const activeCategory = ref<CategoryId>('appearance')

// ============ 右侧内容滚动：位置记忆 + 触底阴影 ============
const scrollRef = ref<HTMLElement | null>(null)
const atBottom = ref(false)
const scrollPositions = ref<Record<CategoryId, number>>({
  appearance: 0,
  search: 0,
  shortcuts: 0,
  privacy: 0,
  about: 0
})

function switchCategory(id: CategoryId) {
  if (id === activeCategory.value) return
  if (scrollRef.value) {
    scrollPositions.value[activeCategory.value] = scrollRef.value.scrollTop
  }
  activeCategory.value = id
  nextTick(() => {
    if (scrollRef.value) {
      scrollRef.value.scrollTop = scrollPositions.value[id] ?? 0
    }
    updateAtBottom()
  })
}

function updateAtBottom() {
  const el = scrollRef.value
  if (!el) return
  const scrollable = el.scrollHeight > el.clientHeight + 4
  atBottom.value = !scrollable || el.scrollTop + el.clientHeight >= el.scrollHeight - 24
}

function onScroll() {
  updateAtBottom()
}

// 键盘导航：↑/↓ 切换分类，Enter 进入当前分类，Tab 在设置项间自然移动
function onNavKeydown(event: KeyboardEvent) {
  const list = categories.value
  const idx = list.findIndex((c) => c.id === activeCategory.value)
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    switchCategory(list[(idx + 1) % list.length]!.id)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    switchCategory(list[(idx - 1 + list.length) % list.length]!.id)
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
  }
}

// ============ 设置项搜索 ============
const searchQuery = ref('')

interface SearchEntry {
  category: CategoryId
  categoryLabel: string
  label: string
  description: string
}

const searchIndex = computed<SearchEntry[]>(() => [
  { category: 'appearance', categoryLabel: '外观与显示', label: '主题模式', description: '暗色 / 亮色 / 跟随系统' },
  { category: 'appearance', categoryLabel: '外观与显示', label: '主题颜色', description: '强调色自定义' },
  { category: 'appearance', categoryLabel: '外观与显示', label: '字体', description: '字体族选择' },
  { category: 'appearance', categoryLabel: '外观与显示', label: '字号', description: '小 / 中 / 大' },
  { category: 'appearance', categoryLabel: '外观与显示', label: '搜索框样式', description: '全圆角 / 小圆角 / 直角' },
  { category: 'appearance', categoryLabel: '外观与显示', label: '布局密度', description: '紧凑 / 标准 / 宽松' },
  { category: 'appearance', categoryLabel: '外观与显示', label: '右上角按钮', description: '隐藏 / 悬停 / 始终显示' },
  { category: 'appearance', categoryLabel: '外观与显示', label: '时钟字体', description: '时钟字体族' },
  { category: 'appearance', categoryLabel: '外观与显示', label: '时钟大小', description: '小 / 中 / 大' },
  { category: 'appearance', categoryLabel: '外观与显示', label: '时钟颜色', description: '时钟文字颜色' },
  { category: 'appearance', categoryLabel: '外观与显示', label: '时钟显示', description: '日期 / 星期 / 秒钟 / 24小时制' },
  { category: 'search', categoryLabel: '搜索设置', label: '默认搜索引擎', description: '百度 / Google / 必应 / DuckDuckGo' },
  { category: 'search', categoryLabel: '搜索设置', label: '搜索建议', description: '搜索建议开关' },
  { category: 'search', categoryLabel: '搜索设置', label: '搜索历史', description: '显示 / 记录搜索历史' },
  { category: 'search', categoryLabel: '搜索设置', label: '热门搜索', description: '显示 / 隐藏热门搜索' },
  { category: 'search', categoryLabel: '搜索设置', label: '工作区内容搜索', description: '笔记 / 书签 / 任务' },
  { category: 'search', categoryLabel: '搜索设置', label: '回车行为', description: '新标签页 / 当前页打开' },
  { category: 'search', categoryLabel: '搜索设置', label: '建议数量', description: '搜索建议最大数量' },
  { category: 'search', categoryLabel: '搜索设置', label: '快捷命令', description: '自定义搜索命令' },
  { category: 'shortcuts', categoryLabel: '快捷键设置', label: '快捷键列表', description: '点击可自定义' },
  { category: 'shortcuts', categoryLabel: '快捷键设置', label: '恢复默认', description: '重置全部快捷键' },
  { category: 'privacy', categoryLabel: '隐私与数据', label: '清除搜索历史', description: '删除本地搜索记录' },
  { category: 'privacy', categoryLabel: '隐私与数据', label: '清除所有数据', description: '重置全部设置与数据' },
  { category: 'privacy', categoryLabel: '隐私与数据', label: '导出设置', description: '下载为 JSON 文件' },
  { category: 'privacy', categoryLabel: '隐私与数据', label: '导入设置', description: '从 JSON 文件恢复' },
  { category: 'about', categoryLabel: '关于', label: '版本信息', description: '当前版本号' },
  { category: 'about', categoryLabel: '关于', label: '更新日志', description: '版本变更记录' },
  { category: 'about', categoryLabel: '关于', label: '仓库地址', description: 'GitHub 仓库' },
  { category: 'about', categoryLabel: '关于', label: '开源许可', description: 'MIT' }
])

const showSearch = computed(() => searchQuery.value.trim().length > 0)
const searchResults = computed<SearchEntry[]>(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return []
  return searchIndex.value.filter(
    (e) => e.label.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)
  )
})

function goToCategory(c: CategoryId) {
  searchQuery.value = ''
  switchCategory(c)
}

// ============ 选项常量 ============
const themeList: ThemeMode[] = ['light', 'dark', 'auto']
const engineList: SearchEngine[] = ['baidu', 'google', 'bing', 'duckduckgo']
const fontSizes: { value: FontSize; label: string }[] = (
  ['small', 'medium', 'large'] as FontSize[]
).map((v) => ({ value: v, label: FONT_SIZE_LABELS[v] }))
const searchBarStyles: { value: SearchBarStyle; label: string }[] = (
  ['full', 'small', 'square'] as SearchBarStyle[]
).map((v) => ({ value: v, label: SEARCH_BAR_STYLE_LABELS[v] }))
const layoutDensities: { value: LayoutDensity; label: string }[] = (
  ['compact', 'standard', 'spacious'] as LayoutDensity[]
).map((v) => ({ value: v, label: LAYOUT_DENSITY_LABELS[v] }))
const cornerVisibilities: { value: CornerButtonVisibility; label: string }[] = [
  { value: 'hidden', label: '完全隐藏' },
  { value: 'hover', label: '悬停显示' },
  { value: 'always', label: '始终显示' }
]
const clockStyles: { value: ClockStyle; label: string }[] = [
  { value: 'digital', label: '数字' },
  { value: 'minimal', label: '极简' },
  { value: 'analog', label: '模拟' }
]
const clockSizes: { value: ClockSize; label: string }[] = (
  ['small', 'medium', 'large'] as ClockSize[]
).map((v) => ({ value: v, label: CLOCK_SIZE_LABELS[v] }))
const clickActions: { value: ClockClickAction; label: string }[] = [
  { value: 'none', label: '无' },
  { value: 'toggleFormat', label: '切换格式' },
  { value: 'openSettings', label: '打开设置' }
]
const doubleClickActions: { value: ClockDoubleClickAction; label: string }[] = [
  { value: 'none', label: '无' },
  { value: 'quickSettings', label: '快速设置' },
  { value: 'fullscreen', label: '全屏' }
]
const enterBehaviors: { value: SearchEnterBehavior; label: string }[] = [
  { value: 'newTab', label: '新标签页打开' },
  { value: 'currentTab', label: '当前页打开' }
]

// 时钟布尔开关项（仅含 boolean 字段）
const clockToggles = computed(
  () =>
    [
      { key: 'visible' as const, label: '显示时钟' },
      { key: 'showDate' as const, label: '显示日期' },
      { key: 'showWeek' as const, label: '显示星期' },
      { key: 'showSeconds' as const, label: '显示秒钟' },
      { key: 'use24Hour' as const, label: '24小时制' },
      { key: 'hoverDetail' as const, label: '悬停显示详情' }
    ] satisfies { key: keyof ClockSettings; label: string }[]
)

// 搜索布尔开关项
const searchToggles = computed(
  () =>
    [
      { key: 'showSuggestions' as const, label: '搜索建议', description: '输入时展示建议' },
      { key: 'showHistory' as const, label: '搜索历史', description: '展示历史搜索' },
      { key: 'showHot' as const, label: '热门搜索', description: '展示热门搜索' },
      { key: 'localSearch' as const, label: '工作区内容搜索', description: '搜索笔记 / 书签 / 任务' },
      {
        key: 'workspaceContentSearch' as const,
        label: '工作区内容搜索（V0.2）',
        description: '笔记 / 书签 / 任务'
      },
      { key: 'recordHistory' as const, label: '记录搜索历史', description: '保存历史记录' },
      { key: 'privacyMode' as const, label: '隐私搜索模式', description: '不记录历史' }
    ] satisfies { key: keyof SearchSettings; label: string; description: string }[]
)

// ============ 快捷键：自定义录制 + 恢复默认 ============
const SHORTCUT_LABELS: Record<ShortcutKey, string> = {
  focusSearch: '聚焦搜索',
  openSettings: '打开设置',
  switchMode: '切换模式',
  newNote: '新建笔记',
  addTask: '添加任务',
  quickAccess: '快捷访问',
  toggleTheme: '切换主题',
  randomBackground: '随机背景'
}
const shortcutKeys = Object.keys(SHORTCUT_LABELS) as ShortcutKey[]

const recording = ref<ShortcutKey | null>(null)
const conflictMessage = ref('')

function startRecord(key: ShortcutKey) {
  if (recording.value) return
  conflictMessage.value = ''
  recording.value = key
}

function stopRecord() {
  recording.value = null
  conflictMessage.value = ''
}

function findConflict(current: ShortcutKey, shortcut: string): ShortcutKey | null {
  for (const key of shortcutKeys) {
    if (key !== current && settings.value.shortcuts[key] === shortcut) return key
  }
  return null
}

function onRecordKeydown(event: KeyboardEvent) {
  if (!recording.value) return
  event.preventDefault()
  event.stopPropagation()

  if (event.key === 'Escape') {
    stopRecord()
    return
  }
  if (event.key === 'Backspace' || event.key === 'Delete') {
    settingsStore.updateShortcuts({ [recording.value]: DEFAULT_SETTINGS.shortcuts[recording.value] })
    stopRecord()
    return
  }
  const shortcut = eventToShortcutString(event)
  if (!shortcut || !isValidShortcut(shortcut)) return
  const key = recording.value
  const conflict = findConflict(key, shortcut)
  if (conflict) {
    conflictMessage.value = `与「${SHORTCUT_LABELS[conflict]}」冲突，请更换`
    return
  }
  settingsStore.updateShortcuts({ [key]: shortcut })
  stopRecord()
}

function resetAllShortcuts() {
  settingsStore.resetShortcuts()
}

// ============ 隐私与数据：清除 / 导出 / 导入 ============
const importError = ref('')
const importPreview = ref<Settings | null>(null)
const importInputRef = ref<HTMLInputElement | null>(null)

function clearSearchHistory() {
  searchStore.clearHistory()
}

function clearAllAppData() {
  if (!window.confirm('确定清除所有数据吗？该操作不可撤销，将重置全部设置、任务、笔记与搜索历史。')) {
    return
  }
  void clearAllData().then(() => {
    window.location.reload()
  })
}

function exportSettings() {
  const json = settingsStore.exportSettings()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  a.href = url
  a.download = `tabtween-settings-${date}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function openImportPicker() {
  importInputRef.value?.click()
}

function onImportFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const data: unknown = JSON.parse(String(reader.result))
      if (!validateSettings(data)) {
        importError.value = '文件格式无效：缺少有效设置内容'
        return
      }
      const merged = mergeSettings(data)
      if (!merged) {
        importError.value = '文件内容无效'
        return
      }
      importError.value = ''
      importPreview.value = merged
    } catch {
      importError.value = '无法解析 JSON 文件'
    }
  }
  reader.readAsText(file)
}

function confirmImport() {
  if (!importPreview.value) return
  settingsStore.replaceSettings(importPreview.value)
  importPreview.value = null
  conflictMessage.value = ''
}

function cancelImport() {
  importPreview.value = null
  importError.value = ''
}

// ============ 快捷命令列表管理 ============
const commandItems = computed(() =>
  settings.value.search.commands.map((c) => ({ id: c.id, label: `${c.name}（${c.keyword}）` }))
)

function addCommand() {
  const command: SearchCommand = {
    id: generateId(),
    name: '新命令',
    keyword: `命令${settings.value.search.commands.length + 1}`,
    url: 'https://www.google.com/search?q=%s'
  }
  settingsStore.updateSearch({ commands: [...settings.value.search.commands, command] })
}

function removeCommand(id: string) {
  settingsStore.updateSearch({
    commands: settings.value.search.commands.filter((c) => c.id !== id)
  })
}

function reorderCommands(items: { id: string; label: string }[]) {
  const map = new Map(settings.value.search.commands.map((c) => [c.id, c]))
  const next = items
    .map((i) => map.get(i.id))
    .filter((c): c is SearchCommand => c !== undefined)
  settingsStore.updateSearch({ commands: next })
}

// ============ 全局录制监听 ============
function onWindowKeydown(event: KeyboardEvent) {
  onRecordKeydown(event)
}

onMounted(() => {
  window.addEventListener('keydown', onWindowKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onWindowKeydown)
})

watch(open, (v) => {
  if (v) nextTick(updateAtBottom)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="settings-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        @click.self="close"
      >
        <div
          class="flex h-[80vh] w-[min(760px,95vw)] flex-col overflow-hidden rounded-xl"
          :style="{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)'
          }"
        >
          <!-- 顶部：标题（居中） + 关闭按钮（右） -->
          <header
            class="relative flex items-center border-b px-4 py-3"
            :style="{ borderColor: 'var(--color-border)' }"
          >
            <h2
              class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-base font-medium"
            >
              设置
            </h2>
            <button
              class="close-btn ml-auto flex items-center justify-center rounded-md"
              :style="{ width: '28px', height: '28px', color: 'var(--color-text)' }"
              aria-label="关闭"
              @click="close"
            >
              ✕
            </button>
          </header>

          <!-- 主体：左侧导航 + 右侧内容 -->
          <div class="flex min-h-0 flex-1">
            <!-- 左侧分类导航 -->
            <nav
              class="w-40 shrink-0 border-r py-2"
              :style="{ borderColor: 'var(--color-border)' }"
              aria-label="设置分类"
              @keydown="onNavKeydown"
            >
              <button
                v-for="c in categories"
                :key="c.id"
                type="button"
                class="nav-item flex w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors duration-200"
                :aria-current="activeCategory === c.id ? 'page' : undefined"
                @click="switchCategory(c.id)"
              >
                <span class="text-base leading-none">{{ c.icon }}</span>
                <span class="truncate">{{ c.label }}</span>
              </button>
            </nav>

            <!-- 右侧内容区 -->
            <div class="flex min-h-0 min-w-0 flex-1 flex-col">
              <!-- 设置项搜索 -->
              <div
                class="shrink-0 border-b px-4 py-2"
                :style="{ borderColor: 'var(--color-border)' }"
              >
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="搜索设置项…"
                  class="w-full rounded-md border bg-transparent px-3 py-1.5 text-sm outline-none transition-colors focus:border-[var(--color-accent)]"
                  :style="{ borderColor: 'var(--color-border)' }"
                />
              </div>

              <!-- 滚动内容容器（relative 用于承载触底阴影） -->
              <div class="relative flex min-h-0 flex-1 flex-col">
                <div
                  ref="scrollRef"
                  class="settings-scroll flex-1 overflow-y-auto px-5 py-4 text-sm"
                  :style="{ color: 'var(--color-text)' }"
                  @scroll="onScroll"
                >
                  <!-- 搜索结果视图 -->
                  <div v-if="showSearch">
                    <p v-if="searchResults.length === 0" class="py-4 text-center opacity-60">
                      没有匹配的设置项
                    </p>
                    <button
                      v-for="r in searchResults"
                      :key="`${r.category}-${r.label}`"
                      type="button"
                      class="mb-1 block w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                      @click="goToCategory(r.category)"
                    >
                      <div class="font-medium">{{ r.label }}</div>
                      <div class="text-xs opacity-60">
                        {{ r.description }} · {{ r.categoryLabel }}
                      </div>
                    </button>
                  </div>

                  <!-- 外观与显示 -->
                  <div v-else-if="activeCategory === 'appearance'">
                    <!-- 主题 -->
                    <section class="setting-group"><h3 class="setting-group__title">主题</h3>
                    <p class="mb-1 text-xs opacity-70">主题模式</p>
                    <SettingRadio
                      :model-value="settings.appearance.theme"
                      :options="themeList.map((v) => ({ value: v, label: THEME_LABELS[v] }))"
                      @update:model-value="settingsStore.setTheme($event as ThemeMode)"
                    />
                    <div class="mt-3">
                      <p class="mb-1 text-xs opacity-70">主题颜色</p>
                      <SettingColorPicker
                        :model-value="settings.appearance.themeColor"
                        :presets="ACCENT_COLOR_PRESETS"
                        @update:model-value="
                          settingsStore.updateAppearance({ themeColor: String($event) })
                        "
                      />
                    </div>
                    <div class="mt-3">
                      <p class="mb-1 text-xs opacity-70">字体</p>
                      <SettingSelect
                        :model-value="settings.appearance.fontFamily"
                        :options="CLOCK_FONT_OPTIONS"
                        @update:model-value="
                          settingsStore.updateAppearance({ fontFamily: String($event) })
                        "
                      />
                    </div>
                    <div class="mt-3">
                      <p class="mb-1 text-xs opacity-70">字号</p>
                      <SettingRadio
                        :model-value="settings.appearance.fontSize"
                        :options="fontSizes"
                        @update:model-value="
                          settingsStore.updateAppearance({ fontSize: $event as FontSize })
                        "
                      />
                    </div>

                    <!-- 时钟 -->
                    </section><section class="setting-group"><h3 class="setting-group__title">时钟</h3>
                    <div class="mt-3">
                      <p class="mb-1 text-xs opacity-70">时钟字体</p>
                      <SettingSelect
                        :model-value="settings.clock.clockFont"
                        :options="CLOCK_FONT_OPTIONS"
                        @update:model-value="
                          settingsStore.updateClock({ clockFont: String($event) })
                        "
                      />
                    </div>
                    <div class="mt-3">
                      <p class="mb-1 text-xs opacity-70">时钟大小</p>
                      <SettingRadio
                        :model-value="settings.clock.clockSize"
                        :options="clockSizes"
                        @update:model-value="
                          settingsStore.updateClock({ clockSize: $event as ClockSize })
                        "
                      />
                    </div>
                    <div class="mt-3">
                      <p class="mb-1 text-xs opacity-70">时钟颜色</p>
                      <SettingColorPicker
                        :model-value="settings.clock.clockColor"
                        :presets="CLOCK_COLOR_PRESETS"
                        @update:model-value="
                          settingsStore.updateClock({ clockColor: String($event) })
                        "
                      />
                    </div>
                    <div class="mt-3 grid grid-cols-1 gap-x-4 md:grid-cols-2">
                      <SettingToggle
                        v-for="t in clockToggles"
                        :key="t.key"
                        :model-value="Boolean(settings.clock[t.key])"
                        :label="t.label"
                        @update:model-value="
                          settingsStore.updateClock({
                            [t.key]: $event
                          } as Partial<ClockSettings>)
                        "
                      />
                    </div>
                    <div class="mt-3">
                      <p class="mb-1 text-xs opacity-70">时钟样式</p>
                      <SettingRadio
                        :model-value="settings.clock.style"
                        :options="clockStyles"
                        @update:model-value="
                          settingsStore.updateClock({ style: $event as ClockStyle })
                        "
                      />
                    </div>
                    <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <p class="mb-1 text-xs opacity-70">点击时钟</p>
                        <SettingSelect
                          :model-value="settings.clock.clickAction"
                          :options="clickActions"
                          @update:model-value="
                            settingsStore.updateClock({ clickAction: $event as ClockClickAction })
                          "
                        />
                      </div>
                      <div>
                        <p class="mb-1 text-xs opacity-70">双击时钟</p>
                        <SettingSelect
                          :model-value="settings.clock.doubleClickAction"
                          :options="doubleClickActions"
                          @update:model-value="
                            settingsStore.updateClock({
                              doubleClickAction: $event as ClockDoubleClickAction
                            })
                          "
                        />
                      </div>
                    </div>

                    <!-- 布局 -->
                    </section><section class="setting-group"><h3 class="setting-group__title">布局</h3>
                    <p class="mb-1 text-xs opacity-70">搜索框样式</p>
                    <SettingRadio
                      :model-value="settings.appearance.searchBarStyle"
                      :options="searchBarStyles"
                      @update:model-value="
                        settingsStore.updateAppearance({ searchBarStyle: $event as SearchBarStyle })
                      "
                    />
                    <div class="mt-3">
                      <p class="mb-1 text-xs opacity-70">布局密度</p>
                      <SettingRadio
                        :model-value="settings.appearance.layoutDensity"
                        :options="layoutDensities"
                        @update:model-value="
                          settingsStore.updateAppearance({
                            layoutDensity: $event as LayoutDensity
                          })
                        "
                      />
                    </div>
                    <div class="mt-3">
                      <p class="mb-1 text-xs opacity-70">右上角按钮</p>
                      <SettingRadio
                        :model-value="settings.cornerButton.visibility"
                        :options="cornerVisibilities"
                        @update:model-value="
                          settingsStore.updateCornerButton({
                            visibility: $event as CornerButtonVisibility
                          })
                        "
                      />
                    </div>
                    </section>
                  </div>

                  <!-- 搜索设置 -->
                  <div v-else-if="activeCategory === 'search'">
                    <section class="setting-group"><h3 class="setting-group__title">搜索引擎</h3>
                    <div class="mt-2">
                      <p class="mb-1 text-xs opacity-70">默认搜索引擎</p>
                      <SettingSelect
                        :model-value="settings.search.engine"
                        :options="
                          engineList.map((v) => ({ value: v, label: SEARCH_ENGINE_LABELS[v] }))
                        "
                        @update:model-value="
                          settingsStore.updateSearch({ engine: $event as SearchEngine })
                        "
                      />
                    </div>
                    <div class="mt-3">
                      <p class="mb-1 text-xs opacity-70">回车行为</p>
                      <SettingRadio
                        :model-value="settings.search.enterBehavior"
                        :options="enterBehaviors"
                        @update:model-value="
                          settingsStore.updateSearch({
                            enterBehavior: $event as SearchEnterBehavior
                          })
                        "
                      />
                    </div>

                    </section><section class="setting-group"><h3 class="setting-group__title">显示与历史</h3>
                    <div class="mt-2 grid grid-cols-1 gap-x-4 md:grid-cols-2">
                      <SettingToggle
                        v-for="t in searchToggles"
                        :key="t.key"
                        :model-value="Boolean(settings.search[t.key])"
                        :label="t.label"
                        :description="t.description"
                        @update:model-value="
                          settingsStore.updateSearch({
                            [t.key]: $event
                          } as Partial<SearchSettings>)
                        "
                      />
                    </div>
                    <div class="mt-3">
                      <p class="mb-1 text-xs opacity-70">搜索建议数量</p>
                      <SettingSlider
                        :model-value="settings.search.suggestionCount"
                        :min="4"
                        :max="12"
                        :step="1"
                        suffix=" 条"
                        @update:model-value="
                          settingsStore.updateSearch({ suggestionCount: Number($event) })
                        "
                      />
                    </div>

                    </section><section class="setting-group"><h3 class="setting-group__title">快捷命令</h3>
                    <div class="mt-2">
                      <SettingListManager
                        :items="commandItems"
                        add-label="添加命令"
                        empty-text="暂无快捷命令"
                        @add="addCommand"
                        @remove="removeCommand"
                        @reorder="reorderCommands"
                      />
                    </div>
                    </section>
                  </div>

                  <!-- 快捷键设置 -->
                  <div v-else-if="activeCategory === 'shortcuts'">
                    <p class="mb-3 text-xs opacity-60">
                      点击快捷键进入录制，按
                      <kbd>Esc</kbd> 取消，按 <kbd>Backspace</kbd> 恢复默认。
                    </p>
                    <ul class="space-y-2">
                      <li
                        v-for="key in shortcutKeys"
                        :key="key"
                        class="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                        :style="{ borderColor: 'var(--color-border)' }"
                      >
                        <span class="text-sm">{{ SHORTCUT_LABELS[key] }}</span>
                        <button
                          type="button"
                          class="rounded-md border px-3 py-1 font-mono text-xs transition-colors"
                          :style="{
                            borderColor:
                              recording === key ? 'var(--color-accent)' : 'var(--color-border)',
                            color: recording === key ? 'var(--color-accent)' : 'var(--color-text)'
                          }"
                          @click="startRecord(key)"
                        >
                          {{ recording === key ? '按下快捷键…' : settings.shortcuts[key] }}
                        </button>
                      </li>
                    </ul>
                    <p
                      v-if="conflictMessage"
                      class="mt-2 text-xs"
                      :style="{ color: 'var(--color-accent)' }"
                    >
                      {{ conflictMessage }}
                    </p>
                    <div class="mt-4">
                      <button
                        type="button"
                        class="rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                        :style="{ borderColor: 'var(--color-border)' }"
                        @click="resetAllShortcuts"
                      >
                        恢复全部默认
                      </button>
                    </div>
                  </div>

                  <!-- 隐私与数据 -->
                  <div v-else-if="activeCategory === 'privacy'">
                    <section class="setting-group"><h3 class="setting-group__title">数据清理</h3>
                    <div class="mt-2 space-y-2">
                      <button
                        type="button"
                        class="action-btn block w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                        :style="{ borderColor: 'var(--color-border)' }"
                        @click="clearSearchHistory"
                      >
                        清除搜索历史
                      </button>
                      <button
                        type="button"
                        class="action-btn block w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                        :style="{ borderColor: 'var(--color-border)' }"
                        @click="clearAllAppData"
                      >
                        清除所有数据（重置为默认）
                      </button>
                    </div>

                    </section><section class="setting-group"><h3 class="setting-group__title">设置导入 / 导出</h3>
                    <div class="mt-2 space-y-2">
                      <button
                        type="button"
                        class="action-btn block w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                        :style="{ borderColor: 'var(--color-border)' }"
                        @click="exportSettings"
                      >
                        导出设置（JSON）
                      </button>
                      <button
                        type="button"
                        class="action-btn block w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                        :style="{ borderColor: 'var(--color-border)' }"
                        @click="openImportPicker"
                      >
                        导入设置（JSON）
                      </button>
                      <input
                        ref="importInputRef"
                        type="file"
                        accept="application/json,.json"
                        class="hidden"
                        @change="onImportFile"
                      />
                      <p v-if="importError" class="text-xs" :style="{ color: 'var(--color-accent)' }">
                        {{ importError }}
                      </p>
                      <div
                        v-if="importPreview"
                        class="rounded-lg border px-3 py-2 text-sm"
                        :style="{
                          borderColor: 'var(--color-border)',
                          background: 'var(--color-accent-soft)'
                        }"
                      >
                        <p class="mb-2 font-medium">已载入预览，确认应用？</p>
                        <div class="flex gap-2">
                          <button
                            type="button"
                            class="rounded-md px-3 py-1 text-xs"
                            :style="{ background: 'var(--color-accent)', color: '#ffffff' }"
                            @click="confirmImport"
                          >
                            应用
                          </button>
                          <button
                            type="button"
                            class="rounded-md border px-3 py-1 text-xs"
                            :style="{ borderColor: 'var(--color-border)' }"
                            @click="cancelImport"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    </div>
                    </section>
                  </div>

                  <!-- 关于 -->
                  <div v-else-if="activeCategory === 'about'">
                    <section class="setting-group"><h3 class="setting-group__title">版本信息</h3>
                    <dl class="mt-2 space-y-1 text-sm">
                      <div class="flex justify-between">
                        <dt class="opacity-60">版本</dt>
                        <dd>{{ ABOUT_INFO.version }}</dd>
                      </div>
                      <div class="flex justify-between">
                        <dt class="opacity-60">作者</dt>
                        <dd>{{ ABOUT_INFO.author }}</dd>
                      </div>
                      <div class="flex justify-between">
                        <dt class="opacity-60">许可</dt>
                        <dd>{{ ABOUT_INFO.license }}</dd>
                      </div>
                    </dl>

                    </section><section class="setting-group"><h3 class="setting-group__title">更新日志</h3>
                    <p class="mt-2 text-sm opacity-70">{{ ABOUT_INFO.changelog }}</p>

                    </section><section class="setting-group"><h3 class="setting-group__title">仓库地址</h3>
                    <a
                      :href="ABOUT_INFO.repository"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="mt-2 inline-block text-sm text-[var(--color-accent)] underline"
                    >
                      {{ ABOUT_INFO.repository }}
                    </a>
                    </section>
                  </div>
                </div>

                <!-- 触底渐变阴影：未触底时显示 -->
                <div
                  v-if="!atBottom"
                  class="pointer-events-none absolute bottom-0 left-0 right-0 h-6"
                  :style="{
                    background: 'linear-gradient(to top, var(--color-bg-elevated), transparent)'
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* 分组卡片 */
/* 分组卡片容器：边框+圆角，让分组一眼可辨 */
.setting-group {
  margin-bottom: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
}
.setting-group:last-child {
  margin-bottom: 0;
}
/* 分组标题：左侧 accent 竖条 + 底部分隔线 */
.setting-group__title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  padding-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
}
.setting-group__title::before {
  content: '';
  display: block;
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: var(--color-accent);
}

/* 关闭按钮：悬浮内压动画 */
.close-btn {
  transition: transform 0.2s ease, background-color 0.2s ease;
}
.close-btn:hover {
  transform: scale(0.92);
}

/* 左侧导航项：active 主色高亮 / hover 半透明背景（PRD F1） */
.nav-item {
  height: 40px;
  color: var(--color-text);
  background: transparent;
}
.nav-item[aria-current='page'] {
  color: var(--color-accent);
  background: var(--color-accent-soft);
}
.nav-item:not([aria-current='page']):hover {
  background: rgba(128, 128, 128, 0.1);
}

/* 操作按钮：点击内压 */
.action-btn {
  transition: transform 0.15s ease;
}
.action-btn:active {
  transform: scale(0.98);
}

/* 右侧滚动区：细窄半透明滚动条 + 平滑滚动（PRD F1） */
.settings-scroll {
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: rgba(128, 128, 128, 0.35) transparent;
}
.settings-scroll::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.settings-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.settings-scroll::-webkit-scrollbar-thumb {
  background: rgba(128, 128, 128, 0.35);
  border-radius: 3px;
}
.settings-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(128, 128, 128, 0.55);
}

/* 快捷键提示 kbd 样式 */
kbd {
  padding: 1px 5px;
  border-radius: 3px;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  font-size: 11px;
  font-family: monospace;
}
</style>

<style>
/* 面板淡入淡出（非 scoped，Transition 类需全局可见） */
.settings-fade-enter-active,
.settings-fade-leave-active {
  transition: opacity 0.2s ease;
}
.settings-fade-enter-from,
.settings-fade-leave-to {
  opacity: 0;
}
</style>

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { SearchEngine } from '@/newtab/types/settings'
import type { Mode, Scene } from '@/newtab/types/mode'
import type { BuiltinCommand } from '@/newtab/constant/commands'
import {
  BUILTIN_COMMANDS,
  SEARCH_ENGINE_URL,
  STORAGE_KEYS,
  LIMITS
} from '@/newtab/constant'
import { useModeStore } from '@/newtab/stores/mode'
import { useSettingsStore } from '@/newtab/stores/settings'
import { useTasksStore } from '@/newtab/stores/tasks'
import { useNotesStore } from '@/newtab/stores/notes'
import { useShortcutsStore } from '@/newtab/stores/shortcuts'
import { loadData, onStorageChange, saveData } from '@/newtab/utils/storage'

export interface SearchHistoryItem {
  query: string
  engine: SearchEngine
  /** 搜索时间戳（epoch 毫秒） */
  timestamp: number
}

/** 本地搜索结果（任务 / 笔记 / 快捷网站） */
export interface LocalResult {
  type: 'task' | 'note' | 'website'
  title: string
  subtitle?: string
  /** 任务 id（用于跳转高亮） */
  taskId?: string
  /** 笔记 id（用于在笔记列表中选中） */
  noteId?: string
  /** 网站跳转 URL */
  url?: string
}

/** 命中后的命令展示项 */
export interface MatchedCommand {
  command: BuiltinCommand
  label: string
  icon: string
}

// ============ 安全的算术表达式求值（不使用 eval / new Function） ============
function safeEvalArithmetic(
  expr: string
): { ok: true; value: number } | { ok: false; error: string } {
  const s = expr.replace(/\s+/g, '')
  if (!s) return { ok: false, error: '空表达式' }
  const tokens: (number | string)[] = []
  let i = 0
  while (i < s.length) {
    const ch = s[i]!
    if ((ch >= '0' && ch <= '9') || ch === '.') {
      let num = ''
      while (i < s.length && ((s[i]! >= '0' && s[i]! <= '9') || s[i] === '.')) {
        num += s[i]
        i++
      }
      const n = Number(num)
      if (Number.isNaN(n)) return { ok: false, error: '无效数字' }
      tokens.push(n)
    } else if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '%' || ch === '(' || ch === ')') {
      tokens.push(ch)
      i++
    } else {
      return { ok: false, error: `非法字符：${ch}` }
    }
  }

  let pos = 0
  const peek = (): string | number | undefined => tokens[pos]
  const consume = (): string | number | undefined => tokens[pos++]

  function parseFactor(): number {
    const t = peek()
    if (t === '(') {
      consume()
      const v = parseExpr()
      if (peek() !== ')') throw new Error('括号不匹配')
      consume()
      return v
    }
    if (t === '-') {
      consume()
      return -parseFactor()
    }
    if (t === '+') {
      consume()
      return parseFactor()
    }
    const n = consume()
    if (typeof n === 'number') return n
    throw new Error('语法错误')
  }
  function parseTerm(): number {
    let v = parseFactor()
    while (peek() === '*' || peek() === '/' || peek() === '%') {
      const op = consume() as string
      const r = parseFactor()
      if (op === '*') v = v * r
      else if (op === '/') {
        if (r === 0) throw new Error('除以零')
        v = v / r
      } else v = v % r
    }
    return v
  }
  function parseExpr(): number {
    let v = parseTerm()
    while (peek() === '+' || peek() === '-') {
      const op = consume() as string
      const r = parseTerm()
      v = op === '+' ? v + r : v - r
    }
    return v
  }

  try {
    const value = parseExpr()
    if (pos < tokens.length) return { ok: false, error: '多余字符' }
    if (!Number.isFinite(value)) return { ok: false, error: '结果无效' }
    return { ok: true, value }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ============ URL 形态识别 ============
function isUrlLike(raw: string): boolean {
  if (!raw || /\s/.test(raw)) return false
  // 形如 domain.tld 或 domain.tld/path，tld 至少 2 位字母，避免与数字字面量冲突
  return /^[^\s/]+\.[a-zA-Z]{2,}([/?#].*)?$/.test(raw)
}

function normalizeUrl(raw: string): string {
  const t = raw.trim()
  return /^https?:\/\//i.test(t) ? t : `https://${t}`
}

/** 规整旧历史数据：旧版 at: ISO 字符串 → timestamp: 数字毫秒 */
function normalizeHistory(raw: unknown): SearchHistoryItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const it = item as Partial<SearchHistoryItem> & { at?: string }
    if (typeof it.timestamp === 'number') {
      return {
        query: String(it.query ?? ''),
        engine: it.engine ?? 'baidu',
        timestamp: it.timestamp
      }
    }
    // 旧格式：at 为 ISO 字符串
    const ts = it.at ? Date.parse(it.at) : NaN
    return {
      query: String(it.query ?? ''),
      engine: it.engine ?? 'baidu',
      timestamp: Number.isFinite(ts) ? ts : Date.now()
    }
  })
}

export const useSearchStore = defineStore('search', () => {
  const query = ref('')
  const isFocused = ref(false)
  const searchMode = ref<'local' | 'web'>('web')
  const history = ref<SearchHistoryItem[]>([])
  let historySynced = false

  // 历史 / 建议过滤（保留旧 API 供 useSearch composable 使用）
  const suggestions = computed<SearchHistoryItem[]>(() => {
    if (!query.value.trim()) return history.value.slice(0, 5)
    const q = query.value.toLowerCase()
    return history.value.filter((h) => h.query.toLowerCase().includes(q)).slice(0, 8)
  })

  // 命令匹配（极简模式禁用）
  const matchedCommands = computed<MatchedCommand[]>(() => {
    const modeStore = useModeStore()
    if (modeStore.isMinimal) return []
    const q = query.value.trim().toLowerCase()
    if (!q) return []
    const result: MatchedCommand[] = []
    for (const cmd of BUILTIN_COMMANDS) {
      const match = cmd.match ?? 'exact'
      if (match === 'exact' && q === cmd.keyword.toLowerCase()) {
        result.push({ command: cmd, label: cmd.label, icon: cmd.icon })
      } else if (match === 'prefix' && cmd.keyword && q.startsWith(cmd.keyword.toLowerCase())) {
        result.push({ command: cmd, label: cmd.label, icon: cmd.icon })
      } else if (match === 'url' && isUrlLike(query.value.trim())) {
        result.push({ command: cmd, label: `打开 ${query.value.trim()}`, icon: cmd.icon })
      }
    }
    return result
  })

  // 计算结果（仅标准模式，前缀 计算:/calc:）
  const calcResult = computed<{ expression: string; value: string } | null>(() => {
    const modeStore = useModeStore()
    if (modeStore.isMinimal) return null
    const q = query.value.trim()
    const m = /^(?:计算:|calc:)(.*)$/i.exec(q)
    if (!m) return null
    const expr = m[1]!.trim()
    if (!expr) return null
    const r = safeEvalArithmetic(expr)
    return { expression: expr, value: r.ok ? String(r.value) : `错误：${r.error}` }
  })

  // 本地搜索结果（任务 / 笔记 / 快捷网站）；笔记与快捷方式从各自 store 实时读取
  const localResults = computed<LocalResult[]>(() => {
    const q = query.value.trim().toLowerCase()
    if (!q) return []
    const results: LocalResult[] = []
    // 任务（标题包含 query）
    const tasksStore = useTasksStore()
    for (const t of tasksStore.tasks) {
      if (t.title.toLowerCase().includes(q)) {
        results.push({ type: 'task', title: t.title, subtitle: '任务', taskId: t.id })
      }
    }
    // 笔记（标题或内容包含 query）
    const notesStore = useNotesStore()
    for (const n of notesStore.notes) {
      if (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'note',
          title: n.title || '无标题',
          subtitle: '笔记',
          noteId: n.id
        })
      }
    }
    // 快捷网站（名称或 URL 包含 query）
    const shortcutsStore = useShortcutsStore()
    for (const s of shortcutsStore.shortcuts) {
      if (s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q)) {
        results.push({ type: 'website', title: s.name, subtitle: s.url, url: s.url })
      }
    }
    return results.slice(0, 20)
  })

  function setQuery(value: string) {
    query.value = value
  }
  function setFocused(value: boolean) {
    isFocused.value = value
  }
  function setSearchMode(mode: 'local' | 'web') {
    searchMode.value = mode
  }

  function buildSearchUrl(engine: SearchEngine): string {
    const base = SEARCH_ENGINE_URL[engine] ?? SEARCH_ENGINE_URL.baidu
    return `${base}${encodeURIComponent(query.value.trim())}`
  }

  function pushHistory(engine: SearchEngine) {
    const trimmed = query.value.trim()
    if (!trimmed) return
    const item: SearchHistoryItem = {
      query: trimmed,
      engine,
      timestamp: Date.now()
    }
    const filtered = history.value.filter((h) => h.query !== trimmed)
    filtered.unshift(item)
    history.value = filtered.slice(0, LIMITS.maxSearchHistory)
    void persistHistory()
  }

  /** 单条删除（按 query 文本去重） */
  function removeHistory(q: string) {
    const trimmed = q.trim()
    if (!trimmed) return
    history.value = history.value.filter((h) => h.query !== trimmed)
    void persistHistory()
  }

  function clearHistory() {
    history.value = []
    void persistHistory()
  }

  /** 用指定引擎执行网络搜索：记录历史 → 清空输入 → 关闭面板 → 按设置打开（新标签页/当前页） */
  function submitWebSearch(engine: SearchEngine) {
    const trimmed = query.value.trim()
    if (!trimmed) return
    const settingsStore = useSettingsStore()
    const url = buildSearchUrl(engine)
    pushHistory(engine)
    clear()
    setFocused(false)
    if (settingsStore.settings.search.enterBehavior === 'newTab') {
      window.open(url, '_blank')
    } else {
      window.location.href = url
    }
  }

  /** 执行命中的命令；calc 仅展示结果不清空，其余执行后清空并关闭面板 */
  function executeCommand(cmd: BuiltinCommand, rawQuery: string) {
    const modeStore = useModeStore()
    const settingsStore = useSettingsStore()
    switch (cmd.action) {
      case 'scene':
        modeStore.setScene(cmd.payload as Scene)
        break
      case 'mode':
        modeStore.setMode(cmd.payload as Mode)
        break
      case 'theme':
        settingsStore.setTheme(cmd.payload as 'light' | 'dark')
        break
      case 'settings':
        if (cmd.event) window.dispatchEvent(new CustomEvent(cmd.event))
        break
      case 'calc':
        // 结果已在面板内展示，无额外动作
        break
      case 'url': {
        const url = normalizeUrl(rawQuery)
        window.open(url, '_blank')
        break
      }
      case 'clearHistory':
        clearHistory()
        break
    }
    if (cmd.action !== 'calc') {
      clear()
      setFocused(false)
    }
  }

  /** 执行本地结果点击：任务→切到工作场景并派发高亮事件；笔记→切到学习场景；网站→打开 URL */
  function executeLocalResult(result: LocalResult) {
    const modeStore = useModeStore()
    switch (result.type) {
      case 'task':
        modeStore.setScene('work')
        window.dispatchEvent(
          new CustomEvent('tabtween:highlight-task', { detail: { id: result.taskId } })
        )
        break
      case 'note': {
        const notesStore = useNotesStore()
        if (result.noteId) notesStore.setActiveId(result.noteId)
        modeStore.setScene('study')
        window.dispatchEvent(new CustomEvent('tabtween:highlight-note'))
        break
      }
      case 'website':
        if (result.url) window.open(result.url, '_blank')
        break
    }
    clear()
    setFocused(false)
  }

  async function persistHistory() {
    await saveData(STORAGE_KEYS.searchHistory, history.value)
  }
  async function loadHistory() {
    const stored = await loadData<unknown>(STORAGE_KEYS.searchHistory)
    history.value = normalizeHistory(stored)
    if (!historySynced) {
      onStorageChange((changes) => {
        const change = changes[STORAGE_KEYS.searchHistory]
        if (!change) return
        history.value = normalizeHistory(change.newValue)
      })
      historySynced = true
    }
  }

  function clear() {
    query.value = ''
  }

  // 启动时加载持久化历史；笔记 / 快捷方式由各自 store 自加载并跨标签同步，
  // localResults 直接读取 store 的响应式状态，无需在此重复缓存
  void loadHistory()

  return {
    query,
    isFocused,
    searchMode,
    history,
    suggestions,
    matchedCommands,
    calcResult,
    localResults,
    setQuery,
    setFocused,
    setSearchMode,
    buildSearchUrl,
    pushHistory,
    removeHistory,
    clearHistory,
    submitWebSearch,
    executeCommand,
    executeLocalResult,
    loadHistory,
    clear
  }
})

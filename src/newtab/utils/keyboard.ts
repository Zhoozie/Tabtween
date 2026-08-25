// 键盘快捷键工具
// 处理跨平台差异（mac 用 Cmd，其他用 Ctrl）

export interface ShortcutMatch {
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  meta?: boolean
  /** 小写的 key，如 "k" / "," / "m" */
  key: string
}

export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false
  return /mac|iphone|ipad/i.test(navigator.platform)
}

export function parseShortcut(input: string): ShortcutMatch {
  const parts = input
    .toLowerCase()
    .split('+')
    .map((p) => p.trim())
  const match: ShortcutMatch = { key: '' }
  for (const p of parts) {
    if (p === 'ctrl' || p === 'control') match.ctrl = true
    else if (p === 'alt' || p === 'option') match.alt = true
    else if (p === 'shift') match.shift = true
    else if (p === 'meta' || p === 'cmd' || p === 'command') match.meta = true
    else match.key = p
  }
  return match
}

/** 判断键盘事件是否匹配指定快捷键 */
export function matchShortcut(event: KeyboardEvent, shortcut: ShortcutMatch): boolean {
  const expectedKey = shortcut.key.toLowerCase()
  const actualKey = event.key.toLowerCase()
  if (expectedKey !== actualKey) return false
  // mac 上 Ctrl/Cmd 互通：用 Cmd 替代 Ctrl
  const wantMod = shortcut.ctrl || shortcut.meta
  const hasMod = event.ctrlKey || event.metaKey
  if (wantMod && !hasMod) return false
  if (!wantMod && (event.ctrlKey || event.metaKey)) return false
  if (!!shortcut.alt !== event.altKey) return false
  if (!!shortcut.shift !== event.shiftKey) return false
  return true
}

/** 注册一个全局快捷键，返回取消注册函数 */
export function registerShortcut(
  shortcut: ShortcutMatch | string,
  handler: (event: KeyboardEvent) => void
): () => void {
  const match = typeof shortcut === 'string' ? parseShortcut(shortcut) : shortcut
  // 当焦点在输入框时不触发（除非快捷键本身是字符输入如 "/"）
  const isInputFocused = () => {
    const el = document.activeElement
    if (!el) return false
    const tag = el.tagName
    return tag === 'INPUT' || tag === 'TEXTAREA' || (el as HTMLElement).isContentEditable
  }

  const listener = (event: KeyboardEvent) => {
    if (!matchShortcut(event, match)) return
    if (isInputFocused() && match.key.length === 1 && !match.ctrl && !match.meta && !match.alt) {
      return
    }
    event.preventDefault()
    handler(event)
  }
  window.addEventListener('keydown', listener)
  return () => window.removeEventListener('keydown', listener)
}

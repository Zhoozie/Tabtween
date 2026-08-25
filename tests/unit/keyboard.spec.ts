import { describe, it, expect } from 'vitest'
import { parseShortcut, matchShortcut } from '@/newtab/utils/keyboard'

function makeEvent(
  key: string,
  opts: { ctrl?: boolean; alt?: boolean; shift?: boolean; meta?: boolean } = {}
): KeyboardEvent {
  return {
    key,
    ctrlKey: opts.ctrl ?? false,
    altKey: opts.alt ?? false,
    shiftKey: opts.shift ?? false,
    metaKey: opts.meta ?? false
  } as unknown as KeyboardEvent
}

describe('utils/keyboard', () => {
  describe('parseShortcut', () => {
    it('should parse ctrl+key', () => {
      const s = parseShortcut('Ctrl+K')
      expect(s.ctrl).toBe(true)
      expect(s.key).toBe('k')
    })

    it('should parse multi-modifier', () => {
      const s = parseShortcut('Ctrl+Shift+B')
      expect(s.ctrl).toBe(true)
      expect(s.shift).toBe(true)
      expect(s.key).toBe('b')
    })

    it('should treat cmd as meta', () => {
      const s = parseShortcut('Cmd+,')
      expect(s.meta).toBe(true)
      expect(s.key).toBe(',')
    })
  })

  describe('matchShortcut', () => {
    it('should match ctrl+k', () => {
      expect(matchShortcut(makeEvent('k', { ctrl: true }), parseShortcut('Ctrl+K'))).toBe(true)
    })

    it('should match meta as ctrl substitute', () => {
      expect(matchShortcut(makeEvent('k', { meta: true }), parseShortcut('Ctrl+K'))).toBe(true)
    })

    it('should not match when key differs', () => {
      expect(matchShortcut(makeEvent('m', { ctrl: true }), parseShortcut('Ctrl+K'))).toBe(false)
    })

    it('should not match when modifier missing', () => {
      expect(matchShortcut(makeEvent('k'), parseShortcut('Ctrl+K'))).toBe(false)
    })

    it('should require shift when specified', () => {
      expect(matchShortcut(makeEvent('b', { ctrl: true }), parseShortcut('Ctrl+Shift+B'))).toBe(
        false
      )
      expect(
        matchShortcut(makeEvent('b', { ctrl: true, shift: true }), parseShortcut('Ctrl+Shift+B'))
      ).toBe(true)
    })
  })
})

import { describe, it, expect } from 'vitest'
import { getClockParts, getGreeting } from '@/newtab/utils/time'

describe('utils/time', () => {
  describe('getClockParts', () => {
    it('should format 24h time correctly', () => {
      const date = new Date(2026, 7, 24, 14, 30, 8)
      const parts = getClockParts(date, true)
      expect(parts.main).toBe('14:30')
      expect(parts.seconds).toBe(':08')
      expect(parts.date).toBe('2026-08-24')
      expect(parts.week).toBe('周一')
    })

    it('should format 12h time with AM/PM', () => {
      const morning = new Date(2026, 7, 24, 9, 5, 0)
      expect(getClockParts(morning, false).main).toBe('09:05 AM')

      const afternoon = new Date(2026, 7, 24, 14, 30, 0)
      expect(getClockParts(afternoon, false).main).toBe('02:30 PM')
    })

    it('should handle midnight and noon in 12h', () => {
      const midnight = new Date(2026, 7, 24, 0, 0, 0)
      expect(getClockParts(midnight, false).main).toBe('12:00 AM')

      const noon = new Date(2026, 7, 24, 12, 0, 0)
      expect(getClockParts(noon, false).main).toBe('12:00 PM')
    })

    it('should pad single digits', () => {
      const date = new Date(2026, 0, 1, 1, 2, 3)
      const parts = getClockParts(date, true)
      expect(parts.main).toBe('01:02')
      expect(parts.seconds).toBe(':03')
    })
  })

  describe('getGreeting', () => {
    it('should return morning greeting before 11', () => {
      expect(getGreeting(new Date(2026, 7, 24, 8, 0))).toBe('早上好')
    })

    it('should return noon greeting between 11 and 13', () => {
      expect(getGreeting(new Date(2026, 7, 24, 12, 0))).toBe('中午好')
    })

    it('should return afternoon greeting between 13 and 18', () => {
      expect(getGreeting(new Date(2026, 7, 24, 15, 0))).toBe('下午好')
    })

    it('should return evening greeting after 18', () => {
      expect(getGreeting(new Date(2026, 7, 24, 20, 0))).toBe('晚上好')
    })
  })
})

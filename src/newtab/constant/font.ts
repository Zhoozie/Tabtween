import type { FontSize } from '@/newtab/types/settings'

/**
 * 字号（FontSize） -> 根元素 px 值。
 * 该值会被写入 :root 的 --font-size-base，组件中使用 rem 的位置
 * 都以此为基准缩放：1rem = var(--font-size-base)。
 */
export const FONT_SIZE_BASE_PX: Record<FontSize, number> = {
  small: 14,
  medium: 16,
  large: 18
}

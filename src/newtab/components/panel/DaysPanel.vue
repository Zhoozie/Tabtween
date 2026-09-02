<script setup lang="ts">
/**
 * DaysPanel — 日子弹窗面板
 *
 * 布局：顶部导航栏 → 内容区域
 * - 顶部导航栏：标题居中 + 设置/关闭按钮在右
 * - 内容区域：列表/设置两视图切换
 * - 添加表单就地显示：点击添加按钮后，表单在按钮位置展开
 * - 编辑表单就地替换：点击列表项后，该行变为内联编辑表单
 */
import { computed, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useDaysStore } from '@/newtab/stores/days'
import { daysDiffFromToday, formatDateDisplay, todayStr } from '@/newtab/stores/days'
import PanelShell from '@/newtab/components/common/PanelShell.vue'
import SvgIcon from '@/newtab/components/common/SvgIcon.vue'
import { DAY_CATEGORY_LABELS, DAY_CATEGORY_LIST, DAY_GROUP_LABELS, LIMITS } from '@/newtab/constant'
import type { Day, DayCategory, DayGroupKey } from '@/newtab/types/day'

interface Props {
  open: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

function close(): void {
  emit('update:open', false)
}

// ===== 日期输入（点击日历图标触发原生日期选择器）=====
// 不再使用模板 ref：三个表单共用一个 ref 名时曾出现运行时异常（el.focus is not a function）。
// 改为从事件 currentTarget 出发，在同一容器里直接定位 date input，更可靠。
function openDatePicker(event: MouseEvent): void {
  const target = event.currentTarget as HTMLElement | null
  const root = target?.parentElement
  const input = root?.querySelector<HTMLInputElement>('input[type="date"]')
  if (!input || typeof input.focus !== 'function') return

  // 优先调用原生 showPicker()。浏览器实测失败时会同步抛错，所以用 try/catch 兜底；
  // 不可用或被禁用时直接 focus()，让 input 自己弹原生选择器。
  if (typeof input.showPicker === 'function') {
    try {
      input.showPicker()
      return
    } catch {
      // fall through to focus
    }
  }
  input.focus()
}

// ===== Store =====
const store = useDaysStore()
const { settings, sortedDays, groupedDays } = storeToRefs(store)

// ===== 面板内部状态 =====
// 'list' | 'settings'
const mainView = ref<'list' | 'settings'>('list')

// 添加态 & 编辑态
const isAdding = ref(false)
const editingId = ref<string | null>(null)

// ===== 表单 =====
const form = ref({
  name: '',
  date: todayStr(),
  category: 'other' as DayCategory,
  note: ''
})
const formError = ref('')

// ===== Toast =====
const toast = ref<string | null>(null)
let toastTimer: number | null = null

function showToast(msg: string): void {
  toast.value = msg
  if (toastTimer !== null) window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toast.value = null
  }, 1500)
}

// ===== 列表分组 =====
interface DayGroup {
  key: DayGroupKey
  label: string
  items: Day[]
}

const visibleGroups = computed<DayGroup[]>(() => {
  const g = groupedDays.value
  const groups: DayGroup[] = [
    { key: 'today', label: DAY_GROUP_LABELS.today, items: g.today },
    { key: 'upcoming', label: DAY_GROUP_LABELS.upcoming, items: g.upcoming },
    { key: 'past', label: DAY_GROUP_LABELS.past, items: g.past }
  ]
  return groups.filter((gr) => gr.items.length > 0)
})

const totalCount = computed(() => sortedDays.value.length)

// ===== 天数文字 & 样式 =====
type DayTone = 'future' | 'today' | 'past'

function dayCountInfo(dateStr: string): { text: string; tone: DayTone } {
  const diff = daysDiffFromToday(dateStr)
  if (diff === 0) return { text: '就是今天', tone: 'today' }
  if (diff > 0) return { text: `还有 ${diff} 天`, tone: 'future' }
  return { text: `已经 ${Math.abs(diff)} 天`, tone: 'past' }
}

function toneStyle(tone: DayTone): Record<string, string> {
  if (tone === 'today') return { color: 'var(--color-today)' }
  if (tone === 'future') return { color: 'var(--color-accent)' }
  return { color: 'var(--color-text)', opacity: '0.5' }
}

// ===== 表单操作 =====
function resetForm(): void {
  form.value = { name: '', date: todayStr(), category: 'other', note: '' }
  formError.value = ''
}

function startAdd(): void {
  resetForm()
  editingId.value = null
  isAdding.value = true
}

function startEdit(day: Day): void {
  isAdding.value = false
  editingId.value = day.id
  form.value = {
    name: day.name,
    date: day.date,
    category: day.category,
    note: day.note ?? ''
  }
  formError.value = ''
}

function cancelEdit(): void {
  isAdding.value = false
  editingId.value = null
  resetForm()
}

function validateForm(): string | null {
  if (!form.value.name.trim()) return '请输入名称'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.value.date)) return '日期格式不正确'
  return null
}

function saveForm(): void {
  const err = validateForm()
  if (err) {
    formError.value = err
    return
  }
  if (editingId.value) {
    store.updateDay(editingId.value, {
      name: form.value.name,
      date: form.value.date,
      category: form.value.category,
      note: form.value.note
    })
    showToast('已保存')
  } else {
    const result = store.addDay({
      name: form.value.name,
      date: form.value.date,
      category: form.value.category,
      note: form.value.note
    })
    if (!result) {
      formError.value = `已达上限（最多 ${LIMITS.maxDays} 个日子）`
      return
    }
    showToast('已添加')
  }
  cancelEdit()
}

function deleteDay(day: Day): void {
  if (!window.confirm(`确定删除「${day.name}」吗？`)) return
  store.removeDay(day.id)
  if (editingId.value === day.id) cancelEdit()
  showToast('已删除')
}

// ===== 设置项更新 =====

// ===== 主视图切换 =====

// ===== 轮播定时器清理 =====
let carouselTimer: number | null = null

watch(
  [() => settings.value.autoCarousel, () => settings.value.carouselInterval],
  ([auto, interval]) => {
    if (carouselTimer !== null) {
      window.clearInterval(carouselTimer)
      carouselTimer = null
    }
    if (auto && sortedDays.value.length > 1) {
      carouselTimer = window.setInterval(() => store.next(), interval * 1000)
    }
  }
)

// ===== 关闭时重置面板状态 =====
watch(
  () => props.open,
  (opened) => {
    if (!opened) {
      setTimeout(() => {
        cancelEdit()
        mainView.value = 'list'
      }, 250)
    }
  }
)

onUnmounted(() => {
  if (carouselTimer !== null) window.clearInterval(carouselTimer)
  if (toastTimer !== null) window.clearTimeout(toastTimer)
})
</script>

<template>
  <PanelShell
    :open="open"
    title="日子"
    :width="settings.panelWidth"
    :show-header="true"
    @update:open="emit('update:open', $event)"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium">日子</span>
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-text)] opacity-60 transition-all hover:bg-[var(--color-hover)] hover:opacity-100"
            aria-label="日子设置"
            @click="mainView = 'settings'"
          >
            <SvgIcon name="more" :size="16" label="日子设置" />
          </button>
          <button
            type="button"
            class="flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-text)] opacity-60 transition-all hover:bg-[var(--color-hover)] hover:opacity-100"
            aria-label="关闭"
            @click="close"
          >
            <SvgIcon name="close" :size="16" label="关闭日子面板" />
          </button>
        </div>
      </div>
    </template>

    <!-- ===== 列表 ===== -->
    <div
      v-if="mainView === 'list'"
      class="days-scroll min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-3"
    >
      <!-- 空状态 + 就地添加表单 -->
      <div
        v-if="totalCount === 0"
        class="flex h-full flex-col items-center justify-center gap-3 text-center"
      >
        <div v-if="!isAdding">
          <span class="text-4xl opacity-30">
            <SvgIcon name="calendar" :size="16" label="展开日子面板" />
          </span>
          <p class="text-sm opacity-50">还没有记录任何日子</p>
          <button
            type="button"
            class="mt-2 rounded-md px-4 py-1.5 text-sm text-[var(--color-on-accent)]"
            :style="{ background: 'var(--color-accent)' }"
            @click="startAdd"
          >
            + 添加第一个日子
          </button>
        </div>
        <div v-else class="w-full max-w-sm rounded-lg border p-3 text-left">
          <p class="mb-2 text-xs font-medium opacity-75">新建日子</p>
          <div class="mb-2 flex gap-2 items-center">
            <div class="flex-1 min-w-0">
              <input
                v-model="form.name"
                type="text"
                placeholder="名称"
                class="form-input w-full"
                maxlength="8"
              />
            </div>
            <div class="relative w-36 shrink-0">
              <input
                v-model="form.date"
                type="date"
                class="form-input w-full date-input"
                style="padding-right: 1.75rem"
              />
              <SvgIcon
                name="calendar"
                :size="14"
                label="选择日子"
                class="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-[var(--color-text)] opacity-60 transition-opacity hover:opacity-100"
                @click="openDatePicker"
              />
            </div>
          </div>
          <div class="mb-2">
            <p class="mb-1.5 text-xs opacity-70">请选择类别</p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="cat in DAY_CATEGORY_LIST"
                :key="cat"
                type="button"
                class="flex items-center gap-1 rounded-md border px-2 py-2 text-xs transition-colors"
                :style="{
                  borderColor:
                    form.category === cat ? 'var(--color-accent)' : 'var(--color-border)',
                  color: form.category === cat ? 'var(--color-accent)' : 'var(--color-text)',
                  background: form.category === cat ? 'var(--color-accent-soft)' : 'transparent'
                }"
                @click="form.category = cat"
              >
                {{ DAY_CATEGORY_LABELS[cat].icon }}
                {{ DAY_CATEGORY_LABELS[cat].label }}
              </button>
            </div>
          </div>
          <div class="mb-2">
            <div class="relative">
              <input
                v-model="form.note"
                type="text"
                placeholder="备注"
                class="form-input w-full pr-10"
                maxlength="20"
              />
              <span class="absolute right-2 top-1/2 -translate-y-1/2 text-xs opacity-40"
                >{{ form.note.length }}/20</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- 有数据时：分组列表 -->
      <div v-else class="space-y-4">
        <section v-for="g in visibleGroups" :key="g.key" class="day-group">
          <h4 class="day-group__title">
            {{ g.label }}
            <span class="opacity-50">({{ g.items.length }})</span>
            <span v-if="g.key === 'today'" class="ml-1">⭐</span>
          </h4>
          <div class="space-y-2">
            <template v-for="day in g.items" :key="day.id">
              <!-- 编辑行 -->
              <div
                v-if="editingId === day.id"
                class="rounded-lg border p-3"
                :style="{
                  borderColor: 'var(--color-accent)',
                  background: 'var(--color-bg-elevated)'
                }"
              >
                <p class="mb-2 text-xs font-medium opacity-75">编辑日子</p>
                <div class="mb-2 flex gap-2 items-center">
                  <div class="flex-1 min-w-0">
                    <input
                      v-model="form.name"
                      type="text"
                      placeholder="名称"
                      class="form-input w-full"
                      maxlength="8"
                      @keydown.enter="saveForm"
                      @keydown.esc="cancelEdit"
                    />
                  </div>
                  <div class="relative w-36 shrink-0">
                    <input
                      v-model="form.date"
                      type="date"
                      class="form-input w-full date-input"
                      style="padding-right: 1.75rem"
                    />
                    <SvgIcon
                      name="calendar"
                      :size="14"
                      label="选择日子"
                      class="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-[var(--color-text)] opacity-60 transition-opacity hover:opacity-100"
                      @click="openDatePicker"
                    />
                  </div>
                </div>
                <div class="mb-2">
                  <p class="mb-1.5 text-xs opacity-70">请选择类别</p>
                  <div class="flex flex-wrap gap-1.5">
                    <button
                      v-for="cat in DAY_CATEGORY_LIST"
                      :key="cat"
                      type="button"
                      class="flex items-center gap-1 rounded-md border px-2 py-2 text-xs transition-colors"
                      :style="{
                        borderColor:
                          form.category === cat ? 'var(--color-accent)' : 'var(--color-border)',
                        color: form.category === cat ? 'var(--color-accent)' : 'var(--color-text)',
                        background:
                          form.category === cat ? 'var(--color-accent-soft)' : 'transparent'
                      }"
                      @click="form.category = cat"
                    >
                      {{ DAY_CATEGORY_LABELS[cat].icon }}
                      {{ DAY_CATEGORY_LABELS[cat].label }}
                    </button>
                  </div>
                </div>
                <div class="mb-2">
                  <div class="relative">
                    <input
                      v-model="form.note"
                      type="text"
                      placeholder="备注"
                      class="form-input w-full pr-10"
                      maxlength="20"
                      @keydown.esc="cancelEdit"
                    />
                    <span class="absolute right-2 top-1/2 -translate-y-1/2 text-xs opacity-40"
                      >{{ form.note.length }}/20</span
                    >
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <button
                    type="button"
                    class="danger-btn rounded-md border px-3 py-1 text-xs text-white"
                    :style="{
                      background: 'var(--color-danger, #ef4444)',
                      borderColor: 'var(--color-danger, #ef4444)'
                    }"
                    @click="deleteDay(day)"
                  >
                    删除
                  </button>
                  <div class="flex gap-2">
                    <button
                      type="button"
                      class="ghost-btn rounded-md border px-3 py-1 text-xs"
                      @click="cancelEdit"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      class="rounded-md px-3 py-1 text-xs text-[var(--color-on-accent)]"
                      :style="{ background: 'var(--color-accent)' }"
                      @click="saveForm"
                    >
                      保存
                    </button>
                  </div>
                </div>
              </div>

              <!-- 正常数据行 -->
              <div v-else class="day-item group" @click="startEdit(day)">
                <div class="day-item__icon">
                  {{ DAY_CATEGORY_LABELS[day.category].icon }}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="font-medium">{{ day.name }}</div>
                  <div v-if="settings.showDate" class="text-xs opacity-60">
                    {{ formatDateDisplay(day.date) }}
                  </div>
                  <div class="text-xs" :style="toneStyle(dayCountInfo(day.date).tone)">
                    {{ dayCountInfo(day.date).text }}
                  </div>
                  <div v-if="settings.showNote && day.note" class="mt-0.5 text-xs opacity-60">
                    {{ day.note }}
                  </div>
                </div>
                <div class="day-item__actions opacity-0 group-hover:opacity-100">
                  <button
                    type="button"
                    class="ghost-btn rounded-md border px-2 py-0.5 text-xs"
                    :style="{ borderColor: 'var(--color-border)' }"
                    @click.stop="startEdit(day)"
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    class="danger-btn rounded-md border px-2 py-0.5 text-xs"
                    :style="{ borderColor: 'var(--color-danger, #ef4444)' }"
                    @click.stop="deleteDay(day)"
                  >
                    删除
                  </button>
                </div>
              </div>
            </template>
          </div>
        </section>
      </div>

      <!-- 底部添加按钮 / 就地添加表单 -->
      <div class="pt-2 pb-1">
        <div
          v-if="isAdding"
          class="rounded-lg border p-3"
          :style="{ borderColor: 'var(--color-accent)', background: 'var(--color-bg-elevated)' }"
        >
          <p class="mb-2 text-xs font-medium opacity-75">新建日子</p>
          <div class="mb-2 flex gap-2 items-center">
            <div class="flex-1 min-w-0">
              <input
                v-model="form.name"
                type="text"
                placeholder="名称"
                class="form-input w-full"
                maxlength="8"
              />
            </div>
            <div class="relative w-36 shrink-0">
              <input
                v-model="form.date"
                type="date"
                class="form-input w-full date-input"
                style="padding-right: 1.75rem"
              />
              <SvgIcon
                name="calendar"
                :size="14"
                label="选择日子"
                class="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-[var(--color-text)] opacity-60 transition-opacity hover:opacity-100"
                @click="openDatePicker"
              />
            </div>
          </div>
          <div class="mb-2">
            <p class="mb-1.5 text-xs opacity-70">请选择类别</p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="cat in DAY_CATEGORY_LIST"
                :key="cat"
                type="button"
                class="flex items-center gap-1 rounded-md border px-2 py-2 text-xs transition-colors"
                :style="{
                  borderColor:
                    form.category === cat ? 'var(--color-accent)' : 'var(--color-border)',
                  color: form.category === cat ? 'var(--color-accent)' : 'var(--color-text)',
                  background: form.category === cat ? 'var(--color-accent-soft)' : 'transparent'
                }"
                @click="form.category = cat"
              >
                {{ DAY_CATEGORY_LABELS[cat].icon }} {{ DAY_CATEGORY_LABELS[cat].label }}
              </button>
            </div>
          </div>
          <div class="mb-2">
            <div class="relative">
              <input
                v-model="form.note"
                type="text"
                placeholder="备注"
                class="form-input w-full pr-10"
                maxlength="20"
              />
              <span class="absolute right-2 top-1/2 -translate-y-1/2 text-xs opacity-40"
                >{{ form.note.length }}/20</span
              >
            </div>
          </div>
          <div class="flex items-center justify-between">
            <p v-if="formError" class="text-xs text-red-500">{{ formError }}</p>
            <div class="ml-auto flex gap-2">
              <button
                type="button"
                class="ghost-btn rounded-md border px-3 py-1 text-xs"
                @click="cancelEdit"
              >
                取消
              </button>
              <button
                type="button"
                class="rounded-md px-3 py-1 text-xs text-[var(--color-on-accent)]"
                :style="{ background: 'var(--color-accent)' }"
                @click="saveForm"
              >
                保存
              </button>
            </div>
          </div>
        </div>
        <button
          v-else
          type="button"
          class="w-full rounded-md border py-1.5 text-sm transition-colors hover:border-[var(--color-accent)]"
          :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }"
          @click="startAdd"
        >
          + 添加日子
        </button>
      </div>
    </div>

    <!-- ===== Toast ===== -->
    <Transition name="toast-fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </Transition>
  </PanelShell>
</template>

<style scoped>
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.18s ease;
}
.tab-fade-enter-from,
.tab-fade-leave-to {
  opacity: 0;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s ease;
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
}

.ghost-btn {
  transition:
    transform 0.15s ease,
    background-color 0.15s ease;
}
.ghost-btn:hover {
  background: var(--color-hover);
}
.ghost-btn:active {
  transform: scale(0.97);
}

.danger-btn {
  transition:
    transform 0.15s ease,
    background-color 0.15s ease;
}
.danger-btn:hover {
  background: var(--color-danger-soft);
}
.danger-btn:active {
  transform: scale(0.97);
}

.day-group {
  margin-bottom: 16px;
}
.day-group:last-child {
  margin-bottom: 0;
}
.day-group__title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text);
}

.day-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
  transition: border-color 0.2s ease;
  cursor: pointer;
}
.day-item:hover {
  border-color: var(--color-accent);
}
.day-item__icon {
  flex-shrink: 0;
  font-size: 1.5rem;
  line-height: 1;
}
.day-item__actions {
  display: flex;
  flex-shrink: 0;
  gap: 6px;
  transition: opacity 0.2s ease;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg-elevated);
  color: var(--color-text);
  font-size: 0.8125rem;
  outline: none;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}
.form-input:focus {
  border-color: var(--color-accent);
}

.toast {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 16px;
  border-radius: 8px;
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-size: 0.8125rem;
  z-index: 10;
  pointer-events: none;
  white-space: nowrap;
}

.days-scroll {
  scrollbar-width: thin;
  scrollbar-color: var(--color-scrollbar-thumb) transparent;
}
.days-scroll::-webkit-scrollbar {
  width: 5px;
}
.days-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.days-scroll::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background: var(--color-scrollbar-thumb);
}
.days-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--color-scrollbar-thumb-hover);
}

input[type='date'] {
  color-scheme: dark;
}

.date-input {
  color-scheme: dark;
  cursor: pointer;
  padding: 6px 8px;
}
</style>

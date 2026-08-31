<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useDaysStore } from '@/newtab/stores/days'
import { daysDiffFromToday, formatDateDisplay, todayStr } from '@/newtab/stores/days'
import SvgIcon from '@/newtab/components/common/SvgIcon.vue'
import SettingToggle from '@/newtab/components/settings/SettingToggle.vue'
import SettingSlider from '@/newtab/components/settings/SettingSlider.vue'
import SettingRadio from '@/newtab/components/settings/SettingRadio.vue'
import PanelShell from '@/newtab/components/common/PanelShell.vue'
import PanelNavItem from '@/newtab/components/common/PanelNavItem.vue'
import SettingGroup from '@/newtab/components/settings/SettingGroup.vue'
import {
  DAY_CATEGORY_LABELS,
  DAY_CATEGORY_LIST,
  DAY_GROUP_LABELS,
  DAY_SORT_BY_OPTIONS,
  DAYS_NAV_TABS
} from '@/newtab/constant'
import type {
  Day,
  DayCategory,
  DayGroupKey,
  DaySettings,
  DaysNavTab,
  DaySortBy
} from '@/newtab/types/day'

const store = useDaysStore()
const { settings, currentIndex, sortedDays, groupedDays, displayDays, currentDay } =
  storeToRefs(store)

// ===== 弹出面板状态 =====
const panelOpen = ref(false)
type View = 'list' | 'add' | 'edit' | 'settings'
const view = ref<View>('list')
const editingId = ref<string | null>(null)

// 表单状态
const formName = ref('')
const formDate = ref(todayStr())
const formCategory = ref<DayCategory>('other')
const formNote = ref('')

// Toast 提示（"已添加" 等，1.5s 自动消失）
const toast = ref<string | null>(null)
let toastTimer: number | null = null

function showToast(msg: string): void {
  toast.value = msg
  if (toastTimer !== null) window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toast.value = null
  }, 1500)
}

// ===== 本体交互 =====
function openPanel(nextView: View = 'list'): void {
  view.value = nextView
  panelOpen.value = true
}

function resetForm(): void {
  formName.value = ''
  formDate.value = todayStr()
  formCategory.value = 'other'
  formNote.value = ''
  editingId.value = null
}

function startAdd(): void {
  resetForm()
  view.value = 'add'
}

function startEdit(day: Day): void {
  editingId.value = day.id
  formName.value = day.name
  formDate.value = day.date
  formCategory.value = day.category
  formNote.value = day.note ?? ''
  view.value = 'edit'
}

function validateForm(): string | null {
  if (!formName.value.trim()) return '请输入名称'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(formDate.value)) return '请选择有效日期'
  return null
}

function saveAdd(): void {
  const err = validateForm()
  if (err) {
    showToast(err)
    return
  }
  store.addDay({
    name: formName.value,
    date: formDate.value,
    category: formCategory.value,
    note: formNote.value
  })
  resetForm()
  view.value = 'list'
  showToast('已添加')
}

function saveEdit(): void {
  const id = editingId.value
  if (!id) return
  const err = validateForm()
  if (err) {
    showToast(err)
    return
  }
  store.updateDay(id, {
    name: formName.value,
    date: formDate.value,
    category: formCategory.value,
    note: formNote.value
  })
  resetForm()
  view.value = 'list'
  showToast('已保存')
}

function cancelForm(): void {
  resetForm()
  view.value = 'list'
}

function deleteDayWithConfirm(day: Day): void {
  if (typeof window !== 'undefined' && !window.confirm(`确定删除「${day.name}」吗？`)) return
  store.removeDay(day.id)
  if (editingId.value === day.id) {
    resetForm()
    view.value = 'list'
  }
  showToast('已删除')
}

function deleteCurrentEdit(): void {
  const id = editingId.value
  if (!id) return
  const day = store.days.find((d) => d.id === id)
  if (day) deleteDayWithConfirm(day)
}

// ===== 设置项更新（类型安全泛型） =====
function updateSetting<K extends keyof DaySettings>(key: K, value: DaySettings[K]): void {
  store.updateSettings({ [key]: value })
}

/** SettingRadio 的 modelValue 为 string|number，需窄化回 DaySortBy */
function onSortByChange(value: string | number): void {
  store.updateSettings({ sortBy: value as DaySortBy })
}

// ===== 天数显示 =====
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

// 当前卡片的天数显示信息（避免模板重复调用）
const currentDayInfo = computed(() => {
  if (!currentDay.value) return null
  return dayCountInfo(currentDay.value.date)
})

// ===== 列表分组（仅展示非空分组）=====
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

// ===== 左栏导航 =====
function isNavActive(tab: DaysNavTab): boolean {
  if (tab === 'list') return view.value === 'list' || view.value === 'edit'
  if (tab === 'add') return view.value === 'add'
  return view.value === 'settings'
}

function onNavClick(tab: DaysNavTab): void {
  if (tab === 'add') {
    resetForm()
    view.value = 'add'
  } else if (tab === 'list') {
    view.value = 'list'
  } else {
    view.value = 'settings'
  }
}

// ===== 轮播定时器（autoCarousel + carouselInterval 驱动，onUnmounted 清理）=====
let intervalId: number | null = null

function stopInterval(): void {
  if (intervalId !== null) {
    window.clearInterval(intervalId)
    intervalId = null
  }
}

watch(
  [
    () => settings.value.autoCarousel,
    () => settings.value.carouselInterval,
    () => displayDays.value.length
  ],
  ([auto, interval, len]) => {
    stopInterval()
    if (auto && len > 1) {
      intervalId = window.setInterval(() => store.next(), interval * 1000)
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  stopInterval()
  if (toastTimer !== null) window.clearTimeout(toastTimer)
})
</script>

<template>
  <!-- 本体卡片 -->
  <section
    class="days-card panel-entry-host p-4"
    :style="{
      borderRadius: 'var(--radius-component)',
      background: 'var(--color-bg-elevated)',
      border: '1px solid var(--color-border)'
    }"
    @click="openPanel('list')"
  >
    <header class="mb-3 flex items-center justify-between">
      <h3 class="text-base font-medium">日子</h3>
      <div class="flex items-center gap-2">
        <span v-if="totalCount > 0" class="text-xs opacity-50">共 {{ totalCount }} 个</span>
        <button
          type="button"
          class="expand-btn panel-entry-btn flex items-center justify-center rounded-md"
          :style="{ width: '24px', height: '24px', color: 'var(--color-text)' }"
          aria-label="展开日子面板"
          @click.stop="openPanel('list')"
        >
          <SvgIcon name="more" :size="16" :label="'展开日子面板'" />
        </button>
      </div>
    </header>

    <!-- 空状态 -->
    <div v-if="displayDays.length === 0" class="flex flex-col items-center gap-2 py-6 text-center">
      <span class="text-4xl">📅</span>
      <p class="text-sm opacity-50">还没有记录任何日子</p>
      <button
        type="button"
        class="primary-btn rounded-md px-3 py-1 text-sm text-[var(--color-on-accent)]"
        :style="{ background: 'var(--color-accent)' }"
        @click.stop="openPanel('add')"
      >
        + 添加日子
      </button>
    </div>

    <!-- 卡片轮播 -->
    <div v-else class="flex items-stretch gap-2">
      <button
        v-if="displayDays.length > 1"
        type="button"
        class="arrow-btn flex items-center justify-center rounded-md"
        :style="{ width: '24px', color: 'var(--color-text)' }"
        aria-label="上一个日子"
        @click.stop="store.prev()"
      >
        ‹
      </button>

      <div class="flex flex-1 items-center justify-center">
        <Transition name="days-slide" mode="out-in">
          <div v-if="currentDay" :key="currentDay.id" class="flex flex-col items-center gap-1 py-2">
            <div class="text-4xl">
              {{ DAY_CATEGORY_LABELS[currentDay.category].icon }}
            </div>
            <div class="font-medium">{{ currentDay.name }}</div>
            <div v-if="settings.showDate" class="text-xs opacity-60">
              {{ formatDateDisplay(currentDay.date) }}
            </div>
            <div v-if="currentDayInfo" class="text-sm" :style="toneStyle(currentDayInfo.tone)">
              {{ currentDayInfo.text }}
            </div>
          </div>
        </Transition>
      </div>

      <button
        v-if="displayDays.length > 1"
        type="button"
        class="arrow-btn flex items-center justify-center rounded-md"
        :style="{ width: '24px', color: 'var(--color-text)' }"
        aria-label="下一个日子"
        @click.stop="store.next()"
      >
        ›
      </button>
    </div>

    <!-- 底部指示 -->
    <div v-if="displayDays.length > 0" class="mt-3 flex items-center justify-center gap-3">
      <div v-if="displayDays.length > 1" class="flex items-center gap-1">
        <button
          v-for="(d, i) in displayDays"
          :key="d.id"
          type="button"
          class="dot"
          :class="{ 'dot--active': i === currentIndex }"
          :aria-label="`跳转到第 ${i + 1} 个日子`"
          @click.stop="store.goTo(i)"
        ></button>
      </div>
      <span class="text-xs opacity-50">共 {{ totalCount }} 个日子</span>
    </div>
  </section>

  <!-- 弹出面板 -->
  <PanelShell
    v-model:open="panelOpen"
    title="日子"
    width="min(640px, 95vw)"
    height="min(640px, 86vh)"
  >
    <nav
      class="w-32 shrink-0 border-r py-2"
      :style="{ borderColor: 'var(--color-border)' }"
      aria-label="日子面板导航"
    >
      <PanelNavItem
        v-for="t in DAYS_NAV_TABS"
        :key="t.id"
        :label="t.label"
        :icon="t.icon"
        :active="isNavActive(t.id)"
        @click="onNavClick(t.id)"
      />
    </nav>

    <!-- 右栏内容区（200ms 淡入淡出） -->
    <div class="relative flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        class="days-scroll flex-1 overflow-y-auto px-5 py-4 text-sm"
        :style="{ color: 'var(--color-text)' }"
      >
        <Transition name="tab-fade" mode="out-in">
          <!-- 全部列表页 -->
          <div v-if="view === 'list'" key="list" class="space-y-3 py-2">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-medium">全部日子</h3>
              <span class="text-xs opacity-60">共 {{ totalCount }} 个</span>
            </div>

            <div
              v-if="totalCount === 0"
              class="flex flex-col items-center gap-2 py-8 text-center opacity-50"
            >
              <span class="text-3xl">📅</span>
              <p class="text-sm">还没有记录任何日子</p>
            </div>

            <template v-else>
              <section v-for="g in visibleGroups" :key="g.key" class="day-group">
                <h4 class="day-group__title">
                  {{ g.label }}
                  <span class="opacity-60">({{ g.items.length }})</span>
                  <span v-if="g.key === 'today'" class="ml-1">⭐</span>
                </h4>
                <div v-for="d in g.items" :key="d.id" class="day-item group">
                  <div class="day-item__icon">
                    {{ DAY_CATEGORY_LABELS[d.category].icon }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="font-medium">{{ d.name }}</div>
                    <div v-if="settings.showDate" class="text-xs opacity-60">
                      {{ formatDateDisplay(d.date) }}
                    </div>
                    <div class="text-xs" :style="toneStyle(dayCountInfo(d.date).tone)">
                      {{ dayCountInfo(d.date).text }}
                    </div>
                    <div v-if="settings.showNote && d.note" class="mt-0.5 text-xs opacity-60">
                      {{ d.note }}
                    </div>
                  </div>
                  <div class="day-item__actions opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      class="ghost-btn rounded-md border px-2 py-0.5 text-xs"
                      :style="{ borderColor: 'var(--color-border)' }"
                      @click="startEdit(d)"
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      class="danger-btn rounded-md border px-2 py-0.5 text-xs"
                      :style="{
                        borderColor: 'var(--color-danger)',
                        color: 'var(--color-danger)'
                      }"
                      @click="deleteDayWithConfirm(d)"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </section>
            </template>

            <div class="mt-4">
              <button
                type="button"
                class="primary-btn w-full rounded-md py-2 text-sm text-[var(--color-on-accent)]"
                :style="{ background: 'var(--color-accent)' }"
                @click="startAdd"
              >
                + 添加日子
              </button>
            </div>
          </div>

          <!-- 添加 / 编辑页 -->
          <div v-else-if="view === 'add' || view === 'edit'" :key="view" class="space-y-4 py-2">
            <h3 class="text-base font-medium">
              {{ view === 'add' ? '添加日子' : '编辑日子' }}
            </h3>

            <div>
              <label class="mb-1 block text-xs opacity-70" for="day-form-name"> 名称 * </label>
              <input
                id="day-form-name"
                v-model="formName"
                type="text"
                maxlength="20"
                class="form-input"
                placeholder="输入名称（最多20字）"
              />
            </div>

            <div>
              <label class="mb-1 block text-xs opacity-70" for="day-form-date"> 日期 * </label>
              <input id="day-form-date" v-model="formDate" type="date" class="form-input" />
            </div>

            <div>
              <span class="mb-1 block text-xs opacity-70">分类 *</span>
              <div class="flex flex-wrap gap-2" role="radiogroup">
                <button
                  v-for="cat in DAY_CATEGORY_LIST"
                  :key="cat"
                  type="button"
                  role="radio"
                  :aria-checked="formCategory === cat"
                  class="chip rounded-md border px-3 py-1 text-xs transition-colors"
                  :style="{
                    borderColor:
                      formCategory === cat ? 'var(--color-accent)' : 'var(--color-border)',
                    color: formCategory === cat ? 'var(--color-accent)' : 'var(--color-text)',
                    background: formCategory === cat ? 'var(--color-accent-soft)' : 'transparent'
                  }"
                  @click="formCategory = cat"
                >
                  {{ DAY_CATEGORY_LABELS[cat].icon }}
                  {{ DAY_CATEGORY_LABELS[cat].label }}
                </button>
              </div>
            </div>

            <div>
              <label class="mb-1 block text-xs opacity-70" for="day-form-note">
                备注（可选）
              </label>
              <input
                id="day-form-note"
                v-model="formNote"
                type="text"
                maxlength="50"
                class="form-input"
                placeholder="输入备注（最多50字）"
              />
            </div>

            <div class="flex gap-2 pt-2">
              <button
                type="button"
                class="primary-btn flex-1 rounded-md py-2 text-sm text-[var(--color-on-accent)]"
                :style="{ background: 'var(--color-accent)' }"
                @click="view === 'add' ? saveAdd() : saveEdit()"
              >
                保存
              </button>
              <button
                v-if="view === 'edit'"
                type="button"
                class="danger-btn flex-1 rounded-md border py-2 text-sm"
                :style="{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }"
                @click="deleteCurrentEdit"
              >
                删除
              </button>
              <button
                type="button"
                class="ghost-btn flex-1 rounded-md border py-2 text-sm"
                :style="{ borderColor: 'var(--color-border)' }"
                @click="cancelForm"
              >
                取消
              </button>
            </div>
          </div>

          <!-- 设置页 -->
          <div v-else key="settings" class="space-y-4 py-2">
            <!-- 显示设置 -->
            <SettingGroup title="显示设置">
              <SettingToggle
                :model-value="settings.showExpired"
                label="显示已过期"
                description="关闭后隐藏已过去的日子"
                @update:model-value="updateSetting('showExpired', $event)"
              />
              <SettingToggle
                :model-value="settings.showDate"
                label="显示日期"
                description="卡片和列表中显示具体日期"
                @update:model-value="updateSetting('showDate', $event)"
              />
              <SettingToggle
                :model-value="settings.showNote"
                label="显示备注"
                description="列表中显示备注内容"
                @update:model-value="updateSetting('showNote', $event)"
              />
              <div class="mt-2">
                <p class="mb-1 text-xs opacity-70">显示日子最大值</p>
                <SettingSlider
                  :model-value="settings.maxDisplay"
                  :min="1"
                  :max="9"
                  :step="1"
                  suffix=" 个"
                  @update:model-value="updateSetting('maxDisplay', $event)"
                />
              </div>
            </SettingGroup>

            <!-- 排序设置 -->
            <SettingGroup title="排序设置">
              <SettingRadio
                :model-value="settings.sortBy"
                :options="DAY_SORT_BY_OPTIONS"
                @update:model-value="onSortByChange"
              />
            </SettingGroup>

            <!-- 轮播设置 -->
            <SettingGroup title="轮播设置">
              <SettingToggle
                :model-value="settings.autoCarousel"
                label="自动轮播"
                description="组件本体自动轮播"
                @update:model-value="updateSetting('autoCarousel', $event)"
              />
              <div class="mt-2">
                <p class="mb-1 text-xs opacity-70">轮播间隔</p>
                <SettingSlider
                  :model-value="settings.carouselInterval"
                  :min="3"
                  :max="10"
                  :step="1"
                  suffix=" 秒"
                  @update:model-value="updateSetting('carouselInterval', $event)"
                />
              </div>
            </SettingGroup>

            <div>
              <button
                type="button"
                class="ghost-btn w-full rounded-md border py-2 text-sm"
                :style="{ borderColor: 'var(--color-border)' }"
                @click="store.resetSettings()"
              >
                恢复默认
              </button>
            </div>
          </div>
        </Transition>

        <!-- Toast 提示 -->
        <Transition name="toast-fade">
          <div v-if="toast" class="toast">{{ toast }}</div>
        </Transition>
      </div>
    </div>
  </PanelShell>
</template>

<style scoped>
/* 卡片本体：点击整体打开面板 */
.days-card {
  cursor: pointer;
}

/* 展开按钮：悬浮半透明背景、点击内压 */
.expand-btn {
  cursor: pointer;
  transition:
    transform 0.15s ease,
    background-color 0.15s ease;
}
.expand-btn:hover {
  background: var(--color-hover);
}
.expand-btn:active {
  transform: scale(0.92);
}

/* 翻页箭头：悬浮半透明背景、点击内压 */
.arrow-btn {
  transition:
    transform 0.15s ease,
    background-color 0.15s ease;
}
.arrow-btn:hover {
  background: var(--color-hover);
}
.arrow-btn:active {
  transform: scale(0.92);
}

/* 主按钮：点击内压 */
.primary-btn {
  transition: transform 0.15s ease;
}
.primary-btn:active {
  transform: scale(0.97);
}

/* 次级按钮：点击内压 */
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

/* 危险按钮：点击内压 */
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

/* 底部指示点 */
.dot {
  width: 6px;
  height: 6px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--color-border);
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    transform 0.15s ease;
}
.dot:hover {
  transform: scale(1.2);
}
.dot--active {
  background: var(--color-accent);
}

/* 列表分组 */
.day-group {
  margin-bottom: 14px;
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

/* 列表项 */
.day-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
  transition: border-color 0.2s ease;
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

/* 表单输入 */
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
}
.form-input:focus {
  border-color: var(--color-accent);
}

/* Toast 提示：浮于面板底部居中 */
.toast {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 14px;
  border-radius: 8px;
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-size: 0.8125rem;
  z-index: 10;
  pointer-events: none;
}

/* 右侧滚动区：细窄半透明滚动条 */
.days-scroll {
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: var(--color-scrollbar-thumb) transparent;
}
.days-scroll::-webkit-scrollbar {
  width: 6px;
  height: 6px;
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
</style>

<style>
/* 右栏内容切换动画：200ms 淡入淡出 */
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.2s ease;
}
.tab-fade-enter-from,
.tab-fade-leave-to {
  opacity: 0;
}

/* 本体卡片切换：左右滑动 + 淡入（仅 transform/opacity） */
.days-slide-enter-active,
.days-slide-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}
.days-slide-enter-from {
  transform: translateX(20px);
  opacity: 0;
}
.days-slide-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}

/* Toast 淡入淡出 */
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s ease;
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
}
</style>






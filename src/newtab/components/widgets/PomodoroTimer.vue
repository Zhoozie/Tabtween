<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { usePomodoroStore } from '@/newtab/stores/pomodoro'
import SettingSlider from '@/newtab/components/settings/SettingSlider.vue'
import SettingToggle from '@/newtab/components/settings/SettingToggle.vue'
import type { PomodoroSettings } from '@/newtab/types/pomodoro'

const store = usePomodoroStore()
const {
  settings,
  remaining,
  running,
  phaseTotalSeconds,
  phaseLabel,
  todayCount,
  todayFocusLabel,
  weekCount,
  weekFocusLabel,
  totalCount,
  streakDays,
  todayGoalProgress,
  todayGoalPercent,
  todayGoalReached,
  roundInfo
} = storeToRefs(store)

// 环形进度条几何参数（SVG circle r=54，viewBox 120）
const RADIUS = 54
const CIRC = 2 * Math.PI * RADIUS

// 弹出面板状态
const panelOpen = ref(false)
const activeTab = ref<'timer' | 'stats' | 'settings'>('timer')
const tabs = [
  { id: 'timer', label: '计时' },
  { id: 'stats', label: '统计' },
  { id: 'settings', label: '设置' }
] as const

// 剩余时间格式化 mm:ss
const display = computed(() => {
  const total = Math.max(0, remaining.value)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

// 进度 0..1（已过时间占比），用于 stroke-dashoffset
const progress = computed(() => {
  const total = phaseTotalSeconds.value
  if (total <= 0) return 0
  const elapsed = total - remaining.value
  return Math.max(0, Math.min(1, elapsed / total))
})
const dashOffset = computed(() => CIRC * (1 - progress.value))

// ===== 本体交互 =====
function openPanel(): void {
  panelOpen.value = true
}
function closePanel(): void {
  panelOpen.value = false
}
function toggleStart(): void {
  if (running.value) store.pause()
  else store.start()
}
function skip(): void {
  store.skip()
}
function reset(): void {
  store.reset()
}

// ===== 设置项更新（类型安全泛型） =====
function updateSetting<K extends keyof PomodoroSettings>(
  key: K,
  value: PomodoroSettings[K]
): void {
  store.updateSettings({ [key]: value })
}
function onToggleNotification(value: boolean): void {
  updateSetting('notificationEnabled', value)
  if (value) store.requestNotificationPermission()
}

// ===== 定时器（组件持有，onUnmounted 清理） =====
let intervalId: number | null = null

function startInterval(): void {
  if (intervalId !== null) return
  intervalId = window.setInterval(() => store.tick(), 1000)
}
function stopInterval(): void {
  if (intervalId !== null) {
    window.clearInterval(intervalId)
    intervalId = null
  }
}

// running 变化时同步启停（覆盖跨标签同步等场景）
watch(running, (r) => {
  if (r) startInterval()
  else stopInterval()
})

onMounted(() => {
  // 组件重新挂载（场景切换回来）时，若仍在运行则恢复 tick
  if (store.running) startInterval()
})
onUnmounted(() => {
  stopInterval()
})
</script>

<template>
  <!-- 本体卡片 -->
  <section
    class="pomodoro-card rounded-xl p-4"
    :style="{
      background: 'var(--color-bg-elevated)',
      border: '1px solid var(--color-border)'
    }"
    @click="openPanel"
  >
    <header class="mb-3 flex items-center justify-between">
      <h3 class="text-base font-medium">番茄钟</h3>
      <button
        type="button"
        class="expand-btn flex items-center justify-center rounded-md"
        :style="{ width: '24px', height: '24px', color: 'var(--color-text)' }"
        aria-label="展开番茄钟面板"
      >
        ⤢
      </button>
    </header>

    <!-- 环形进度条 + 中心剩余时间 + 状态标签 -->
    <div class="ring-wrap relative mx-auto mb-3 h-[84px] w-[84px]">
      <svg viewBox="0 0 120 120" width="84" height="84">
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="var(--color-border)"
          stroke-width="8"
        />
        <circle
          class="ring-progress"
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="var(--color-accent)"
          stroke-width="8"
          stroke-linecap="round"
          :stroke-dasharray="CIRC"
          :stroke-dashoffset="dashOffset"
        />
      </svg>
      <div
        class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
      >
        <div class="text-2xl font-light tabular-nums">{{ display }}</div>
        <div class="text-[11px] opacity-60">{{ phaseLabel }}</div>
      </div>
    </div>

    <!-- 主按钮：直接开始/暂停，不打开面板 -->
    <div class="flex justify-center">
      <button
        type="button"
        class="primary-btn rounded-md px-4 py-1.5 text-sm text-white"
        :style="{ background: 'var(--color-accent)' }"
        @click.stop="toggleStart"
      >
        {{ running ? '暂停' : '开始' }}
      </button>
    </div>

    <!-- 今日简要统计 -->
    <div class="mt-3 text-center text-xs opacity-60">
      今日：{{ todayCount }}🍅 | {{ todayFocusLabel }}
    </div>
  </section>

  <!-- 弹出面板 -->
  <Teleport to="body">
    <Transition name="pomodoro-fade">
      <div
        v-if="panelOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        @click.self="closePanel"
      >
        <div
          class="flex h-[80vh] w-[min(640px,95vw)] flex-col overflow-hidden rounded-xl"
          :style="{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)'
          }"
        >
          <!-- 顶部：标题居中 + 关闭按钮 -->
          <header
            class="relative flex items-center border-b px-4 py-3"
            :style="{ borderColor: 'var(--color-border)' }"
          >
            <h2
              class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-base font-medium"
            >
              番茄钟
            </h2>
            <button
              type="button"
              class="close-btn ml-auto flex items-center justify-center rounded-md"
              :style="{ width: '28px', height: '28px', color: 'var(--color-text)' }"
              aria-label="关闭"
              @click="closePanel"
            >
              ✕
            </button>
          </header>

          <!-- 主体：左导航 + 右内容 -->
          <div class="flex min-h-0 flex-1">
            <nav
              class="w-32 shrink-0 border-r py-2"
              :style="{ borderColor: 'var(--color-border)' }"
              aria-label="番茄钟面板导航"
            >
              <button
                v-for="t in tabs"
                :key="t.id"
                type="button"
                class="nav-item flex w-full items-center rounded-lg px-3 text-left text-sm transition-colors duration-200"
                :aria-current="activeTab === t.id ? 'page' : undefined"
                @click="activeTab = t.id"
              >
                {{ t.label }}
              </button>
            </nav>

            <!-- 右栏内容区（200ms 淡入淡出） -->
            <div class="relative flex min-h-0 min-w-0 flex-1 flex-col">
              <div
                class="pomodoro-scroll flex-1 overflow-y-auto px-5 py-4 text-sm"
                :style="{ color: 'var(--color-text)' }"
              >
                <Transition name="tab-fade" mode="out-in">
                  <!-- 计时页 -->
                  <div v-if="activeTab === 'timer'" key="timer" class="flex flex-col items-center gap-4 py-4">
                    <div class="relative h-[120px] w-[120px]">
                      <svg viewBox="0 0 120 120" width="120" height="120">
                        <circle
                          cx="60"
                          cy="60"
                          r="54"
                          fill="none"
                          stroke="var(--color-border)"
                          stroke-width="8"
                        />
                        <circle
                          class="ring-progress"
                          cx="60"
                          cy="60"
                          r="54"
                          fill="none"
                          stroke="var(--color-accent)"
                          stroke-width="8"
                          stroke-linecap="round"
                          :stroke-dasharray="CIRC"
                          :stroke-dashoffset="dashOffset"
                        />
                      </svg>
                      <div
                        class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
                      >
                        <div class="text-[32px] font-light tabular-nums">{{ display }}</div>
                        <div class="text-sm opacity-60">{{ phaseLabel }}</div>
                      </div>
                    </div>

                    <!-- 操作按钮组 -->
                    <div class="flex gap-2">
                      <button
                        type="button"
                        class="primary-btn rounded-md px-4 py-1.5 text-sm text-white"
                        :style="{ background: 'var(--color-accent)' }"
                        @click="toggleStart"
                      >
                        {{ running ? '暂停' : '开始' }}
                      </button>
                      <button
                        type="button"
                        class="ghost-btn rounded-md border px-4 py-1.5 text-sm"
                        :style="{ borderColor: 'var(--color-border)' }"
                        @click="skip"
                      >
                        跳过
                      </button>
                      <button
                        type="button"
                        class="ghost-btn rounded-md border px-4 py-1.5 text-sm"
                        :style="{ borderColor: 'var(--color-border)' }"
                        @click="reset"
                      >
                        重置
                      </button>
                    </div>

                    <!-- 今日简要统计 + 本轮进度 -->
                    <div class="text-center text-sm opacity-70">
                      今日：{{ todayCount }}🍅 | {{ todayFocusLabel }}
                    </div>
                    <div class="text-center text-sm opacity-70">
                      第 {{ roundInfo.current }} 轮 / 共 {{ roundInfo.total }} 轮（到长休息）
                    </div>
                  </div>

                  <!-- 统计页 -->
                  <div v-else-if="activeTab === 'stats'" key="stats" class="space-y-3 py-2">
                    <section class="setting-group">
                      <h3 class="setting-group__title">今日</h3>
                      <dl class="space-y-1.5">
                        <div class="flex justify-between">
                          <dt class="opacity-60">今日番茄数</dt>
                          <dd>{{ todayCount }} 🍅</dd>
                        </div>
                        <div class="flex justify-between">
                          <dt class="opacity-60">今日专注时长</dt>
                          <dd>{{ todayFocusLabel }}</dd>
                        </div>
                      </dl>
                      <!-- 今日目标进度 -->
                      <div class="mt-3">
                        <div class="flex justify-between text-xs">
                          <span class="opacity-60">今日目标进度</span>
                          <span>{{ todayCount }} / {{ settings.dailyGoal }}</span>
                        </div>
                        <div
                          class="mt-1 h-2 overflow-hidden rounded-full"
                          :style="{ background: 'var(--color-border)' }"
                        >
                          <div
                            class="h-full rounded-full transition-all duration-300"
                            :style="{
                              width: `${todayGoalProgress * 100}%`,
                              background: todayGoalReached
                                ? 'var(--color-accent)'
                                : 'var(--color-text-muted)'
                            }"
                          ></div>
                        </div>
                        <div class="mt-1 text-right text-xs opacity-60">
                          {{ todayGoalPercent }}%{{ todayGoalReached ? ' · 已达标' : '' }}
                        </div>
                      </div>
                    </section>

                    <section class="setting-group">
                      <h3 class="setting-group__title">本周</h3>
                      <dl class="space-y-1.5">
                        <div class="flex justify-between">
                          <dt class="opacity-60">本周番茄数</dt>
                          <dd>{{ weekCount }} 🍅</dd>
                        </div>
                        <div class="flex justify-between">
                          <dt class="opacity-60">本周专注时长</dt>
                          <dd>{{ weekFocusLabel }}</dd>
                        </div>
                      </dl>
                    </section>

                    <section class="setting-group">
                      <h3 class="setting-group__title">累计</h3>
                      <dl class="space-y-1.5">
                        <div class="flex justify-between">
                          <dt class="opacity-60">累计番茄总数</dt>
                          <dd>{{ totalCount }} 🍅</dd>
                        </div>
                        <div class="flex justify-between">
                          <dt class="opacity-60">连续专注天数</dt>
                          <dd>{{ streakDays }} 天</dd>
                        </div>
                      </dl>
                    </section>
                  </div>

                  <!-- 设置页 -->
                  <div v-else key="settings" class="space-y-4 py-2">
                    <!-- 时长设置 -->
                    <section class="setting-group">
                      <h3 class="setting-group__title">时长设置</h3>
                      <div class="space-y-3">
                        <div>
                          <p class="mb-1 text-xs opacity-70">专注时长</p>
                          <SettingSlider
                            :model-value="settings.focusMinutes"
                            :min="5"
                            :max="60"
                            :step="1"
                            suffix=" 分钟"
                            @update:model-value="updateSetting('focusMinutes', $event)"
                          />
                        </div>
                        <div>
                          <p class="mb-1 text-xs opacity-70">短休息时长</p>
                          <SettingSlider
                            :model-value="settings.shortBreakMinutes"
                            :min="1"
                            :max="15"
                            :step="1"
                            suffix=" 分钟"
                            @update:model-value="updateSetting('shortBreakMinutes', $event)"
                          />
                        </div>
                        <div>
                          <p class="mb-1 text-xs opacity-70">长休息时长</p>
                          <SettingSlider
                            :model-value="settings.longBreakMinutes"
                            :min="5"
                            :max="30"
                            :step="1"
                            suffix=" 分钟"
                            @update:model-value="updateSetting('longBreakMinutes', $event)"
                          />
                        </div>
                        <div>
                          <p class="mb-1 text-xs opacity-70">长休息间隔</p>
                          <SettingSlider
                            :model-value="settings.longBreakInterval"
                            :min="2"
                            :max="6"
                            :step="1"
                            suffix=" 轮"
                            @update:model-value="updateSetting('longBreakInterval', $event)"
                          />
                        </div>
                      </div>
                    </section>

                    <!-- 自动化 -->
                    <section class="setting-group">
                      <h3 class="setting-group__title">自动化</h3>
                      <SettingToggle
                        :model-value="settings.autoStartBreak"
                        label="自动开始休息"
                        description="工作阶段结束后自动进入休息"
                        @update:model-value="updateSetting('autoStartBreak', $event)"
                      />
                      <SettingToggle
                        :model-value="settings.autoStartFocus"
                        label="自动开始专注"
                        description="休息阶段结束后自动开始下一轮专注"
                        @update:model-value="updateSetting('autoStartFocus', $event)"
                      />
                    </section>

                    <!-- 提醒 -->
                    <section class="setting-group">
                      <h3 class="setting-group__title">提醒</h3>
                      <SettingToggle
                        :model-value="settings.soundEnabled"
                        label="声音提醒"
                        description="阶段完成时播放短蜂鸣"
                        @update:model-value="updateSetting('soundEnabled', $event)"
                      />
                      <SettingToggle
                        :model-value="settings.notificationEnabled"
                        label="浏览器通知"
                        description="阶段完成时发送系统通知（需授权）"
                        @update:model-value="onToggleNotification($event)"
                      />
                    </section>

                    <!-- 目标 -->
                    <section class="setting-group">
                      <h3 class="setting-group__title">目标</h3>
                      <div>
                        <p class="mb-1 text-xs opacity-70">每日番茄目标</p>
                        <SettingSlider
                          :model-value="settings.dailyGoal"
                          :min="1"
                          :max="16"
                          :step="1"
                          suffix=" 个"
                          @update:model-value="updateSetting('dailyGoal', $event)"
                        />
                      </div>
                    </section>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* 卡片本体：点击整体打开面板 */
.pomodoro-card {
  cursor: pointer;
}

/* 环形进度条：从顶部开始顺时针，过渡 stroke-dashoffset */
.ring-progress {
  transform-box: fill-box;
  transform-origin: center;
  transform: rotate(-90deg);
  transition: stroke-dashoffset 0.3s ease;
}

/* 展开按钮：悬浮内压 */
.expand-btn {
  transition: transform 0.2s ease, background-color 0.2s ease;
}
.expand-btn:hover {
  transform: scale(0.92);
  background: rgba(128, 128, 128, 0.1);
}

/* 关闭按钮：悬浮内压 */
.close-btn {
  transition: transform 0.2s ease, background-color 0.2s ease;
}
.close-btn:hover {
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
  transition: transform 0.15s ease, background-color 0.15s ease;
}
.ghost-btn:hover {
  background: rgba(128, 128, 128, 0.1);
}
.ghost-btn:active {
  transform: scale(0.97);
}

/* 左侧导航项：active 主色高亮 / hover 半透明背景（参照 Settings.vue） */
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

/* 分组卡片 */
.setting-group {
  margin-bottom: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
}
.setting-group:last-child {
  margin-bottom: 0;
}
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

/* 右侧滚动区：细窄半透明滚动条 */
.pomodoro-scroll {
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: rgba(128, 128, 128, 0.35) transparent;
}
.pomodoro-scroll::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.pomodoro-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.pomodoro-scroll::-webkit-scrollbar-thumb {
  background: rgba(128, 128, 128, 0.35);
  border-radius: 3px;
}
.pomodoro-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(128, 128, 128, 0.55);
}
</style>

<style>
/* 面板淡入淡出（非 scoped，Transition 类需全局可见） */
.pomodoro-fade-enter-active,
.pomodoro-fade-leave-active {
  transition: opacity 0.2s ease;
}
.pomodoro-fade-enter-from,
.pomodoro-fade-leave-to {
  opacity: 0;
}

/* 右栏内容切换动画：200ms 淡入淡出 */
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.2s ease;
}
.tab-fade-enter-from,
.tab-fade-leave-to {
  opacity: 0;
}
</style>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/newtab/stores/settings'
import type { CustomEngine } from '@/newtab/types/settings'
import {
  BUILTIN_SEARCH_ENGINES,
  MAX_MINIMAL_ENGINES,
  MAX_VISIBLE_SEARCH_ENGINES,
  isValidSearchEngineUrl,
  validateSearchEngineUrl
} from '@/newtab/constant/searchEngines'
import { generateId } from '@/newtab/utils/settings'

interface Props {
  modelValue: CustomEngine[]
}

const props = withDefaults(defineProps<Props>(), { modelValue: () => [] })

const emit = defineEmits<{
  'update:modelValue': [value: CustomEngine[]]
}>()

const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)

const customEngines = computed(() => props.modelValue)

// 编辑态：null = 未编辑，string = 正在编辑的引擎 id
const editingId = ref<string | null>(null)
const isAdding = ref(false)

// 表单数据（仅名称 + 地址，图标自动取名称首字符）
const form = ref<{ name: string; url: string }>({ name: '', url: '' })
const formError = ref('')

// ===== 计算属性 =====

const formIcon = computed(() => {
  const trimmed = form.value.name.trim()
  return trimmed.charAt(0).toUpperCase() || '🔎'
})

const enabledCount = computed(() => customEngines.value.length)
const disabledCount = computed(
  () => customEngines.value.filter((e) => !isValidSearchEngineUrl(e.url)).length
)

function getEngineIcon(engine: { name: string; icon?: string }): string {
  if (engine.icon) return engine.icon
  return engine.name.trim().charAt(0).toUpperCase() || '🔎'
}

// 全部引擎（内置在前，自定义在后）
const allEngines = computed(() => {
  const custom = customEngines.value.map((e) => ({
    id: e.id,
    name: e.name,
    icon: getEngineIcon(e),
    url: e.url,
    builtin: false as const
  }))
  return [...BUILTIN_SEARCH_ENGINES, ...custom]
})

/** 已选预设（按 minimalEngines 顺序映射） */
const presetEnginesRaw = computed(() => {
  const map = new Map(allEngines.value.map((e) => [e.id, e]))
  return settings.value.search.minimalEngines
    .map((id) => map.get(id))
    .filter((e): e is (typeof allEngines.value)[number] => !!e)
})

/**
 * 已选预设（保持 minimalEngines 原顺序，点击即切换默认，不换顺序）
 */
const presetEngines = computed(() => presetEnginesRaw.value)
const minimalSelectedCount = computed(() => presetEnginesRaw.value.length)
const isEditing = computed(() => editingId.value !== null)

const minimalFull = computed(() => minimalSelectedCount.value >= MAX_MINIMAL_ENGINES)
const minimalAtMin = computed(() => minimalSelectedCount.value <= 1)

/** 当前默认引擎 id */
const currentDefaultId = computed(() => settings.value.search.engine)

// ===== 操作：自定义引擎 =====

function resetForm(): void {
  form.value = { name: '', url: '' }
  formError.value = ''
}

function startAdd(): void {
  resetForm()
  editingId.value = null
  isAdding.value = true
}

function cancelEdit(): void {
  isAdding.value = false
  editingId.value = null
  resetForm()
}

function validate(): boolean {
  const { name, url } = form.value
  if (!name.trim()) {
    formError.value = '请填写名称'
    return false
  }
  if (name.trim().length > 20) {
    formError.value = '名称最多 20 个字符'
    return false
  }
  if (!url.trim()) {
    formError.value = '请填写搜索地址'
    return false
  }
  const urlValidation = validateSearchEngineUrl(url.trim())
  if (!urlValidation.ok) {
    formError.value = urlValidation.message
    return false
  }
  formError.value = ''
  return true
}

function saveForm(): void {
  if (!validate()) return
  const name = form.value.name.trim()
  const icon = name.charAt(0).toUpperCase()
  const payload: CustomEngine = {
    id: editingId.value ?? generateId(),
    name,
    icon,
    url: form.value.url.trim()
  }
  if (editingId.value) {
    emit(
      'update:modelValue',
      customEngines.value.map((e) => (e.id === editingId.value ? payload : e))
    )
  } else {
    if (customEngines.value.length >= MAX_VISIBLE_SEARCH_ENGINES) return
    // 新增的自定义引擎默认不加入预设
    emit('update:modelValue', [...customEngines.value, payload])
  }
  cancelEdit()
}

function startEdit(engine: CustomEngine): void {
  editingId.value = engine.id
  isAdding.value = false
  form.value = { name: engine.name, url: engine.url }
  formError.value = ''
}

function removeEngine(id: string): void {
  // 同时清理该 id 在极简模式选择中的引用（store 内已自动维护默认引擎）
  settingsStore.updateMinimalEngines(
    settings.value.search.minimalEngines.filter((mid) => mid !== id)
  )
  emit(
    'update:modelValue',
    customEngines.value.filter((engine) => engine.id !== id)
  )
}

// ===== 操作：预设 =====

/** 判断某个引擎是否已在预设中 */
function isInPresets(id: string): boolean {
  return settings.value.search.minimalEngines.includes(id)
}

/** 把某个引擎加入预设（仅 + 按钮触发） */
function addToPresets(id: string): void {
  const current = settings.value.search.minimalEngines
  if (current.includes(id)) return
  if (current.length >= MAX_MINIMAL_ENGINES) return
  settingsStore.updateMinimalEngines([...current, id])
}

/** 从预设中移除（在预设列表的 ✕ 按钮中使用） */
function removeFromPresets(id: string): void {
  if (settings.value.search.minimalEngines.length <= 1) return
  settingsStore.updateMinimalEngines(
    settings.value.search.minimalEngines.filter((mid) => mid !== id)
  )
}

/** 把某个预设引擎设为默认（点击预设列表项时调用） */
function setDefaultEngine(id: string): void {
  if (!settings.value.search.minimalEngines.includes(id)) return
  settingsStore.updateSearch({ engine: id })
}

function isUrlValid(url: string): boolean {
  return isValidSearchEngineUrl(url)
}
</script>

<template>
  <div class="space-y-5">
    <!-- ============ 一、全部引擎 ============ -->
    <section>
      <div class="mb-2 flex items-center justify-between">
        <p class="text-xs font-medium opacity-75">全部引擎</p>
        <span class="text-[11px] opacity-50">
          自定义 {{ enabledCount }}/{{ MAX_VISIBLE_SEARCH_ENGINES }} · 预设 {{ minimalSelectedCount }}/{{ MAX_MINIMAL_ENGINES }}
        </span>
      </div>
      <p class="mb-2 text-[11px] opacity-55">
        右侧 <span class="font-medium" :style="{ color: 'var(--color-accent)' }">+</span> 可加入极简模式预设；<span class="font-medium" :style="{ color: 'var(--color-accent)' }">✓</span> 表示已在预设中。预设达到 {{ MAX_MINIMAL_ENGINES }} 个时，全部 + 按钮置灰。
      </p>

      <div class="space-y-2">
        <!--
          每个引擎一行：
          - 左侧：图标 + 名称 + URL
          - 右侧：✓ / + 切换按钮 + （内置徽章 / ✎ ✕）
        -->
        <div
          v-for="engine in allEngines"
          :key="engine.id"
          class="flex items-center gap-3 rounded-lg border p-3"
          :class="[
            !engine.builtin && !isUrlValid(engine.url) ? 'border-red-400/50' : '',
            editingId === engine.id ? 'ring-1 ring-[var(--color-accent)]' : ''
          ]"
          :style="{
            borderColor:
              !engine.builtin && !isUrlValid(engine.url)
                ? 'rgba(239, 68, 68, 0.5)'
                : editingId === engine.id
                  ? 'var(--color-accent)'
                  : 'var(--color-border)'
          }"
        >
          <!-- ===== 显示态 ===== -->
          <template v-if="editingId !== engine.id">
            <!-- 左侧：图标 + 名称 + URL -->
            <span
              class="grid h-9 w-9 shrink-0 place-items-center rounded-md text-sm font-medium"
              :style="{
                background: 'var(--color-accent-soft)',
                color: 'var(--color-accent)'
              }"
            >
              {{ engine.icon }}
            </span>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="truncate text-sm font-medium">{{ engine.name }}</span>
                <span
                  v-if="!engine.builtin && !isUrlValid(engine.url)"
                  class="rounded px-1.5 py-0.5 text-[10px] text-red-500"
                  :style="{ background: 'rgba(239, 68, 68, 0.1)' }"
                >
                  地址无效
                </span>
              </div>
              <div class="mt-0.5 truncate text-[11px] opacity-55" :title="engine.url">
                {{ engine.url }}
              </div>
            </div>

            <!-- 右侧：✓/+ + 内置/编辑/删除 -->
            <div class="flex shrink-0 items-center gap-1.5">
              <!-- ✓ / + 切换 -->
              <button
                v-if="!isInPresets(engine.id)"
                type="button"
                class="grid h-7 w-7 place-items-center rounded-md text-sm font-medium transition-all"
                :disabled="minimalFull || (!engine.builtin && !isUrlValid(engine.url))"
                :title="
                  !engine.builtin && !isUrlValid(engine.url)
                    ? '地址无效，无法加入预设'
                    : minimalFull
                      ? '预设已达上限'
                      : '点击加入极简模式预设'
                "
                :style="{
                  background: 'transparent',
                  color: minimalFull ? 'var(--color-text)' : 'var(--color-accent)',
                  border: '1px solid var(--color-border)',
                  opacity: minimalFull || (!engine.builtin && !isUrlValid(engine.url)) ? 0.35 : 1
                }"
                @click="addToPresets(engine.id)"
              >
                +
              </button>
              <button
                v-else
                type="button"
                class="grid h-7 w-7 place-items-center rounded-md text-sm font-medium transition-all"
                :style="{
                  background: 'var(--color-accent)',
                  color: 'var(--color-on-accent)',
                  border: '1px solid var(--color-accent)'
                }"
                title="点击从预设中移除"
                aria-label="从预设中移除"
                @click.stop="removeFromPresets(engine.id)"
              >
                ✓
              </button>

              <!-- 内置徽章 / 编辑 + 删除 -->
              <template v-if="engine.builtin">
                <span
                  class="rounded-md px-2 py-1 text-[10px] font-medium"
                  :style="{
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)',
                    opacity: 0.6
                  }"
                >
                  内置
                </span>
              </template>
              <template v-else>
                <button
                  type="button"
                  class="grid h-7 w-7 place-items-center rounded-md text-xs opacity-55 transition-opacity hover:opacity-100 hover:bg-[var(--color-hover)]"
                  aria-label="编辑"
                  title="编辑"
                  @click="startEdit(engine)"
                >
                  ✎
                </button>
                <button
                  type="button"
                  class="grid h-7 w-7 place-items-center rounded-md text-xs opacity-55 transition-opacity hover:opacity-100 hover:bg-[var(--color-hover)]"
                  aria-label="删除"
                  title="删除"
                  @click="removeEngine(engine.id)"
                >
                  ✕
                </button>
              </template>
            </div>
          </template>

          <!-- ===== 编辑态：文本直接放大变成输入框 ===== -->
          <div v-else class="flex-1 space-y-2">
            <div class="flex items-center gap-2">
              <span
                class="grid h-9 w-9 shrink-0 place-items-center rounded-md text-sm font-medium"
                :style="{
                  background: 'var(--color-accent-soft)',
                  color: 'var(--color-accent)'
                }"
              >
                {{ formIcon }}
              </span>
              <input
                v-model="form.name"
                type="text"
                maxlength="20"
                placeholder="名称"
                class="min-w-0 flex-1 rounded-md border bg-transparent px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
                :style="{ borderColor: 'var(--color-border)' }"
                autofocus
              />
            </div>
            <input
              v-model="form.url"
              type="url"
              placeholder="搜索地址，例如 https://www.baidu.com/s?wd=%s"
              class="w-full rounded-md border bg-transparent px-2.5 py-1.5 text-xs outline-none focus:border-[var(--color-accent)]"
              :style="{ borderColor: 'var(--color-border)' }"
            />
            <p class="text-[11px] opacity-55">
              提示：在搜索地址中使用
              <code
                class="rounded px-1 py-0.5 font-mono text-[10px]"
                :style="{ background: 'var(--color-bg-elevated)' }"
              >%s</code>
              代表用户输入的关键词。图标将自动取名称的第一个字符。
            </p>
            <p v-if="formError" class="text-[11px] text-red-500">{{ formError }}</p>
            <div class="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                class="rounded-md px-2.5 py-1 text-xs opacity-60 transition-opacity hover:opacity-100"
                @click="cancelEdit"
              >
                取消
              </button>
              <button
                type="button"
                class="rounded-md px-3 py-1 text-xs text-[var(--color-on-accent)] transition-opacity hover:opacity-90"
                :style="{ background: 'var(--color-accent)' }"
                @click="saveForm"
              >
                保存
              </button>
            </div>
          </div>
        </div>

        <!-- 空状态：尚无自定义引擎 -->
        <div
          v-if="customEngines.length === 0"
          class="rounded-lg border border-dashed py-3 text-center"
          :style="{ borderColor: 'var(--color-border)' }"
        >
          <p class="text-xs opacity-55">还没有自定义搜索引擎</p>
        </div>
      </div>

      <!-- 手动添加表单 -->
      <div
        v-if="isAdding"
        class="mt-2 space-y-2 rounded-lg border p-3"
        :style="{ borderColor: 'var(--color-accent)' }"
      >
        <div class="flex items-center gap-2">
          <span
            class="grid h-9 w-9 shrink-0 place-items-center rounded-md text-sm font-medium"
            :style="{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }"
          >
            {{ formIcon }}
          </span>
          <input
            v-model="form.name"
            type="text"
            maxlength="20"
            placeholder="名称（必填，≤20 字符）"
            class="min-w-0 flex-1 rounded-md border bg-transparent px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
            :style="{ borderColor: 'var(--color-border)' }"
            autofocus
          />
        </div>
        <input
          v-model="form.url"
          type="url"
          placeholder="搜索地址，例如 https://www.baidu.com/s?wd=%s"
          class="w-full rounded-md border bg-transparent px-2.5 py-1.5 text-xs outline-none focus:border-[var(--color-accent)]"
          :style="{ borderColor: 'var(--color-border)' }"
        />
        <p class="text-[11px] opacity-55">
          提示：在搜索地址中使用
          <code
            class="rounded px-1 py-0.5 font-mono text-[10px]"
            :style="{ background: 'var(--color-bg-elevated)' }"
          >%s</code>
          代表用户输入的关键词。图标将自动取名称的第一个字符。新增的引擎默认不会加入预设。
        </p>
        <p v-if="formError" class="text-[11px] text-red-500">{{ formError }}</p>
        <div class="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            class="rounded-md px-2.5 py-1 text-xs opacity-60 transition-opacity hover:opacity-100"
            @click="cancelEdit"
          >
            取消
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs text-[var(--color-on-accent)] transition-opacity hover:opacity-90"
            :style="{ background: 'var(--color-accent)' }"
            @click="saveForm"
          >
            添加
          </button>
        </div>
      </div>

      <!-- 添加按钮 -->
      <button
        v-if="!isAdding && !isEditing"
        type="button"
        class="mt-2 w-full rounded-lg border px-3 py-2 text-sm text-[var(--color-accent)] transition-colors hover:bg-[var(--color-hover)] disabled:cursor-not-allowed disabled:opacity-40"
        :style="{ borderColor: 'var(--color-border)' }"
        :disabled="enabledCount >= MAX_VISIBLE_SEARCH_ENGINES"
        @click="startAdd"
      >
        + 手动添加
      </button>

      <p v-if="disabledCount > 0" class="mt-2 text-[11px] text-red-500">
        {{ disabledCount }} 个引擎地址无效，请编辑修正。
      </p>
    </section>

    <!-- ============ 二、极简模式预设（点击设为默认 / ✕ 移除） ============ -->
    <section>
      <div class="mb-2 flex items-center justify-between">
        <p class="text-xs font-medium opacity-75">极简模式预设</p>
        <span class="text-[11px] opacity-50">
          {{ minimalSelectedCount }}/{{ MAX_MINIMAL_ENGINES }}
        </span>
      </div>
      <p class="mb-2 text-[11px] opacity-55">
        点击列表项可将其设为默认（内置）；点击 ✕ 从预设中移除（至少保留 1 个）。
      </p>

      <div v-if="presetEngines.length > 0" class="space-y-2">
        <div
          v-for="engine in presetEngines"
          :key="engine.id"
          class="flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-[var(--color-hover)]"
          :style="{
            borderColor:
              engine.id === currentDefaultId ? 'var(--color-accent)' : 'var(--color-border)',
            cursor: 'pointer'
          }"
          :title="engine.id === currentDefaultId ? '当前默认（内置）' : '点击设为默认'"
          @click="setDefaultEngine(engine.id)"
        >
          <!-- 图标 -->
          <span
            class="grid h-8 w-8 shrink-0 place-items-center rounded-md text-sm font-medium"
            :style="{
              background:
                engine.id === currentDefaultId
                  ? 'var(--color-accent)'
                  : 'var(--color-accent-soft)',
              color:
                engine.id === currentDefaultId
                  ? 'var(--color-on-accent)'
                  : 'var(--color-accent)'
            }"
          >
            {{ engine.icon }}
          </span>

          <!-- 名称 + URL -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="truncate text-sm font-medium">{{ engine.name }}</span>
              <span
                v-if="engine.id === currentDefaultId"
                class="rounded px-1.5 py-0.5 text-[10px] font-medium"
                :style="{ background: 'var(--color-accent)', color: 'var(--color-on-accent)' }"
              >
                默认
              </span>
            </div>
            <div class="mt-0.5 truncate text-[11px] opacity-55">{{ engine.url }}</div>
          </div>

          <!-- ✕ 移除 -->
          <button
            type="button"
            class="grid h-7 w-7 shrink-0 place-items-center rounded-md text-xs opacity-55 transition-opacity hover:opacity-100 hover:bg-[var(--color-bg-elevated)] disabled:cursor-not-allowed disabled:opacity-30"
            :disabled="minimalAtMin"
            :title="minimalAtMin ? '预设至少保留 1 个' : '从预设中移除'"
            aria-label="从预设中移除"
            @click.stop="removeFromPresets(engine.id)"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-else
        class="rounded-lg border border-dashed py-4 text-center"
        :style="{ borderColor: 'var(--color-border)' }"
      >
        <p class="text-xs opacity-55">预设为空，请在「全部引擎」中点击 + 加入</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
input::placeholder {
  opacity: 0.5;
}
button:disabled {
  cursor: not-allowed;
}
button:disabled:hover {
  background: transparent;
}
</style>
# AGENTS.md

## 1. 项目概述

**项目名称**：页间（Tabtween）
**项目类型**：浏览器新标签页插件
**支持浏览器**：Chrome 88+、Edge 88+
**当前版本**：V1.0（开发中）

## 2. 技术栈

### 2.1. 核心技术
- **框架**：Vue 3.4+（Composition API）
- **语言**：TypeScript 5+
- **构建工具**：Vite 5+
- **状态管理**：Pinia
- **样式方案**：Tailwind CSS 3 + Scoped CSS
- **路由**：不需要（单页面应用）
- **数据持久化**：Chrome Storage API

### 2.2. 开发工具
- **包管理**：pnpm（必须使用）
- **代码规范**：ESLint + Prettier
- **类型检查**：Vue TSC + TypeScript strict
- **测试**：Vitest + Vue Test Utils
- **版本控制**：Git

## 3. 项目结构

```
tabtween/
├── public/
│ ├── manifest.json # 插件配置（Manifest V3）
│ ├── newtab.html # 新标签页HTML入口
│ └── icons/ # 插件图标（16/32/48/128）
├── src/
│ ├── background/ # 后台脚本
│ │ └── index.ts # Service Worker入口
│ ├── newtab/ # 新标签页
│ │ ├── main.ts # Vue应用入口
│ │ ├── App.vue # 根组件
│ │ ├── modes/ # 模式组件
│ │ │ ├── MinimalMode.vue # 极简模式
│ │ │ └── StandardMode.vue # 标准模式
│ │ ├── scenes/ # 标准模式场景
│ │ │ ├── WorkScene.vue # 工作场景
│ │ │ ├── StudyScene.vue # 学习场景
│ │ │ └── LeisureScene.vue # 休闲场景
│ │ ├── components/ # 通用组件
│ │ │ ├── search/
│ │ │ │ ├── SearchBar.vue # 搜索框
│ │ │ │ └── SearchResults.vue # 搜索结果
│ │ │ ├── common/
│ │ │ │ ├── Clock.vue # 时钟
│ │ │ │ ├── ModeSwitcher.vue # 模式切换
│ │ │ │ ├── ThemeToggle.vue # 日夜切换
│ │ │ │ └── SettingsPanel.vue # 设置面板
│ │ │ └── widgets/
│ │ │ ├── TaskList.vue # 任务列表
│ │ │ ├── PomodoroTimer.vue # 番茄钟
│ │ │ ├── NotePad.vue # 笔记
│ │ │ ├── QuickAccess.vue # 快捷访问
│ │ │ └── WeatherWidget.vue # 天气组件
│ │ ├── composables/ # 组合式函数
│ │ │ ├── useSearch.ts
│ │ │ ├── useMode.ts
│ │ │ ├── useTheme.ts
│ │ │ ├── useStorage.ts
│ │ │ └── useKeyboard.ts
│ │ ├── stores/ # Pinia状态
│ │ │ ├── mode.ts
│ │ │ ├── settings.ts
│ │ │ ├── tasks.ts
│ │ │ └── search.ts
│ │ ├── types/ # 类型定义
│ │ │ ├── index.ts
│ │ │ ├── mode.ts
│ │ │ ├── task.ts
│ │ │ └── settings.ts
│ │ ├── utils/ # 工具函数
│ │ │ ├── storage.ts
│ │ │ ├── time.ts
│ │ │ └── keyboard.ts
│ │ └── styles/ # 全局样式
│ │ ├── main.css
│ │ └── variables.css
│ └── shared/ # 共享代码
├── tests/ # 测试文件
│ ├── unit/
│ └── e2e/
├── docs/
├── .eslintrc.js
├── .prettierrc
├── tsconfig.json
├── vite.config.ts
└── package.json
```

## 4. 开发限制与规范

### 4.1. Vue 组件规范

必须使用 Composition API

```vue
<script setup lang="ts">
// ✅ 正确：使用 <script setup>
import { ref, computed } from 'vue';

const count = ref(0);
const doubled = computed(() => count.value * 2);
</script>

<template>
  <div>{{ doubled }}</div>
</template>
<!-- ❌ 禁止：使用 Options API -->
<script>
export default {
  data() {
    return { count: 0 };
  }
}
</script>
```

组件命名规范

- 组件文件名：PascalCase（如 `SearchBar.vue`）
- 组件内 name 选项：可不写（使用文件名）
- 模板中使用：PascalCase 或 kebab-case 均可

Props 定义

```
// ✅ 正确：使用 TypeScript 定义 Props
interface Props {
  placeholder?: string;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '搜索',
  size: 'medium',
  disabled: false
});
```

Emits 定义

```
// ✅ 正确：使用 TypeScript 定义 Emits
const emit = defineEmits<{
  search: [query: string]
  clear: []
  focus: [event: FocusEvent]
}>();
```

组件通信

- 父子组件：Props + Emits
- 跨组件：Pinia Store
- 事件总线：禁止使用

### 4.2. TypeScript 规范

严格模式（必须）

```
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

类型定义

```
// ✅ 正确：明确的类型定义
interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  dueDate?: Date;
}

// ❌ 禁止：使用 any
const data: any = getData();
```

类型导入

```
// ✅ 使用 type 关键字导入类型
import type { Task } from '@/types/task';
import { createTask } from '@/utils/task';
```

### 4.3. 状态管理规范

使用 Pinia

```
// stores/mode.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Mode, Scene } from '@/types/mode';

export const useModeStore = defineStore('mode', () => {
  const currentMode = ref<Mode>('standard');
  const currentScene = ref<Scene>('work');
  
  const isMinimal = computed(() => currentMode.value === 'minimal');
  
  function setMode(mode: Mode) {
    currentMode.value = mode;
  }
  
  function setScene(scene: Scene) {
    currentScene.value = scene;
  }
  
  return {
    currentMode,
    currentScene,
    isMinimal,
    setMode,
    setScene
  };
});
```

Store 规范

- 一个 Store 对应一个业务领域
- Store 内使用 Composition API 风格
- 状态必须通过方法修改
- 禁止直接在组件中修改 store 状态

### 4.4. 样式规范

使用 Tailwind CSS

```
<template>
  <!-- ✅ 优先使用 Tailwind 类 -->
  <div class="flex items-center justify-between px-4 py-2">
    <span class="text-lg font-medium text-gray-900">标题</span>
  </div>
</template>
```

Scoped CSS

```
<style scoped>
/* ✅ 复杂样式使用 scoped CSS */
.search-bar {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
</style>
```

样式限制

- 禁止使用内联样式（动态样式除外）
- 禁止使用 CSS 预处理器（Sass/Less）
- 颜色使用 CSS 变量（支持日夜切换）
- 动画使用 transition 或 CSS animation

### 4.5. 代码风格规范

ESLint 配置

```
// .eslintrc.js
module.exports = {
  extends: [
    'plugin:vue/vue3-recommended',
    '@vue/typescript/recommended',
    'prettier'
  ],
  rules: {
    'vue/multi-word-component-names': 'error',
    'vue/no-unused-vars': 'error',
    'vue/require-default-prop': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error'
  }
};
```

Prettier 配置

```
{
  "semi": false,
  "singleQuote": true,
  "printWidth": 100,
  "trailingComma": "none",
  "arrowParens": "always"
}
```

命名规范

- **组件**：PascalCase（`SearchBar.vue`）
- **Composables**：camelCase + use 前缀（`useSearch.ts`）
- **Store**：camelCase（`modeStore.ts`）
- **工具函数**：camelCase（`formatTime.ts`）
- **常量**：UPPER_SNAKE_CASE（`MAX_TASKS`）
- **类型**：PascalCase（`TaskItem`）
- **CSS 类**：kebab-case（`search-bar`）

### 4.6. 测试规范

单元测试

```
// tests/unit/useSearch.spec.ts
import { describe, it, expect } from 'vitest';
import { useSearch } from '@/composables/useSearch';

describe('useSearch', () => {
  it('should search correctly', () => {
    // 测试代码
  });
});
```

组件测试

```
import { mount } from '@vue/test-utils';
import SearchBar from '@/components/search/SearchBar.vue';

describe('SearchBar', () => {
  it('renders properly', () => {
    const wrapper = mount(SearchBar);
    expect(wrapper.exists()).toBe(true);
  });
});
```

测试要求

- 工具函数必须有测试
- 核心组件必须有测试
- 测试覆盖率 > 80%
- 禁止跳过测试（skip）

### 4.7. 构建与部署规范

Vite 配置

```
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  build: {
    target: 'chrome88',
    minify: 'terser',
    rollupOptions: {
      input: {
        newtab: 'src/newtab/index.html'
      }
    }
  }
});
```

Manifest V3 要求

```
{
  "manifest_version": 3,
  "name": "智汇桌面",
  "version": "0.1.0",
  "chrome_url_overrides": {
    "newtab": "newtab.html"
  },
  "permissions": [
    "storage",
    "bookmarks",
    "history"
  ],
  "background": {
    "service_worker": "background.js"
  }
}
```

构建限制

- 禁止使用动态导入（Manifest V3 限制）
- 代码必须打包为单文件
- 禁止使用 eval
- 禁止远程代码

### 4.8. Chrome API 使用规范

Storage 操作

```typescript
// utils/storage.ts
// ✅ 统一封装 Chrome Storage API
export async function saveData<T>(key: string, value: T): Promise<void> {
  await chrome.storage.sync.set({ [key]: value });
}

export async function loadData<T>(key: string): Promise<T | undefined> {
  const result = await chrome.storage.sync.get(key);
  return result[key] as T | undefined;
}

// 大数据使用 local
export async function saveLargeData<T>(key: string, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}
```

存储限制

- `chrome.storage.sync`：最多 100KB（用于设置、偏好）
- `chrome.storage.local`：最多 10MB（用于笔记、任务）
- 所有异步操作必须使用 async/await
- 必须处理存储失败的情况

Service Worker 限制

- 禁止使用 DOM
- 禁止使用 window 对象
- 使用 self 代替 window
- 必须在 30 秒内完成操作
- 使用 chrome.alarms 代替 setTimeout

### 4.9. 性能规范

加载性能

- 首屏加载 < 100ms
- 搜索响应 < 100ms
- 禁止在 main.ts 中执行耗时操作
- 使用懒加载

```typescript
// ✅ 懒加载组件
const TaskList = defineAsyncComponent(() => import('@/components/widgets/TaskList.vue'));

// ✅ 懒加载场景
const WorkScene = defineAsyncComponent(() => import('@/scenes/WorkScene.vue'));
```

渲染优化

- 大列表使用虚拟滚动
- 使用 v-memo 优化静态内容
- 避免不必要的响应式数据
- 使用 shallowRef 处理大对象

```vue
// ✅ 使用 shallowRef 处理大对象
const largeData = shallowRef<LargeData>({});

// ✅ 使用 v-memo
<template>
  <div v-memo="[task.id, task.completed]">
    {{ task.title }}
  </div>
</template>
```

动画性能

- 只使用 transform 和 opacity
- 避免触发布局重排
- 使用 requestAnimationFrame
- 动画帧率保持 60fps

```css
/* ✅ 使用 transform */
.fade-enter-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

/* ❌ 避免使用 width/height 动画 */
.bad-animation {
  transition: width 0.3s;
}
```

### 4.10. 内存管理

事件监听清理

```typescript
// ✅ 组件卸载时清理
onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
```

定时器清理

```typescript
// ✅ 清理定时器
const timer = ref<number>();

onMounted(() => {
  timer.value = setInterval(updateTime, 1000);
});

onUnmounted(() => {
  if (timer.value) {
    clearInterval(timer.value);
  }
});
```

内存限制

- 插件内存占用 < 100MB
- 避免内存泄漏
- 定期清理缓存
- 大对象使用后释放

### 4.11. 安全规范

禁止使用

- ❌ eval()
- ❌ new Function()
- ❌ innerHTML（使用 v-html 时需谨慎）
- ❌ 远程代码执行
- ❌ 第三方 CDN 脚本

XSS 防护

```vue
<!-- ✅ 默认转义 -->
<div>{{ userInput }}</div>

<!-- ⚠️ 使用 v-html 时必须消毒 -->
<div v-html="sanitizedHtml"></div>
```

数据处理

- 用户数据加密存储
- 敏感数据不记录日志
- 网络请求使用 HTTPS
- 权限最小化

## 5. 开发命令

```bash
# 安装依赖（必须使用 pnpm）
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 类型检查
pnpm type-check

# 代码检查
pnpm lint

# 格式化
pnpm format

# 测试
pnpm test
```



## 6. 禁止事项清单

### 6.1. 绝对禁止

- ❌ 使用 Options API
- ❌ 使用 any 类型
- ❌ 使用 Vuex（必须用 Pinia）
- ❌ 使用 CSS 预处理器
- ❌ 使用 axios（使用 fetch API）
- ❌ 使用 jQuery
- ❌ 使用 moment.js（使用 date-fns 或原生）
- ❌ 内联样式（动态样式除外）
- ❌ 在 Service Worker 中使用 DOM
- ❌ 远程加载代码
- ❌ eval 和 new Function

### 6.2. 需要避免

- ⚠️ 过度设计
- ⚠️ 过早优化
- ⚠️ 重复代码
- ⚠️ 深层嵌套（>3层）
- ⚠️ 大文件（>500行）
- ⚠️ 魔法数字

## 7. 关键功能开发注意事项

### 搜索功能

- 搜索框必须在所有模式中可用
- 快捷键：`/` 或 `Ctrl+K` 聚焦
- 搜索建议实时展示
- 支持搜索命令（输入特定文字执行操作）
- 搜索结果分类展示

### 模式切换

- 极简模式 ↔ 标准模式
- 标准模式下切换场景
- 切换动画：600ms（大模式）/ 400ms（场景）
- 快捷键：`Ctrl+M`

### 日夜切换

- 三种状态：暗色、亮色、自动
- 快捷键：`Ctrl+D`
- 切换动画：300ms
- 使用 CSS 变量实现

### 设置系统

- 快速设置面板（从右上角展开）
- 完整设置界面
- 实时预览
- 自动保存

### 右上角按钮组

- 日夜切换、模式切换、设置
- 极简模式：半透明（30%），悬停显示（100%）
- 标准模式：完全可见
- 点击展开对应面板

## 最后提醒

1. 所有代码必须通过 TypeScript 类型检查
2. 所有组件必须使用 Composition API
3. 所有样式使用 Tailwind + Scoped CSS
4. 所有存储使用 Chrome Storage API
5. 所有异步操作使用 async/await
6. 所有事件监听必须清理
7. 所有定时器必须清理
8. 保持代码简洁，避免过度设计
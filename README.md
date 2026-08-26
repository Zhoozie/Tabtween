# 页间 (Tabtween)

页间是一套浏览器新标签页效率工作台，基于 Chrome Manifest V3 开发，支持极简模式与标准模式，内置搜索、任务、笔记、番茄钟、快捷访问、日子与日历等小组件。

> 当前版本处于开发阶段，天气、阅读列表与推荐内容为占位实现。

## 技术栈

- Vue 3 + `<script setup lang="ts">`
- TypeScript 5+
- Vite
- Pinia
- Tailwind CSS 4 + Scoped CSS
- Chrome Storage API
- Chrome 88+ / Edge 88+

## 功能概览

### 模式与场景

- 极简模式：时钟 + 搜索框，右上方按钮组半透明显示。
- 标准模式：顶部搜索栏、主题切换、模式切换、场景切换与设置入口。
- 工作场景：任务列表、日历、快捷访问。
- 学习场景：笔记、番茄钟、阅读列表占位、快捷访问。
- 休闲场景：天气占位、日子、今日推荐占位、快捷访问。

### 搜索

- 支持百度、Google、必应、DuckDuckGo。
- 支持搜索建议、搜索历史、热门搜索开关。
- 支持笔记、书签、任务等本地内容搜索。
- 支持回车打开方式、建议数量、自定义搜索引擎、自定义搜索命令。
- 支持 `工作`、`学习`、`休闲`、`极简`、`夜间`、`白天`、`设置`、`清除历史`、`计算:` 等内置命令。
- 直接输入 URL 可打开网站。

### 小组件

- 任务列表：增删任务、优先级、状态过滤。
- 番茄钟：专注/休息时长、自动切换、通知、每日目标。
- 笔记：自动保存的快速笔记。
- 快捷访问：添加快捷入口、删除、按顺序展示。
- 日子：纪念日/待办日记录、分类与排序。
- 日历：按周起始日展示、今日标记与任务标记。
- 天气：当前为 MVP 占位组件。

### 设置面板

设置面板包含五类：

- 外观与显示：主题、主题色、字体、字号、搜索框样式、布局密度、时钟设置。
- 搜索设置：引擎、建议、历史、本地内容搜索、回车行为、快捷命令。
- 快捷键设置：查看与自定义默认快捷键。
- 隐私与数据：清除搜索历史、清除所有数据、导出/导入设置。
- 关于：版本信息、更新日志、仓库地址。

### 存储

- 设置、偏好使用 `chrome.storage.sync`。
- 任务、笔记等大数据使用 `chrome.storage.local`。
- 开发环境自动降级到 `localStorage`。
- 通过 `chrome.storage.onChanged` 实现跨标签页同步。

## 项目结构

```text
tabtween/
├── public/
│   ├── manifest.json
│   ├── icons.svg
│   └── favicon.svg
├── src/
│   ├── background/
│   │   └── index.ts
│   └── newtab/
│       ├── main.ts
│       ├── App.vue
│       ├── layouts/
│       │   ├── MinimalMode.vue
│       │   ├── StandardMode.vue
│       │   ├── Scene/
│       │   │   ├── WorkScene.vue
│       │   │   ├── StudyScene.vue
│       │   │   └── LeisureScene.vue
│       │   └── Panel/
│       │       ├── Settings.vue
│       │       └── CalendarPanel.vue
│       ├── components/
│       │   ├── common/
│       │   ├── search/
│       │   ├── settings/
│       │   └── widgets/
│       ├── composables/
│       ├── stores/
│       ├── types/
│       ├── constant/
│       ├── utils/
│       └── styles/
├── tests/
│   └── unit/
├── AGENTS.md
├── package.json
├── vite.config.ts
└── vitest.config.ts
```

## 开发命令

包管理统一使用 `pnpm`。

| 命令 | 说明 |
| --- | --- |
| `pnpm install` | 安装依赖 |
| `pnpm dev` | 启动 Vite 开发服务器 |
| `pnpm build` | 类型检查并构建扩展产物 |
| `pnpm preview` | 预览构建产物 |
| `pnpm type-check` | TypeScript 类型检查 |
| `pnpm lint:check` | ESLint 检查 |
| `pnpm lint` | ESLint 检查并自动修复 |
| `pnpm format:check` | Prettier 格式检查 |
| `pnpm format` | Prettier 自动格式化 |
| `pnpm test` | 运行 Vitest 单元测试 |
| `pnpm test:watch` | 监听模式运行测试 |

## 本地开发

```bash
pnpm install
pnpm dev
```

Vite 会直接服务 `src/newtab`，非扩展环境中数据会自动降级到 `localStorage`，方便调试界面。

## 加载扩展

```bash
pnpm build
```

然后在浏览器中：

1. 打开 `chrome://extensions` 或 `edge://extensions`。
2. 开启开发者模式。
3. 选择“加载已解压的扩展程序”。
4. 选择项目中的 `dist` 目录。

构建产物包含 `newtab` 页面与 `background` Service Worker。

## 开发约定

- 必须使用 Vue 3 Composition API 与 `<script setup>`。
- 禁止使用 Options API、Vuex、事件总线。
- 父子组件通信使用 Props + Emits，跨组件状态使用 Pinia。
- 数据持久化统一走 Chrome Storage API 封装。
- 异步操作使用 `async/await`。
- Service Worker 中禁止使用 DOM，长时任务使用 `chrome.alarms`。
- 所有事件监听与定时器必须在组件卸载时清理。
- 完整规范见 `AGENTS.md`。

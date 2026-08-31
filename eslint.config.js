import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'

// ESLint v9 flat config（对应 AGENTS.md 4.5 节规范）
// - plugin:vue/vue3-recommended  -> pluginVue.configs['flat/recommended']
// - @vue/typescript/recommended  -> tseslint.configs.recommended
// - prettier                     -> eslintConfigPrettier（关闭与 Prettier 冲突的格式规则）
export default [
  // 忽略目录
  {
    name: 'tabtween/ignores',
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'public/**',
      'src/assets/**',
      'src/**/*.d.ts'
    ]
  },

  // 基础 JS 推荐规则
  js.configs.recommended,

  // TypeScript 推荐规则（对应 @vue/typescript/recommended）
  ...tseslint.configs.recommended,

  // Vue 3 推荐规则（对应 plugin:vue/vue3-recommended）
  ...pluginVue.configs['flat/recommended'],

  // 在 .vue 文件的 <script lang="ts"> 中使用 TS 解析器
  {
    name: 'tabtween/vue-ts-parser',
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    }
  },

  // 关闭与 Prettier 冲突的格式规则
  eslintConfigPrettier,

  // 项目自定义规则（AGENTS.md 4.5 节）
  {
    name: 'tabtween/rules',
    rules: {
      'vue/multi-word-component-names': 'error',
      'vue/no-unused-vars': 'error',
      'vue/require-default-prop': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error'
    }
  },

  // Clock.vue / Settings.vue 为用户明确指定的文件名，
  // 与 vue/multi-word-component-names 规则冲突，单独豁免
  {
    name: 'tabtween/single-word-override',
    files: [
      '**/components/common/Clock.vue',
      '**/layouts/Panel/Settings.vue'
    ],
    rules: {
      'vue/multi-word-component-names': 'off'
    }
  }
]

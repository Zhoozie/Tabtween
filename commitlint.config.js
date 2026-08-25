/**
 * Conventional Commits 提交信息规范
 * 格式: <type>(<scope>): <subject>
 *
 * 示例:
 *   feat(search): 新增搜索历史记录
 *   fix(mode): 修复模式切换状态丢失
 *   chore(deps): 升级 vue 到 3.5.41
 */
/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // header: <type>(<scope>): <subject>  整体最大长度
    'header-max-length': [2, 'always', 100],
    // 允许任意大小写（兼容中文 subject）
    'subject-case': [0],
    // body 每行最大长度
    'body-max-line-length': [2, 'always', 100],
    // 允许的 type 列表
    'type-enum': [
      2,
      'always',
      [
        'feat', // 新功能
        'fix', // 修复 bug
        'docs', // 文档
        'style', // 代码格式（不影响功能）
        'refactor', // 重构
        'perf', // 性能优化
        'test', // 测试
        'build', // 构建系统 / 依赖
        'ci', // CI 配置
        'chore', // 杂务
        'revert' // 回退
      ]
    ],
    // 建议 scope（warning 级别，不强制，仅提示）
    'scope-enum': [
      1,
      'always',
      [
        'newtab',
        'background',
        'search',
        'mode',
        'scene',
        'widget',
        'task',
        'settings',
        'theme',
        'storage',
        'deps',
        'release',
        'config'
      ]
    ],
    // scope 可省略
    'scope-empty': [0]
  }
}

// 日历组件设置（依据 PRD V0.2 §F8 工作场景日历组件，面板设置页）

/** 周首日 */
export type FirstDayOfWeek = 'sunday' | 'monday'

/** 日历组件设置 */
export interface CalendarSettings {
  /** 周首日：周日/周一 */
  firstDayOfWeek: FirstDayOfWeek
  /** 是否显示周数 */
  showWeekNumbers: boolean
  /** 是否高亮今日 */
  showTodayMarker: boolean
  /** 是否在日期格上标记有任务到期的日子 */
  showTaskMarkers: boolean
}

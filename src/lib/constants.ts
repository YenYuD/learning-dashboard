// src/lib/constants.ts

/** MVP 階段無認證，使用固定 demo user ID */
export const MOCK_USER_ID = 'user-demo';

/**
 * Board 可選顏色（5×5，按色相環排列，飽和度壓在 35-50% 的復古陶瓷風）
 * 所有顏色視覺重量相近，在圖表中任意搭配都柔和協調。
 */
export const BOARD_COLORS = [
  // 藍系
  { value: '#5AAED4', label: '天藍' },
  { value: '#6A9CC8', label: '鴿藍' },
  { value: '#5EC4CC', label: '水青' },
  { value: '#4AB8B8', label: '青' },
  { value: '#5BB8A4', label: '碧玉' },
  // 綠系
  { value: '#5BAD8A', label: '翠綠' },
  { value: '#6EC87A', label: '草綠' },
  { value: '#8CC86A', label: '葉綠' },
  { value: '#AACB58', label: '嫩綠' },
  { value: '#C8C454', label: '橄欖' },
  // 暖黃橙系
  { value: '#D4A84C', label: '蜂蜜' },
  { value: '#D4904E', label: '琥珀' },
  { value: '#D08456', label: '橙' },
  { value: '#CC7860', label: '磚橙' },
  { value: '#C87474', label: '珊瑚' },
  // 粉紅紫系
  { value: '#C27492', label: '覆盆子' },
  { value: '#BC7CAC', label: '玫瑰' },
  { value: '#B880C4', label: '蘭花' },
  { value: '#9884CC', label: '薰衣草' },
  { value: '#8888CC', label: '長春花' },
  // 靛藍系
  { value: '#8496CC', label: '矢車菊' },
  { value: '#7C90D0', label: '岩藍' },
  { value: '#7884CC', label: '靛紫' },
  { value: '#7272CC', label: '深靛' },
  { value: '#8484D4', label: '藍紫' },
] as const;

/** Board 模板定義 */
export const BOARD_TEMPLATES = [
  {
    id: 'language',
    label: '語言學習',
    icon: 'Book',
    type: 'TASK_BASED' as const,
    defaultLists: ['Vocabulary', 'Grammar', 'Practice'],
  },
  {
    id: 'programming',
    label: '程式學習',
    icon: 'Code',
    type: 'TASK_BASED' as const,
    defaultLists: ['To Learn', 'In Progress', 'Completed'],
  },
  {
    id: 'sport',
    label: '技能型運動',
    icon: 'Mountain',
    type: 'TIME_ONLY' as const,
    defaultLists: [],
  },
  {
    id: 'fitness',
    label: '健身訓練',
    icon: 'Dumbbell',
    type: 'TASK_BASED' as const,
    defaultLists: ['Plan', 'In Progress', 'Done'],
  },
  {
    id: 'custom',
    label: '自訂',
    icon: 'Sparkles',
    type: 'TASK_BASED' as const,
    defaultLists: [],
  },
] as const;

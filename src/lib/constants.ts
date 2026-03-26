// src/lib/constants.ts

/** MVP 階段無認證，使用固定 demo user ID */
export const MOCK_USER_ID = 'user-demo';

/** Board 可選顏色（設計稿定義的 8 種柔和色） */
export const BOARD_COLORS = [
  { value: '#EFF6FF', label: '淺藍' },
  { value: '#F0FDF4', label: '淺綠' },
  { value: '#FEF3C7', label: '淺黃' },
  { value: '#FCE7F3', label: '淺粉' },
  { value: '#F3E8FF', label: '淺紫' },
  { value: '#FEE2E2', label: '淺紅' },
  { value: '#E0F2FE', label: '淺青' },
  { value: '#FEF9C3', label: '淺檸檬' },
] as const;

/** Board 模板定義 */
export const BOARD_TEMPLATES = [
  {
    id: 'language',
    label: '語言學習',
    icon: '📚',
    type: 'TASK_BASED' as const,
    defaultLists: ['Vocabulary', 'Grammar', 'Practice'],
  },
  {
    id: 'programming',
    label: '程式學習',
    icon: '💻',
    type: 'TASK_BASED' as const,
    defaultLists: ['To Learn', 'In Progress', 'Completed'],
  },
  {
    id: 'sport',
    label: '技能型運動',
    icon: '⛷️',
    type: 'TIME_ONLY' as const,
    defaultLists: [],
  },
  {
    id: 'fitness',
    label: '健身訓練',
    icon: '💪',
    type: 'TASK_BASED' as const,
    defaultLists: ['Plan', 'In Progress', 'Done'],
  },
  {
    id: 'custom',
    label: '自訂',
    icon: '✨',
    type: 'TASK_BASED' as const,
    defaultLists: [],
  },
] as const;

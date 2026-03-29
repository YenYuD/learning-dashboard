// src/lib/constants.ts

/** MVP 階段無認證，使用固定 demo user ID */
export const MOCK_USER_ID = 'user-demo';

/** Board 可選顏色（淺色、中色、深色三排） */
export const BOARD_COLORS = [
  // 淺色
  { value: '#EFF6FF', label: '淺藍' },
  { value: '#F0FDF4', label: '淺綠' },
  { value: '#FEF3C7', label: '淺黃' },
  { value: '#FCE7F3', label: '淺粉' },
  { value: '#F3E8FF', label: '淺紫' },
  { value: '#FEE2E2', label: '淺紅' },
  { value: '#E0F2FE', label: '淺青' },
  { value: '#FEF9C3', label: '淺檸檬' },
  // 中色
  { value: '#93C5FD', label: '中藍' },
  { value: '#6EE7B7', label: '中綠' },
  { value: '#FCD34D', label: '中黃' },
  { value: '#F9A8D4', label: '中粉' },
  { value: '#C4B5FD', label: '中紫' },
  { value: '#FCA5A5', label: '中紅' },
  { value: '#67E8F9', label: '中青' },
  { value: '#86EFAC', label: '中草綠' },
  // 深色
  { value: '#2563EB', label: '深藍' },
  { value: '#059669', label: '深綠' },
  { value: '#D97706', label: '深橙' },
  { value: '#DB2777', label: '深粉' },
  { value: '#7C3AED', label: '深紫' },
  { value: '#DC2626', label: '深紅' },
  { value: '#0891B2', label: '深青' },
  { value: '#65A30D', label: '深草綠' },
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

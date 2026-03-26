// src/lib/mock-data.ts

export type TimeRange = 'today' | 'week' | 'month';

export const WEEKLY_BAR_DATA = [
  { day: '週一', '英文學習': 1.5, 'LeetCode': 2, '滑雪': 0 },
  { day: '週二', '英文學習': 1, 'LeetCode': 1.5, '滑雪': 0 },
  { day: '週三', '英文學習': 2, 'LeetCode': 0.5, '滑雪': 3 },
  { day: '週四', '英文學習': 1.5, 'LeetCode': 2.5, '滑雪': 0 },
  { day: '週五', '英文學習': 2.5, 'LeetCode': 1, '滑雪': 0 },
  { day: '週六', '英文學習': 1, 'LeetCode': 0, '滑雪': 4 },
  { day: '週日', '英文學習': 3, 'LeetCode': 1.5, '滑雪': 0 },
];

export const DONUT_DATA = [
  { name: '英文學習', value: 40, color: '#EF4444' },
  { name: 'LeetCode', value: 35, color: '#3B82F6' },
  { name: '滑雪', value: 25, color: '#10B981' },
];

export const DAILY_TREND_DATA = [
  { date: '3/19', hours: 3.5 },
  { date: '3/20', hours: 4 },
  { date: '3/21', hours: 2.5 },
  { date: '3/22', hours: 5 },
  { date: '3/23', hours: 3 },
  { date: '3/24', hours: 4.5 },
  { date: '3/25', hours: 2.5 },
];

export const STATS_DATA: Record<TimeRange, {
  today: { value: string; unit: string; trend: string; trendUp: boolean };
  week: { value: string; unit: string; trend: string; trendUp: boolean };
  month: { value: string; unit: string; trend: string; trendUp: boolean };
  boards: { value: string; unit: string; trend: string; trendUp: boolean };
}> = {
  today: {
    today: { value: '2.5', unit: '小時', trend: '+0.5 vs 昨天', trendUp: true },
    week: { value: '15', unit: '小時', trend: '+2 vs 上週', trendUp: true },
    month: { value: '45', unit: '小時', trend: '+5 vs 上月', trendUp: true },
    boards: { value: '8', unit: '個 Boards', trend: '', trendUp: true },
  },
  week: {
    today: { value: '2.5', unit: '小時', trend: '+0.5 vs 昨天', trendUp: true },
    week: { value: '15', unit: '小時', trend: '+2 vs 上週', trendUp: true },
    month: { value: '45', unit: '小時', trend: '+5 vs 上月', trendUp: true },
    boards: { value: '8', unit: '個 Boards', trend: '', trendUp: true },
  },
  month: {
    today: { value: '2.5', unit: '小時', trend: '+0.5 vs 昨天', trendUp: true },
    week: { value: '15', unit: '小時', trend: '+2 vs 上週', trendUp: true },
    month: { value: '45', unit: '小時', trend: '+5 vs 上月', trendUp: true },
    boards: { value: '8', unit: '個 Boards', trend: '', trendUp: true },
  },
};

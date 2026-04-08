'use client';

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Flame } from 'lucide-react';
import { trpc } from '~/utils/trpc';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const CHART_COLORS = ['#6A9CC8', '#5BAD8A', '#D4A84C', '#C87474', '#9884CC', '#4AB8B8', '#D08456', '#BC7CAC'];

function formatMinutes(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return h > 0 ? `${h}h ${min}m` : `${min}m`;
}

export default function FriendStatsPage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();

  const summaryQuery = trpc.friendStats.getSummary.useQuery({ friendId: params.userId });
  const chartQuery = trpc.friendStats.getWeeklyChart.useQuery({ friendId: params.userId });
  const breakdownQuery = trpc.friendStats.getBoardBreakdown.useQuery({ friendId: params.userId });

  const summary = summaryQuery.data;

  if (summaryQuery.isLoading) {
    return <p className="text-muted-foreground">載入中...</p>;
  }

  if (summaryQuery.error) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <p className="text-muted-foreground">
          {summaryQuery.error.data?.code === 'FORBIDDEN' ? '你們不是好友，無法查看統計' : '載入失敗'}
        </p>
        <button onClick={() => router.back()} className="text-sm text-primary underline">返回</button>
      </div>
    );
  }

  return (
    <div className="py-10 px-12 flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
        </button>
        {summary?.image ? (
          <Image src={summary.image} alt="好友頭像" width={48} height={48} className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <div className="h-12 w-12 rounded-full bg-muted" />
        )}
        <div>
          <h1 className="text-2xl font-medium">{summary?.name ?? 'Unknown'}</h1>
          <p className="text-sm text-muted-foreground">Learning Stats</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-1 rounded-lg border p-7">
          <p className="text-sm text-muted-foreground">本週學習</p>
          <p className="text-3xl font-semibold">{formatMinutes(summary?.weeklyMinutes ?? 0)}</p>
        </div>
        <div className="space-y-1 rounded-lg border p-7">
          <p className="text-sm text-muted-foreground">連續天數</p>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-semibold">{summary?.streak ?? 0}</p>
            <Flame size={24} className="text-primary" />
          </div>
        </div>
        <div className="space-y-1 rounded-lg border p-7">
          <p className="text-sm text-muted-foreground">本週完成任務</p>
          <p className="text-3xl font-semibold">{summary?.weeklyTasks ?? 0}</p>
          <p className="text-sm text-muted-foreground">個任務</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Weekly Bar Chart */}
        <div className="space-y-4 rounded-lg border p-6">
          <h3 className="font-medium">本週學習時數</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartQuery.data ?? []}>
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#7A7A7A' }} />
              <YAxis tick={{ fontSize: 12, fill: '#7A7A7A' }} />
              <Tooltip formatter={(value) => formatMinutes(Number(value))} />
              <Bar dataKey="minutes" fill="#E42313" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Board Pie Chart */}
        <div className="space-y-4 rounded-lg border p-6">
          <h3 className="font-medium">Board 時間佔比</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={breakdownQuery.data ?? []}
                dataKey="minutes"
                nameKey="name"
                innerRadius={40}
                outerRadius={70}
              >
                {breakdownQuery.data?.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Legend
                formatter={(value) => {
                  const item = breakdownQuery.data?.find((d) => d.name === value);
                  return `${value} — ${formatMinutes(item?.minutes ?? 0)}`;
                }}
              />
              <Tooltip formatter={(value) => formatMinutes(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

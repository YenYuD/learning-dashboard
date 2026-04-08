'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { trpc } from '~/utils/trpc';
import { RankRow } from '~/components/ranking/RankRow';

type Dimension = 'hours' | 'streak' | 'tasks';
type TimeRange = 'week' | 'month';

function formatValue(dimension: Dimension, value: number): string {
  if (dimension === 'hours') {
    const h = Math.floor(value / 60);
    const m = value % 60;
    return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m`;
  }
  if (dimension === 'streak') return `${value}d`;
  return `${value}`;
}

export default function RankingPage() {
  const { data: session } = useSession();
  const [dimension, setDimension] = useState<Dimension>('hours');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  const leaderboardQuery = trpc.ranking.leaderboard.useQuery({ dimension, timeRange });

  const dimensions: { key: Dimension; label: string }[] = [
    { key: 'hours', label: 'Study Hours' },
    { key: 'streak', label: 'Streak' },
  ];

  return (
    <div className="md:py-10 md:px-12 py-4 px-6 flex flex-col gap-8">
      <h1 className="text-4xl font-medium tracking-tight">Ranking</h1>

      {/* Controls */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2">
          {dimensions.map(({ key, label }) => (
            <button
              key={key}
              className={`rounded px-3 py-1.5 text-sm font-medium ${dimension === key ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}
              onClick={() => setDimension(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {dimension !== 'streak' && (
          <div className="flex flex-col md:flex-row gap-2">
            {(['week', 'month'] as const).map((tr) => (
              <button
                key={tr}
                className={`rounded px-3 py-1.5 text-xs font-medium ${timeRange === tr ? 'bg-foreground text-white' : 'bg-muted text-muted-foreground'
                  }`}
                onClick={() => setTimeRange(tr)}
              >
                {tr === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="divide-y rounded-lg border">
        <div className="flex items-center gap-3 md:gap-4 bg-muted/50 px-3 md:px-6 py-3">
          <span className="w-8 md:w-10 text-xs font-medium text-muted-foreground">#</span>
          <span className="w-8 md:w-10" />
          <span className="flex-1 text-xs font-medium text-muted-foreground">Name</span>
          <span className="w-16 md:w-24 text-right text-xs font-medium text-muted-foreground">
            {dimension === 'hours' ? 'Hours' : dimension === 'streak' ? 'Days' : 'Tasks'}
          </span>
        </div>

        {leaderboardQuery.isLoading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">載入中...</p>
        ) : leaderboardQuery.data?.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            加入好友就能看到排行榜！
          </p>
        ) : (
          leaderboardQuery.data?.map((entry) => (
            <RankRow
              key={entry.userId}
              rank={entry.rank}
              userId={entry.userId}
              name={entry.name}
              image={entry.image}
              value={entry.value}
              formatValue={(v) => formatValue(dimension, v)}
              isMe={entry.userId === session?.user?.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

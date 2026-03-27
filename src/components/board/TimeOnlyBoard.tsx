// src/components/board/TimeOnlyBoard.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Plus, Trash2, Calendar } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { cn } from '~/lib/utils';

interface TimeRecord {
  id: string;
  date: string;
  duration: string;
  note?: string;
}

// Mock 最近記錄
const MOCK_RECORDS: TimeRecord[] = [
  { id: 'r1', date: '2026-03-22', duration: '1h 計時新增', note: '計時新增' },
  { id: 'r2', date: '2026-03-20', duration: '1.5h', note: '手動新增' },
];

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

interface TimeOnlyBoardProps {
  boardName?: string;
}

export function TimeOnlyBoard({ boardName }: TimeOnlyBoardProps) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const handleStop = () => {
    setRunning(false);
    setElapsed(0);
  };

  return (
    <div className="flex flex-col items-center gap-8 p-8 max-w-2xl mx-auto w-full">
      {/* 計時器 */}
      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-6 py-10">
          <span className="text-6xl font-bold tracking-widest tabular-nums">
            {formatTime(elapsed)}
          </span>

          {/* 控制按鈕 */}
          <div className="flex items-center gap-4">
            <Button
              size="icon"
              className={cn(
                'h-12 w-12 rounded-full',
                running ? 'bg-primary hover:bg-primary/90' : 'bg-primary hover:bg-primary/90',
              )}
              onClick={() => setRunning((r) => !r)}
            >
              {running ? <Pause size={20} /> : <Play size={20} />}
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-12 w-12 rounded-full"
              onClick={handleStop}
              disabled={elapsed === 0}
            >
              <Square size={18} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 統計 */}
      <div className="grid grid-cols-2 gap-4 w-full">
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <p className="text-sm text-muted-foreground mb-1">本周累計</p>
            <p className="text-3xl font-bold leading-none">8.5</p>
            <p className="text-sm text-muted-foreground mt-1">小時</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <p className="text-sm text-muted-foreground mb-1">本月累計</p>
            <p className="text-3xl font-bold leading-none">24</p>
            <p className="text-sm text-muted-foreground mt-1">小時</p>
          </CardContent>
        </Card>
      </div>

      {/* 手動新增 */}
      <Button variant="outline" className="w-full gap-2 border-dashed">
        <Plus size={16} />
        手動新增時間
      </Button>

      {/* 最近記錄 */}
      <div className="w-full">
        <h3 className="text-sm font-semibold mb-3">最近記錄</h3>
        <div className="flex flex-col gap-2">
          {MOCK_RECORDS.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
            >
              <div className="flex items-center gap-3 text-sm">
                <Calendar size={14} className="text-muted-foreground" />
                <span className="text-muted-foreground">{record.date}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{record.duration}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

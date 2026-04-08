// src/app/(app)/timer/page.tsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { ArrowLeft, Play, Pause, Square, Plus, Calendar, Trash2 } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Skeleton } from '~/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '~/components/ui/dialog';
import { cn } from '~/lib/utils';
import { trpc } from '~/utils/trpc';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const diff = d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function TaskTimerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const taskId = searchParams.get('taskId') ?? '';
  const boardId = searchParams.get('boardId') ?? '';

  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  const [manualOpen, setManualOpen] = useState(false);
  const [manualHours, setManualHours] = useState(0);
  const [manualMinutes, setManualMinutes] = useState(0);
  const [manualDate, setManualDate] = useState(new Date().toISOString().slice(0, 10));
  const [manualNote, setManualNote] = useState('');

  const utils = trpc.useUtils();
  const { data: task, isLoading } = trpc.task.byId.useQuery(
    { id: taskId },
    { enabled: !!taskId },
  );

  const createEntry = trpc.timeEntries.create.useMutation({
    onSuccess: () => utils.task.byId.invalidate({ id: taskId }),
  });
  const deleteEntry = trpc.timeEntries.delete.useMutation({
    onSuccess: () => utils.task.byId.invalidate({ id: taskId }),
  });

  const timeEntries = useMemo(() => task?.timeEntries ?? [], [task?.timeEntries]);

  const { weeklyHours, monthlyHours } = useMemo(() => {
    const now = new Date();
    const weekStart = getStartOfWeek(now);
    const monthStart = getStartOfMonth(now);
    let weeklyMinutes = 0;
    let monthlyMinutes = 0;
    for (const entry of timeEntries) {
      const d = new Date(entry.startTime ?? entry.createdAt);
      if (d >= monthStart) monthlyMinutes += entry.duration;
      if (d >= weekStart) weeklyMinutes += entry.duration;
    }
    return {
      weeklyHours: (weeklyMinutes / 60).toFixed(1),
      monthlyHours: (monthlyMinutes / 60).toFixed(1),
    };
  }, [timeEntries]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const handlePlayPause = () => {
    if (!running && elapsed === 0) startTimeRef.current = new Date();
    setRunning((r) => !r);
  };

  const handleStop = () => {
    if (elapsed > 0) {
      createEntry.mutate({
        boardId,
        taskId,
        duration: Math.max(1, Math.round(elapsed / 60)),
        startTime: startTimeRef.current ?? undefined,
        endTime: new Date(),
        note: '計時器',
      });
    }
    setRunning(false);
    setElapsed(0);
    startTimeRef.current = null;
  };

  const handleManualSubmit = () => {
    const totalMinutes = manualHours * 60 + manualMinutes;
    if (totalMinutes <= 0) return;
    const entryDate = new Date(manualDate);
    createEntry.mutate({
      boardId,
      taskId,
      duration: totalMinutes,
      startTime: entryDate,
      endTime: entryDate,
      note: manualNote || '手動新增',
    });
    setManualHours(0);
    setManualMinutes(0);
    setManualDate(new Date().toISOString().slice(0, 10));
    setManualNote('');
    setManualOpen(false);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex h-14 items-center gap-3 border-b bg-card px-4 md:px-6 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/board/${boardId}`)}
        >
          <ArrowLeft size={18} />
        </Button>
        {isLoading ? (
          <Skeleton className="h-5 w-40" />
        ) : (
          <div>
            <p className="text-xs text-muted-foreground">任務計時</p>
            <h1 className="text-sm font-semibold leading-tight">{task?.title}</h1>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col items-center gap-6 p-4 md:gap-8 md:p-8 max-w-2xl mx-auto w-full">
        {/* 計時器 */}
        <Card className="w-full">
          <CardContent className="flex flex-col items-center gap-4 py-8 md:gap-6 md:py-10">
            <span className="text-5xl md:text-6xl font-bold tracking-widest tabular-nums">
              {formatTime(elapsed)}
            </span>
            <div className="flex items-center gap-4">
              <Button
                size="icon"
                className={cn('h-12 w-12 rounded-full', 'bg-primary hover:bg-primary/90')}
                onClick={handlePlayPause}
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
              <p className="text-3xl font-bold leading-none">{weeklyHours}</p>
              <p className="text-sm text-muted-foreground mt-1">小時</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4 px-5">
              <p className="text-sm text-muted-foreground mb-1">本月累計</p>
              <p className="text-3xl font-bold leading-none">{monthlyHours}</p>
              <p className="text-sm text-muted-foreground mt-1">小時</p>
            </CardContent>
          </Card>
        </div>

        {/* 手動新增 */}
        <Button
          variant="outline"
          className="w-full gap-2 border-dashed"
          onClick={() => setManualOpen(true)}
        >
          <Plus size={16} />
          手動新增時間
        </Button>

        <Dialog open={manualOpen} onOpenChange={setManualOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>手動新增時間</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium w-16">時長</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={manualHours}
                    onChange={(e) => setManualHours(Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">小時</span>
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">分鐘</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium w-16">日期</label>
                <Input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium w-16">備註</label>
                <Input
                  type="text"
                  placeholder="選填"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setManualOpen(false)}>取消</Button>
              <Button
                onClick={handleManualSubmit}
                disabled={manualHours * 60 + manualMinutes <= 0 || createEntry.isPending}
              >
                新增
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 最近記錄 */}
        <div className="w-full">
          <h3 className="text-sm font-semibold mb-3">此任務的時間記錄</h3>
          <div className="flex flex-col gap-2">
            {timeEntries.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">尚無記錄</p>
            )}
            {timeEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={14} className="text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {new Date(entry.startTime ?? entry.createdAt).toLocaleDateString()}
                  </span>
                  <span className="font-medium">{formatDuration(entry.duration)}</span>
                </div>
                <div className="flex items-center gap-3">
                  {entry.note && (
                    <span className="text-xs text-muted-foreground">{entry.note}</span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteEntry.mutate({ id: entry.id })}
                    disabled={deleteEntry.isPending}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TaskTimerPage() {
  return (
    <Suspense>
      <TaskTimerContent />
    </Suspense>
  );
}

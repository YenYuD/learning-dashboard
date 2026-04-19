// src/app/(app)/timer/page.tsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { localDayStartUTC, toLocalDateKey } from '~/lib/timezoneUtils';
import { trpc } from '~/utils/trpc';
import { toast } from 'sonner';

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

const TIMER_STORAGE_KEY = 'learning-dashboard-timer';

interface TimerState {
  elapsed: number;
  running: boolean;
  startTime: string | null;
  boardId: string;
  taskId: string;
  lastSavedAt: string;
}

function saveTimerState(state: TimerState) {
  try {
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage full or unavailable
  }
}

function loadTimerState(): TimerState | null {
  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TimerState;
  } catch {
    return null;
  }
}

function clearTimerState() {
  try {
    localStorage.removeItem(TIMER_STORAGE_KEY);
  } catch {
    // silent
  }
}

const manualEntrySchema = z.object({
  hours: z.number().int().min(0, '小時數不可為負').max(23, '小時數須介於 0 ~ 23'),
  minutes: z.number().int().min(0, '分鐘數不可為負').max(59, '分鐘數須介於 0 ~ 59'),
  date: z.string().min(1, '請選擇日期'),
  note: z.string().optional(),
}).refine((data) => data.hours * 60 + data.minutes > 0, {
  message: '時長必須大於 0 分鐘',
  path: ['minutes'],
});

type ManualEntryFormData = z.infer<typeof manualEntrySchema>;

function TaskTimerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const taskId = searchParams.get('taskId') ?? '';
  const boardId = searchParams.get('boardId') ?? '';

  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const initializedRef = useRef(false);

  const [manualOpen, setManualOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ManualEntryFormData>({
    resolver: zodResolver(manualEntrySchema),
    defaultValues: {
      hours: 0,
      minutes: 0,
      date: toLocalDateKey(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone),
      note: '',
    },
  });

  const utils = trpc.useUtils();
  const { data: task, isLoading } = trpc.task.byId.useQuery(
    { id: taskId },
    { enabled: !!taskId },
  );

  const invalidateAnalytics = () => {
    utils.analytics.summary.invalidate();
    utils.analytics.weeklyByBoard.invalidate();
    utils.analytics.boardDistribution.invalidate();
    utils.analytics.dailyTrend.invalidate();
    utils.analytics.monthlyCalendar.invalidate();
    utils.analytics.monthlyBoardBreakdown.invalidate();
  };

  const createEntry = trpc.timeEntries.create.useMutation({
    onSuccess: () => {
      utils.task.byId.invalidate({ id: taskId });
      invalidateAnalytics();
      toast.success('時間記錄已儲存');
    },
    onError: (error) => {
      toast.error('儲存失敗', { description: error.message });
    },
  });
  const deleteEntry = trpc.timeEntries.delete.useMutation({
    onSuccess: () => {
      utils.task.byId.invalidate({ id: taskId });
      invalidateAnalytics();
      toast.success('記錄已刪除');
    },
    onError: (error) => {
      toast.error('刪除失敗', { description: error.message });
    },
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

  // Restore timer state from localStorage on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const saved = loadTimerState();
    if (!saved) return;
    if (saved.boardId !== boardId || saved.taskId !== taskId) return;

    if (saved.running && saved.startTime) {
      const startMs = new Date(saved.startTime).getTime();
      const realElapsed = Math.floor((Date.now() - startMs) / 1000);
      setElapsed(realElapsed);
      setRunning(true);
      startTimeRef.current = new Date(saved.startTime);
    } else if (saved.elapsed > 0) {
      setElapsed(saved.elapsed);
      startTimeRef.current = saved.startTime ? new Date(saved.startTime) : null;
    }
  }, [boardId, taskId]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const realElapsed = Math.floor(
            (Date.now() - startTimeRef.current.getTime()) / 1000,
          );
          setElapsed(realElapsed);
        } else {
          setElapsed((p) => p + 1);
        }
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  // Persist timer state to localStorage whenever it changes
  useEffect(() => {
    if (!initializedRef.current) return;

    if (elapsed === 0 && !running) {
      clearTimerState();
      return;
    }

    saveTimerState({
      elapsed,
      running,
      startTime: startTimeRef.current?.toISOString() ?? null,
      boardId,
      taskId,
      lastSavedAt: new Date().toISOString(),
    });
  }, [elapsed, running, boardId, taskId]);

  // Warn before closing/refreshing browser when timer is active
  useEffect(() => {
    const hasActiveTimer = running || elapsed > 0;
    if (!hasActiveTimer) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [running, elapsed]);

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
    clearTimerState();
  };

  const onManualSubmit = (data: ManualEntryFormData) => {
    const totalMinutes = data.hours * 60 + data.minutes;
    // 以瀏覽器時區的午夜作為 startTime，確保「選哪天就是哪天」
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const entryDate = localDayStartUTC(data.date, tz);
    createEntry.mutate({
      boardId,
      taskId,
      duration: totalMinutes,
      startTime: entryDate,
      endTime: entryDate,
      note: data.note || '手動新增',
    });
    reset();
    setManualOpen(false);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex h-14 items-center gap-3 border-b bg-card px-4 md:px-6 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (
              (running || elapsed > 0) &&
              !window.confirm('您有未儲存的計時紀錄，確定要離開嗎？')
            ) {
              return;
            }
            router.push(`/board/${boardId}`);
          }}
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
            <form onSubmit={handleSubmit(onManualSubmit)}>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium w-16">時長</label>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={23}
                        className="w-20"
                        {...register('hours', { valueAsNumber: true })}
                      />
                      <span className="text-sm text-muted-foreground">小時</span>
                      <Input
                        type="number"
                        min={0}
                        max={59}
                        className="w-20"
                        {...register('minutes', { valueAsNumber: true })}
                      />
                      <span className="text-sm text-muted-foreground">分鐘</span>
                    </div>
                    {(errors.hours || errors.minutes) && (
                      <p className="text-sm text-destructive">
                        {errors.hours?.message || errors.minutes?.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium w-16">日期</label>
                  <div className="flex flex-col gap-1 flex-1">
                    <Input
                      type="date"
                      {...register('date')}
                    />
                    {errors.date && (
                      <p className="text-sm text-destructive">{errors.date.message}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium w-16">備註</label>
                  <div className="flex flex-col gap-1 flex-1">
                    <Input
                      type="text"
                      placeholder="選填"
                      {...register('note')}
                    />
                    {errors.note && (
                      <p className="text-sm text-destructive">{errors.note.message}</p>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setManualOpen(false)}>取消</Button>
                <Button
                  type="submit"
                  disabled={createEntry.isPending}
                >
                  新增
                </Button>
              </DialogFooter>
            </form>
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

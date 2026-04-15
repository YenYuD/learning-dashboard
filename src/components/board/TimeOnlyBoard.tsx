// src/components/board/TimeOnlyBoard.tsx
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, Square, Plus, Trash2, Calendar, Pencil } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '~/components/ui/dialog';
import { cn } from '~/lib/utils';
import { localDayStartUTC } from '~/lib/timezoneUtils';
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
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday is start of week
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

interface TimeOnlyBoardProps {
  boardId: string;
  boardName?: string;
}

export function TimeOnlyBoard({ boardId, boardName: _boardName }: TimeOnlyBoardProps) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  // Manual entry dialog state
  const [manualOpen, setManualOpen] = useState(false);
  const [manualHours, setManualHours] = useState(0);
  const [manualMinutes, setManualMinutes] = useState(0);
  const [manualDate, setManualDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [manualNote, setManualNote] = useState('');

  // tRPC queries and mutations
  const utils = trpc.useUtils();
  const boardQuery = trpc.board.byId.useQuery({ id: boardId });

  // Edit entry state
  const [editingEntry, setEditingEntry] = useState<NonNullable<typeof boardQuery.data>['timeEntries'][0] | null>(null);
  const [editHours, setEditHours] = useState(0);
  const [editMinutes, setEditMinutes] = useState(0);
  const [editDate, setEditDate] = useState('');
  const [editNote, setEditNote] = useState('');

  const invalidateAnalytics = () => {
    utils.analytics.summary.invalidate();
    utils.analytics.weeklyByBoard.invalidate();
    utils.analytics.boardDistribution.invalidate();
    utils.analytics.dailyTrend.invalidate();
    utils.analytics.monthlyCalendar.invalidate();
    utils.analytics.monthlyBoardBreakdown.invalidate();
  };

  const createEntry = trpc.timeEntries.create.useMutation({
    onMutate: async (input) => {
      await utils.board.byId.cancel({ id: boardId });
      const previous = utils.board.byId.getData({ id: boardId });
      utils.board.byId.setData({ id: boardId }, (old) => {
        if (!old) return old;
        return {
          ...old,
          timeEntries: [
            {
              id: `optimistic-${Date.now()}`,
              boardId: input.boardId,
              taskId: input.taskId ?? null,
              duration: input.duration,
              startTime: input.startTime ?? null,
              endTime: input.endTime ?? null,
              type: 'MANUAL' as const,
              note: input.note ?? null,
              createdAt: new Date(),
              updatedAt: new Date(),
              task: null,
            },
            ...old.timeEntries,
          ],
        };
      });
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        utils.board.byId.setData({ id: boardId }, context.previous);
      }
      toast.error('儲存失敗', { description: _err.message });
    },
    onSettled: () => {
      utils.board.byId.invalidate({ id: boardId });
      invalidateAnalytics();
    },
    onSuccess: () => {
      toast.success('時間記錄已儲存');
    },
  });
  const deleteEntry = trpc.timeEntries.delete.useMutation({
    onMutate: async (input) => {
      await utils.board.byId.cancel({ id: boardId });
      const previous = utils.board.byId.getData({ id: boardId });
      utils.board.byId.setData({ id: boardId }, (old) => {
        if (!old) return old;
        return {
          ...old,
          timeEntries: old.timeEntries.filter((e) => e.id !== input.id),
        };
      });
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        utils.board.byId.setData({ id: boardId }, context.previous);
      }
      toast.error('刪除失敗', { description: _err.message });
    },
    onSettled: () => {
      utils.board.byId.invalidate({ id: boardId });
      invalidateAnalytics();
    },
    onSuccess: () => {
      toast.success('記錄已刪除');
    },
  });

  const updateEntry = trpc.timeEntries.update.useMutation({
    onMutate: async (input) => {
      await utils.board.byId.cancel({ id: boardId });
      const previous = utils.board.byId.getData({ id: boardId });
      utils.board.byId.setData({ id: boardId }, (old) => {
        if (!old) return old;
        return {
          ...old,
          timeEntries: old.timeEntries.map((e) =>
            e.id === input.id
              ? {
                  ...e,
                  duration: input.duration ?? e.duration,
                  startTime: input.startTime ?? e.startTime,
                  endTime: input.endTime ?? e.endTime,
                  note: input.note !== undefined ? input.note : e.note,
                }
              : e
          ),
        };
      });
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        utils.board.byId.setData({ id: boardId }, context.previous);
      }
      toast.error('更新失敗', { description: _err.message });
    },
    onSettled: () => {
      utils.board.byId.invalidate({ id: boardId });
      invalidateAnalytics();
    },
    onSuccess: () => {
      toast.success('記錄已更新');
      setEditingEntry(null);
    },
  });

  const timeEntries = useMemo(() => boardQuery.data?.timeEntries ?? [], [boardQuery.data?.timeEntries]);

  const { weeklyHours, monthlyHours } = useMemo(() => {
    const now = new Date();
    const weekStart = getStartOfWeek(now);
    const monthStart = getStartOfMonth(now);

    let weeklyMinutes = 0;
    let monthlyMinutes = 0;

    for (const entry of timeEntries) {
      const entryDate = new Date(entry.startTime ?? entry.createdAt);
      if (entryDate >= monthStart) {
        monthlyMinutes += entry.duration;
      }
      if (entryDate >= weekStart) {
        weeklyMinutes += entry.duration;
      }
    }

    return {
      weeklyHours: (weeklyMinutes / 60).toFixed(1),
      monthlyHours: (monthlyMinutes / 60).toFixed(1),
    };
  }, [timeEntries]);

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

  const handlePlayPause = () => {
    if (!running) {
      // Starting the timer
      if (elapsed === 0) {
        startTimeRef.current = new Date();
      }
    }
    setRunning((r) => !r);
  };

  const handleStop = () => {
    if (elapsed > 0) {
      const durationMinutes = Math.max(1, Math.round(elapsed / 60));
      createEntry.mutate({
        boardId,
        duration: durationMinutes,
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
    if (manualHours < 0 || manualHours > 23) {
      toast.error('小時數須介於 0 ~ 23');
      return;
    }
    if (manualMinutes < 0 || manualMinutes > 59) {
      toast.error('分鐘數須介於 0 ~ 59');
      return;
    }
    const totalMinutes = manualHours * 60 + manualMinutes;
    if (totalMinutes <= 0) return;

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const entryDate = localDayStartUTC(manualDate, tz);

    createEntry.mutate({
      boardId,
      duration: totalMinutes,
      startTime: entryDate,
      endTime: entryDate,
      note: manualNote || '手動新增',
    });

    // Reset form
    setManualHours(0);
    setManualMinutes(0);
    setManualDate(new Date().toISOString().slice(0, 10));
    setManualNote('');
    setManualOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteEntry.mutate({ id });
  };

  const handleEditOpen = (entry: NonNullable<typeof boardQuery.data>['timeEntries'][0]) => {
    setEditingEntry(entry);
    setEditHours(Math.floor(entry.duration / 60));
    setEditMinutes(entry.duration % 60);
    const d = new Date(entry.startTime ?? entry.createdAt);
    setEditDate(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    );
    setEditNote(entry.note ?? '');
  };

  const handleEditSubmit = () => {
    if (!editingEntry) return;
    if (editHours < 0 || editHours > 23) {
      toast.error('小時數須介於 0 ~ 23');
      return;
    }
    if (editMinutes < 0 || editMinutes > 59) {
      toast.error('分鐘數須介於 0 ~ 59');
      return;
    }
    const totalMinutes = editHours * 60 + editMinutes;
    if (totalMinutes <= 0) return;

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const entryDate = localDayStartUTC(editDate, tz);

    updateEntry.mutate({
      id: editingEntry.id,
      duration: totalMinutes,
      startTime: entryDate,
      endTime: entryDate,
      note: editNote || undefined,
    });
  };

  return (
    <div className="flex flex-col items-center gap-6 sm:gap-8 p-4 sm:p-8 max-w-2xl mx-auto w-full">
      {/* 計時器 */}
      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-4 sm:gap-6 py-6 sm:py-10 px-4 sm:px-6">
          <span className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-widest tabular-nums">
            {formatTime(elapsed)}
          </span>

          {/* 控制按鈕 */}
          <div className="flex items-center gap-4">
            <Button
              size="icon"
              className={cn(
                'h-12 w-12 rounded-full',
                'bg-primary hover:bg-primary/90',
              )}
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
            <Button
              variant="outline"
              onClick={() => setManualOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleManualSubmit}
              disabled={manualHours * 60 + manualMinutes <= 0 || createEntry.isPending}
            >
              新增
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingEntry} onOpenChange={(open) => { if (!open) setEditingEntry(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯記錄</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium w-16">時長</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  value={editHours}
                  onChange={(e) => setEditHours(Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">小時</span>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={editMinutes}
                  onChange={(e) => setEditMinutes(Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">分鐘</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium w-16">日期</label>
              <Input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium w-16">備註</label>
              <Input
                type="text"
                placeholder="選填"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEntry(null)}>
              取消
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={editHours * 60 + editMinutes <= 0 || updateEntry.isPending}
            >
              儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 最近記錄 */}
      <div className="w-full">
        <h3 className="text-sm font-semibold mb-3">最近記錄</h3>
        <div className="flex flex-col gap-2">
          {timeEntries.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              尚無記錄
            </p>
          )}
          {timeEntries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 sm:px-4 py-3"
            >
              <div className="flex items-center gap-2 sm:gap-3 text-sm min-w-0">
                <Calendar size={14} className="shrink-0 text-muted-foreground" />
                <span className="shrink-0 text-muted-foreground">
                  {new Date(entry.startTime ?? entry.createdAt).toLocaleDateString()}
                </span>
                <span className="shrink-0 text-sm font-medium">
                  {formatDuration(entry.duration)}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
                {entry.note && (
                  <span className="text-muted-foreground truncate max-w-[100px] sm:max-w-[160px]">{entry.note}</span>
                )}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={() => handleEditOpen(entry)}
                    disabled={updateEntry.isPending}
                  >
                    <Pencil size={13} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
                    onClick={() => handleDelete(entry.id)}
                    disabled={deleteEntry.isPending}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

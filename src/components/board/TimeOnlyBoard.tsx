// src/components/board/TimeOnlyBoard.tsx
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, Square, Plus, Trash2, Calendar } from 'lucide-react';
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
  const [manualDate, setManualDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [manualNote, setManualNote] = useState('');

  // tRPC queries and mutations
  const utils = trpc.useUtils();
  const boardQuery = trpc.board.byId.useQuery({ id: boardId });
  const createEntry = trpc.timeEntries.create.useMutation({
    onSuccess: () => {
      utils.board.byId.invalidate({ id: boardId });
    },
  });
  const deleteEntry = trpc.timeEntries.delete.useMutation({
    onSuccess: () => {
      utils.board.byId.invalidate({ id: boardId });
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
    const totalMinutes = manualHours * 60 + manualMinutes;
    if (totalMinutes <= 0) return;

    const entryDate = new Date(manualDate);

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
              className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
            >
              <div className="flex items-center gap-3 text-sm">
                <Calendar size={14} className="text-muted-foreground" />
                <span className="text-muted-foreground">
                  {new Date(entry.startTime ?? entry.createdAt).toLocaleDateString()}
                </span>
                <span className="text-sm font-medium">
                  {formatDuration(entry.duration)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {entry.note && (
                  <span className="text-muted-foreground">{entry.note}</span>
                )}
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
          ))}
        </div>
      </div>
    </div>
  );
}

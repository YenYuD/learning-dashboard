// src/components/dialogs/CreateBoardModal.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { IconPicker } from '~/components/ui/icon-picker';
import { cn } from '~/lib/utils';
import { BOARD_COLORS } from '~/lib/constants';
import { trpc } from '~/utils/trpc';
import { toast } from 'sonner';
import { ListChecks, Timer } from 'lucide-react';

type BoardType = 'TASK_BASED' | 'TIME_ONLY';

const BOARD_TYPES: { type: BoardType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    type: 'TASK_BASED',
    label: '任務型',
    icon: <ListChecks size={22} />,
    description: '建立任務清單，逐步完成學習目標。適合有明確步驟的學習，例如讀書計畫、程式課題。',
  },
  {
    type: 'TIME_ONLY',
    label: '計時型',
    icon: <Timer size={22} />,
    description: '單純記錄投入的時間，不需要任務列表。適合難以拆解成任務的練習，例如滑雪、樂器。',
  },
];

const createBoardSchema = z.object({
  name: z.string().min(1, 'Board 名稱為必填').max(50, 'Board 名稱不可超過 50 字'),
});

type CreateBoardFormData = z.infer<typeof createBoardSchema>;

interface CreateBoardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBoardModal({ open, onOpenChange }: CreateBoardModalProps) {
  const [boardType, setBoardType] = useState<BoardType>('TASK_BASED');
  const [selectedColor, setSelectedColor] = useState<string>(BOARD_COLORS[0].value);
  const [boardIcon, setBoardIcon] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateBoardFormData>({
    resolver: zodResolver(createBoardSchema),
    defaultValues: { name: '' },
  });

  const router = useRouter();
  const utils = trpc.useUtils();

  const createBoard = trpc.board.create.useMutation({
    onMutate: async (input) => {
      await utils.board.list.cancel();
      const previous = utils.board.list.getData();
      utils.board.list.setData(undefined, (old) => {
        if (!old) return old;
        return [
          ...old,
          {
            id: `optimistic-${Date.now()}`,
            name: input.name,
            type: input.type,
            icon: input.icon ?? null,
            color: input.color ?? null,
            order: old.length,
            user_id: '',
            lists: [],
            timeEntries: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
      });
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        utils.board.list.setData(undefined, context.previous);
      }
      toast.error('建立 Board 失敗', { description: _err.message });
    },
    onSuccess: (newBoard) => {
      // 立即將 optimistic ID 替換成真實 ID，避免 Sidebar 連結仍指向不存在的 ID
      utils.board.list.setData(undefined, (old) => {
        if (!old) return old;
        return old.map((board) =>
          board.id.startsWith('optimistic-') ? { ...board, id: newBoard.id } : board,
        );
      });
      utils.board.list.invalidate();
      onOpenChange(false);
      reset();
      setBoardType('TASK_BASED');
      setSelectedColor(BOARD_COLORS[0].value);
      setBoardIcon('');
      router.push(`/board/${newBoard.id}`);
    },
  });

  const onSubmit = (data: CreateBoardFormData) => {
    createBoard.mutate({
      name: data.name.trim(),
      type: boardType,
      icon: boardIcon || undefined,
      color: selectedColor,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>建立新 Board</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Board type selection */}
          <div>
            <p className="text-sm font-medium mb-3">選擇類型</p>
            <div className="grid grid-cols-2 gap-3">
              {BOARD_TYPES.map(({ type, label, icon, description }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setBoardType(type)}
                  className={cn(
                    'flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-colors',
                    boardType === type
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/40',
                  )}
                >
                  <div className={cn(
                    'flex items-center gap-2 font-medium text-sm',
                    boardType === type ? 'text-primary' : 'text-foreground',
                  )}>
                    {icon}
                    {label}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Board info */}
          <div className="space-y-4">
            <p className="text-sm font-medium">Board 資訊</p>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                名稱
              </label>
              <Input
                placeholder="例：日文 N2 備考"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Icon */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  Icon
                </label>
                <IconPicker
                  value={boardIcon}
                  onChange={(name) => setBoardIcon(name)}
                />
              </div>

              {/* 顏色 */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  顏色
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {BOARD_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      title={color.label}
                      onClick={() => setSelectedColor(color.value)}
                      className={cn(
                        'h-7 w-7 rounded border-2 transition-transform hover:scale-110',
                        selectedColor === color.value
                          ? 'border-foreground scale-110'
                          : 'border-transparent',
                      )}
                      style={{ backgroundColor: color.value }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={createBoard.isPending}
          >
            {createBoard.isPending ? '建立中...' : '建立 Board'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

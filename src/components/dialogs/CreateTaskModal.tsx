// src/components/dialogs/CreateTaskModal.tsx
'use client';

import { useForm } from 'react-hook-form';
import { ChevronDown, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { trpc } from '~/utils/trpc';

interface ListOption {
  id: string;
  name: string;
}

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  lists: ListOption[];
  defaultListId: string;
}

interface CreateTaskFormData {
  title: string;
  description: string;
  listId: string;
}

export function CreateTaskModal({
  open,
  onOpenChange,
  boardId,
  lists,
  defaultListId,
}: CreateTaskModalProps) {
  const utils = trpc.useUtils();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTaskFormData>({
    defaultValues: {
      title: '',
      description: '',
      listId: defaultListId,
    },
  });

  const createTask = trpc.task.create.useMutation({
    onSuccess: () => {
      utils.board.byId.invalidate({ id: boardId });
      reset();
      onOpenChange(false);
    },
  });

  const onSubmit = (data: CreateTaskFormData) => {
    const trimmedTitle = data.title.trim();
    if (!trimmedTitle) return;
    createTask.mutate({
      listId: data.listId,
      title: trimmedTitle,
      description: data.description.trim() || undefined,
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset();
    } else {
      reset({ title: '', description: '', listId: defaultListId });
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0" showCloseButton={false}>
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between px-6 h-16 space-y-0">
          <DialogTitle className="text-lg font-semibold">新增任務</DialogTitle>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted hover:bg-muted/80"
          >
            <X size={16} className="text-muted-foreground" />
          </button>
        </DialogHeader>

        <div className="h-px bg-border" />

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-5">
            {/* Title field */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-foreground">
                任務標題
              </label>
              <Input
                placeholder="例如：複習 N2 單字 Unit 5"
                {...register('title', { required: '任務標題為必填' })}
                disabled={createTask.isPending}
                autoFocus
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Description field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-medium text-foreground">
                  描述
                </label>
                <span className="text-[13px] text-muted-foreground">選填</span>
              </div>
              <textarea
                placeholder="補充任務細節、參考資料連結..."
                {...register('description')}
                rows={4}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
            </div>

            {/* List select field */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-foreground">
                加入清單
              </label>
              <div className="relative">
                <select
                  {...register('listId')}
                  className="flex w-full h-10 items-center rounded-lg border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none pr-8"
                >
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 h-[68px]">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="px-5"
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={createTask.isPending}
              className="px-5 bg-[#EF4444] hover:bg-[#DC2626] text-white"
            >
              {createTask.isPending ? '建立中...' : '建立任務'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

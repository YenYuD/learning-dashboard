// src/components/dialogs/TaskDetailModal.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { trpc } from '~/utils/trpc';
import { toast } from 'sonner';

interface TaskDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: {
    id: string;
    title: string;
    description?: string;
    listId: string;
  };
  boardId: string;
}

export function TaskDetailModal({
  open,
  onOpenChange,
  task,
  boardId,
}: TaskDetailModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const utils = trpc.useUtils();

  const updateTask = trpc.task.update.useMutation({
    onSuccess: () => {
      utils.board.byId.invalidate({ id: boardId });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('更新任務失敗', { description: error.message });
    },
  });

  const deleteTask = trpc.task.delete.useMutation({
    onSuccess: () => {
      utils.board.byId.invalidate({ id: boardId });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('刪除任務失敗', { description: error.message });
    },
  });

  const handleSave = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    updateTask.mutate({
      id: task.id,
      title: trimmed,
      description: description.trim() || undefined,
    });
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteTask.mutate({ id: task.id });
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setConfirmDelete(false);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>編輯任務</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              標題
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="任務名稱"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="選填描述..."
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="pt-2 border-t">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteTask.isPending}
              className="w-full"
            >
              {deleteTask.isPending
                ? '刪除中...'
                : confirmDelete
                  ? '確認刪除？'
                  : '刪除任務'}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || updateTask.isPending}
          >
            {updateTask.isPending ? '儲存中...' : '儲存'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

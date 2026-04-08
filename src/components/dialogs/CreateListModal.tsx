// src/components/dialogs/CreateListModal.tsx
'use client';

import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
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

interface CreateListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
}

interface CreateListFormData {
  name: string;
}

export function CreateListModal({ open, onOpenChange, boardId }: CreateListModalProps) {
  const utils = trpc.useUtils();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateListFormData>({
    defaultValues: { name: '' },
  });

  const createList = trpc.list.create.useMutation({
    onSuccess: () => {
      utils.board.byId.invalidate({ id: boardId });
      reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('建立清單失敗', { description: error.message });
    },
  });

  const onSubmit = (data: CreateListFormData) => {
    const trimmed = data.name.trim();
    if (!trimmed) return;
    createList.mutate({ boardId, name: trimmed });
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0" showCloseButton={false}>
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between px-6 h-16 space-y-0">
          <DialogTitle className="text-lg font-semibold">新增清單</DialogTitle>
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
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-foreground">
                清單名稱
              </label>
              <Input
                placeholder="例如：To Do、In Progress..."
                {...register('name', { required: '清單名稱為必填' })}
                disabled={createList.isPending}
                autoFocus
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="h-px bg-border" />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 pb-6">
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
              disabled={createList.isPending}
              className="px-5 bg-[#EF4444] hover:bg-[#DC2626] text-white"
            >
              {createList.isPending ? '建立中...' : '建立清單'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

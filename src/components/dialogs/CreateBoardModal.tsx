// src/components/dialogs/CreateBoardModal.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { cn } from '~/lib/utils';
import { BOARD_COLORS, BOARD_TEMPLATES } from '~/lib/constants';

interface CreateBoardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TemplateId = (typeof BOARD_TEMPLATES)[number]['id'];

// 設計稿顯示的 4 個模板（2×2 grid）
const DISPLAY_TEMPLATES = BOARD_TEMPLATES.filter((t) =>
  ['language', 'programming', 'sport', 'fitness'].includes(t.id),
);

export function CreateBoardModal({ open, onOpenChange }: CreateBoardModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('language');
  const [boardName, setBoardName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(BOARD_COLORS[0].value);
  const [boardIcon, setBoardIcon] = useState('');

  const selectedTemplateData = BOARD_TEMPLATES.find(
    (t) => t.id === selectedTemplate,
  );

  const handleCreate = () => {
    if (!boardName.trim()) return;
    // TODO: 串接 trpc.board.create
    console.log('Create board:', {
      name: boardName,
      template: selectedTemplate,
      color: selectedColor,
      icon: boardIcon || selectedTemplateData?.icon,
      type: selectedTemplateData?.type,
      defaultLists: selectedTemplateData?.defaultLists,
    });
    onOpenChange(false);
    setBoardName('');
    setSelectedTemplate('language');
    setSelectedColor(BOARD_COLORS[0].value);
    setBoardIcon('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>建立新 Board</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Template selection — 2×2 grid */}
          <div>
            <p className="text-sm font-medium mb-3">選擇模板</p>
            <div className="grid grid-cols-2 gap-2">
              {DISPLAY_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplate(template.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center text-sm transition-colors',
                    selectedTemplate === template.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/40',
                  )}
                >
                  <span className="text-2xl">{template.icon}</span>
                  <span className="font-medium text-xs">{template.label}</span>
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
                placeholder={`例：${selectedTemplateData?.label ?? '我的 Board'}`}
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Icon */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  Icon
                </label>
                <Input
                  placeholder={selectedTemplateData?.icon ?? '🎯'}
                  value={boardIcon}
                  onChange={(e) => setBoardIcon(e.target.value)}
                  className="text-center text-lg"
                  maxLength={2}
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
          <Button onClick={handleCreate} disabled={!boardName.trim()}>
            建立 Board
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

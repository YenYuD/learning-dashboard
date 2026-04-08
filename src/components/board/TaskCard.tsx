// src/components/board/TaskCard.tsx
'use client';

import { Clock, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TaskCardProps {
  taskId: string;
  boardId: string;
  title: string;
  description?: string;
  totalMinutes?: number;
  onClick?: () => void;
}

function formatMinutes(minutes: number): string {
  if (minutes === 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function TaskCard({
  taskId,
  boardId,
  title,
  description,
  totalMinutes = 0,
  onClick,
}: TaskCardProps) {
  const router = useRouter();

  return (
    <div
      className="relative flex flex-col gap-2 rounded-lg border border-[#E8E8E8] bg-white p-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      onClick={onClick}
    >
      <p className="text-sm font-medium text-[#0D0D0D] leading-snug pr-6">{title}</p>
      {description && (
        <p className="text-xs text-[#7A7A7A] line-clamp-2">{description}</p>
      )}
      <div className="flex items-center gap-1.5 text-xs text-[#7A7A7A]">
        <Clock size={14} />
        <span>{formatMinutes(totalMinutes)}</span>
      </div>
      <button
        type="button"
        className="flex w-full items-center justify-center gap-1.5 rounded-md bg-[#E42313] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#C91F10] transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/timer?taskId=${taskId}&boardId=${boardId}`);
        }}
      >
        Select Task
      </button>
      <MoreHorizontal
        size={16}
        className="absolute top-3.5 right-3.5 text-[#9CA3AF]"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      />
    </div>
  );
}

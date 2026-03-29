// src/components/ui/board-icon.tsx
import { icons } from 'lucide-react';
import { ClipboardList } from 'lucide-react';

interface BoardIconProps {
  icon: string | null | undefined;
  size?: number;
  className?: string;
}

/**
 * Renders a Lucide icon by name. Falls back to ClipboardList if the name
 * is invalid or not provided.
 */
export function BoardIcon({ icon, size = 16, className }: BoardIconProps) {
  if (!icon) return <ClipboardList size={size} className={className} />;

  const Icon = icons[icon as keyof typeof icons];
  if (!Icon) return <ClipboardList size={size} className={className} />;

  return <Icon size={size} className={className} />;
}

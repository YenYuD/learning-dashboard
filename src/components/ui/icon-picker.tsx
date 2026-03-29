// src/components/ui/icon-picker.tsx
'use client';

import { useState, useMemo } from 'react';
import { icons, type LucideIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Input } from '~/components/ui/input';
import { cn } from '~/lib/utils';

/** Curated icons suitable for boards/learning activities */
const ICON_NAMES = [
  // Learning & Education
  'Book', 'BookOpen', 'GraduationCap', 'Library', 'Notebook', 'NotebookPen',
  'Pencil', 'PenLine', 'School', 'BookMarked', 'BookText',
  'Brain', 'Microscope', 'TestTube2', 'FlaskConical', 'Telescope',
  // Programming & Tech
  'Code', 'Terminal', 'Monitor', 'Laptop', 'Cpu', 'Database',
  'Globe', 'Wifi', 'Smartphone', 'Bug', 'Braces',
  'Server', 'Network', 'GitBranch', 'GitFork', 'Keyboard',
  'MousePointer', 'Tablet', 'Link', 'Layout', 'Layers',
  // Sports & Fitness
  'Dumbbell', 'HeartPulse', 'Bike', 'Footprints', 'Trophy',
  'Medal', 'Timer', 'Flame', 'Mountain', 'Waves',
  'Tent', 'Ship', 'Bus', 'Car', 'Truck',
  // Music & Art
  'Music', 'Palette', 'Camera', 'Film', 'Mic', 'Headphones',
  'Video', 'Radio', 'Volume2', 'Podcast',
  // Language & Communication
  'Languages', 'MessageCircle', 'Type', 'FileText', 'ScrollText',
  'Newspaper', 'Phone', 'Hash', 'Pin',
  // Productivity
  'Target', 'Rocket', 'Zap', 'Star', 'Sparkles',
  'CheckCircle', 'ListChecks', 'Calendar', 'Clock', 'Lightbulb',
  'Presentation', 'ClipboardList', 'ClipboardCheck', 'Settings', 'Package',
  'Hourglass', 'Watch', 'Infinity', 'Sigma', 'Percent',
  // Nature & Misc
  'TreePine', 'Sun', 'Moon', 'Cloud', 'Leaf',
  'Coffee', 'Utensils', 'Plane', 'MapPin', 'Compass',
  'Flower', 'Flower2', 'Droplets', 'Earth', 'Feather',
  'Dog', 'Fish', 'PawPrint', 'Bird', 'Rabbit',
  // People & Body
  'Hand', 'Eye', 'ThumbsUp', 'HeartHandshake', 'Stethoscope',
  'Thermometer', 'Syringe', 'Award', 'BadgeCheck', 'Crown',
  // Tools & Objects
  'Wrench', 'Ruler', 'Scale', 'Scissors', 'Puzzle',
  'Map', 'Key', 'Lock', 'Shield', 'Umbrella',
  'Home', 'Building', 'Building2', 'Calculator', 'Briefcase',
  // Finance & Shopping
  'Coins', 'PiggyBank', 'CreditCard', 'ShoppingCart', 'ShoppingBag',
  // Categories
  'Folder', 'Tag', 'Bookmark', 'Heart', 'Flag',
  'Diamond', 'Gift', 'Backpack', 'PaintBucket', 'Gamepad2',
] as const;

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  className?: string;
}

export function IconPicker({ value, onChange, className }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredIcons = useMemo(() => {
    if (!search) return ICON_NAMES;
    const lower = search.toLowerCase();
    return ICON_NAMES.filter((name) => name.toLowerCase().includes(lower));
  }, [search]);

  const SelectedIcon = value ? (icons[value as keyof typeof icons] ?? null) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'flex h-10 w-20 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
          value && 'text-foreground',
          className,
        )}
      >
        {SelectedIcon ? <SelectedIcon size={22} /> : <span className="text-xs">選擇</span>}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <Input
          placeholder="搜尋 icon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2 h-8 text-sm"
        />
        <div className="grid max-h-48 grid-cols-7 gap-1 overflow-y-auto">
          {filteredIcons.map((name) => {
            const Icon = icons[name as keyof typeof icons] as LucideIcon | undefined;
            if (!Icon) return null;
            return (
              <button
                key={name}
                type="button"
                title={name}
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                  setSearch('');
                }}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-accent',
                  value === name && 'bg-primary/10 text-primary ring-1 ring-primary/30',
                )}
              >
                <Icon size={16} />
              </button>
            );
          })}
          {filteredIcons.length === 0 && (
            <p className="col-span-7 py-4 text-center text-xs text-muted-foreground">
              找不到符合的 icon
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

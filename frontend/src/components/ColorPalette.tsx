import { cn } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

interface ColorOption {
  id: string;
  name: string;
  hex: string;
  group: string;
}

interface ColorPaletteProps {
  colors: ColorOption[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function ColorPalette({
  colors,
  value,
  onChange,
  className,
}: ColorPaletteProps) {
  const [open, setOpen] = useState(false);

  // Group colors by their group
  const groupedColors = colors.reduce<Record<string, ColorOption[]>>(
    (acc, color) => {
      if (!acc[color.group]) {
        acc[color.group] = [];
      }
      acc[color.group].push(color);
      return acc;
    },
    {},
  );

  const selectedColor = colors.find((c) => c.id === value);

  const handleColorSelect = (colorId: string) => {
    onChange?.(colorId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            'w-full justify-between bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700 hover:text-gray-100',
            !selectedColor && 'text-gray-400',
            className,
          )}
        >
          <div className="flex items-center gap-2">
            {selectedColor && (
              <div
                className="h-4 w-4 rounded-full ring-1 ring-gray-600"
                style={{ backgroundColor: selectedColor.hex }}
              />
            )}
            <span>{selectedColor?.name || 'Select color'}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[200px] p-0 bg-gray-800 border-gray-700"
        align="start"
      >
        <div className="space-y-4 p-3">
          {Object.entries(groupedColors).map(([group, groupColors]) => (
            <div key={group} className="space-y-2">
              <div className="text-sm font-medium capitalize text-gray-400">
                {group}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {groupColors.map((color) => (
                  <button
                    key={color.id}
                    className={cn(
                      'relative h-8 w-8 rounded-full transition-all hover:scale-105',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800',
                      value === color.id &&
                        'ring-2 ring-gray-400 ring-offset-2 ring-offset-gray-800',
                    )}
                    style={{ backgroundColor: color.hex }}
                    onClick={() => handleColorSelect(color.id)}
                    type="button"
                    title={color.name}
                  >
                    <span className="sr-only">{color.name}</span>
                    {value === color.id && (
                      <Check
                        className="absolute inset-0 h-4 w-4 mx-auto my-auto text-white mix-blend-difference"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

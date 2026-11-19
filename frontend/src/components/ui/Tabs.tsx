'use client';
import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type TabItem = { id: string; label: ReactNode; count?: number };

type TabsProps = {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  children: ReactNode;
  className?: string;
};

/**
 * Pestañas accesibles (patrón WAI-ARIA): flechas, Inicio y Fin mueven el foco entre pestañas;
 * solo la activa está en el orden de tabulación.
 */
export function Tabs({ items, value, onChange, label, children, className }: TabsProps) {
  const baseId = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function onKeyDown(event: KeyboardEvent, index: number) {
    const last = items.length - 1;
    const target =
      event.key === 'ArrowRight'
        ? index === last
          ? 0
          : index + 1
        : event.key === 'ArrowLeft'
          ? index === 0
            ? last
            : index - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null;
    if (target === null) return;
    event.preventDefault();
    onChange(items[target].id);
    refs.current[target]?.focus();
  }

  return (
    <div className={className}>
      <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-line">
        {items.map((item, index) => {
          const selected = item.id === value;
          return (
            <button
              key={item.id}
              ref={(el) => {
                refs.current[index] = el;
              }}
              role="tab"
              type="button"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(item.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cn(
                '-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                selected ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-muted hover:text-ink',
              )}
            >
              {item.label}
              {item.count !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs',
                    selected ? 'bg-brand-50 text-brand-700' : 'bg-surface-sunken text-ink-muted',
                  )}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`${baseId}-panel`} aria-labelledby={`${baseId}-tab-${value}`} className="pt-6">
        {children}
      </div>
    </div>
  );
}

import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-sunken text-ink-soft ring-line-strong',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  success: 'bg-success-50 text-success-700 ring-success-600/25',
  warning: 'bg-warning-50 text-warning-700 ring-warning-600/25',
  danger: 'bg-danger-50 text-danger-700 ring-danger-600/25',
};

export function Badge({ tone = 'neutral', className, ...props }: ComponentProps<'span'> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

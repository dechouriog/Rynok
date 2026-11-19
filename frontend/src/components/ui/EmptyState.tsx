import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  tone?: 'neutral' | 'danger';
  className?: string;
};

/** Estado vacío o de error: explica qué pasa y ofrece el siguiente paso. */
export function EmptyState({ icon, title, description, action, tone = 'neutral', className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-card border border-dashed px-6 py-12 text-center',
        tone === 'danger' ? 'border-danger-600/30 bg-danger-50/50' : 'border-line-strong bg-surface-muted',
        className,
      )}
    >
      <div
        className={cn(
          'mb-4 flex h-12 w-12 items-center justify-center rounded-full [&>svg]:h-6 [&>svg]:w-6',
          tone === 'danger' ? 'bg-danger-50 text-danger-600' : 'bg-brand-50 text-brand-600',
        )}
        aria-hidden
      >
        {icon}
      </div>
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {description && <div className="mt-1 max-w-md text-sm text-ink-muted">{description}</div>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

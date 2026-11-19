'use client';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';
type ToastInput = { title: string; description?: ReactNode; tone?: ToastTone; duration?: number };
type ToastItem = ToastInput & { id: number; tone: ToastTone };

type ToastApi = {
  toast: (input: ToastInput) => number;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const ICONS = { success: CheckCircle2, error: XCircle, info: Info, warning: AlertTriangle } as const;
const TONES: Record<ToastTone, string> = {
  success: 'border-success-600/30 [&_svg.icon]:text-success-600',
  error: 'border-danger-600/30 [&_svg.icon]:text-danger-600',
  info: 'border-brand-200 [&_svg.icon]:text-brand-600',
  warning: 'border-warning-600/30 [&_svg.icon]:text-warning-600',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setItems((current) => current.filter((t) => t.id !== id)), []);

  const toast = useCallback(
    ({ tone = 'info', duration, ...input }: ToastInput) => {
      const id = nextId.current++;
      setItems((current) => [...current.slice(-3), { ...input, tone, id }]);
      // Los errores se quedan más tiempo: suelen requerir que la persona lea y actúe.
      const ms = duration ?? (tone === 'error' ? 9000 : 5000);
      if (ms > 0) setTimeout(() => dismiss(id), ms);
      return id;
    },
    [dismiss],
  );

  const api = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end"
      >
        {items.map((item) => {
          const Icon = ICONS[item.tone];
          return (
            <div
              key={item.id}
              role={item.tone === 'error' ? 'alert' : 'status'}
              className={cn(
                'pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-card border bg-surface p-4 shadow-raised',
                TONES[item.tone],
              )}
            >
              <Icon className="icon mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                {item.description && <div className="mt-0.5 break-words text-sm text-ink-soft">{item.description}</div>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="-m-1 rounded-control p-1 text-ink-muted hover:bg-surface-sunken hover:text-ink"
                aria-label="Cerrar notificación"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
}

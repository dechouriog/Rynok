'use client';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** Impide cerrar con Escape o clic fuera (por ejemplo, mientras se firma una transacción). */
  locked?: boolean;
  className?: string;
};

/**
 * Diálogo modal sobre <dialog> nativo: el navegador gestiona el foco atrapado, la capa superior
 * y la tecla Escape. Al cerrar, el foco vuelve al elemento que lo abrió.
 */
export function Modal({ open, onClose, title, description, children, footer, locked, className }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        if (!locked) onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current && !locked) onClose();
      }}
      className={cn(
        'm-auto w-[calc(100%-2rem)] max-w-lg rounded-card bg-surface p-0 text-ink shadow-overlay',
        'backdrop:bg-ink/50 backdrop:backdrop-blur-sm open:animate-slide-up',
        className,
      )}
    >
      {open && (
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id={titleId} className="text-lg font-semibold text-ink">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={locked}
              className="-m-1 rounded-control p-1 text-ink-muted hover:bg-surface-sunken hover:text-ink disabled:opacity-40"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          {description && (
            <div id={descriptionId} className="mt-2 text-sm text-ink-soft">
              {description}
            </div>
          )}
          {children && <div className="mt-4">{children}</div>}
          {footer && <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

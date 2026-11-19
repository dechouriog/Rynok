'use client';
import { useId, type ComponentProps, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

export const controlClasses =
  'block w-full rounded-control border border-line-strong bg-surface px-3 text-sm text-ink shadow-card ' +
  'placeholder:text-ink-muted transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 ' +
  'disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-ink-muted ' +
  'aria-[invalid=true]:border-danger-600 aria-[invalid=true]:focus:ring-danger-600/30';

type FieldProps = {
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  /** Oculta visualmente la etiqueta pero la mantiene para lectores de pantalla. */
  hideLabel?: boolean;
  icon?: ReactNode;
  className?: string;
  children: (props: {
    id: string;
    'aria-invalid'?: true;
    'aria-describedby'?: string;
    required?: boolean;
  }) => ReactNode;
};

/** Envoltorio accesible: etiqueta asociada, texto de ayuda y mensaje de error enlazados con aria-describedby. */
export function Field({ label, hint, error, required, hideLabel, icon, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={id}
        className={cn('flex items-center gap-1.5 text-sm font-medium text-ink', hideLabel && 'sr-only')}
      >
        {icon}
        {label}
        {required && (
          <span className="text-danger-600" aria-hidden>
            *
          </span>
        )}
      </label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy, required })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="flex items-center gap-1 text-xs font-medium text-danger-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden /> {error}
        </p>
      )}
    </div>
  );
}

type InputProps = ComponentProps<'input'> & Omit<FieldProps, 'children' | 'className'> & { fieldClassName?: string };

export function Input({
  label,
  hint,
  error,
  required,
  hideLabel,
  icon,
  fieldClassName,
  className,
  ...props
}: InputProps) {
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      hideLabel={hideLabel}
      icon={icon}
      className={fieldClassName}
    >
      {(a11y) => <input {...a11y} {...props} className={cn(controlClasses, 'h-11', className)} />}
    </Field>
  );
}

type TextareaProps = ComponentProps<'textarea'> &
  Omit<FieldProps, 'children' | 'className'> & { fieldClassName?: string };

export function Textarea({
  label,
  hint,
  error,
  required,
  hideLabel,
  icon,
  fieldClassName,
  className,
  ...props
}: TextareaProps) {
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      hideLabel={hideLabel}
      icon={icon}
      className={fieldClassName}
    >
      {(a11y) => <textarea rows={5} {...a11y} {...props} className={cn(controlClasses, 'py-2.5', className)} />}
    </Field>
  );
}

type SelectProps = ComponentProps<'select'> & Omit<FieldProps, 'children' | 'className'> & { fieldClassName?: string };

export function Select({
  label,
  hint,
  error,
  required,
  hideLabel,
  icon,
  fieldClassName,
  className,
  children,
  ...props
}: SelectProps) {
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      hideLabel={hideLabel}
      icon={icon}
      className={fieldClassName}
    >
      {(a11y) => (
        <select {...a11y} {...props} className={cn(controlClasses, 'h-11 pr-8', className)}>
          {children}
        </select>
      )}
    </Field>
  );
}

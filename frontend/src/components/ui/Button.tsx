import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-control font-semibold ' +
  'transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:pointer-events-none aria-disabled:opacity-60';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white shadow-card hover:bg-brand-700 active:bg-brand-800',
  secondary: 'bg-ink text-white shadow-card hover:bg-ink-soft',
  outline: 'border border-line-strong bg-surface text-ink hover:bg-surface-muted',
  ghost: 'text-ink-soft hover:bg-surface-sunken hover:text-ink',
  danger: 'bg-danger-600 text-white shadow-card hover:bg-danger-700',
  success: 'bg-success-600 text-white shadow-card hover:bg-success-700',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<'button'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Muestra un spinner, deshabilita el botón y anuncia el estado a lectores de pantalla. */
  loading?: boolean;
  loadingText?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  icon,
  fullWidth,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses(variant, size, cn(fullWidth && 'w-full', className))}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  fullWidth?: boolean;
};

/** Enlace con apariencia de botón (navegación, no acciones). */
export function ButtonLink({
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, size, cn(fullWidth && 'w-full', className))} {...props}>
      {icon}
      {children}
    </Link>
  );
}

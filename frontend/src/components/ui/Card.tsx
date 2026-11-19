import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('rounded-card border border-line bg-surface shadow-card', className)} {...props} />;
}

export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('border-b border-line px-5 py-4', className)} {...props} />;
}

export function CardBody({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('p-5', className)} {...props} />;
}

import { CheckCircle2, Clock, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { EscrowStatus, PropertyStatus } from '@/lib/api';

/** Estado comercial de la propiedad, coherente con el contrato. */
export function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  if (status === 'SOLD') {
    return (
      <Badge tone="neutral">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Vendida
      </Badge>
    );
  }
  if (status === 'IN_ESCROW') {
    return (
      <Badge tone="warning">
        <Clock className="h-3.5 w-3.5" aria-hidden /> En escrow
      </Badge>
    );
  }
  return (
    <Badge tone="brand">
      <Tag className="h-3.5 w-3.5" aria-hidden /> Disponible
    </Badge>
  );
}

const ESCROW_LABELS: Record<EscrowStatus, { label: string; tone: 'warning' | 'success' | 'neutral' }> = {
  AWAITING_DELIVERY: { label: 'Fondos en escrow', tone: 'warning' },
  COMPLETE: { label: 'Completada', tone: 'success' },
  REFUNDED: { label: 'Reembolsada', tone: 'neutral' },
};

export function EscrowStatusBadge({ status }: { status: EscrowStatus }) {
  const { label, tone } = ESCROW_LABELS[status];
  return <Badge tone={tone}>{label}</Badge>;
}

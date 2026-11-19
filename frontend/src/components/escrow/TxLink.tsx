import { ExternalLink } from 'lucide-react';
import { explorerTxUrl } from '@/lib/blockchain';
import { shortenAddress } from '@/lib/format';

/** Hash de transacción, enlazado al explorador cuando la red lo tiene. */
export function TxLink({ hash, label }: { hash: string; label?: string }) {
  const url = explorerTxUrl(hash);
  const text = label ?? shortenAddress(hash);
  if (!url)
    return (
      <span className="font-mono text-xs text-ink-muted" title={hash}>
        {text}
      </span>
    );
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-mono text-xs text-brand-600 hover:underline"
      title={hash}
    >
      {text} <ExternalLink className="h-3 w-3" aria-hidden />
      <span className="sr-only">(abre el explorador en otra pestaña)</span>
    </a>
  );
}

/** 0x1234…abcd */
export function shortenAddress(address: string): string {
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
}

/** "2.5" → "2,5 ETH" con hasta 6 decimales y separadores en español. */
export function formatEth(value: string | number): string {
  const number = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(number)) return `${value} ETH`;
  return `${number.toLocaleString('es-CO', { maximumFractionDigits: 6 })} ETH`;
}

const dateFormatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
const shortDateFormatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' });

export function formatDate(value: string | Date, withTime = true): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return (withTime ? dateFormatter : shortDateFormatter).format(date);
}

/** "en 3 días", "hace 2 horas"… */
export function formatRelative(value: string | Date, now: Date = new Date()): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(seconds, 'second');
}

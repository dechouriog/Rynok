/**
 * Sesión (JWT + wallet) persistida en sessionStorage y expuesta como store externo para
 * `useSyncExternalStore`: el servidor siempre ve "sin sesión" y el cliente se sincroniza tras
 * hidratar, sin desajustes ni setState dentro de efectos.
 */
export type Session = { token: string; address: string };

const KEY = 'rynok_session';
const listeners = new Set<() => void>();
let cache: Session | null | undefined;

/** Momento de expiración (ms) del JWT, o null si no se puede leer. */
export function tokenExpiresAt(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
    return typeof json.exp === 'number' ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, now = Date.now()): boolean {
  const exp = tokenExpiresAt(token);
  return exp !== null && exp <= now;
}

function read(): Session | null {
  if (cache !== undefined) return cache;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Session) : null;
    cache = parsed && parsed.token && parsed.address && !isTokenExpired(parsed.token) ? parsed : null;
    if (!cache && raw) window.sessionStorage.removeItem(KEY);
  } catch {
    cache = null;
  }
  return cache;
}

export const sessionStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: read,
  getServerSnapshot: (): Session | null => null,
  set(session: Session | null) {
    cache = session;
    try {
      if (session) window.sessionStorage.setItem(KEY, JSON.stringify(session));
      else window.sessionStorage.removeItem(KEY);
    } catch {
      // sessionStorage puede no estar disponible (modo privado estricto): la sesión vive en memoria.
    }
    listeners.forEach((listener) => listener());
  },
  /** Solo para pruebas. */
  reset() {
    cache = undefined;
  },
};

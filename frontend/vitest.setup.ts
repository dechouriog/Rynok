import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { sessionStore } from '@/lib/session-store';

// jsdom no implementa showModal/close de <dialog>: se simula el atributo `open`.
if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
  };
}

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
  sessionStore.reset();
  delete window.ethereum;
  vi.useRealTimers();
});

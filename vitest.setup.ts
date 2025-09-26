import '@testing-library/jest-dom';

declare global {
  // Vitest with jsdom doesn't provide crypto.randomUUID in older environments
  interface Crypto {
    randomUUID?: () => string;
  }
}

if (typeof globalThis.crypto !== 'undefined' && !globalThis.crypto.randomUUID) {
  globalThis.crypto.randomUUID = () => `test-${Math.random().toString(16).slice(2)}`;
}

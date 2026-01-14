// Polyfill para crypto - deve ser importado ANTES de qualquer outro módulo
import { webcrypto } from 'crypto';

// Garante que crypto está disponível globalmente
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = webcrypto as any;
}

if (typeof (global as any).crypto === 'undefined') {
  (global as any).crypto = webcrypto;
}


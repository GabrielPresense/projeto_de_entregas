// Polyfill para crypto - executado antes de qualquer coisa
const { webcrypto } = require('crypto');

// Garante que crypto está disponível globalmente
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = webcrypto;
}

// Também garante que está disponível em global (compatibilidade)
if (typeof global.crypto === 'undefined') {
  global.crypto = webcrypto;
}


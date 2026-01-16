// URLs configuráveis para diferentes ambientes
const API_URLS = {
  development: 'http://192.168.0.7:3000', // Para desenvolvimento local
  production: 'https://perceptive-charisma-production-61fc.up.railway.app',
};

// Verifica se está em produção de forma segura
// __DEV__ pode não estar definido durante o build
const isProduction = typeof __DEV__ !== 'undefined' ? __DEV__ === false : process.env.NODE_ENV === 'production';

export const API_CONFIG = {
  BASE_URL: isProduction ? API_URLS.production : API_URLS.development,
  
  TIMEOUT: 10000,
};


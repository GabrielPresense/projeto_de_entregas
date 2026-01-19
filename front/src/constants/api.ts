// URLs configuráveis para diferentes ambientes
const API_URLS = {
  development: 'http://192.168.0.7:3000', // Para desenvolvimento local
  production: 'https://perceptive-charisma-production-61fc.up.railway.app',
};

function getIsProduction(): boolean {
  if (typeof __DEV__ !== 'undefined') {
    return __DEV__ === false;
  }
  
  // Fallback para process.env.NODE_ENV (pode não estar disponível durante bundling)
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) {
    return process.env.NODE_ENV === 'production';
  }
  
  // Se nada estiver disponível, assume desenvolvimento
  return false;
}

const isProduction = getIsProduction();

export const API_CONFIG = {
  BASE_URL: isProduction ? API_URLS.production : API_URLS.development,
  
  TIMEOUT: 10000,
};


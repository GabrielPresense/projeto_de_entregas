// Configurações da API
// IMPORTANTE: Ajuste a URL conforme onde está testando:
// - Emulador Android: use 'http://10.0.2.2:3000'
// - Dispositivo físico: use o IP da sua máquina, ex: 'http://192.168.1.100:3000'
// - iOS Simulator ou Web: 'http://localhost:3000' funciona

export const API_CONFIG = {
  // URL do backend
  // Mude aqui conforme onde está testando:
  BASE_URL: 'http://192.168.0.7:3000', // Para emulador Android
  // BASE_URL: 'http://localhost:3000', // Para iOS Simulator ou Web
  // BASE_URL: 'http://192.168.1.100:3000', // Para dispositivo físico (troque pelo seu IP)
  
  // Tempo máximo de espera (10 segundos)
  TIMEOUT: 10000,
};

// Para descobrir seu IP (Windows):
// 1. Abra o CMD/PowerShell
// 2. Digite: ipconfig
// 3. Procure por "IPv4" - exemplo: 192.168.1.100
// 4. Use esse IP na BASE_URL acima


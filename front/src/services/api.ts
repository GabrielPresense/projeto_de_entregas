// cinfiguração de como o app vai conversar com o backend
import { API_CONFIG } from '../constants/api';

// Pega a URL do backend que configurei no outro arquivo
const BASE_URL = API_CONFIG.BASE_URL;

// Tipo pra configurar as requisições
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
}

// Função principal que faz as requisições
async function request<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { method = 'GET', headers = {}, body } = config;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Junta a URL base com o endpoint que passei
  const url = `${BASE_URL}${endpoint}`;

  // Monta a configuração da requisição
  const requestConfig: RequestInit = {
    method,
    headers: defaultHeaders,
  };

  // Se tiver body (dados pra enviar), converte pra JSON
  if (body) {
    requestConfig.body = JSON.stringify(body);
  }

  try {
    // Faz a requisição de verdade
    const response = await fetch(url, requestConfig);

    // Se deu erro, trata aqui
    if (!response.ok) {
      // Tenta pegar a mensagem de erro que o backend mandou
      let errorMessage = 'Erro na requisição';
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.message ||
          errorData.error ||
          `Erro ${response.status}: ${response.statusText}`;
      } catch {
        // Se não conseguir ler o erro, usa uma mensagem padrão
        errorMessage = `Erro ${response.status}: ${response.statusText}`;
      }

      throw new Error(errorMessage);
    }

    // Se deu certo, tenta converter a resposta pra JSON
    // Se não tiver conteúdo, retorna vazio mesmo
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return data;
    }

    // Se a resposta está vazia mas o status é OK, retorna vazio
    return {} as T;
  } catch (error) {
    // Se der algum erro de rede ou qualquer outra coisa
    if (error instanceof Error) {
      // Melhora mensagens de erro de rede
      if (
        error.message.includes('Network') ||
        error.message.includes('fetch') ||
        error.message.includes('Failed to fetch')
      ) {
        throw new Error(
          `Não foi possível conectar ao servidor em ${BASE_URL}. Verifique se o backend está rodando.`,
        );
      }
      throw error;
    }
    throw new Error('Erro desconhecido na requisição');
  }
}

// Funções prontas
export const api = {
  get: <T>(endpoint: string, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'GET', headers }),

  post: <T>(endpoint: string, data?: any, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'POST', body: data, headers }),

  put: <T>(endpoint: string, data?: any, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'PUT', body: data, headers }),

  patch: <T>(endpoint: string, data?: any, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'PATCH', body: data, headers }),

  delete: <T>(endpoint: string, data?: any, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'DELETE', body: data, headers }),
};

// Exporta a URL caso eu precise em outro lugar
export const API_BASE_URL = BASE_URL;

// Exporta a função request caso eu precise fazer algo mais específico
export default api;


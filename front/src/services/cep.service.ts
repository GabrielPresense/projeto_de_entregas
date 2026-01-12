// Service para buscar endereço por CEP usando ViaCEP
interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

interface EnderecoCompleto {
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

// Busca endereço completo por CEP
export async function buscarEnderecoPorCEP(cep: string): Promise<EnderecoCompleto | null> {
  try {
    // Remove formatação do CEP (remove hífen e espaços)
    const cepLimpo = cep.replace(/[-\s]/g, '');
    
    // Valida se tem 8 dígitos
    if (cepLimpo.length !== 8 || !/^\d+$/.test(cepLimpo)) {
      return null;
    }

    const url = `https://viacep.com.br/ws/${cepLimpo}/json/`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'DeliveryApp/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`Erro ao buscar CEP: ${response.status}`);
        return null;
      }

      const data: ViaCEPResponse = await response.json();

      // Verifica se o CEP foi encontrado
      if (data.erro || !data.logradouro) {
        console.warn(`CEP não encontrado: ${cep}`);
        return null;
      }

      return {
        logradouro: data.logradouro,
        bairro: data.bairro || '',
        cidade: data.localidade,
        estado: data.uf,
        cep: data.cep,
      };
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.warn('Timeout ao buscar CEP (verifique sua conexão)');
      } else {
        console.error('Erro ao buscar CEP:', fetchError);
      }
      return null;
    }
  } catch (error) {
    console.error('Erro ao buscar endereço por CEP:', error);
    return null;
  }
}

// Formata CEP (adiciona hífen)
export function formatarCEP(cep: string): string {
  const cepLimpo = cep.replace(/[-\s]/g, '');
  if (cepLimpo.length <= 5) {
    return cepLimpo;
  }
  return `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5, 8)}`;
}

// Valida se o CEP tem formato válido
export function validarCEP(cep: string): boolean {
  const cepLimpo = cep.replace(/[-\s]/g, '');
  return cepLimpo.length === 8 && /^\d+$/.test(cepLimpo);
}


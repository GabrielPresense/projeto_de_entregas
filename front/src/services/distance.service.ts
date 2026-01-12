// Service para calcular distância e valor do frete usando OpenStreetMap
import { NOMINATIM_API, OSRM_API } from '../constants/openStreetMap';

interface Coordinates {
  lat: number;
  lng: number;
}

// Resposta da API Nominatim (geocodificação)
interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
}

// Resposta da API OSRM (cálculo de rotas)
interface OSRMResponse {
  code: string;
  routes: Array<{
    distance: number; // Distância em metros
    duration: number; // Duração em segundos
    geometry: string;
  }>;
}

// Calcula a distância entre duas coordenadas usando a fórmula de Haversine
function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distância em km
  
  return Math.round(distance * 100) / 100; // Arredonda para 2 casas decimais
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Normaliza endereço para melhorar resultados da busca
function normalizeAddress(address: string): string {
  let normalized = address.trim();
  
  // Remove espaços múltiplos
  normalized = normalized.replace(/\s+/g, ' ');
  
  // Remove duplicações de vírgulas
  normalized = normalized.replace(/,\s*,+/g, ',');
  
  // Remove duplicações de "Brasil" e contexto geográfico no final
  normalized = normalized.replace(/,\s*(Brasil|Brasil,?\s*[A-Z][a-záàâãéèêíïóôõöúçñ]+(,\s*[A-Z][a-záàâãéèêíïóôõöúçñ]+)*)$/gi, '');
  normalized = normalized.trim();
  
  // Corrige formatação: número seguido de estado sem vírgula (ex: "07 pr" -> "07, pr")
  normalized = normalized.replace(/(\d+)\s+([a-z]{2})\b/gi, '$1, $2');
  
  // Normaliza abreviações comuns
  normalized = normalized.replace(/\b(r\.|rua|av\.|avenida|str\.|street)\b/gi, (match) => {
    const map: Record<string, string> = {
      'r.': 'Rua',
      'rua': 'Rua',
      'av.': 'Avenida',
      'avenida': 'Avenida',
      'str.': 'Rua',
      'street': 'Rua',
    };
    return map[match.toLowerCase()] || match;
  });
  
  return normalized;
}

// Converte endereço em coordenadas usando Nominatim (OpenStreetMap)
async function geocodeAddress(address: string, retryCount = 0): Promise<Coordinates | null> {
  const MAX_RETRIES = 3; // Aumentado para 3 tentativas
  
  try {
    // Se o endereço contém coordenadas diretamente, usa elas
    const coordMatch = address.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
    if (coordMatch) {
      return {
        lat: parseFloat(coordMatch[1]),
        lng: parseFloat(coordMatch[2]),
      };
    }

    // Normaliza o endereço primeiro
    let searchQuery = normalizeAddress(address);
    
    const lowerQuery = searchQuery.toLowerCase();
    
    // Lista de estados brasileiros (siglas e nomes completos)
    const estadosSiglas = ['ac', 'al', 'ap', 'am', 'ba', 'ce', 'df', 'es', 'go', 'ma', 'mt', 'ms', 'mg', 'pa', 'pb', 'pr', 'pe', 'pi', 'rj', 'rn', 'rs', 'ro', 'rr', 'sc', 'sp', 'se', 'to'];
    const estadosNomes = ['acre', 'alagoas', 'amapá', 'amazonas', 'bahia', 'ceará', 'ceara', 'distrito federal', 'espírito santo', 'espirito santo', 'goiás', 'goias', 'maranhão', 'maranhao', 'mato grosso', 'mato grosso do sul', 'minas gerais', 'pará', 'para', 'paraíba', 'parana', 'paraná', 'pernambuco', 'piauí', 'piaui', 'rio de janeiro', 'rio grande do norte', 'rio grande do sul', 'rondônia', 'rondonia', 'roraima', 'santa catarina', 'são paulo', 'sao paulo', 'sergipe', 'tocantins'];
    
    // Detecta estado no endereço
    const hasEstado = estadosSiglas.some(sigla => new RegExp(`\\b${sigla}\\b`, 'i').test(searchQuery)) ||
                      estadosNomes.some(nome => lowerQuery.includes(nome));
    const hasBrasil = lowerQuery.includes('brasil');
    
    // Adiciona contexto geográfico se necessário
    if (hasEstado && hasBrasil) {
      // Já tem estado e país, não adiciona nada
    } else if (hasEstado && !hasBrasil) {
      // Tem estado mas não tem país - adiciona apenas Brasil
      searchQuery = `${searchQuery}, Brasil`;
    } else if (!hasEstado && hasBrasil) {
      // Tem país mas não tem estado - deixa como está
    } else {
      // Não tem nem estado nem país - adiciona apenas Brasil
      searchQuery = `${searchQuery}, Brasil`;
    }
    
    // Log para debug
    console.log(`[Geocodificação] Buscando: "${searchQuery}" (tentativa ${retryCount + 1})`);
    
    const encodedAddress = encodeURIComponent(searchQuery);
    // Usa viewbox para limitar busca ao Brasil e aumenta o limit
    const url = `${NOMINATIM_API}?q=${encodedAddress}&format=json&limit=5&addressdetails=1&countrycodes=br&accept-language=pt-BR&viewbox=-75.0,-35.0,-30.0,5.0&bounded=0`;

    // Cria um AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'DeliveryApp/1.0', // Nominatim requer User-Agent
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Se for erro 429 (rate limit), aguarda antes de tentar novamente
        if (response.status === 429 && retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
          return geocodeAddress(address, retryCount + 1);
        }
        console.warn('Erro na geocodificação:', response.status);
        return null;
      }

      const data: NominatimResponse[] = await response.json();

      if (data && data.length > 0) {
        // Log para debug
        console.log(`Geocodificação bem-sucedida para: ${searchQuery}`);
        console.log(`Resultado: ${data[0].display_name}`);
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }

      // Se não encontrou resultado, tenta variações do endereço
      if (retryCount < MAX_RETRIES) {
        console.warn(`[Geocodificação] Nenhum resultado para: "${searchQuery}", tentando variações...`);
        
        const variations: string[] = [];
        const parts = searchQuery.split(',').map(p => p.trim()).filter(p => p);
        
        // Mapa de siglas de estado para nomes completos
        const stateMap: Record<string, string> = {
          'pr': 'Paraná', 'sp': 'São Paulo', 'rj': 'Rio de Janeiro', 'mg': 'Minas Gerais',
          'rs': 'Rio Grande do Sul', 'sc': 'Santa Catarina', 'ba': 'Bahia', 'go': 'Goiás',
          'pe': 'Pernambuco', 'ce': 'Ceará', 'pa': 'Pará', 'ma': 'Maranhão', 'pb': 'Paraíba',
          'pi': 'Piauí', 'al': 'Alagoas', 'se': 'Sergipe', 'rn': 'Rio Grande do Norte',
          'to': 'Tocantins', 'mt': 'Mato Grosso', 'ms': 'Mato Grosso do Sul', 'ac': 'Acre',
          'ap': 'Amapá', 'am': 'Amazonas', 'ro': 'Rondônia', 'rr': 'Roraima', 'df': 'Distrito Federal',
          'es': 'Espírito Santo'
        };
        
        if (parts.length > 0) {
          const firstPart = parts[0];
          const lastPart = parts[parts.length - 1].toLowerCase().replace(/\s*brasil\s*/gi, '').trim();
          
          // 1. Remove número da rua (suporta vários formatos: "123", "123a", "nº 123")
          const withoutNumber = firstPart.replace(/\s+\d+[a-z]?\s*$/, '').replace(/\s+n[º°]?\s*\d+[a-z]?\s*$/i, '').trim();
          if (withoutNumber !== firstPart && withoutNumber.length > 5) {
            variations.push([withoutNumber, ...parts.slice(1)].join(', '));
          }
          
          // 2. Expande sigla de estado
          if (stateMap[lastPart]) {
            const expanded = searchQuery.replace(new RegExp(`\\b${lastPart}\\b`, 'gi'), stateMap[lastPart]);
            variations.push(expanded);
          }
          
          // 3. Rua sem número + estado expandido
          if (withoutNumber !== firstPart && stateMap[lastPart]) {
            const expandedState = stateMap[lastPart];
            const restParts = parts.slice(1);
            restParts[restParts.length - 1] = restParts[restParts.length - 1].replace(new RegExp(`\\b${lastPart}\\b`, 'gi'), expandedState);
            variations.push([withoutNumber, ...restParts].join(', '));
          }
          
          // 4. Apenas rua + cidade/estado (remove partes intermediárias)
          if (parts.length >= 3) {
            variations.push(`${parts[0]}, ${parts.slice(-2).join(', ')}`);
          }
          
          // 5. Remove palavras comuns que podem confundir (ex: "moço", "filho", "júnior")
          const cleanedFirst = firstPart.replace(/\b(moço|moço filho|filho|júnior|junior|jr)\b/gi, '').trim().replace(/\s+/g, ' ');
          if (cleanedFirst !== firstPart && cleanedFirst.length > 5) {
            variations.push([cleanedFirst, ...parts.slice(1)].join(', '));
          }
          
          // 6. Tenta sem o último elemento (pode ser redundante)
          if (parts.length > 2) {
            variations.push(parts.slice(0, -1).join(', '));
          }
        }
        
        // Remove duplicatas e tenta cada variação
        const uniqueVariations = Array.from(new Set(variations));
        for (const variation of uniqueVariations) {
          if (variation && variation !== searchQuery && variation.length > 5) {
            console.log(`[Geocodificação] Tentando variação: "${variation}"`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            const result = await geocodeAddress(variation, retryCount + 1);
            if (result) {
              console.log(`[Geocodificação] ✅ Sucesso com variação: "${variation}"`);
              return result;
            }
          }
        }
      }

      console.warn(`[Geocodificação] ❌ Falha após ${retryCount + 1} tentativa(s): "${address}"`);
      return null;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Se for erro de abort (timeout) ou rede, tenta novamente
      if (
        (fetchError.name === 'AbortError' || 
         fetchError.message?.includes('Network') ||
         fetchError.message?.includes('fetch')) &&
        retryCount < MAX_RETRIES
      ) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return geocodeAddress(address, retryCount + 1);
      }
      
      throw fetchError;
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn('Timeout ao geocodificar endereço (verifique sua conexão)');
    } else if (error.message?.includes('Network') || error.message?.includes('fetch')) {
      console.warn('Erro de rede ao geocodificar endereço (verifique sua conexão com a internet)');
    } else {
      console.error('Erro ao geocodificar endereço:', error);
    }
    return null;
  }
}

// Calcula o valor do frete baseado na distância
// Taxa fixa: R$ 5,00 + R$ 2,00 por km
export function calculateFreightValue(distanceKm: number): number {
  const fixedRate = 5.0;
  const ratePerKm = 2.0;
  const total = fixedRate + (distanceKm * ratePerKm);
  return Math.round(total * 100) / 100; // Arredonda para 2 casas decimais
}

// Calcula a distância de rota entre dois endereços usando OSRM (OpenStreetMap)
// SEMPRE usa distância de rota real, nunca linha reta
export async function estimateDistance(
  address1: string,
  address2: string
): Promise<{ distance: number; value: number } | null> {
  try {
    // Primeiro, obtém as coordenadas dos endereços
    const coord1 = await geocodeAddress(address1);
    const coord2 = await geocodeAddress(address2);

    if (!coord1 || !coord2) {
      console.warn('Não foi possível obter coordenadas dos endereços');
      return null; // Retorna null em vez de usar estimativa
    }

    // SEMPRE usa OSRM para calcular a distância de rota real
    // Formato: lng,lat (OSRM usa longitude primeiro!)
    const coordinates = `${coord1.lng},${coord1.lat};${coord2.lng},${coord2.lat}`;
    // Usa perfil de carro (driving) que é mais adequado para entregas
    // URL correta: /route/v1/driving/{coordinates}
    const url = `${OSRM_API}/driving/${coordinates}?overview=false&alternatives=false&steps=false`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DeliveryApp/1.0',
      },
    });

    if (!response.ok) {
      // Tenta obter mais detalhes do erro
      let errorDetails = '';
      try {
        const errorData = await response.text();
        errorDetails = errorData;
      } catch (e) {
        // Ignora erro ao ler resposta
      }
      
      console.warn(`OSRM API retornou erro: ${response.status}`, errorDetails);
      
      // Se for erro 400, pode ser problema com coordenadas inválidas
      if (response.status === 400) {
        console.warn('Coordenadas inválidas ou fora do alcance do OSRM');
        return null;
      }
      
      // Tenta novamente apenas se não for erro 400
      if (response.status !== 400) {
        return await retryOSRMRequest(coord1, coord2);
      }
      
      return null;
    }

    const data: OSRMResponse = await response.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      // Converte metros para quilômetros
      const distanceKm = data.routes[0].distance / 1000;
      const value = calculateFreightValue(distanceKm);
      console.log(`Distância de rota calculada: ${distanceKm.toFixed(2)} km`);
      return { distance: Math.round(distanceKm * 10) / 10, value }; // Arredonda para 1 casa decimal
    } else {
      console.warn('OSRM não retornou rota válida:', data.code);
      // Tenta novamente
      return await retryOSRMRequest(coord1, coord2);
    }
  } catch (error) {
    console.error('Erro ao calcular distância de rota:', error);
    
    // Tenta novamente uma vez
    try {
      const coord1 = await geocodeAddress(address1);
      const coord2 = await geocodeAddress(address2);
      
      if (coord1 && coord2) {
        return await retryOSRMRequest(coord1, coord2);
      }
    } catch (e) {
      console.error('Erro ao tentar novamente:', e);
    }
    
    // Se tudo falhar, retorna null - não usa linha reta
    console.error('Não foi possível calcular distância de rota. Tente novamente.');
    return null;
  }
}

// Função auxiliar para tentar novamente a requisição OSRM
async function retryOSRMRequest(
  coord1: Coordinates,
  coord2: Coordinates
): Promise<{ distance: number; value: number } | null> {
  try {
    const coordinates = `${coord1.lng},${coord1.lat};${coord2.lng},${coord2.lat}`;
    const url = `${OSRM_API}/driving/${coordinates}?overview=false&alternatives=false&steps=false`;

    // Aguarda um pouco antes de tentar novamente
    await new Promise(resolve => setTimeout(resolve, 500));

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DeliveryApp/1.0',
      },
    });

    if (response.ok) {
      const data: OSRMResponse = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const distanceKm = data.routes[0].distance / 1000;
        const value = calculateFreightValue(distanceKm);
        console.log(`Distância de rota calculada (retry): ${distanceKm.toFixed(2)} km`);
        return { distance: Math.round(distanceKm * 10) / 10, value };
      }
    }
  } catch (error) {
    console.error('Erro ao tentar novamente OSRM:', error);
  }

  return null;
}

// Estimativa simples baseada no tamanho dos endereços
// Esta é uma função temporária - em produção, use uma API de geocodificação
function estimateDistanceFromAddresses(address1: string, address2: string): number {
  // Estimativa muito básica: assume uma distância média de 5km
  // Em produção, isso deve ser substituído por uma chamada real à API
  const baseDistance = 5.0;
  
  // Se os endereços são muito diferentes, aumenta a estimativa
  const similarity = calculateStringSimilarity(
    address1.toLowerCase(),
    address2.toLowerCase()
  );
  
  // Se são muito diferentes (bairros diferentes), aumenta a distância
  if (similarity < 0.3) {
    return baseDistance * 2; // ~10km
  } else if (similarity < 0.6) {
    return baseDistance * 1.5; // ~7.5km
  }
  
  return baseDistance; // ~5km
}

// Calcula similaridade entre duas strings (método simples)
function calculateStringSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  
  let matches = 0;
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2 && word1.length > 2) {
        matches++;
        break;
      }
    }
  }
  
  return matches / Math.max(words1.length, words2.length);
}

// Formata o valor em reais
export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}


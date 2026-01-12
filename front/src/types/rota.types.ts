// Tipos relacionados a Rotas

// Status possíveis de uma rota
export enum StatusRota {
  PLANEJADA = 'planejada',
  EM_ANDAMENTO = 'em_andamento',
  CONCLUIDA = 'concluida',
  CANCELADA = 'cancelada',
}

// Tipo completo de uma Rota
export interface Rota {
  id: number;
  nome: string;
  descricao: string;
  status: StatusRota;
  distancia: string;               // Formato: "15.5" (em km, decimal como string)
  tempoEstimado: number;           // Tempo estimado em minutos
  veiculo: {
    id: number;
    placa: string;                  // Formato: "ABC-1234"
    modelo: string;
    marca: string;
    tipo?: string;
    disponivel?: boolean;
  };
  pedidos?: Array<{
    id: number;
    descricao: string;
    enderecoDestino: string;
    enderecoOrigem?: string;
    status: string;
    valor?: string;
  }>;
  createdAt: string;               // Formato ISO: "2026-01-15T10:30:00.000Z"
  startedAt?: string;              // Formato ISO: "2026-01-15T10:30:00.000Z"
  completedAt?: string;           // Formato ISO: "2026-01-15T10:30:00.000Z"
}

// Para criar uma nova rota
export interface CreateRotaDto {
  nome: string;                    // Obrigatório
  descricao: string;               // Obrigatório
  status?: StatusRota;            // Opcional, default: PLANEJADA
  distancia: string;              // Obrigatório, formato: "15.5" (em km)
  tempoEstimado: number;          // Obrigatório, tempo em minutos (número positivo)
  veiculoId: number;              // Obrigatório, ID do veículo atribuído
}

// Para atualizar uma rota
export interface UpdateRotaDto {
  nome?: string;
  descricao?: string;
  status?: StatusRota;
  distancia?: string;             // Formato: "15.5" (em km)
  tempoEstimado?: number;         // Tempo em minutos (número positivo)
  veiculoId?: number;             // ID do veículo (pode trocar o veículo)
}


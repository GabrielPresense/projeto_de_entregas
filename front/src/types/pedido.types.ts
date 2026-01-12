// Tipos relacionados a Pedidos

// Status de pedido
export enum StatusPedido {
  PENDENTE = 'pendente',
  CONFIRMADO = 'confirmado',
  EM_PREPARACAO = 'em_preparacao',
  PRONTO_PARA_ENTREGA = 'pronto_para_entrega',
  EM_TRANSITO = 'em_transito',
  ENTREGUE = 'entregue',
  CANCELADO = 'cancelado',
}

// Tipo completo de um Pedido
export interface Pedido {
  id: number;
  descricao: string;
  enderecoOrigem: string;
  enderecoDestino: string;
  valor: string;
  status: StatusPedido;
  // Coordenadas vêm do banco como string (tipo decimal)
  // Use parseFloat() para converter para number quando necessário
  latitudeAtual?: string;  // Formato: "-23.123456" (decimal do banco)
  longitudeAtual?: string; // Formato: "-51.123456" (decimal do banco)
  entregador?: {
    id: number;
    nome: string;
    cpf?: string;           // CPF do entregador
    telefone?: string;      // Formato: "(XX) XXXXX-XXXX"
    email?: string;         // Formato válido de email
  };
  rota?: {
    id: number;
    nome: string;
    descricao?: string;
    status?: string;
    distancia?: string;
    tempoEstimado?: number;
  };
  pagamento?: {
    id: number;
    valor: string;
    metodoPagamento: string;
    status: string;
    transacaoId?: string;
    qrCode?: string;
    qrCodeBase64?: string;
  };
  createdAt: string;       // Formato ISO: "2026-01-15T10:30:00.000Z"
  updatedAt?: string;      // Formato ISO: "2026-01-15T10:30:00.000Z"
}

// Para criar um novo pedido
export interface CreatePedidoDto {
  descricao: string;
  enderecoOrigem: string;
  enderecoDestino: string;
  valor: string;
  status?: StatusPedido;
  entregadorId?: number;
  rotaId?: number;
}

// Para atualizar um pedido
export interface UpdatePedidoDto {
  descricao?: string;
  enderecoOrigem?: string;
  enderecoDestino?: string;
  valor?: string;
  status?: StatusPedido;
  entregadorId?: number;
  rotaId?: number;
}

// Para atualizar localização do pedido
// Nota: Recebe number (mais preciso para cálculos)
// O backend converte para string (decimal) para armazenar no banco
export interface UpdateLocationDto {
  latitude: number;   // Formato: -23.123456 (número decimal)
  longitude: number;  // Formato: -51.123456 (número decimal)
}


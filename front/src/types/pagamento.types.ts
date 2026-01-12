// Tipos relacionados a Pagamentos

// Status possíveis de um pagamento
export enum StatusPagamento {
  PENDENTE = 'pendente',
  PROCESSANDO = 'processando',
  APROVADO = 'aprovado',
  RECUSADO = 'recusado',
  REEMBOLSADO = 'reembolsado',
}

// Métodos de pagamento disponíveis
export enum MetodoPagamento {
  CARTAO_CREDITO = 'cartao_credito',
  CARTAO_DEBITO = 'cartao_debito',
  PIX = 'pix',
  BOLETO = 'boleto',
}

// Tipo completo de um Pagamento
export interface Pagamento {
  id: number;
  valor: string;                   // Formato: "50.00" (decimal como string)
  metodoPagamento: MetodoPagamento;
  status: StatusPagamento;
  transacaoId?: string;            // ID da transação no gateway (Mercado Pago)
  qrCode?: string;                 // QR Code PIX em formato texto (EMV)
  qrCodeBase64?: string;           // QR Code PIX em formato base64 (imagem)
  ticketUrl?: string;              // URL do boleto (se método for boleto)
  pedido: {
    id: number;
    descricao: string;
    valor: string;
    status?: string;
  };
  createdAt: string;               // Formato ISO: "2026-01-15T10:30:00.000Z"
  processedAt?: string;            // Formato ISO: "2026-01-15T10:30:00.000Z"
}

// Para criar um novo pagamento
export interface CreatePagamentoDto {
  valor: string;                   // Formato: "50.00" (decimal como string)
  metodoPagamento: MetodoPagamento; // Método escolhido (PIX, cartão, etc)
  status?: StatusPagamento;        // Opcional, default: PENDENTE
  pedidoId: number;                // ID do pedido associado (obrigatório)
  transacaoId?: string;            // ID da transação (gerado pelo gateway)
}

// Para atualizar um pagamento
// Usado principalmente para atualizar status e adicionar QR Code após processamento
export interface UpdatePagamentoDto {
  valor?: string;                  // Formato: "50.00"
  metodoPagamento?: MetodoPagamento;
  status?: StatusPagamento;        // Usado para marcar como APROVADO, RECUSADO, etc
  transacaoId?: string;            // ID da transação do gateway
  qrCode?: string;                // QR Code PIX em formato texto (gerado pelo gateway)
  qrCodeBase64?: string;          // QR Code PIX em formato base64 (gerado pelo gateway)
  ticketUrl?: string;              // URL do boleto (gerado pelo gateway)
}


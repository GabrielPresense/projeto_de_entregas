// Tipos relacionados a Veículos

// Tipos de veículo disponíveis
export enum TipoVeiculo {
  MOTO = 'moto',
  CARRO = 'carro',
  VAN = 'van',
  CAMINHAO = 'caminhao',
}

// Tipo completo de um Veículo
export interface Veiculo {
  id: number;
  placa: string;                   // Formato: "ABC-1234" ou "ABC1234" (validação no backend)
  modelo: string;                  // Ex: "Civic", "Hilux"
  marca: string;                   // Ex: "Honda", "Toyota"
  tipo: TipoVeiculo;
  capacidade: number;              // Capacidade em kg ou m³
  disponivel: boolean;             // Se está disponível para uso
  rotas?: Array<{
    id: number;
    nome: string;
    descricao?: string;
    status: string;
    distancia?: string;
  }>;
  entregadores?: Array<{
    id: number;
    nome: string;
    cpf?: string;
    telefone?: string;
    email?: string;
  }>;
}

// Para criar um novo veículo
// Validações: Placa (formato brasileiro), Capacidade (número positivo)
export interface CreateVeiculoDto {
  placa: string;                   // Obrigatório, formato: "ABC-1234" (validação no backend)
  modelo: string;                  // Obrigatório
  marca: string;                   // Obrigatório
  tipo: TipoVeiculo;                // Obrigatório
  capacidade: number;              // Obrigatório, número positivo (em kg ou m³)
  disponivel?: boolean;            // Opcional, default: true
}

// Para atualizar um veículo
export interface UpdateVeiculoDto {
  placa?: string;                  // Formato: "ABC-1234"
  modelo?: string;
  marca?: string;
  tipo?: TipoVeiculo;
  capacidade?: number;             // Número positivo
  disponivel?: boolean;
}


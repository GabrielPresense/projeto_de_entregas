// Tipos relacionados a Entregadores

// Status possíveis de um entregador
export enum StatusEntregador {
  DISPONIVEL = 'disponivel',
  EM_ENTREGA = 'em_entrega',
  INDISPONIVEL = 'indisponivel',
}

// Tipo completo de um Entregador
export interface Entregador {
  id: number;
  nome: string;
  cpf: string;        // Formato: "123.456.789-00" (validação no backend)
  telefone: string;   // Formato: "(11) 99999-9999" (validação no backend)
  email: string;      // Formato válido de email (validação no backend)
  status: StatusEntregador;
  pedidos?: Array<{
    id: number;
    descricao: string;
    status: string;
    enderecoDestino?: string;
    valor?: string;
  }>;
  veiculos?: Array<{
    id: number;
    placa: string;     // Formato: "ABC-1234" (validação no backend)
    modelo: string;
    marca: string;
    tipo?: string;
    disponivel?: boolean;
  }>;
}

// Para criar um novo entregador
export interface CreateEntregadorDto {
  nome: string;                    
  cpf: string;                     
  telefone: string;               
  email: string;                   
  status?: StatusEntregador;
}

// Para atualizar um entregador
// Validações aplicadas apenas nos campos que forem atualizados
export interface UpdateEntregadorDto {
  nome?: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  status?: StatusEntregador;
}


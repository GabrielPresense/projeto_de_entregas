# Backend - Sistema de Entregas

Sistema de gerenciamento de entregas com rastreamento em tempo real via WebSocket.

## Funcionalidades

- Cadastro de Entregadores
- Cadastro de Veículos
- Cadastro de Pedidos
- Cadastro de Rotas
- Sistema de Pagamentos
- Rastreamento em tempo real via WebSocket

## Tecnologias

- NestJS
- TypeORM
- MySQL
- Socket.IO (WebSocket)
- class-validator
- class-transformer

## Instalação

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente criando um arquivo `.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=usuario
DB_PASS=15789
DB_NAME=base_de_dados
PORT=3000
NODE_ENV=development

# Mercado Pago - PIX Integration (Opcional)
# Para obter o token:
# 1. Acesse: https://www.mercadopago.com.br/developers
# 2. Crie uma aplicação
# 3. Copie o Access Token (Test) para desenvolvimento
# 4. Cole abaixo (sem o token, usará um mock para testes)
MERCADO_PAGO_ACCESS_TOKEN=TEST-SEU_TOKEN_AQUI
```

3. Inicie o banco de dados MySQL com Docker:
```bash
npm run db:up
```

4. Inicie o servidor:
```bash
npm run start:dev
```

## Endpoints da API

### Entregadores
- `GET /entregadores` - Lista todos os entregadores
- `GET /entregadores/:id` - Busca um entregador
- `POST /entregadores` - Cria um entregador
- `PUT /entregadores/:id` - Atualiza um entregador
- `DELETE /entregadores/:id` - Remove um entregador

### Veículos
- `GET /veiculos` - Lista todos os veículos
- `GET /veiculos/disponiveis` - Lista veículos disponíveis
- `GET /veiculos/:id` - Busca um veículo
- `POST /veiculos` - Cria um veículo
- `PUT /veiculos/:id` - Atualiza um veículo
- `DELETE /veiculos/:id` - Remove um veículo

### Pedidos
- `GET /pedidos` - Lista todos os pedidos
- `GET /pedidos/:id` - Busca um pedido
- `POST /pedidos` - Cria um pedido
- `PUT /pedidos/:id` - Atualiza um pedido
- `PUT /pedidos/:id/status` - Atualiza o status de um pedido
- `PUT /pedidos/:id/location` - Atualiza a localização de um pedido
- `DELETE /pedidos/:id` - Remove um pedido

### Rotas
- `GET /rotas` - Lista todas as rotas
- `GET /rotas/:id` - Busca uma rota
- `POST /rotas` - Cria uma rota
- `PUT /rotas/:id` - Atualiza uma rota
- `DELETE /rotas/:id` - Remove uma rota

### Pagamentos
- `GET /pagamentos` - Lista todos os pagamentos
- `GET /pagamentos/:id` - Busca um pagamento
- `POST /pagamentos` - Cria um pagamento
- `POST /pagamentos/:id/processar` - Processa um pagamento
- `PUT /pagamentos/:id` - Atualiza um pagamento
- `DELETE /pagamentos/:id` - Remove um pagamento

## WebSocket - Rastreamento em Tempo Real

### Eventos do Cliente

#### Entrar no rastreamento de um pedido
```javascript
socket.emit('join_tracking', { pedidoId: 1 });
```

#### Sair do rastreamento de um pedido
```javascript
socket.emit('leave_tracking', { pedidoId: 1 });
```

#### Atualizar localização
```javascript
socket.emit('update_location', {
  pedidoId: 1,
  latitude: -23.5505,
  longitude: -46.6333
});
```

#### Obter status do pedido
```javascript
socket.emit('get_pedido_status', { pedidoId: 1 });
```

### Eventos do Servidor

#### Localização atualizada
```javascript
socket.on('location_updated', (data) => {
  console.log('Localização atualizada:', data);
  // data: { pedidoId, latitude, longitude, status, timestamp }
});
```

#### Status do pedido alterado
```javascript
socket.on('status_changed', (data) => {
  console.log('Status alterado:', data);
  // data: { pedidoId, status, timestamp }
});
```

## Status dos Pedidos

- `pendente` - Pedido criado, aguardando confirmação
- `confirmado` - Pedido confirmado
- `em_preparacao` - Pedido em preparação
- `pronto_para_entrega` - Pronto para ser entregue
- `em_transito` - Em trânsito para o destino
- `entregue` - Pedido entregue
- `cancelado` - Pedido cancelado

## Status dos Entregadores

- `disponivel` - Disponível para entregas
- `em_entrega` - Realizando uma entrega
- `indisponivel` - Indisponível

## Tipos de Veículos

- `moto` - Motocicleta
- `carro` - Carro
- `van` - Van
- `caminhao` - Caminhão

## Métodos de Pagamento

- `cartao_credito` - Cartão de Crédito
- `cartao_debito` - Cartão de Débito
- `pix` - PIX
- `boleto` - Boleto

## Status dos Pagamentos

- `pendente` - Aguardando processamento
- `processando` - Em processamento
- `aprovado` - Aprovado
- `recusado` - Recusado
- `reembolsado` - Reembolsado

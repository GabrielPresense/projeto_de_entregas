# Como Testar o PIX do Mercado Pago

Este guia explica como testar a integração PIX do Mercado Pago no sistema.

## Pré-requisitos

1. ✅ Servidor rodando (`npm run start:dev`)
2. ✅ Banco de dados MySQL ativo (`npm run db:up`)
3. ✅ Token do Mercado Pago configurado no `.env`

## Métodos de Teste

### Opção 1: Script PowerShell (Recomendado para Windows)

Execute no PowerShell:

```powershell
cd back
.\test\test-pix.ps1
```

### Opção 2: Script Node.js (Funciona em qualquer sistema)

Execute no terminal:

```bash
cd back
npm run test:pix:simples
```

Ou diretamente:

```bash
cd back
node test/test-pix-simples.js
```

### Opção 3: Teste E2E (Jest)

Execute os testes automatizados:

```bash
cd back
npm run test:e2e -- pagamentos-pix
```

## O que o teste faz?

O script de teste executa automaticamente:

1. ✅ **Verifica se o servidor está rodando**
2. ✅ **Cria um pedido** de teste
3. ✅ **Cria um pagamento PIX** vinculado ao pedido
4. ✅ **Processa o pagamento** (gera QR Code via Mercado Pago)
5. ✅ **Consulta o status** do pagamento

## Resultado Esperado

Ao executar o teste, você verá:

```
========================================
  TESTE DE INTEGRAÇÃO PIX - MERCADO PAGO
========================================

[1/5] Verificando se o servidor está rodando...
✓ Servidor está rodando!

[2/5] Criando pedido...
✓ Pedido criado com sucesso! ID: 1

[3/5] Criando pagamento PIX...
✓ Pagamento PIX criado com sucesso! ID: 1

[4/5] Processando pagamento PIX (gerando QR Code)...
✓ Pagamento processado com sucesso!

  DADOS DO PAGAMENTO PIX:
  -------------------------
  ID da Transação: 123456789
  Status: pendente

  QR CODE (PIX Copia e Cola):
  00020126360014BR.GOV.BCB.PIX...

[5/5] Consultando status do pagamento...
✓ Status consultado!
  Status atual: pendente
```

## Testando Manualmente com cURL/Postman

### 1. Criar Pedido

```bash
POST http://localhost:3000/pedidos
Content-Type: application/json

{
  "descricao": "Pedido teste PIX",
  "enderecoOrigem": "Rua A, 123",
  "enderecoDestino": "Rua B, 456",
  "valor": "150.00"
}
```

### 2. Criar Pagamento PIX

```bash
POST http://localhost:3000/pagamentos
Content-Type: application/json

{
  "valor": "150.00",
  "metodoPagamento": "pix",
  "pedidoId": 1
}
```

### 3. Processar Pagamento (Gerar QR Code)

```bash
POST http://localhost:3000/pagamentos/1/processar
```

### 4. Consultar Status

```bash
GET http://localhost:3000/pagamentos/1/status
```

## Solução de Problemas

### Erro: "Servidor não está respondendo"

- Certifique-se de que o servidor está rodando: `npm run start:dev`
- Verifique se a porta 3000 está livre

### Erro: "MERCADO_PAGO_ACCESS_TOKEN não configurado"

- Verifique se o arquivo `.env` existe na pasta `back/`
- Confirme que a variável `MERCADO_PAGO_ACCESS_TOKEN` está configurada
- Reinicie o servidor após configurar o token

### Erro: "Falha ao criar pagamento PIX"

- Verifique se o token do Mercado Pago é válido
- Confirme que está usando um token de teste (começa com `TEST-`)
- Verifique sua conexão com a internet

### QR Code não aparece

- Verifique os logs do servidor para ver erros detalhados
- Confirme que o token tem permissões para criar pagamentos PIX
- Verifique se a resposta do Mercado Pago contém `point_of_interaction`

## Próximos Passos

Após o teste bem-sucedido:

1. 📱 Use o QR Code gerado em um app de pagamento para testar o pagamento real
2. 🔄 Consulte o status periodicamente para ver quando o pagamento for aprovado
3. 🧪 Teste diferentes valores e cenários
4. 📊 Monitore os logs do servidor para entender o fluxo completo

## Endpoints Disponíveis

- `POST /pagamentos` - Criar pagamento
- `POST /pagamentos/:id/processar` - Processar pagamento PIX
- `GET /pagamentos` - Listar todos os pagamentos
- `GET /pagamentos/:id` - Buscar pagamento específico
- `GET /pagamentos/:id/status` - Consultar status no Mercado Pago
- `PUT /pagamentos/:id` - Atualizar pagamento
- `DELETE /pagamentos/:id` - Remover pagamento


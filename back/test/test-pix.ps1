# Script de Teste PIX - Mercado Pago
# Execute este script para testar a integração PIX

$baseUrl = "http://localhost:3000"
$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTE DE INTEGRAÇÃO PIX - MERCADO PAGO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o servidor está rodando
Write-Host "[1/5] Verificando se o servidor está rodando..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl" -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
    Write-Host "✓ Servidor está rodando!" -ForegroundColor Green
} catch {
    Write-Host "✗ Erro: Servidor não está respondendo em $baseUrl" -ForegroundColor Red
    Write-Host "  Certifique-se de que o servidor está rodando (npm run start:dev)" -ForegroundColor Yellow
    exit 1
}

# 1. Criar Pedido
Write-Host ""
Write-Host "[2/5] Criando pedido..." -ForegroundColor Yellow
$pedidoBody = @{
    descricao = "Pedido de teste PIX - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    enderecoOrigem = "Rua A, 123 - São Paulo"
    enderecoDestino = "Rua B, 456 - São Paulo"
    valor = "150.00"
} | ConvertTo-Json

try {
    $pedido = Invoke-RestMethod -Uri "$baseUrl/pedidos" -Method POST -ContentType "application/json" -Body $pedidoBody
    $pedidoId = $pedido.id
    Write-Host "✓ Pedido criado com sucesso! ID: $pedidoId" -ForegroundColor Green
    Write-Host "  Descrição: $($pedido.descricao)" -ForegroundColor Gray
    Write-Host "  Valor: R$ $($pedido.valor)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Erro ao criar pedido: $_" -ForegroundColor Red
    exit 1
}

# 2. Criar Pagamento PIX
Write-Host ""
Write-Host "[3/5] Criando pagamento PIX..." -ForegroundColor Yellow
$pagamentoBody = @{
    valor = "150.00"
    metodoPagamento = "pix"
    pedidoId = $pedidoId
} | ConvertTo-Json

try {
    $pagamento = Invoke-RestMethod -Uri "$baseUrl/pagamentos" -Method POST -ContentType "application/json" -Body $pagamentoBody
    $pagamentoId = $pagamento.id
    Write-Host "✓ Pagamento PIX criado com sucesso! ID: $pagamentoId" -ForegroundColor Green
    Write-Host "  Status: $($pagamento.status)" -ForegroundColor Gray
    Write-Host "  Método: $($pagamento.metodoPagamento)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Erro ao criar pagamento: $_" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Detalhes: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

# 3. Processar Pagamento (Gerar QR Code)
Write-Host ""
Write-Host "[4/5] Processando pagamento PIX (gerando QR Code)..." -ForegroundColor Yellow
try {
    $resultado = Invoke-RestMethod -Uri "$baseUrl/pagamentos/$pagamentoId/processar" -Method POST
    Write-Host "✓ Pagamento processado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  DADOS DO PAGAMENTO PIX:" -ForegroundColor Cyan
    Write-Host "  -------------------------" -ForegroundColor Cyan
    Write-Host "  ID da Transação: $($resultado.transacaoId)" -ForegroundColor White
    Write-Host "  Status: $($resultado.status)" -ForegroundColor White
    
    if ($resultado.qrCode) {
        Write-Host ""
        Write-Host "  QR CODE (PIX Copia e Cola):" -ForegroundColor Yellow
        Write-Host "  $($resultado.qrCode)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  💡 Você pode copiar o QR Code acima e usar em qualquer app de pagamento!" -ForegroundColor Green
    }
    
    if ($resultado.qrCodeBase64) {
        Write-Host ""
        Write-Host "  QR Code Base64 disponível (para gerar imagem)" -ForegroundColor Gray
    }
    
    if ($resultado.ticketUrl) {
        Write-Host ""
        Write-Host "  URL do Ticket: $($resultado.ticketUrl)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "✗ Erro ao processar pagamento: $_" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Detalhes: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "  Possíveis causas:" -ForegroundColor Yellow
    Write-Host "  - Token do Mercado Pago não configurado no .env" -ForegroundColor Yellow
    Write-Host "  - Token inválido ou expirado" -ForegroundColor Yellow
    Write-Host "  - Problema de conexão com a API do Mercado Pago" -ForegroundColor Yellow
    exit 1
}

# 4. Consultar Status
Write-Host ""
Write-Host "[5/5] Consultando status do pagamento..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
try {
    $status = Invoke-RestMethod -Uri "$baseUrl/pagamentos/$pagamentoId/status" -Method GET
    Write-Host "✓ Status consultado!" -ForegroundColor Green
    Write-Host "  Status atual: $($status.status)" -ForegroundColor White
    
    if ($status.status -eq "aprovado") {
        Write-Host "  🎉 Pagamento APROVADO!" -ForegroundColor Green
    } elseif ($status.status -eq "pendente") {
        Write-Host "  ⏳ Pagamento ainda PENDENTE" -ForegroundColor Yellow
        Write-Host "  💡 Use o QR Code para fazer o pagamento e depois consulte o status novamente" -ForegroundColor Gray
    } elseif ($status.status -eq "recusado") {
        Write-Host "  ❌ Pagamento RECUSADO" -ForegroundColor Red
    }
} catch {
    Write-Host "⚠ Aviso: Não foi possível consultar o status: $_" -ForegroundColor Yellow
}

# Resumo
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTE CONCLUÍDO!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Resumo:" -ForegroundColor Yellow
Write-Host "  - Pedido ID: $pedidoId" -ForegroundColor White
Write-Host "  - Pagamento ID: $pagamentoId" -ForegroundColor White
Write-Host ""
Write-Host "Para consultar o status novamente:" -ForegroundColor Gray
Write-Host "  GET $baseUrl/pagamentos/$pagamentoId/status" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para ver os detalhes do pagamento:" -ForegroundColor Gray
Write-Host "  GET $baseUrl/pagamentos/$pagamentoId" -ForegroundColor Cyan
Write-Host ""


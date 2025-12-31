/**
 * Script de Teste PIX - Mercado Pago
 * Execute: node test-pix.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Função auxiliar para fazer requisições HTTP
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          // Tenta parsear como JSON, se falhar, usa o body como string
          let parsed;
          try {
            parsed = body ? JSON.parse(body) : {};
          } catch (parseError) {
            // Se não for JSON, retorna o body como string (ex: "Hello World!")
            parsed = body || {};
          }
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, data: parsed });
          } else {
            // Tenta extrair mensagem de erro mais detalhada
            let errorMsg = `HTTP ${res.statusCode}`;
            if (parsed && parsed.message) {
              errorMsg += `: ${parsed.message}`;
            } else if (body) {
              errorMsg += `: ${body.substring(0, 200)}`;
            }
            reject(new Error(errorMsg));
          }
        } catch (e) {
          reject(new Error(`Erro ao processar resposta: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`Erro na requisição: ${e.message}`));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Função para aguardar
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Função para exibir resultado
function log(message, color = 'white') {
  const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testarPix() {
  try {
    log('\n========================================', 'cyan');
    log('  TESTE DE INTEGRAÇÃO PIX - MERCADO PAGO', 'cyan');
    log('========================================\n', 'cyan');

    // 1. Verificar servidor
    log('[1/5] Verificando se o servidor está rodando...', 'yellow');
    try {
      const serverCheck = await makeRequest('GET', '/');
      log('✓ Servidor está rodando!', 'green');
      if (serverCheck.data && typeof serverCheck.data === 'string') {
        log(`  Resposta: ${serverCheck.data}`, 'gray');
      }
    } catch (e) {
      log('✗ Erro: Servidor não está respondendo', 'red');
      log(`  Detalhes: ${e.message}`, 'red');
      log('  Certifique-se de que o servidor está rodando (npm run start:dev)', 'yellow');
      log('  Verifique se a porta 3000 está livre e o servidor iniciou corretamente', 'yellow');
      process.exit(1);
    }

    // 2. Criar Pedido
    log('\n[2/5] Criando pedido...', 'yellow');
    const pedidoData = {
      descricao: `Pedido de teste PIX - ${new Date().toLocaleString('pt-BR')}`,
      enderecoOrigem: 'Rua A, 123 - São Paulo',
      enderecoDestino: 'Rua B, 456 - São Paulo',
      valor: '150.00',
    };

    const pedidoResponse = await makeRequest('POST', '/pedidos', pedidoData);
    const pedidoId = pedidoResponse.data.id;
    log(`✓ Pedido criado com sucesso! ID: ${pedidoId}`, 'green');
    log(`  Descrição: ${pedidoResponse.data.descricao}`, 'gray');
    log(`  Valor: R$ ${pedidoResponse.data.valor}`, 'gray');

    // 3. Criar Pagamento PIX
    log('\n[3/5] Criando pagamento PIX...', 'yellow');
    const pagamentoData = {
      valor: '150.00',
      metodoPagamento: 'pix',
      pedidoId: pedidoId,
    };

    const pagamentoResponse = await makeRequest('POST', '/pagamentos', pagamentoData);
    const pagamentoId = pagamentoResponse.data.id;
    log(`✓ Pagamento PIX criado com sucesso! ID: ${pagamentoId}`, 'green');
    log(`  Status: ${pagamentoResponse.data.status}`, 'gray');
    log(`  Método: ${pagamentoResponse.data.metodoPagamento}`, 'gray');

    // 4. Processar Pagamento (Gerar QR Code)
    log('\n[4/5] Processando pagamento PIX (gerando QR Code)...', 'yellow');
    let processarResponse;
    try {
      processarResponse = await makeRequest(
        'POST',
        `/pagamentos/${pagamentoId}/processar`,
      );
    } catch (error) {
      log('✗ Erro ao processar pagamento PIX', 'red');
      log(`  Detalhes: ${error.message}`, 'red');
      log('\n  Possíveis causas:', 'yellow');
      log('  - Token do Mercado Pago não configurado ou inválido', 'yellow');
      log('  - Verifique o arquivo .env na pasta back/', 'yellow');
      log('  - Confirme que MERCADO_PAGO_ACCESS_TOKEN está configurado', 'yellow');
      log('  - Verifique os logs do servidor para mais detalhes', 'yellow');
      throw error;
    }
    log('✓ Pagamento processado com sucesso!', 'green');
    log('\n  DADOS DO PAGAMENTO PIX:', 'cyan');
    log('  -------------------------', 'cyan');
    log(`  ID da Transação: ${processarResponse.data.transacaoId}`, 'white');
    log(`  Status: ${processarResponse.data.status}`, 'white');

    if (processarResponse.data.qrCode) {
      log('\n  QR CODE (PIX Copia e Cola):', 'yellow');
      log(`  ${processarResponse.data.qrCode}`, 'gray');
      log('\n  💡 Você pode copiar o QR Code acima e usar em qualquer app de pagamento!', 'green');
    }

    if (processarResponse.data.qrCodeBase64) {
      log('\n  QR Code Base64 disponível (para gerar imagem)', 'gray');
    }

    if (processarResponse.data.ticketUrl) {
      log(`\n  URL do Ticket: ${processarResponse.data.ticketUrl}`, 'cyan');
    }

    // 5. Consultar Status
    log('\n[5/5] Consultando status do pagamento...', 'yellow');
    await sleep(2000);
    try {
      const statusResponse = await makeRequest('GET', `/pagamentos/${pagamentoId}/status`);
      log('✓ Status consultado!', 'green');
      log(`  Status atual: ${statusResponse.data.status}`, 'white');

      if (statusResponse.data.status === 'aprovado') {
        log('  🎉 Pagamento APROVADO!', 'green');
      } else if (statusResponse.data.status === 'pendente') {
        log('  ⏳ Pagamento ainda PENDENTE', 'yellow');
        log('  💡 Use o QR Code para fazer o pagamento e depois consulte o status novamente', 'gray');
      } else if (statusResponse.data.status === 'recusado') {
        log('  ❌ Pagamento RECUSADO', 'red');
      }
    } catch (e) {
      log(`⚠ Aviso: Não foi possível consultar o status: ${e.message}`, 'yellow');
    }

    // Resumo
    log('\n========================================', 'cyan');
    log('  TESTE CONCLUÍDO!', 'cyan');
    log('========================================\n', 'cyan');
    log('Resumo:', 'yellow');
    log(`  - Pedido ID: ${pedidoId}`, 'white');
    log(`  - Pagamento ID: ${pagamentoId}`, 'white');
    log('\nPara consultar o status novamente:', 'gray');
    log(`  GET ${BASE_URL}/pagamentos/${pagamentoId}/status`, 'cyan');
    log('\nPara ver os detalhes do pagamento:', 'gray');
    log(`  GET ${BASE_URL}/pagamentos/${pagamentoId}`, 'cyan');
    log('');

  } catch (error) {
    log(`\n✗ Erro durante o teste: ${error.message}`, 'red');
    if (error.message.includes('ECONNREFUSED')) {
      log('\n  O servidor não está rodando!', 'yellow');
      log('  Execute: npm run start:dev', 'yellow');
    } else if (error.message.includes('MERCADO_PAGO')) {
      log('\n  Problema com a integração do Mercado Pago:', 'yellow');
      log('  - Verifique se o token está configurado no .env', 'yellow');
      log('  - Verifique se o token é válido', 'yellow');
    }
    process.exit(1);
  }
}

// Executar teste
testarPix();


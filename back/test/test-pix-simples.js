/**
 * Script de Teste PIX Simplificado - Mercado Pago
 * Versão mais simples e com melhor tratamento de erros
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function fazerRequisicao(method, path, dados = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const opcoes = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(opcoes, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        let dados;
        try {
          dados = body ? JSON.parse(body) : {};
        } catch (e) {
          dados = { raw: body };
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, dados });
        } else {
          const erro = dados.message || dados.error || body || `HTTP ${res.statusCode}`;
          reject(new Error(erro));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`Erro de conexão: ${e.message}`));
    });

    if (dados) {
      req.write(JSON.stringify(dados));
    }
    req.end();
  });
}

async function testar() {
  console.log('\n========================================');
  console.log('  TESTE PIX - MERCADO PAGO');
  console.log('========================================\n');

  try {
    // 1. Verificar servidor
    console.log('[1/5] Verificando servidor...');
    await fazerRequisicao('GET', '/');
    console.log('✓ Servidor OK\n');

    // 2. Criar pedido
    console.log('[2/5] Criando pedido...');
    const pedido = await fazerRequisicao('POST', '/pedidos', {
      descricao: `Teste PIX - ${new Date().toLocaleString('pt-BR')}`,
      enderecoOrigem: 'Rua A, 123',
      enderecoDestino: 'Rua B, 456',
      valor: '150.00',
    });
    const pedidoId = pedido.dados.id;
    console.log(`✓ Pedido criado: ID ${pedidoId}\n`);

    // 3. Criar pagamento
    console.log('[3/5] Criando pagamento PIX...');
    const pagamento = await fazerRequisicao('POST', '/pagamentos', {
      valor: '150.00',
      metodoPagamento: 'pix',
      pedidoId: pedidoId,
    });
    const pagamentoId = pagamento.dados.id;
    console.log(`✓ Pagamento criado: ID ${pagamentoId}\n`);

    // 4. Processar (gerar QR Code)
    console.log('[4/5] Processando pagamento (gerando QR Code)...');
    try {
      const resultado = await fazerRequisicao('POST', `/pagamentos/${pagamentoId}/processar`);
      
      console.log('✓ Pagamento processado!\n');
      console.log('════════════════════════════════════');
      console.log('  DADOS DO PAGAMENTO PIX');
      console.log('════════════════════════════════════');
      console.log(`ID Transação: ${resultado.dados.transacaoId || 'N/A'}`);
      console.log(`Status: ${resultado.dados.status}`);
      
      if (resultado.dados.qrCode) {
        console.log('\n📱 QR CODE PIX:');
        console.log(resultado.dados.qrCode);
        console.log('\n💡 Copie o código acima e use em qualquer app de pagamento!');
      }
      
      if (resultado.dados.ticketUrl) {
        console.log(`\n🔗 URL: ${resultado.dados.ticketUrl}`);
      }
      console.log('════════════════════════════════════\n');

      // 5. Consultar status
      console.log('[5/5] Consultando status...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      const status = await fazerRequisicao('GET', `/pagamentos/${pagamentoId}/status`);
      console.log(`✓ Status: ${status.dados.status}\n`);

      console.log('========================================');
      console.log('  TESTE CONCLUÍDO COM SUCESSO!');
      console.log('========================================\n');

    } catch (erroProcessar) {
      console.log('✗ ERRO ao processar pagamento\n');
      console.log('Detalhes do erro:', erroProcessar.message);
      console.log('\n🔍 DIAGNÓSTICO:');
      console.log('1. Verifique se o servidor foi reiniciado após configurar o token');
      console.log('2. Confirme que MERCADO_PAGO_ACCESS_TOKEN está no arquivo .env');
      console.log('3. Verifique os logs do servidor para mais detalhes');
      console.log('4. O token pode estar inválido ou expirado\n');
      throw erroProcessar;
    }

  } catch (erro) {
    console.log('\n✗ ERRO NO TESTE');
    console.log('Mensagem:', erro.message);
    
    if (erro.message.includes('ECONNREFUSED') || erro.message.includes('conexão')) {
      console.log('\n💡 O servidor não está rodando!');
      console.log('Execute: npm run start:dev');
    }
    
    process.exit(1);
  }
}

testar();


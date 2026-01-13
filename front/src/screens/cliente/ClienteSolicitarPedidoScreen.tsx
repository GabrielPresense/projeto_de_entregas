import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { pedidosService } from '../../services/pedidos.service';
import { pagamentosService } from '../../services/pagamentos.service';
import { CreatePedidoDto, StatusPedido } from '../../types/pedido.types';
import { MetodoPagamento, StatusPagamento } from '../../types/pagamento.types';
import { commonStylesWithForm as commonStyles } from '../../styles/commonStyles';
import { estimateDistance, formatCurrency } from '../../services/distance.service';
import { buscarEnderecoPorCEP, formatarCEP, validarCEP } from '../../services/cep.service';
import AddressAutocomplete from '../../components/AddressAutocomplete';
import { clienteSolicitarPedidoStyles as styles } from '../../styles/clienteSolicitarPedidoStyles';
import QRCode from 'react-native-qrcode-svg';

interface Props {
  onSuccess?: (pedidoId: number) => void;
  onCancel?: () => void;
}

type Step = 'form' | 'payment';

export default function ClienteSolicitarPedidoScreen({ onSuccess, onCancel }: Props) {
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [formData, setFormData] = useState<CreatePedidoDto>({
    descricao: '',
    enderecoOrigem: '',
    enderecoDestino: '',
    valor: '',
  });
  const [calculatedValue, setCalculatedValue] = useState<number | null>(null);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pagamentoId, setPagamentoId] = useState<number | null>(null);
  const [pedidoId, setPedidoId] = useState<number | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);
  const [origemCoords, setOrigemCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinoCoords, setDestinoCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [cepOrigem, setCepOrigem] = useState('');
  const [numeroOrigem, setNumeroOrigem] = useState('');
  const [cepDestino, setCepDestino] = useState('');
  const [numeroDestino, setNumeroDestino] = useState('');
  const [buscandoCepOrigem, setBuscandoCepOrigem] = useState(false);
  const [buscandoCepDestino, setBuscandoCepDestino] = useState(false);

  // Calcula o valor automaticamente quando os endereços são preenchidos
  useEffect(() => {
    const calculateFreight = async () => {
      const origemText = formData.enderecoOrigem.trim();
      const destinoText = formData.enderecoDestino.trim();
      
      // Se temos coordenadas dos dois endereços, usa elas diretamente (mais rápido)
      // Mas só se os endereços ainda correspondem às coordenadas
      if (origemCoords && destinoCoords && origemText && destinoText) {
        setCalculating(true);
        try {
          const result = await estimateDistance(
            `${origemCoords.lat},${origemCoords.lng}`,
            `${destinoCoords.lat},${destinoCoords.lng}`
          );
          if (result) {
            setCalculatedDistance(result.distance);
            setCalculatedValue(result.value);
            setFormData((prev) => ({
              ...prev,
              valor: result.value.toFixed(2).replace('.', ','),
            }));
          } else {
            // Se não conseguiu calcular, mostra mensagem
            Alert.alert(
              'Aviso',
              'Não foi possível calcular a distância de rota. Verifique os endereços e tente novamente.'
            );
          }
        } catch (error) {
          console.error('Erro ao calcular frete:', error);
          Alert.alert(
            'Erro',
            'Erro ao calcular a distância. Verifique sua conexão e tente novamente.'
          );
        } finally {
          setCalculating(false);
        }
      } else if (
        origemText &&
        destinoText &&
        origemText.length > 10 &&
        destinoText.length > 10
      ) {
        // Se não tem coordenadas ou endereços foram alterados, recalcula usando os endereços
        setCalculating(true);
        try {
          const result = await estimateDistance(
            origemText,
            destinoText
          );
          if (result) {
            setCalculatedDistance(result.distance);
            setCalculatedValue(result.value);
            setFormData((prev) => ({
              ...prev,
              valor: result.value.toFixed(2).replace('.', ','),
            }));
          } else {
            // Se não conseguiu calcular, mostra mensagem
            Alert.alert(
              'Aviso',
              'Não foi possível calcular a distância de rota. Verifique os endereços e tente novamente.'
            );
          }
        } catch (error) {
          console.error('Erro ao calcular frete:', error);
          Alert.alert(
            'Erro',
            'Erro ao calcular a distância. Verifique sua conexão e tente novamente.'
          );
        } finally {
          setCalculating(false);
        }
      } else {
        // Limpa valores quando endereços são removidos ou incompletos
        setCalculatedValue(null);
        setCalculatedDistance(null);
        setFormData((prev) => ({ ...prev, valor: '' }));
      }
    };

    // Debounce para não calcular a cada tecla digitada
    const timeoutId = setTimeout(calculateFreight, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData.enderecoOrigem, formData.enderecoDestino, origemCoords, destinoCoords]);

  const validateForm = (): boolean => {
    if (!formData.descricao.trim()) {
      Alert.alert('Erro', 'Descrição é obrigatória');
      return false;
    }
    if (!formData.enderecoOrigem.trim()) {
      Alert.alert('Erro', 'Endereço de origem é obrigatório');
      return false;
    }
    if (!formData.enderecoDestino.trim()) {
      Alert.alert('Erro', 'Endereço de destino é obrigatório');
      return false;
    }
    if (!calculatedValue || calculatedValue <= 0) {
      Alert.alert('Erro', 'Aguarde o cálculo do frete ou verifique os endereços');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateForm()) {
      return;
    }
    // Define PIX como método de pagamento automaticamente
    setStep('payment');
  };

  const handlePaymentConfirm = async () => {
    setPaymentConfirmed(true);

    try {
      setLoading(true);
      
      // 1. Cria o pedido
      const pedido = await pedidosService.create({
        ...formData,
        valor: calculatedValue!.toFixed(2),
        status: StatusPedido.PENDENTE,
      });

      setPedidoId(pedido.id);

      // 2. Cria o pagamento PIX
      const pagamento = await pagamentosService.create({
        valor: calculatedValue!.toFixed(2),
        metodoPagamento: MetodoPagamento.PIX,
        pedidoId: pedido.id,
      });

      setPagamentoId(pagamento.id);

      // 3. Processa o pagamento para gerar QR Code
      const pagamentoProcessado = await pagamentosService.processar(pagamento.id);
      
      if (pagamentoProcessado.qrCode) {
        setQrCode(pagamentoProcessado.qrCode);
        
        // Detecta se está em modo de teste (QR Code simulado ou transacaoId mock)
        // Se o transacaoId começa com "mock-" ou o QR Code não contém "br.gov.bcb.pix", é modo de teste
        const transacaoIdStr = pagamentoProcessado.transacaoId ? String(pagamentoProcessado.transacaoId) : '';
        const qrCodeStr = pagamentoProcessado.qrCode ? String(pagamentoProcessado.qrCode) : '';
        
        const isTest = transacaoIdStr.startsWith('mock-') || 
                       (qrCodeStr.startsWith('000201') && 
                        !qrCodeStr.includes('br.gov.bcb.pix'));
        setIsTestMode(isTest);
        
        if (isTest) {
          console.log('Modo de teste detectado - Pagamento será aprovado automaticamente ao clicar em "Simular Pagamento"');
        }
      } else {
        Alert.alert('Aviso', 'QR Code não foi gerado. Tente novamente.');
        setPaymentConfirmed(false);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar pagamento';
      Alert.alert('Erro', errorMessage);
      setPaymentConfirmed(false);
    } finally {
      setLoading(false);
    }
  };


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {step === 'form' ? (
          <View style={styles.formContainer}>
            <View style={styles.headerSection}>
              <Text style={styles.stepTitle}>📝 Nova Solicitação</Text>
              <Text style={styles.stepSubtitle}>Preencha os dados do seu pedido</Text>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>📍</Text>
                <Text style={styles.sectionTitle}>Endereços</Text>
              </View>

              {/* CEP e Número - Origem */}
              <View style={styles.cepRow}>
                <View style={styles.cepField}>
                  <Text style={commonStyles.form.label}>CEP Origem *</Text>
                  <View style={styles.cepInputContainer}>
                    <TextInput
                      style={[commonStyles.form.input, styles.cepInput]}
                      value={cepOrigem}
                      onChangeText={async (text) => {
                        const formatted = formatarCEP(text);
                        setCepOrigem(formatted);
                        
                        if (validarCEP(formatted)) {
                          setBuscandoCepOrigem(true);
                          try {
                            const endereco = await buscarEnderecoPorCEP(formatted);
                            if (endereco) {
                              const enderecoCompleto = numeroOrigem
                                ? `${endereco.logradouro}, ${numeroOrigem}, ${endereco.bairro}, ${endereco.cidade}, ${endereco.estado}`
                                : `${endereco.logradouro}, ${endereco.bairro}, ${endereco.cidade}, ${endereco.estado}`;
                              setFormData({ ...formData, enderecoOrigem: enderecoCompleto });
                              setOrigemCoords(null);
                            } else {
                              Alert.alert('CEP não encontrado', 'Verifique o CEP digitado e tente novamente.');
                            }
                          } catch (error) {
                            console.error('Erro ao buscar CEP:', error);
                            Alert.alert('Erro', 'Não foi possível buscar o endereço. Tente novamente.');
                          } finally {
                            setBuscandoCepOrigem(false);
                          }
                        }
                      }}
                      placeholder="00000-000"
                      keyboardType="numeric"
                      maxLength={9}
                    />
                    {buscandoCepOrigem && (
                      <ActivityIndicator size="small" color="#007AFF" style={styles.cepLoader} />
                    )}
                  </View>
                </View>
                <View style={styles.numeroField}>
                  <Text style={commonStyles.form.label}>Número</Text>
                  <TextInput
                    style={[commonStyles.form.input, styles.numeroInput]}
                    value={numeroOrigem}
                    onChangeText={(text) => {
                      setNumeroOrigem(text);
                      if (formData.enderecoOrigem && cepOrigem && validarCEP(cepOrigem)) {
                        const enderecoSemNumero = formData.enderecoOrigem.replace(/,\s*\d+[a-z]?\s*,/, ',').replace(/,\s*\d+[a-z]?\s*$/, '');
                        const enderecoCompleto = text
                          ? `${enderecoSemNumero}, ${text}`
                          : enderecoSemNumero;
                        setFormData({ ...formData, enderecoOrigem: enderecoCompleto });
                        setOrigemCoords(null);
                      }
                    }}
                    placeholder="123"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={commonStyles.form.field}>
                <AddressAutocomplete
                  label="Endereço Origem *"
                  value={formData.enderecoOrigem}
                  onChangeText={(text) => {
                    setFormData({ ...formData, enderecoOrigem: text });
                    setOrigemCoords(null);
                  }}
                  onSelectAddress={(address, lat, lng) => {
                    setFormData({ ...formData, enderecoOrigem: address });
                    setOrigemCoords({ lat, lng });
                  }}
                  placeholder="Endereço será preenchido automaticamente pelo CEP"
                  multiline
                  numberOfLines={2}
                />
              </View>

              {/* CEP e Número - Destino */}
              <View style={styles.cepRow}>
                <View style={styles.cepField}>
                  <Text style={commonStyles.form.label}>CEP Destino *</Text>
                  <View style={styles.cepInputContainer}>
                    <TextInput
                      style={[commonStyles.form.input, styles.cepInput]}
                      value={cepDestino}
                      onChangeText={async (text) => {
                        const formatted = formatarCEP(text);
                        setCepDestino(formatted);
                        
                        if (validarCEP(formatted)) {
                          setBuscandoCepDestino(true);
                          try {
                            const endereco = await buscarEnderecoPorCEP(formatted);
                            if (endereco) {
                              const enderecoCompleto = numeroDestino
                                ? `${endereco.logradouro}, ${numeroDestino}, ${endereco.bairro}, ${endereco.cidade}, ${endereco.estado}`
                                : `${endereco.logradouro}, ${endereco.bairro}, ${endereco.cidade}, ${endereco.estado}`;
                              setFormData({ ...formData, enderecoDestino: enderecoCompleto });
                              setDestinoCoords(null);
                            } else {
                              Alert.alert('CEP não encontrado', 'Verifique o CEP digitado e tente novamente.');
                            }
                          } catch (error) {
                            console.error('Erro ao buscar CEP:', error);
                            Alert.alert('Erro', 'Não foi possível buscar o endereço. Tente novamente.');
                          } finally {
                            setBuscandoCepDestino(false);
                          }
                        }
                      }}
                      placeholder="00000-000"
                      keyboardType="numeric"
                      maxLength={9}
                    />
                    {buscandoCepDestino && (
                      <ActivityIndicator size="small" color="#007AFF" style={styles.cepLoader} />
                    )}
                  </View>
                </View>
                <View style={styles.numeroField}>
                  <Text style={commonStyles.form.label}>Número</Text>
                  <TextInput
                    style={[commonStyles.form.input, styles.numeroInput]}
                    value={numeroDestino}
                    onChangeText={(text) => {
                      setNumeroDestino(text);
                      if (formData.enderecoDestino && cepDestino && validarCEP(cepDestino)) {
                        const enderecoSemNumero = formData.enderecoDestino.replace(/,\s*\d+[a-z]?\s*,/, ',').replace(/,\s*\d+[a-z]?\s*$/, '');
                        const enderecoCompleto = text
                          ? `${enderecoSemNumero}, ${text}`
                          : enderecoSemNumero;
                        setFormData({ ...formData, enderecoDestino: enderecoCompleto });
                        setDestinoCoords(null);
                      }
                    }}
                    placeholder="123"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={commonStyles.form.field}>
                <AddressAutocomplete
                  label="Endereço Destino *"
                  value={formData.enderecoDestino}
                  onChangeText={(text) => {
                    setFormData({ ...formData, enderecoDestino: text });
                    setDestinoCoords(null);
                  }}
                  onSelectAddress={(address, lat, lng) => {
                    setFormData({ ...formData, enderecoDestino: address });
                    setDestinoCoords({ lat, lng });
                  }}
                  placeholder="Endereço será preenchido automaticamente pelo CEP"
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View style={commonStyles.form.field}>
                <View style={styles.labelContainer}>
                  <Text style={commonStyles.form.label}>Descrição</Text>
                  <Text style={styles.helperText}>Descreva o que será entregue</Text>
                </View>
                <TextInput
                  style={[commonStyles.form.input, styles.textArea]}
                  value={formData.descricao}
                  onChangeText={(text) => setFormData({ ...formData, descricao: text })}
                  placeholder="Ex: Entrega de medicamentos, documentos, encomenda..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Mostra o valor do frete apenas quando os endereços estão preenchidos */}
              {(formData.enderecoOrigem.trim() && formData.enderecoDestino.trim()) && (
                <View style={commonStyles.form.field}>
                  <View style={styles.freightValueContainer}>
                    {calculating ? (
                      <View style={styles.calculatingContainer}>
                        <ActivityIndicator size="small" color="#110975" />
                        <Text style={styles.calculatingText}>Calculando frete...</Text>
                      </View>
                    ) : calculatedValue ? (
                      <View style={styles.valueDisplay}>
                        <Text style={styles.valueLabel}>Valor do Frete</Text>
                        <Text style={styles.valueAmount}>R$ {formatCurrency(calculatedValue)}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              )}
            </View>

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.continueButton]}
                onPress={handleNext}
              >
                <Text style={styles.continueButtonText}>Continuar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.paymentContainer}>
            <View style={styles.headerSection}>
              <Text style={styles.stepTitle}> Pagamento PIX</Text>
              <Text style={styles.stepSubtitle}>Escaneie o QR Code para pagar</Text>
            </View>

            <View style={styles.paymentSummary}>
              <Text style={styles.summaryLabel}>Resumo do Pedido</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>Descrição:</Text>
                <Text style={styles.summaryValue}>{formData.descricao}</Text>
              </View>
              {calculatedDistance !== null && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryText}>Distância:</Text>
                  <Text style={styles.summaryValue}>{calculatedDistance.toFixed(1)} km</Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>Valor:</Text>
                <Text style={[styles.summaryValue, styles.summaryValueBold]}>
                  R$ {calculatedValue ? formatCurrency(calculatedValue) : '0,00'}
                </Text>
              </View>
            </View>

            {qrCode ? (
              <View style={styles.qrCodeContainer}>
                <Text style={styles.qrCodeTitle}>Escaneie o QR Code ou copie o código PIX</Text>
                
                {qrCode.startsWith('000201') && !qrCode.includes('br.gov.bcb.pix') ? (
                  <View style={styles.devWarning}>
                    <Text style={styles.devWarningText}>
                      ⚠️ QR Code de desenvolvimento{'\n'}
                      Configure o token do Mercado Pago corretamente para gerar QR Codes válidos
                    </Text>
                  </View>
                ) : null}
                
                <View style={styles.qrCodeWrapper}>
                  <QRCode
                    value={qrCode}
                    size={250}
                    backgroundColor="#fff"
                    color="#000"
                  />
                </View>
                
                <View style={styles.pixCodeContainer}>
                  <Text style={styles.pixCodeLabel}>Código PIX (Copia e Cola):</Text>
                  <View style={styles.pixCodeBox}>
                    <Text style={styles.pixCodeText} selectable>
                      {qrCode}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={async () => {
                      await Clipboard.setStringAsync(qrCode);
                      Alert.alert('Copiado!', 'Código PIX copiado para a área de transferência');
                    }}
                  >
                    <Text style={styles.copyButtonText}>📋 Copiar Código PIX</Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity
                  style={styles.finishButton}
                  onPress={async () => {
                    if (isTestMode && pagamentoId && pedidoId) {
                      // Modo de teste: aprova o pagamento automaticamente
                      try {
                        setLoading(true);
                        
                        // 1. Aprova o pagamento
                        await pagamentosService.update(pagamentoId, {
                          status: StatusPagamento.APROVADO,
                        });
                        
                        // 2. Atualiza o status do pedido para CONFIRMADO
                        await pedidosService.updateStatus(pedidoId, StatusPedido.CONFIRMADO);
                        
                        Alert.alert(
                          'Pedido criado e pago!',
                          'Pagamento aprovado (modo de teste). O pedido foi enviado para a empresa.',
                          [
                            {
                              text: 'OK',
                              onPress: () => {
                                onSuccess?.(pedidoId);
                              },
                            },
                          ]
                        );
                      } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Erro ao processar pagamento';
                        Alert.alert('Erro', errorMessage);
                      } finally {
                        setLoading(false);
                      }
                    } else {
                      // Modo de produção: apenas confirma que o pedido foi criado
                      Alert.alert(
                        'Pedido criado!',
                        'Após realizar o pagamento, seu pedido será processado.',
                        [
                          {
                            text: 'OK',
                            onPress: () => {
                              onSuccess?.(pedidoId || 0);
                            },
                          },
                        ]
                      );
                    }
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.finishButtonText}>
                      {isTestMode ? 'Simular Pagamento (Teste)' : 'Já paguei / Continuar'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.paymentMethods}>
                <View style={styles.pixMethodContainer}>
                  <Text style={styles.pixIcon}>📱</Text>
                  <Text style={styles.pixLabel}>PIX</Text>
                  <Text style={styles.pixDescription}>
                    Pagamento instantâneo via PIX
                  </Text>
                </View>

                <View style={[commonStyles.form.buttons, { padding: 20, paddingTop: 0 }]}>
                  <TouchableOpacity
                    style={[commonStyles.form.formButton, commonStyles.form.cancelButton]}
                    onPress={() => setStep('form')}
                    disabled={loading}
                  >
                    <Text style={commonStyles.form.cancelButtonText}>Voltar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      commonStyles.form.formButton,
                      commonStyles.form.saveButton,
                      loading && styles.buttonDisabled,
                    ]}
                    onPress={handlePaymentConfirm}
                    disabled={loading || paymentConfirmed}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={commonStyles.form.saveButtonText}>
                        {paymentConfirmed ? 'Gerando QR Code...' : 'Gerar QR Code PIX'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


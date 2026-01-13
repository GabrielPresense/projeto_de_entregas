// Tela para criar ou editar um pedido (versão empresa - igual ao cliente mas sem pagamento)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { pedidosService } from '../../services/pedidos.service';
import { entregadoresService } from '../../services/entregadores.service';
import { Pedido, CreatePedidoDto, UpdatePedidoDto, StatusPedido } from '../../types/pedido.types';
import { Entregador } from '../../types/entregador.types';
import { commonStylesWithForm as commonStyles } from '../../styles/commonStyles';
import { estimateDistance, formatCurrency } from '../../services/distance.service';
import { buscarEnderecoPorCEP, formatarCEP, validarCEP } from '../../services/cep.service';
import AddressAutocomplete from '../../components/AddressAutocomplete';
import { clienteSolicitarPedidoStyles as styles } from '../../styles/clienteSolicitarPedidoStyles';
import { entregadoresListStyles } from '../../styles/entregadorStyles';
import { pedidoDetailStyles } from '../../styles/pedidoStyles';

interface Props {
  pedido?: Pedido; // Se tiver, é edição. Se não, é criação
  onSave?: (pedido: Pedido) => void;
  onCancel?: () => void;
}

export default function PedidoFormScreen({ pedido, onSave, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [formData, setFormData] = useState<CreatePedidoDto>({
    descricao: pedido?.descricao || '',
    enderecoOrigem: pedido?.enderecoOrigem || '',
    enderecoDestino: pedido?.enderecoDestino || '',
    valor: pedido?.valor || '',
    entregadorId: pedido?.entregador?.id,
    status: pedido?.status || StatusPedido.EM_PREPARACAO,
  });
  const [calculatedValue, setCalculatedValue] = useState<number | null>(null);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [origemCoords, setOrigemCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinoCoords, setDestinoCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [cepOrigem, setCepOrigem] = useState('');
  const [numeroOrigem, setNumeroOrigem] = useState('');
  const [cepDestino, setCepDestino] = useState('');
  const [numeroDestino, setNumeroDestino] = useState('');
  const [buscandoCepOrigem, setBuscandoCepOrigem] = useState(false);
  const [buscandoCepDestino, setBuscandoCepDestino] = useState(false);
  const [showEntregadorModal, setShowEntregadorModal] = useState(false);
  const [entregadores, setEntregadores] = useState<Entregador[]>([]);
  const [loadingEntregadores, setLoadingEntregadores] = useState(false);
  const [selectedEntregador, setSelectedEntregador] = useState<Entregador | null>(
    (pedido?.entregador as Entregador) || null
  );

  // Calcula o valor automaticamente quando os endereços são preenchidos
  useEffect(() => {
    const calculateFreight = async () => {
      const origemText = formData.enderecoOrigem.trim();
      const destinoText = formData.enderecoDestino.trim();
      
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
          }
        } catch (error) {
          console.error('Erro ao calcular frete:', error);
        } finally {
          setCalculating(false);
        }
      } else if (
        origemText &&
        destinoText &&
        origemText.length > 10 &&
        destinoText.length > 10
      ) {
        setCalculating(true);
        try {
          const result = await estimateDistance(origemText, destinoText);
          if (result) {
            setCalculatedDistance(result.distance);
            setCalculatedValue(result.value);
            setFormData((prev) => ({
              ...prev,
              valor: result.value.toFixed(2).replace('.', ','),
            }));
          }
        } catch (error) {
          console.error('Erro ao calcular frete:', error);
        } finally {
          setCalculating(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      calculateFreight();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [formData.enderecoOrigem, formData.enderecoDestino, origemCoords, destinoCoords]);

  const loadEntregadores = async () => {
    try {
      setLoadingEntregadores(true);
      const dados = await entregadoresService.getAll();
      setEntregadores(Array.isArray(dados) ? dados : []);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro ao carregar entregadores';
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoadingEntregadores(false);
    }
  };

  const openEntregadorModal = () => {
    setShowEntregadorModal(true);
    loadEntregadores();
  };

  const handleSelectEntregador = (entregador: Entregador) => {
    setSelectedEntregador(entregador);
    setFormData((prev) => ({
      ...prev,
      entregadorId: entregador.id,
    }));
    setShowEntregadorModal(false);
  };

  const handleSave = async () => {
    // Validação básica
    if (!formData.descricao.trim()) {
      Alert.alert('Erro', 'Descrição é obrigatória');
      return;
    }
    if (!formData.enderecoOrigem.trim()) {
      Alert.alert('Erro', 'Endereço de origem é obrigatório');
      return;
    }
    if (!formData.enderecoDestino.trim()) {
      Alert.alert('Erro', 'Endereço de destino é obrigatório');
      return;
    }
    if (!formData.valor.trim()) {
      Alert.alert('Erro', 'Valor é obrigatório');
      return;
    }
    if (!formData.entregadorId) {
      Alert.alert('Erro', 'Selecione um entregador');
      return;
    }

    try {
      setLoading(true);
      let savedPedido: Pedido;

      if (pedido) {
        // Atualizar pedido existente
        const updateData: UpdatePedidoDto = {
          descricao: formData.descricao,
          enderecoOrigem: formData.enderecoOrigem,
          enderecoDestino: formData.enderecoDestino,
          valor: formData.valor,
          entregadorId: formData.entregadorId,
          status: formData.status,
        };
        savedPedido = await pedidosService.update(pedido.id, updateData);
      } else {
        // Criar novo pedido
        savedPedido = await pedidosService.create({
          ...formData,
          status: StatusPedido.EM_PREPARACAO,
        });
      }

      Alert.alert('Sucesso', pedido ? 'Pedido atualizado!' : 'Pedido criado!');
      onSave?.(savedPedido);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro ao salvar pedido';
      Alert.alert('Erro', errorMessage);
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
        <View style={styles.formContainer}>
          <View style={styles.headerSection}>
            <Text style={styles.stepTitle}>
              {pedido ? '✏️ Editar Pedido' : '📝 Novo Pedido'}
            </Text>
            <Text style={styles.stepSubtitle}>
              {pedido ? 'Atualize os dados do pedido' : 'Preencha os dados do pedido'}
            </Text>
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
          </View>

          <View style={styles.section}>
            <View style={commonStyles.form.field}>
              <Text style={commonStyles.form.label}>Descrição</Text>
              <TextInput
                style={[commonStyles.form.input, { minHeight: 80 }]}
                value={formData.descricao}
                onChangeText={(text) =>
                  setFormData({ ...formData, descricao: text })
                }
                placeholder="Descreva o que será entregue"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Valor do Frete */}
          {calculatedValue !== null && (
            <View style={styles.section}>
              <View style={styles.paymentSummary}>
                <Text style={styles.summaryLabel}>Valor do Frete:</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(calculatedValue)}
                </Text>
                {calculatedDistance !== null && (
                  <Text style={styles.summaryText}>
                    Distância: {calculatedDistance.toFixed(2)} km
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Seleção de Entregador */}
          <View style={styles.section}>
            <View style={commonStyles.form.field}>
              <Text style={commonStyles.form.label}>Entregador *</Text>
              <TouchableOpacity
                style={[
                  commonStyles.form.input,
                  {
                    paddingVertical: 15,
                    justifyContent: 'center',
                    backgroundColor: selectedEntregador ? '#f0f0f0' : '#fff',
                  },
                ]}
                onPress={openEntregadorModal}
              >
                <Text
                  style={{
                    color: selectedEntregador ? '#333' : '#999',
                    fontSize: 16,
                  }}
                >
                  {selectedEntregador
                    ? `${selectedEntregador.nome} - ${selectedEntregador.telefone}`
                    : 'Selecione um entregador'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Botões */}
          <View style={styles.buttonsContainer}>
            {onCancel && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, styles.continueButton]}
              onPress={handleSave}
              disabled={loading || calculating}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.continueButtonText}>
                  {pedido ? 'Salvar' : 'Criar Pedido'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modal para selecionar entregador */}
      <Modal
        visible={showEntregadorModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEntregadorModal(false)}
      >
        <View style={pedidoDetailStyles.modalOverlay}>
          <View style={pedidoDetailStyles.modalContent}>
            <View style={pedidoDetailStyles.modalHeader}>
              <Text style={pedidoDetailStyles.modalTitle}>Selecione o Entregador</Text>
              <TouchableOpacity
                onPress={() => setShowEntregadorModal(false)}
                style={pedidoDetailStyles.modalCloseButton}
              >
                <Text style={pedidoDetailStyles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {loadingEntregadores ? (
              <View style={pedidoDetailStyles.center}>
                <ActivityIndicator size="large" color="#110975" />
                <Text style={pedidoDetailStyles.loadingText}>Carregando entregadores...</Text>
              </View>
            ) : entregadores.length === 0 ? (
              <View style={pedidoDetailStyles.center}>
                <Text style={pedidoDetailStyles.emptyText}>Nenhum entregador disponível</Text>
              </View>
            ) : (
              <FlatList
                data={entregadores}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={entregadoresListStyles.card}
                    onPress={() => handleSelectEntregador(item)}
                  >
                    <View style={entregadoresListStyles.cardHeader}>
                      <Text style={entregadoresListStyles.cardTitle}>{item.nome}</Text>
                    </View>
                    <View style={entregadoresListStyles.cardInfo}>
                      <Text style={entregadoresListStyles.cardLabel}>CPF:</Text>
                      <Text style={entregadoresListStyles.cardValue}>{item.cpf}</Text>
                    </View>
                    <View style={entregadoresListStyles.cardInfo}>
                      <Text style={entregadoresListStyles.cardLabel}>Telefone:</Text>
                      <Text style={entregadoresListStyles.cardValue}>{item.telefone}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={pedidoDetailStyles.modalList}
              />
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

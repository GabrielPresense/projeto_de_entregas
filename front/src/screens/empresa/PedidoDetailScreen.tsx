// Tela para ver detalhes de um pedido
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { pedidosService } from '../../services/pedidos.service';
import { entregadoresService } from '../../services/entregadores.service';
import { trackingService } from '../../services/tracking.service';
import { Pedido, StatusPedido } from '../../types/pedido.types';
import { Entregador } from '../../types/entregador.types';
import { pedidoDetailStyles } from '../../styles/pedidoStyles';
import { entregadoresListStyles } from '../../styles/entregadorStyles';

interface Props {
  pedidoId: number;
  onEdit?: (pedido: Pedido) => void;
  onDelete?: () => void;
  onBack?: () => void;
}

export default function PedidoDetailScreen({
  pedidoId,
  onEdit,
  onDelete,
  onBack,
}: Props) {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showEntregadorModal, setShowEntregadorModal] = useState(false);
  const [entregadores, setEntregadores] = useState<Entregador[]>([]);
  const [loadingEntregadores, setLoadingEntregadores] = useState(false);
  const [despachando, setDespachando] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; timestamp?: string } | null>(null);

  useEffect(() => {
    loadPedido();
  }, [pedidoId]);

  // Conecta ao tracking quando o pedido está em trânsito
  useEffect(() => {
    if (pedido && pedido.status === StatusPedido.EM_TRANSITO) {
      trackingService.connect();
      trackingService.joinTracking(pedido.id, {
        onLocationUpdate: (data) => {
          if (data.pedidoId === pedido.id) {
            setLocation({
              lat: data.latitude,
              lng: data.longitude,
              timestamp: data.timestamp,
            });
            // Atualiza o pedido com a nova localização
            loadPedido();
          }
        },
        onStatusChange: (data) => {
          if (data.pedidoId === pedido.id) {
            loadPedido();
          }
        },
      });
    }

    return () => {
      if (pedido) {
        trackingService.leaveTracking(pedido.id);
      }
    };
  }, [pedido?.id, pedido?.status]);

  const loadPedido = async () => {
    try {
      setLoading(true);
      const dados = await pedidosService.getById(pedidoId);
      setPedido(dados);
      
      // Atualiza a localização se existir
      if (dados.latitudeAtual && dados.longitudeAtual) {
        setLocation({
          lat: parseFloat(dados.latitudeAtual),
          lng: parseFloat(dados.longitudeAtual),
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro ao carregar pedido';
      Alert.alert('Erro', errorMessage);
      onBack?.();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar',
      'Tem certeza que deseja deletar este pedido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await pedidosService.delete(pedidoId);
              Alert.alert('Sucesso', 'Pedido deletado!');
              onDelete?.();
            } catch (error) {
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : 'Erro ao deletar pedido';
              Alert.alert('Erro', errorMessage);
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const handleStatusChange = async (newStatus: StatusPedido) => {
    try {
      const updated = await pedidosService.updateStatus(pedidoId, newStatus);
      setPedido(updated);
      Alert.alert('Sucesso', 'Status atualizado!');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro ao atualizar status';
      Alert.alert('Erro', errorMessage);
    }
  };

  const getStatusLabel = (status: StatusPedido): string => {
    const labels: Record<StatusPedido, string> = {
      [StatusPedido.PENDENTE]: 'Pendente',
      [StatusPedido.CONFIRMADO]: 'Confirmado',
      [StatusPedido.EM_PREPARACAO]: 'Em Preparação',
      [StatusPedido.PRONTO_PARA_ENTREGA]: 'Pronto para Entrega',
      [StatusPedido.EM_TRANSITO]: 'Em Trânsito',
      [StatusPedido.ENTREGUE]: 'Entregue',
      [StatusPedido.CANCELADO]: 'Cancelado',
    };
    return labels[status] || status;
  };

  const formatValor = (valor: string): string => {
    return `R$ ${parseFloat(valor).toFixed(2).replace('.', ',')}`;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Não informado';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

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

  const handleDespacharPedido = async (entregadorId: number) => {
    try {
      setDespachando(true);
      // Atualiza o pedido com o entregador e muda o status para EM_TRANSITO
      const updated = await pedidosService.update(pedido!.id, {
        entregadorId,
        status: StatusPedido.EM_TRANSITO,
      });
      setPedido(updated);
      setShowEntregadorModal(false);
      Alert.alert('Sucesso', 'Pedido despachado e entregador em trânsito!');
      // Conecta ao tracking para receber atualizações de localização
      trackingService.connect();
      trackingService.joinTracking(updated.id, {
        onLocationUpdate: (data) => {
          if (data.pedidoId === updated.id) {
            setLocation({
              lat: data.latitude,
              lng: data.longitude,
              timestamp: data.timestamp,
            });
            loadPedido();
          }
        },
        onStatusChange: (data) => {
          if (data.pedidoId === updated.id) {
            loadPedido();
          }
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro ao despachar pedido';
      Alert.alert('Erro', errorMessage);
    } finally {
      setDespachando(false);
    }
  };

  const openEntregadorModal = () => {
    setShowEntregadorModal(true);
    loadEntregadores();
  };

  const renderEntregadorItem = ({ item }: { item: Entregador }) => (
    <TouchableOpacity
      style={entregadoresListStyles.card}
      onPress={() => handleDespacharPedido(item.id)}
      disabled={despachando}
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
  );

  if (loading) {
    return (
      <View style={pedidoDetailStyles.center}>
        <ActivityIndicator size="large" color="#110975" />
        <Text style={pedidoDetailStyles.loadingText}>Carregando pedido...</Text>
      </View>
    );
  }

  if (!pedido) {
    return (
      <View style={pedidoDetailStyles.center}>
        <Text style={pedidoDetailStyles.errorText}>Pedido não encontrado</Text>
        {onBack && (
          <TouchableOpacity style={pedidoDetailStyles.button} onPress={onBack}>
            <Text style={pedidoDetailStyles.buttonText}>Voltar</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={pedidoDetailStyles.container}>
      <View style={pedidoDetailStyles.content}>
        <View style={pedidoDetailStyles.statusHeader}>
          <Text style={pedidoDetailStyles.pedidoId}>Pedido #{pedido.id}</Text>
          <View
            style={[
              pedidoDetailStyles.statusBadge,
              {
                backgroundColor:
                  pedido.status === StatusPedido.ENTREGUE
                    ? '#34C759'
                    : pedido.status === StatusPedido.CANCELADO
                      ? '#FF3B30'
                      : '#FF9500',
              },
            ]}
          >
            <Text style={pedidoDetailStyles.statusText}>
              {getStatusLabel(pedido.status)}
            </Text>
          </View>
        </View>

        <View style={pedidoDetailStyles.section}>
          <Text style={pedidoDetailStyles.sectionTitle}>Informações</Text>
          <View style={pedidoDetailStyles.infoRow}>
            <Text style={pedidoDetailStyles.infoLabel}>Descrição:</Text>
            <Text style={pedidoDetailStyles.infoValue}>{pedido.descricao}</Text>
          </View>
          <View style={pedidoDetailStyles.infoRow}>
            <Text style={pedidoDetailStyles.infoLabel}>Valor:</Text>
            <Text style={pedidoDetailStyles.infoValue}>{formatValor(pedido.valor)}</Text>
          </View>
        </View>

        <View style={pedidoDetailStyles.section}>
          <Text style={pedidoDetailStyles.sectionTitle}>Endereços</Text>
          <View style={pedidoDetailStyles.infoRow}>
            <Text style={pedidoDetailStyles.infoLabel}>Origem:</Text>
            <Text style={pedidoDetailStyles.infoValue}>{pedido.enderecoOrigem}</Text>
          </View>
          <View style={pedidoDetailStyles.infoRow}>
            <Text style={pedidoDetailStyles.infoLabel}>Destino:</Text>
            <Text style={pedidoDetailStyles.infoValue}>{pedido.enderecoDestino}</Text>
          </View>
        </View>

        {pedido.entregador && (
          <View style={pedidoDetailStyles.section}>
            <Text style={pedidoDetailStyles.sectionTitle}>Entregador</Text>
            <View style={pedidoDetailStyles.infoRow}>
              <Text style={pedidoDetailStyles.infoLabel}>Nome:</Text>
              <Text style={pedidoDetailStyles.infoValue}>{pedido.entregador.nome}</Text>
            </View>
            {pedido.entregador.telefone && (
              <View style={pedidoDetailStyles.infoRow}>
                <Text style={pedidoDetailStyles.infoLabel}>Telefone:</Text>
                <Text style={pedidoDetailStyles.infoValue}>
                  {pedido.entregador.telefone}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Mostra localização quando em trânsito */}
        {pedido.status === StatusPedido.EM_TRANSITO && (
          <View style={pedidoDetailStyles.section}>
            <Text style={pedidoDetailStyles.sectionTitle}>📍 Localização do Entregador</Text>
            {location ? (
              <>
                <View style={{ height: 300, width: '100%', borderRadius: 10, overflow: 'hidden', marginTop: 10 }}>
                  <MapView
                    key={`map-${location.lat}-${location.lng}`}
                    style={{ flex: 1 }}
                    initialRegion={{
                      latitude: location.lat,
                      longitude: location.lng,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                    region={{
                      latitude: location.lat,
                      longitude: location.lng,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                    showsUserLocation={false}
                    showsMyLocationButton={false}
                  >
                    <Marker
                      key={`marker-${location.lat}-${location.lng}`}
                      coordinate={{
                        latitude: location.lat,
                        longitude: location.lng,
                      }}
                      title="Entregador"
                      description={location.timestamp ? `Atualizado: ${new Date(location.timestamp).toLocaleString('pt-BR')}` : 'Localização do entregador'}
                    >
                      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 30 }}>🚗</Text>
                      </View>
                    </Marker>
                  </MapView>
                </View>
                {location.timestamp && (
                  <Text style={{ fontSize: 12, color: '#666', marginTop: 8, textAlign: 'center' }}>
                    Atualizado: {new Date(location.timestamp).toLocaleString('pt-BR')}
                  </Text>
                )}
                <View style={{ marginTop: 10, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 8 }}>
                  <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
                    🟢 Localização atualizada em tempo real
                  </Text>
                </View>
              </>
            ) : (
              <View style={pedidoDetailStyles.infoRow}>
                <Text style={pedidoDetailStyles.infoLabel}>Status:</Text>
                <Text style={[pedidoDetailStyles.infoValue, { color: '#999' }]}>
                  Aguardando atualização de localização...
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={pedidoDetailStyles.section}>
          <Text style={pedidoDetailStyles.sectionTitle}>Datas</Text>
          <View style={pedidoDetailStyles.infoRow}>
            <Text style={pedidoDetailStyles.infoLabel}>Criado em:</Text>
            <Text style={pedidoDetailStyles.infoValue}>{formatDate(pedido.createdAt)}</Text>
          </View>
          {pedido.updatedAt && (
            <View style={pedidoDetailStyles.infoRow}>
              <Text style={pedidoDetailStyles.infoLabel}>Atualizado em:</Text>
              <Text style={pedidoDetailStyles.infoValue}>
                {formatDate(pedido.updatedAt)}
              </Text>
            </View>
          )}
        </View>

        {/* Botão para despachar pedido confirmado */}
        {pedido.status === StatusPedido.CONFIRMADO && (
          <View style={pedidoDetailStyles.actions}>
            <TouchableOpacity
              style={[pedidoDetailStyles.actionButton, pedidoDetailStyles.saveButton]}
              onPress={openEntregadorModal}
            >
              <Text style={pedidoDetailStyles.actionButtonText}>
                Definir Entregador e Despachar
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {onDelete && (
          <View style={pedidoDetailStyles.actions}>
            <TouchableOpacity
              style={[pedidoDetailStyles.actionButton, pedidoDetailStyles.deleteButton]}
              onPress={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={pedidoDetailStyles.actionButtonText}>Deletar</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

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
                renderItem={renderEntregadorItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={pedidoDetailStyles.modalList}
              />
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}



// Tela para rastrear uma entrega em tempo real
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { pedidosService } from '../../services/pedidos.service';
import { trackingService } from '../../services/tracking.service';
import { Pedido, StatusPedido } from '../../types/pedido.types';
import { trackingStyles } from '../../styles/trackingStyles';

export default function TrackingScreen() {
  const [pedidoId, setPedidoId] = useState('');
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    timestamp?: string;
  } | null>(null);

  // Limpa tracking quando sai da tela
  useEffect(() => {
    return () => {
      if (pedido) {
        trackingService.leaveTracking(pedido.id);
      }
    };
  }, [pedido]);

  const buscarPedido = async () => {
    if (!pedidoId.trim()) {
      Alert.alert('Erro', 'Digite o ID do pedido');
      return;
    }

    try {
      setLoading(true);
      const id = parseInt(pedidoId);
      const dados = await pedidosService.getById(id);
      setPedido(dados);

      // Se já tiver localização, mostra
      if (dados.latitudeAtual && dados.longitudeAtual) {
        setLocation({
          lat: parseFloat(dados.latitudeAtual),
          lng: parseFloat(dados.longitudeAtual),
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Pedido não encontrado';
      Alert.alert('Erro', errorMessage);
      setPedido(null);
      setLocation(null);
    } finally {
      setLoading(false);
    }
  };

  const iniciarTracking = () => {
    if (!pedido) return;

    setTracking(true);
    trackingService.connect();

    // Entra no tracking do pedido
    trackingService.joinTracking(pedido.id, {
      onLocationUpdate: (data) => {
        setLocation({
          lat: data.latitude,
          lng: data.longitude,
          timestamp: data.timestamp,
        });
        // Atualiza o status também
        if (pedido) {
          setPedido({ ...pedido, status: data.status as StatusPedido });
        }
      },
      onStatusChange: (data) => {
        if (pedido) {
          setPedido({ ...pedido, status: data.status as StatusPedido });
        }
        Alert.alert('Status Atualizado', `Status: ${data.status}`);
      },
      onError: (error) => {
        Alert.alert('Erro no Tracking', error);
      },
    });
  };

  const pararTracking = () => {
    if (pedido) {
      trackingService.leaveTracking(pedido.id);
    }
    setTracking(false);
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

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Não informado';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  return (
    <ScrollView style={trackingStyles.container}>
      <View style={trackingStyles.content}>
        <View style={trackingStyles.searchSection}>
          <Text style={trackingStyles.label}>ID do Pedido</Text>
          <View style={trackingStyles.searchRow}>
            <TextInput
              style={trackingStyles.input}
              value={pedidoId}
              onChangeText={setPedidoId}
              placeholder="Ex: 1"
              keyboardType="numeric"
              editable={!loading && !tracking}
            />
            <TouchableOpacity
              style={trackingStyles.searchButton}
              onPress={buscarPedido}
              disabled={loading || tracking}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={trackingStyles.searchButtonText}>Buscar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {pedido && (
          <View style={trackingStyles.pedidoSection}>
            <View style={trackingStyles.pedidoHeader}>
              <Text style={trackingStyles.pedidoTitle}>
                Pedido #{pedido.id}
              </Text>
              <View
                style={[
                  trackingStyles.statusBadge,
                  {
                    backgroundColor:
                      pedido.status === StatusPedido.ENTREGUE
                        ? '#34C759'
                        : pedido.status === StatusPedido.CANCELADO
                          ? '#FF3B30'
                          : pedido.status === StatusPedido.EM_TRANSITO
                            ? '#FF9500'
                            : '#999',
                  },
                ]}
              >
                <Text style={trackingStyles.statusText}>
                  {getStatusLabel(pedido.status)}
                </Text>
              </View>
            </View>

            <View style={trackingStyles.infoBox}>
              <Text style={trackingStyles.infoLabel}>Descrição:</Text>
              <Text style={trackingStyles.infoValue}>{pedido.descricao}</Text>
            </View>

            <View style={trackingStyles.infoBox}>
              <Text style={trackingStyles.infoLabel}>De:</Text>
              <Text style={trackingStyles.infoValue}>
                {pedido.enderecoOrigem}
              </Text>
            </View>

            <View style={trackingStyles.infoBox}>
              <Text style={trackingStyles.infoLabel}>Para:</Text>
              <Text style={trackingStyles.infoValue}>
                {pedido.enderecoDestino}
              </Text>
            </View>

            {pedido.entregador && (
              <View style={trackingStyles.infoBox}>
                <Text style={trackingStyles.infoLabel}>Entregador:</Text>
                <Text style={trackingStyles.infoValue}>
                  {pedido.entregador.nome}
                </Text>
              </View>
            )}

            {location && (
              <View style={trackingStyles.locationBox}>
                <Text style={trackingStyles.locationTitle}>
                  📍 Localização Atual
                </Text>
                <View style={trackingStyles.locationInfo}>
                  <Text style={trackingStyles.locationLabel}>Latitude:</Text>
                  <Text style={trackingStyles.locationValue}>
                    {location.lat.toFixed(6)}
                  </Text>
                </View>
                <View style={trackingStyles.locationInfo}>
                  <Text style={trackingStyles.locationLabel}>Longitude:</Text>
                  <Text style={trackingStyles.locationValue}>
                    {location.lng.toFixed(6)}
                  </Text>
                </View>
                {location.timestamp && (
                  <Text style={trackingStyles.locationTime}>
                    Atualizado: {formatDate(location.timestamp)}
                  </Text>
                )}
                <Text style={trackingStyles.locationNote}>
                  💡 A localização é atualizada automaticamente quando o
                  entregador se move
                </Text>
              </View>
            )}

            {!location && pedido.status === StatusPedido.EM_TRANSITO && (
              <View style={trackingStyles.noLocationBox}>
                <Text style={trackingStyles.noLocationText}>
                  ⏳ Aguardando localização do entregador...
                </Text>
              </View>
            )}

            <View style={trackingStyles.actions}>
              {!tracking ? (
                <TouchableOpacity
                  style={trackingStyles.trackButton}
                  onPress={iniciarTracking}
                >
                  <Text style={trackingStyles.trackButtonText}>
                    Iniciar Rastreamento
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={trackingStyles.stopButton}
                  onPress={pararTracking}
                >
                  <Text style={trackingStyles.stopButtonText}>
                    Parar Rastreamento
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {tracking && (
              <View style={trackingStyles.trackingStatus}>
                <View style={trackingStyles.trackingIndicator} />
                <Text style={trackingStyles.trackingText}>
                  Rastreamento ativo - Recebendo atualizações em tempo real
                </Text>
              </View>
            )}
          </View>
        )}

        {!pedido && !loading && (
          <View style={trackingStyles.emptyState}>
            <Text style={trackingStyles.emptyText}>
              Digite o ID do pedido para começar o rastreamento
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}


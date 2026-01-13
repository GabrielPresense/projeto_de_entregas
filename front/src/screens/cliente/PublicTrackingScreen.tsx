import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { publicTrackingStyles as styles } from '../../styles/publicTrackingStyles';
import { pedidosService } from '../../services/pedidos.service';
import { trackingService } from '../../services/tracking.service';
import { Pedido, StatusPedido } from '../../types/pedido.types';
import { commonStyles } from '../../styles/commonStyles';

const { width, height } = Dimensions.get('window');

interface Props {
  onBack?: () => void;
}

export default function PublicTrackingScreen({ }: Props) {
  const [pedidoId, setPedidoId] = useState('');
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; timestamp?: string } | null>(null);

  useEffect(() => {
    // Limpa tracking quando sai da tela
    return () => {
      if (pedido) {
        trackingService.leaveTracking(pedido.id);
      }
    };
  }, [pedido]);

  const buscarPedido = async () => {
    if (!pedidoId.trim()) {
      Alert.alert('Erro', 'Digite o número do pedido');
      return;
    }

    const id = parseInt(pedidoId);
    if (isNaN(id) || id <= 0) {
      Alert.alert('Erro', 'Número do pedido inválido');
      return;
    }

    try {
      setLoading(true);
      
      // Se já estiver rastreando um pedido, sai do tracking anterior
      if (pedido && tracking) {
        trackingService.leaveTracking(pedido.id);
      }
      
      const dados = await pedidosService.getById(id);
      setPedido(dados);

      // Se já tiver localização, mostra
      if (dados.latitudeAtual && dados.longitudeAtual) {
        setLocation({
          lat: parseFloat(dados.latitudeAtual),
          lng: parseFloat(dados.longitudeAtual),
        });
      }

      // Conecta ao tracking
      trackingService.connect();
      trackingService.joinTracking(dados.id, {
        onLocationUpdate: (data) => {
          setLocation({
            lat: data.latitude,
            lng: data.longitude,
            timestamp: new Date().toISOString(),
          });
        },
        onStatusChange: async (data) => {
          // Recarrega o pedido para pegar o status atualizado
          const updated = await pedidosService.getById(data.pedidoId);
          setPedido(updated);
        },
      });
      setTracking(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Pedido não encontrado';
      Alert.alert('Erro', errorMessage);
      setPedido(null);
      setLocation(null);
      setTracking(false);
    } finally {
      setLoading(false);
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

  const getStatusColor = (status: StatusPedido): string => {
    switch (status) {
      case StatusPedido.ENTREGUE:
        return '#34C759';
      case StatusPedido.EM_TRANSITO:
        return '#FF9500';
      case StatusPedido.CANCELADO:
        return '#FF3B30';
      default:
        return '#999';
    }
  };

  const formatValor = (valor: string): string => {
    const num = parseFloat(valor);
    return `R$ ${num.toFixed(2).replace('.', ',')}`;
  };

  return (
    <ScrollView style={commonStyles.container}>
      <View style={styles.content}>
        {!pedido ? (
          <View style={styles.searchContainer}>
            <Text style={styles.searchTitle}>📍 Rastrear Pedido</Text>
            <Text style={styles.searchSubtitle}>Digite o número do pedido para rastrear</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={pedidoId}
                onChangeText={setPedidoId}
                placeholder="Ex: 123"
                keyboardType="numeric"
                autoFocus
              />
              <TouchableOpacity
                style={[styles.searchButton, loading && styles.buttonDisabled]}
                onPress={buscarPedido}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.searchButtonText}>Buscar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.pedidoId}>Pedido #{pedido.id}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(pedido.status) }]}>
                <Text style={styles.statusText}>{getStatusLabel(pedido.status)}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informações do Pedido</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Descrição:</Text>
                <Text style={styles.infoValue}>{pedido.descricao}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Valor:</Text>
                <Text style={styles.infoValue}>{formatValor(pedido.valor)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Destino:</Text>
                <Text style={styles.infoValue}>{pedido.enderecoDestino}</Text>
              </View>
            </View>

            {pedido.entregador && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Entregador</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Nome:</Text>
                  <Text style={styles.infoValue}>{pedido.entregador.nome}</Text>
                </View>
                {pedido.entregador.telefone && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Telefone:</Text>
                    <Text style={styles.infoValue}>{pedido.entregador.telefone}</Text>
                  </View>
                )}
              </View>
            )}

            {location && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📍 Localização do Entregador</Text>
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
                    onRegionChangeComplete={(region) => {
                      // Mantém o zoom quando a localização atualiza
                    }}
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
                {tracking && (
                  <View style={styles.trackingIndicator}>
                    <Text style={styles.trackingText}>🟢 Rastreamento ativo em tempo real</Text>
                  </View>
                )}
              </View>
            )}

            {pedido.status === StatusPedido.ENTREGUE && (
              <View style={[styles.section, styles.successBox]}>
                <Text style={styles.successText}>✅ Pedido Entregue!</Text>
                <Text style={styles.successSubtext}>Seu pedido foi entregue com sucesso.</Text>
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity style={styles.newSearchButton} onPress={() => { 
                if (pedido) {
                  trackingService.leaveTracking(pedido.id);
                }
                setPedido(null); 
                setPedidoId(''); 
                setLocation(null); 
                setTracking(false); 
              }}>
                <Text style={styles.newSearchButtonText}>Rastrear Outro Pedido</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}


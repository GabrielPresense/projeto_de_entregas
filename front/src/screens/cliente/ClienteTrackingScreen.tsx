import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { clienteTrackingStyles as styles } from '../../styles/clienteTrackingStyles';
import { pedidosService } from '../../services/pedidos.service';
import { trackingService } from '../../services/tracking.service';
import { Pedido, StatusPedido } from '../../types/pedido.types';
import { commonStyles } from '../../styles/commonStyles';

const { width, height } = Dimensions.get('window');

interface Props {
  pedido: Pedido;
  onBack?: () => void;
}

export default function ClienteTrackingScreen({ pedido: initialPedido, onBack }: Props) {
  const [pedido, setPedido] = useState<Pedido>(initialPedido);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; timestamp?: string } | null>(null);

  useEffect(() => {
    // Conecta ao tracking quando a tela carrega
    if (pedido) {
      trackingService.connect();
      trackingService.joinTracking(pedido.id, {
        onLocationUpdate: (data) => {
          setLocation({
            lat: data.latitude,
            lng: data.longitude,
            timestamp: data.timestamp,
          });
        },
        onStatusChange: async (data) => {
          const updated = await pedidosService.getById(data.pedidoId);
          setPedido(updated);
        },
      });
      loadPedidoStatus();
    }

    // Limpa quando sai da tela
    return () => {
      if (pedido) {
        trackingService.leaveTracking(pedido.id);
      }
    };
  }, [pedido]);

  const loadPedidoStatus = async () => {
    try {
      setLoading(true);
      const dados = await pedidosService.getById(pedido.id);
      setPedido(dados);

      if (dados.latitudeAtual && dados.longitudeAtual) {
        setLocation({
          lat: parseFloat(dados.latitudeAtual),
          lng: parseFloat(dados.longitudeAtual),
        });
      }
    } catch (error) {
      console.error('Erro ao carregar status do pedido:', error);
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
          </View>
        )}

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#110975" />
            <Text style={styles.loadingText}>Atualizando localização...</Text>
          </View>
        )}

        {pedido.status === StatusPedido.ENTREGUE && (
          <View style={[styles.section, styles.successBox]}>
            <Text style={styles.successText}>✅ Pedido Entregue!</Text>
            <Text style={styles.successSubtext}>Seu pedido foi entregue com sucesso.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}


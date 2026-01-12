import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { entregadorPedidoDetailStyles as styles } from '../../styles/entregadorPedidoDetailStyles';
import * as Location from 'expo-location';
import { pedidosService } from '../../services/pedidos.service';
import { Pedido, StatusPedido } from '../../types/pedido.types';
import { commonStyles } from '../../styles/commonStyles';

interface Props {
  pedido: Pedido;
  onBack?: () => void;
}

export default function EntregadorPedidoDetailScreen({ pedido: initialPedido, onBack }: Props) {
  const [pedido, setPedido] = useState<Pedido>(initialPedido);
  const [loading, setLoading] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);

  useEffect(() => {
    checkLocationPermission();
    loadPedidoStatus();
  }, []);

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
    } catch (error) {
      console.error('Erro ao verificar permissão de localização:', error);
      setLocationPermission(false);
    }
  };

  const loadPedidoStatus = async () => {
    try {
      setLoading(true);
      const dados = await pedidosService.getById(pedido.id);
      setPedido(dados);
    } catch (error) {
      console.error('Erro ao carregar status do pedido:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateLocation = async () => {
    if (!locationPermission) {
      Alert.alert(
        'Permissão Necessária',
        'É necessário permitir o acesso à localização para atualizar sua posição.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Permitir', onPress: checkLocationPermission },
        ]
      );
      return;
    }

    try {
      setUpdatingLocation(true);

      // Obtém a localização atual
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Atualiza a localização do pedido
      await pedidosService.updateLocation(pedido.id, {
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      // Atualiza o pedido localmente
      const updatedPedido = await pedidosService.getById(pedido.id);
      setPedido(updatedPedido);

      Alert.alert('Sucesso', 'Localização atualizada com sucesso!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar localização';
      Alert.alert('Erro', errorMessage);
    } finally {
      setUpdatingLocation(false);
    }
  };

  const updateStatus = async (newStatus: StatusPedido) => {
    try {
      setLoading(true);
      await pedidosService.updateStatus(pedido.id, newStatus);
      const updatedPedido = await pedidosService.getById(pedido.id);
      setPedido(updatedPedido);
      Alert.alert('Sucesso', 'Status atualizado!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar status';
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleIniciarEntrega = () => {
    Alert.alert(
      'Iniciar Entrega',
      'Deseja iniciar a entrega deste pedido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Iniciar',
          onPress: () => updateStatus(StatusPedido.EM_TRANSITO),
        },
      ]
    );
  };

  const handleFinalizarEntrega = () => {
    Alert.alert(
      'Finalizar Entrega',
      'Confirma que o pedido foi entregue?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => updateStatus(StatusPedido.ENTREGUE),
        },
      ]
    );
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

  const podeAtualizarLocalizacao =
    pedido.status === StatusPedido.EM_TRANSITO || pedido.status === StatusPedido.PRONTO_PARA_ENTREGA;

  const podeIniciarEntrega = pedido.status === StatusPedido.PRONTO_PARA_ENTREGA;
  const podeFinalizarEntrega = pedido.status === StatusPedido.EM_TRANSITO;

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
            <Text style={styles.infoLabel}>Origem:</Text>
            <Text style={styles.infoValue}>{pedido.enderecoOrigem}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Destino:</Text>
            <Text style={styles.infoValue}>{pedido.enderecoDestino}</Text>
          </View>
        </View>

        {pedido.latitudeAtual && pedido.longitudeAtual && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Localização Atual</Text>
            <View style={styles.locationBox}>
              <Text style={styles.locationText}>Lat: {parseFloat(pedido.latitudeAtual).toFixed(6)}</Text>
              <Text style={styles.locationText}>Lng: {parseFloat(pedido.longitudeAtual).toFixed(6)}</Text>
            </View>
          </View>
        )}

        {podeAtualizarLocalizacao && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.updateLocationButton, updatingLocation && styles.buttonDisabled]}
              onPress={updateLocation}
              disabled={updatingLocation}
            >
              {updatingLocation ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.updateLocationButtonText}>📍 Atualizar Minha Localização</Text>
                  <Text style={styles.updateLocationSubtext}>Envia sua posição atual para o sistema</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.actions}>
          {podeIniciarEntrega && (
            <TouchableOpacity style={styles.actionButton} onPress={handleIniciarEntrega} disabled={loading}>
              <Text style={styles.actionButtonText}>🚚 Iniciar Entrega</Text>
            </TouchableOpacity>
          )}

          {podeFinalizarEntrega && (
            <TouchableOpacity style={[styles.actionButton, styles.finishButton]} onPress={handleFinalizarEntrega} disabled={loading}>
              <Text style={styles.actionButtonText}>✅ Finalizar Entrega</Text>
            </TouchableOpacity>
          )}

          {pedido.status === StatusPedido.ENTREGUE && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>✅ Pedido Entregue!</Text>
              <Text style={styles.successSubtext}>Esta entrega foi finalizada com sucesso.</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}


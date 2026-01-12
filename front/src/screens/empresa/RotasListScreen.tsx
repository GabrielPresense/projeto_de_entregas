import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { rotasService } from '../../services/rotas.service';
import { Rota, StatusRota } from '../../types/rota.types';
import { rotasListStyles } from '../../styles/rotaStyles';

interface Props {
  onSelectRota?: (rota: Rota) => void;
}

export default function RotasListScreen({ onSelectRota }: Props) {
  const [rotas, setRotas] = useState<Rota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRotas();
  }, []);

  const loadRotas = async () => {
    try {
      setLoading(true);
      setError(null);
      const dados = await rotasService.getAll();
      setRotas(Array.isArray(dados) ? dados : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar rotas';
      setError(errorMessage);
      if (!errorMessage.includes('Network') && !errorMessage.includes('fetch')) {
        Alert.alert('Erro', errorMessage);
      }
      setRotas([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: StatusRota): string => {
    const labels: Record<StatusRota, string> = {
      [StatusRota.PLANEJADA]: 'Planejada',
      [StatusRota.EM_ANDAMENTO]: 'Em Andamento',
      [StatusRota.CONCLUIDA]: 'Concluída',
      [StatusRota.CANCELADA]: 'Cancelada',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: StatusRota): string => {
    switch (status) {
      case StatusRota.CONCLUIDA:
        return '#34C759';
      case StatusRota.EM_ANDAMENTO:
        return '#FF9500';
      case StatusRota.CANCELADA:
        return '#FF3B30';
      default:
        return '#999';
    }
  };

  const renderItem = ({ item }: { item: Rota }) => {
    if (!item || !item.id) return null;
    return (
      <TouchableOpacity style={rotasListStyles.card} onPress={() => onSelectRota?.(item)}>
        <View style={rotasListStyles.cardHeader}>
          <Text style={rotasListStyles.cardTitle}>{item.nome}</Text>
          <View style={[rotasListStyles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={rotasListStyles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>
        <View style={rotasListStyles.cardInfo}>
          <Text style={rotasListStyles.cardLabel}>Descrição:</Text>
          <Text style={rotasListStyles.cardValue} numberOfLines={2}>{item.descricao}</Text>
        </View>
        <View style={rotasListStyles.cardInfo}>
          <Text style={rotasListStyles.cardLabel}>Distância:</Text>
          <Text style={rotasListStyles.cardValue}>{item.distancia} km</Text>
        </View>
        <View style={rotasListStyles.cardInfo}>
          <Text style={rotasListStyles.cardLabel}>Tempo Estimado:</Text>
          <Text style={rotasListStyles.cardValue}>{item.tempoEstimado} minutos</Text>
        </View>
        {item.veiculo && (
          <View style={rotasListStyles.cardInfo}>
            <Text style={rotasListStyles.cardLabel}>Veículo:</Text>
            <Text style={rotasListStyles.cardValue}>{item.veiculo.placa} - {item.veiculo.marca} {item.veiculo.modelo}</Text>
          </View>
        )}
        {item.pedidos && item.pedidos.length > 0 && (
          <View style={rotasListStyles.cardInfo}>
            <Text style={rotasListStyles.cardLabel}>Pedidos:</Text>
            <Text style={rotasListStyles.cardValue}>{item.pedidos.length} pedido(s)</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={rotasListStyles.center}>
        <ActivityIndicator size="large" color="#110975" />
        <Text style={rotasListStyles.loadingText}>Carregando rotas...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={rotasListStyles.center}>
        <Text style={rotasListStyles.errorText}>{error}</Text>
        <TouchableOpacity style={{ marginTop: 20, padding: 15, backgroundColor: '#110975', borderRadius: 8 }} onPress={loadRotas}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (rotas.length === 0) {
    return (
      <View style={rotasListStyles.emptyContainer}>
        <Text style={rotasListStyles.emptyText}>Nenhuma rota cadastrada ainda</Text>
      </View>
    );
  }

  return (
    <FlatList data={rotas} renderItem={renderItem} keyExtractor={(item) => item.id.toString()} contentContainerStyle={rotasListStyles.list} refreshing={loading} onRefresh={loadRotas} />
  );
}


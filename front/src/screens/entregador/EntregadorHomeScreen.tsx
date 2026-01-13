import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { entregadorHomeStyles as styles } from '../../styles/entregadorHomeStyles';
import { pedidosService } from '../../services/pedidos.service';
import { Pedido, StatusPedido } from '../../types/pedido.types';
import { commonStyles } from '../../styles/commonStyles';

interface Props {
  entregadorId: number; // ID do entregador logado
  onSelectPedido?: (pedido: Pedido) => void;
  showHeader?: boolean; // Se deve mostrar o cabeçalho interno
}

export default function EntregadorHomeScreen({ entregadorId, onSelectPedido, showHeader = true }: Props) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPedidos();
  }, [entregadorId]);

  const loadPedidos = async () => {
    try {
      setLoading(true);
      setError(null);
      // Busca todos os pedidos e filtra pelo entregador
      const todosPedidos = await pedidosService.getAll();
      const meusPedidos = todosPedidos.filter(
        (pedido) => pedido.entregador?.id === entregadorId
      );
      setPedidos(meusPedidos);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar pedidos';
      setError(errorMessage);
      if (!errorMessage.includes('Network') && !errorMessage.includes('fetch')) {
        Alert.alert('Erro', errorMessage);
      }
      setPedidos([]);
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
      case StatusPedido.PRONTO_PARA_ENTREGA:
        return '#007AFF';
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

  const renderItem = ({ item }: { item: Pedido }) => {
    if (!item || !item.id) return null;

    const podeAtualizarLocalizacao = 
      item.status === StatusPedido.EM_TRANSITO || 
      item.status === StatusPedido.PRONTO_PARA_ENTREGA;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Pedido #{item.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardDescription} numberOfLines={2}>{item.descricao}</Text>
          <View style={styles.cardInfo}>
            <Text style={styles.cardLabel}>Valor:</Text>
            <Text style={styles.cardValue}>{formatValor(item.valor)}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardLabel}>Destino:</Text>
            <Text style={styles.cardValue} numberOfLines={2}>{item.enderecoDestino}</Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.detailButton} 
            onPress={() => onSelectPedido?.(item)}
          >
            <Text style={styles.detailButtonText}>Ver Detalhes</Text>
          </TouchableOpacity>
          {podeAtualizarLocalizacao && (
            <View style={styles.locationIndicator}>
              <Text style={styles.locationText}>📍 Ativo</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={commonStyles.center}>
        <ActivityIndicator size="large" color="#110975" />
        <Text style={commonStyles.loadingText}>Carregando suas entregas...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={commonStyles.center}>
        <Text style={commonStyles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadPedidos}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (pedidos.length === 0) {
    return (
      <View style={commonStyles.center}>
        <Text style={styles.emptyIcon}>📦</Text>
        <Text style={commonStyles.emptyText}>Você não tem entregas no momento</Text>
        <Text style={styles.emptySubtext}>Novas entregas aparecerão aqui quando forem atribuídas a você</Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Minhas Entregas</Text>
          <Text style={styles.headerSubtitle}>{pedidos.length} entrega(s) atribuída(s)</Text>
        </View>
      )}
      <FlatList
        data={pedidos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={commonStyles.list}
        refreshing={loading}
        onRefresh={loadPedidos}
      />
    </View>
  );
}


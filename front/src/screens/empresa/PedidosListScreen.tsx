// Tela para listar todos os pedidos
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { pedidosService } from '../../services/pedidos.service';
import { Pedido, StatusPedido } from '../../types/pedido.types';
import { pedidosListStyles } from '../../styles/pedidoStyles';

interface Props {
  navigation?: any; // Vai ser tipado quando tiver navegação configurada
  onSelectPedido?: (pedido: Pedido) => void;
}

type FiltroStatus = 'todos' | StatusPedido.CONFIRMADO | StatusPedido.PENDENTE | StatusPedido.EM_TRANSITO | StatusPedido.ENTREGUE;

export default function PedidosListScreen({ onSelectPedido }: Props) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos');

  // Busca os pedidos quando a tela carrega
  useEffect(() => {
    loadPedidos();
  }, []);

  const loadPedidos = async () => {
    try {
      setLoading(true);
      setError(null);
      const dados = await pedidosService.getAll();
      // Garante que dados é um array
      setPedidos(Array.isArray(dados) ? dados : []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao carregar pedidos';
      setError(errorMessage);
      // Só mostra alert se não for erro de conexão (evita spam)
      if (!errorMessage.includes('Network') && !errorMessage.includes('fetch')) {
        Alert.alert('Erro', errorMessage);
      }
      // Limpa a lista em caso de erro
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  };

  // Função pra formatar o status
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

  // Função pra formatar valor
  const formatValor = (valor: string): string => {
    try {
      const num = parseFloat(valor);
      if (isNaN(num)) return 'R$ 0,00';
      return `R$ ${num.toFixed(2).replace('.', ',')}`;
    } catch {
      return 'R$ 0,00';
    }
  };

  // Filtra os pedidos baseado no status selecionado
  const pedidosFiltrados = filtroStatus === 'todos'
    ? pedidos
    : pedidos.filter((pedido) => pedido.status === filtroStatus);

  // Renderiza cada item da lista
  const renderItem = ({ item }: { item: Pedido }) => {
    // Proteção contra dados inválidos
    if (!item || !item.id) {
      return null;
    }

    return (
      <TouchableOpacity
        style={pedidosListStyles.card}
        onPress={() => onSelectPedido?.(item)}
      >
        <View style={pedidosListStyles.cardHeader}>
          <Text style={pedidosListStyles.cardTitle}>Pedido #{item.id}</Text>
          <View
            style={[
              pedidosListStyles.statusBadge,
              {
                backgroundColor:
                  item.status === StatusPedido.ENTREGUE
                    ? '#34C759'
                    : item.status === StatusPedido.CANCELADO
                      ? '#FF3B30'
                      : '#FF9500',
              },
            ]}
          >
            <Text style={pedidosListStyles.statusText}>
              {getStatusLabel(item.status || StatusPedido.PENDENTE)}
            </Text>
          </View>
        </View>

        <Text style={pedidosListStyles.cardDescription}>
          {item.descricao || 'Sem descrição'}
        </Text>

        <View style={pedidosListStyles.cardInfo}>
          <Text style={pedidosListStyles.cardLabel}>De:</Text>
          <Text style={pedidosListStyles.cardValue}>
            {item.enderecoOrigem || 'Não informado'}
          </Text>
        </View>

        <View style={pedidosListStyles.cardInfo}>
          <Text style={pedidosListStyles.cardLabel}>Para:</Text>
          <Text style={pedidosListStyles.cardValue}>
            {item.enderecoDestino || 'Não informado'}
          </Text>
        </View>

        <View style={pedidosListStyles.cardFooter}>
          <Text style={pedidosListStyles.cardValor}>
            {formatValor(item.valor || '0')}
          </Text>
          {item.entregador && (
            <Text style={pedidosListStyles.cardEntregador}>
              Entregador: {item.entregador.nome}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={pedidosListStyles.center}>
        <ActivityIndicator size="large" color="#110975" />
        <Text style={pedidosListStyles.loadingText}>Carregando pedidos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={pedidosListStyles.container}>
        <View style={pedidosListStyles.center}>
          <Text style={pedidosListStyles.errorText}>
            {error.includes('Network') || error.includes('fetch')
              ? 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.'
              : error}
          </Text>
          <TouchableOpacity style={pedidosListStyles.retryButton} onPress={loadPedidos}>
            <Text style={pedidosListStyles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={pedidosListStyles.container}>
      {/* Filtros de Status */}
      <View style={pedidosListStyles.filtersContainer}>
        <TouchableOpacity
          style={[
            pedidosListStyles.filterButton,
            filtroStatus === 'todos' && pedidosListStyles.filterButtonActive,
          ]}
          onPress={() => setFiltroStatus('todos')}
        >
          <Text
            style={[
              pedidosListStyles.filterButtonText,
              filtroStatus === 'todos' && pedidosListStyles.filterButtonTextActive,
            ]}
          >
            Todos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            pedidosListStyles.filterButton,
            filtroStatus === StatusPedido.CONFIRMADO && pedidosListStyles.filterButtonActive,
          ]}
          onPress={() => setFiltroStatus(StatusPedido.CONFIRMADO)}
        >
          <Text
            style={[
              pedidosListStyles.filterButtonText,
              filtroStatus === StatusPedido.CONFIRMADO && pedidosListStyles.filterButtonTextActive,
            ]}
          >
            Confirmado
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            pedidosListStyles.filterButton,
            filtroStatus === StatusPedido.PENDENTE && pedidosListStyles.filterButtonActive,
          ]}
          onPress={() => setFiltroStatus(StatusPedido.PENDENTE)}
        >
          <Text
            style={[
              pedidosListStyles.filterButtonText,
              filtroStatus === StatusPedido.PENDENTE && pedidosListStyles.filterButtonTextActive,
            ]}
          >
            Pendente
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            pedidosListStyles.filterButton,
            filtroStatus === StatusPedido.EM_TRANSITO && pedidosListStyles.filterButtonActive,
          ]}
          onPress={() => setFiltroStatus(StatusPedido.EM_TRANSITO)}
        >
          <Text
            style={[
              pedidosListStyles.filterButtonText,
              filtroStatus === StatusPedido.EM_TRANSITO && pedidosListStyles.filterButtonTextActive,
            ]}
          >
            Em Trânsito
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            pedidosListStyles.filterButton,
            filtroStatus === StatusPedido.ENTREGUE && pedidosListStyles.filterButtonActive,
          ]}
          onPress={() => setFiltroStatus(StatusPedido.ENTREGUE)}
        >
          <Text
            style={[
              pedidosListStyles.filterButtonText,
              filtroStatus === StatusPedido.ENTREGUE && pedidosListStyles.filterButtonTextActive,
            ]}
          >
            Entregue
          </Text>
        </TouchableOpacity>
      </View>

      {pedidosFiltrados.length === 0 ? (
        <View style={pedidosListStyles.center}>
          <Text style={pedidosListStyles.emptyText}>
            {pedidos.length === 0
              ? 'Nenhum pedido encontrado'
              : filtroStatus === 'todos'
                ? 'Nenhum pedido encontrado'
                : `Nenhum pedido com status "${getStatusLabel(filtroStatus)}"`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={pedidosFiltrados}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={pedidosListStyles.list}
          refreshing={loading}
          onRefresh={loadPedidos}
        />
      )}
    </View>
  );
}



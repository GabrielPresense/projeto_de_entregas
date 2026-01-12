// Tela para listar todos os entregadores
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { entregadoresService } from '../../services/entregadores.service';
import { Entregador, StatusEntregador } from '../../types/entregador.types';
import { entregadoresListStyles } from '../../styles/entregadorStyles';

interface Props {
  onSelectEntregador?: (entregador: Entregador) => void;
  onAddEntregador?: () => void;
  refreshTrigger?: number; // Para forçar atualização quando voltar da tela de detalhes
}

export default function EntregadoresListScreen({
  onSelectEntregador,
  onAddEntregador,
  refreshTrigger,
}: Props) {
  const [entregadores, setEntregadores] = useState<Entregador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEntregadores();
  }, []);

  // Atualiza a lista quando refreshTrigger mudar (após deletar, por exemplo)
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      loadEntregadores();
    }
  }, [refreshTrigger]);

  const loadEntregadores = async () => {
    try {
      setLoading(true);
      setError(null);
      const dados = await entregadoresService.getAll();
      setEntregadores(Array.isArray(dados) ? dados : []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao carregar entregadores';
      setError(errorMessage);
      if (!errorMessage.includes('Network') && !errorMessage.includes('fetch')) {
        Alert.alert('Erro', errorMessage);
      }
      setEntregadores([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: StatusEntregador): string => {
    const labels: Record<StatusEntregador, string> = {
      [StatusEntregador.DISPONIVEL]: 'Disponível',
      [StatusEntregador.EM_ENTREGA]: 'Em Entrega',
      [StatusEntregador.INDISPONIVEL]: 'Indisponível',
    };
    return labels[status] || status;
  };

  const renderItem = ({ item }: { item: Entregador }) => {
    if (!item || !item.id) {
      return null;
    }

    return (
      <TouchableOpacity
        style={entregadoresListStyles.card}
        onPress={() => onSelectEntregador?.(item)}
      >
        <View style={entregadoresListStyles.cardHeader}>
          <Text style={entregadoresListStyles.cardTitle}>{item.nome}</Text>
          <View
            style={[
              entregadoresListStyles.statusBadge,
              {
                backgroundColor:
                  item.status === StatusEntregador.DISPONIVEL
                    ? '#34C759'
                    : item.status === StatusEntregador.EM_ENTREGA
                      ? '#FF9500'
                      : '#FF3B30',
              },
            ]}
          >
            <Text style={entregadoresListStyles.statusText}>
              {getStatusLabel(item.status || StatusEntregador.DISPONIVEL)}
            </Text>
          </View>
        </View>

        <View style={entregadoresListStyles.cardInfo}>
          <Text style={entregadoresListStyles.cardLabel}>CPF:</Text>
          <Text style={entregadoresListStyles.cardValue}>{item.cpf}</Text>
        </View>

        <View style={entregadoresListStyles.cardInfo}>
          <Text style={entregadoresListStyles.cardLabel}>Telefone:</Text>
          <Text style={entregadoresListStyles.cardValue}>{item.telefone}</Text>
        </View>

        <View style={entregadoresListStyles.cardInfo}>
          <Text style={entregadoresListStyles.cardLabel}>Email:</Text>
          <Text style={entregadoresListStyles.cardValue}>{item.email}</Text>
        </View>

        <View style={entregadoresListStyles.cardFooter}>
          {item.veiculos && item.veiculos.length > 0 && (
            <Text style={entregadoresListStyles.cardVeiculos}>
              {item.veiculos.length} veículo(s)
            </Text>
          )}
          {item.pedidos && item.pedidos.length > 0 && (
            <Text style={entregadoresListStyles.cardPedidos}>
              {item.pedidos.length} pedido(s)
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={entregadoresListStyles.center}>
        <ActivityIndicator size="large" color="#110975" />
        <Text style={entregadoresListStyles.loadingText}>
          Carregando entregadores...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={entregadoresListStyles.container}>
        <View style={entregadoresListStyles.center}>
          <Text style={entregadoresListStyles.errorText}>
            {error.includes('Network') || error.includes('fetch')
              ? 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.'
              : error}
          </Text>
          <TouchableOpacity
            style={entregadoresListStyles.retryButton}
            onPress={loadEntregadores}
          >
            <Text style={entregadoresListStyles.retryButtonText}>
              Tentar novamente
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={entregadoresListStyles.container}>
      {onAddEntregador && (
        <View style={entregadoresListStyles.refreshHeader}>
          <TouchableOpacity
            style={entregadoresListStyles.refreshButton}
            onPress={onAddEntregador}
          >
            <Text style={entregadoresListStyles.refreshButtonText}>
              + Adicionar Entregador
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {entregadores.length === 0 ? (
        <View style={entregadoresListStyles.center}>
          <Text style={entregadoresListStyles.emptyText}>
            Nenhum entregador encontrado
          </Text>
        </View>
      ) : (
        <FlatList
          data={entregadores}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={entregadoresListStyles.list}
          refreshing={loading}
          onRefresh={loadEntregadores}
        />
      )}
    </View>
  );
}


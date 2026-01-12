import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { rotasService } from '../../services/rotas.service';
import { Rota, StatusRota } from '../../types/rota.types';
import { rotaDetailStyles } from '../../styles/rotaStyles';

interface Props {
  rotaId: number;
  onEdit?: (rota: Rota) => void;
  onDelete?: () => void;
  onBack?: () => void;
}

export default function RotaDetailScreen({ rotaId, onEdit, onDelete, onBack }: Props) {
  const [rota, setRota] = useState<Rota | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadRota();
  }, [rotaId]);

  const loadRota = async () => {
    try {
      setLoading(true);
      const dados = await rotasService.getById(rotaId);
      setRota(dados);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar rota';
      Alert.alert('Erro', errorMessage);
      onBack?.();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Confirmar Exclusão', 'Tem certeza que deseja excluir esta rota?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeleting(true);
            await rotasService.delete(rotaId);
            Alert.alert('Sucesso', 'Rota excluída!');
            onDelete?.();
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir rota';
            Alert.alert('Erro', errorMessage);
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
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

  if (loading) {
    return (
      <View style={rotaDetailStyles.center}>
        <ActivityIndicator size="large" color="#110975" />
        <Text style={rotaDetailStyles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (!rota) {
    return (
      <View style={rotaDetailStyles.center}>
        <Text style={rotaDetailStyles.errorText}>Rota não encontrada</Text>
      </View>
    );
  }

  return (
    <ScrollView style={rotaDetailStyles.container}>
      <View style={rotaDetailStyles.detailContainer}>
        <View style={rotaDetailStyles.section}>
          <Text style={rotaDetailStyles.sectionTitle}>Informações da Rota</Text>
          <View style={rotaDetailStyles.infoRow}>
            <Text style={rotaDetailStyles.infoLabel}>Nome:</Text>
            <Text style={rotaDetailStyles.infoValue}>{rota.nome}</Text>
          </View>
          <View style={rotaDetailStyles.infoRow}>
            <Text style={rotaDetailStyles.infoLabel}>Descrição:</Text>
            <Text style={rotaDetailStyles.infoValue}>{rota.descricao}</Text>
          </View>
          <View style={rotaDetailStyles.infoRow}>
            <Text style={rotaDetailStyles.infoLabel}>Status:</Text>
            <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: getStatusColor(rota.status) }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{getStatusLabel(rota.status)}</Text>
            </View>
          </View>
          <View style={rotaDetailStyles.infoRow}>
            <Text style={rotaDetailStyles.infoLabel}>Distância:</Text>
            <Text style={rotaDetailStyles.infoValue}>{rota.distancia} km</Text>
          </View>
          <View style={rotaDetailStyles.infoRow}>
            <Text style={rotaDetailStyles.infoLabel}>Tempo Estimado:</Text>
            <Text style={rotaDetailStyles.infoValue}>{rota.tempoEstimado} minutos</Text>
          </View>
          {rota.veiculo && (
            <View style={rotaDetailStyles.infoRow}>
              <Text style={rotaDetailStyles.infoLabel}>Veículo:</Text>
              <Text style={rotaDetailStyles.infoValue}>{rota.veiculo.placa} - {rota.veiculo.marca} {rota.veiculo.modelo}</Text>
            </View>
          )}
          {rota.createdAt && (
            <View style={rotaDetailStyles.infoRow}>
              <Text style={rotaDetailStyles.infoLabel}>Criada em:</Text>
              <Text style={rotaDetailStyles.infoValue}>{new Date(rota.createdAt).toLocaleString('pt-BR')}</Text>
            </View>
          )}
        </View>
        {rota.pedidos && rota.pedidos.length > 0 && (
          <View style={rotaDetailStyles.section}>
            <Text style={rotaDetailStyles.sectionTitle}>Pedidos</Text>
            {rota.pedidos.map((pedido) => (
              <View key={pedido.id} style={{ padding: 10, backgroundColor: '#f0f0f0', borderRadius: 8, marginBottom: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '600' }}>Pedido #{pedido.id} - {pedido.descricao}</Text>
                <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{pedido.enderecoDestino}</Text>
                <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Status: {pedido.status}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={rotaDetailStyles.actionButtons}>
          <TouchableOpacity style={rotaDetailStyles.editButton} onPress={() => onEdit?.(rota)}>
            <Text style={rotaDetailStyles.editButtonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={rotaDetailStyles.deleteButton} onPress={handleDelete} disabled={deleting}>
            {deleting ? <ActivityIndicator color="#fff" /> : <Text style={rotaDetailStyles.deleteButtonText}>Excluir</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}


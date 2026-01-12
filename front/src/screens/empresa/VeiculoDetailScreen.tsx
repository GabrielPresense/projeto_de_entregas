import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { veiculosService } from '../../services/veiculos.service';
import { Veiculo, TipoVeiculo } from '../../types/veiculo.types';
import { veiculoDetailStyles } from '../../styles/veiculoStyles';

interface Props {
  veiculoId: number;
  onEdit?: (veiculo: Veiculo) => void;
  onDelete?: () => void;
  onBack?: () => void;
}

export default function VeiculoDetailScreen({ veiculoId, onEdit, onDelete, onBack }: Props) {
  const [veiculo, setVeiculo] = useState<Veiculo | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadVeiculo();
  }, [veiculoId]);

  const loadVeiculo = async () => {
    try {
      setLoading(true);
      const dados = await veiculosService.getById(veiculoId);
      setVeiculo(dados);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar veículo';
      Alert.alert('Erro', errorMessage);
      onBack?.();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Confirmar Exclusão', 'Tem certeza que deseja excluir este veículo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeleting(true);
            await veiculosService.delete(veiculoId);
            Alert.alert('Sucesso', 'Veículo excluído!');
            onDelete?.();
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir veículo';
            Alert.alert('Erro', errorMessage);
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  const getTipoLabel = (tipo: TipoVeiculo): string => {
    const labels: Record<TipoVeiculo, string> = {
      [TipoVeiculo.MOTO]: 'Moto',
      [TipoVeiculo.CARRO]: 'Carro',
      [TipoVeiculo.VAN]: 'Van',
      [TipoVeiculo.CAMINHAO]: 'Caminhão',
    };
    return labels[tipo] || tipo;
  };

  if (loading) {
    return (
      <View style={veiculoDetailStyles.center}>
        <ActivityIndicator size="large" color="#110975" />
        <Text style={veiculoDetailStyles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (!veiculo) {
    return (
      <View style={veiculoDetailStyles.center}>
        <Text style={veiculoDetailStyles.errorText}>Veículo não encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView style={veiculoDetailStyles.container}>
      <View style={veiculoDetailStyles.detailContainer}>
        <View style={veiculoDetailStyles.section}>
          <Text style={veiculoDetailStyles.sectionTitle}>Informações do Veículo</Text>
          <View style={veiculoDetailStyles.infoRow}>
            <Text style={veiculoDetailStyles.infoLabel}>Placa:</Text>
            <Text style={veiculoDetailStyles.infoValue}>{veiculo.placa}</Text>
          </View>
          <View style={veiculoDetailStyles.infoRow}>
            <Text style={veiculoDetailStyles.infoLabel}>Marca:</Text>
            <Text style={veiculoDetailStyles.infoValue}>{veiculo.marca}</Text>
          </View>
          <View style={veiculoDetailStyles.infoRow}>
            <Text style={veiculoDetailStyles.infoLabel}>Modelo:</Text>
            <Text style={veiculoDetailStyles.infoValue}>{veiculo.modelo}</Text>
          </View>
          <View style={veiculoDetailStyles.infoRow}>
            <Text style={veiculoDetailStyles.infoLabel}>Tipo:</Text>
            <Text style={veiculoDetailStyles.infoValue}>{getTipoLabel(veiculo.tipo)}</Text>
          </View>
          <View style={veiculoDetailStyles.infoRow}>
            <Text style={veiculoDetailStyles.infoLabel}>Capacidade:</Text>
            <Text style={veiculoDetailStyles.infoValue}>{veiculo.capacidade} kg</Text>
          </View>
          <View style={veiculoDetailStyles.infoRow}>
            <Text style={veiculoDetailStyles.infoLabel}>Status:</Text>
            <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: veiculo.disponivel ? '#34C759' : '#FF3B30' }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{veiculo.disponivel ? 'Disponível' : 'Indisponível'}</Text>
            </View>
          </View>
        </View>
        {veiculo.entregadores && veiculo.entregadores.length > 0 && (
          <View style={veiculoDetailStyles.section}>
            <Text style={veiculoDetailStyles.sectionTitle}>Entregadores</Text>
            {veiculo.entregadores.map((entregador) => (
              <View key={entregador.id} style={{ padding: 10, backgroundColor: '#f0f0f0', borderRadius: 8, marginBottom: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '600' }}>{entregador.nome}</Text>
                {entregador.email && <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{entregador.email}</Text>}
              </View>
            ))}
          </View>
        )}
        <View style={veiculoDetailStyles.actionButtons}>
          <TouchableOpacity style={veiculoDetailStyles.editButton} onPress={() => onEdit?.(veiculo)}>
            <Text style={veiculoDetailStyles.editButtonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={veiculoDetailStyles.deleteButton} onPress={handleDelete} disabled={deleting}>
            {deleting ? <ActivityIndicator color="#fff" /> : <Text style={veiculoDetailStyles.deleteButtonText}>Excluir</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}


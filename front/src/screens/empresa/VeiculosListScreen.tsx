import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { veiculosService } from '../../services/veiculos.service';
import { Veiculo, TipoVeiculo } from '../../types/veiculo.types';
import { veiculosListStyles } from '../../styles/veiculoStyles';

interface Props {
  onSelectVeiculo?: (veiculo: Veiculo) => void;
  onAddVeiculo?: () => void;
}

export default function VeiculosListScreen({ onSelectVeiculo, onAddVeiculo }: Props) {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVeiculos();
  }, []);

  const loadVeiculos = async () => {
    try {
      setLoading(true);
      setError(null);
      const dados = await veiculosService.getAll();
      setVeiculos(Array.isArray(dados) ? dados : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar veículos';
      setError(errorMessage);
      if (!errorMessage.includes('Network') && !errorMessage.includes('fetch')) {
        Alert.alert('Erro', errorMessage);
      }
      setVeiculos([]);
    } finally {
      setLoading(false);
    }
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

  const renderItem = ({ item }: { item: Veiculo }) => {
    if (!item || !item.id) return null;
    return (
      <TouchableOpacity style={veiculosListStyles.card} onPress={() => onSelectVeiculo?.(item)}>
        <View style={veiculosListStyles.cardHeader}>
          <Text style={veiculosListStyles.cardTitle}>{item.marca} {item.modelo}</Text>
          <View style={[veiculosListStyles.statusBadge, { backgroundColor: item.disponivel ? '#34C759' : '#FF3B30' }]}>
            <Text style={veiculosListStyles.statusText}>{item.disponivel ? 'Disponível' : 'Indisponível'}</Text>
          </View>
        </View>
        <View style={veiculosListStyles.cardInfo}>
          <Text style={veiculosListStyles.cardLabel}>Placa:</Text>
          <Text style={veiculosListStyles.cardValue}>{item.placa}</Text>
        </View>
        <View style={veiculosListStyles.cardInfo}>
          <Text style={veiculosListStyles.cardLabel}>Tipo:</Text>
          <Text style={veiculosListStyles.cardValue}>{getTipoLabel(item.tipo)}</Text>
        </View>
        <View style={veiculosListStyles.cardInfo}>
          <Text style={veiculosListStyles.cardLabel}>Capacidade:</Text>
          <Text style={veiculosListStyles.cardValue}>{item.capacidade} kg</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={veiculosListStyles.center}>
        <ActivityIndicator size="large" color="#110975" />
        <Text style={veiculosListStyles.loadingText}>Carregando veículos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={veiculosListStyles.center}>
        <Text style={veiculosListStyles.errorText}>{error}</Text>
        <TouchableOpacity style={{ marginTop: 20, padding: 15, backgroundColor: '#110975', borderRadius: 8 }} onPress={loadVeiculos}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={veiculosListStyles.container}>
      {onAddVeiculo && (
        <View style={veiculosListStyles.refreshHeader}>
          <TouchableOpacity
            style={veiculosListStyles.refreshButton}
            onPress={onAddVeiculo}
          >
            <Text style={veiculosListStyles.refreshButtonText}>
              + Adicionar Veículo
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {veiculos.length === 0 ? (
        <View style={veiculosListStyles.emptyContainer}>
          <Text style={veiculosListStyles.emptyText}>Nenhum veículo cadastrado ainda</Text>
        </View>
      ) : (
        <FlatList
          data={veiculos}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={veiculosListStyles.list}
          refreshing={loading}
          onRefresh={loadVeiculos}
        />
      )}
    </View>
  );
}


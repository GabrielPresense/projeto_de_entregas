// Tela para ver detalhes de um entregador
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { entregadoresService } from '../../services/entregadores.service';
import { Entregador, StatusEntregador } from '../../types/entregador.types';
import { entregadorDetailStyles } from '../../styles/entregadorStyles';

interface Props {
  entregadorId: number;
  onEdit?: (entregador: Entregador) => void;
  onDelete?: () => void;
  onBack?: () => void;
}

export default function EntregadorDetailScreen({
  entregadorId,
  onEdit,
  onDelete,
  onBack,
}: Props) {
  const [entregador, setEntregador] = useState<Entregador | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadEntregador();
  }, [entregadorId]);

  const loadEntregador = async () => {
    try {
      setLoading(true);
      const dados = await entregadoresService.getById(entregadorId);
      setEntregador(dados);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erro ao carregar entregador';
      Alert.alert('Erro', errorMessage);
      onBack?.();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar',
      'Tem certeza que deseja deletar este entregador?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await entregadoresService.delete(entregadorId);
              Alert.alert('Sucesso', 'Entregador deletado!');
              onDelete?.();
            } catch (error) {
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : 'Erro ao deletar entregador';
              Alert.alert('Erro', errorMessage);
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const getStatusLabel = (status: StatusEntregador): string => {
    const labels: Record<StatusEntregador, string> = {
      [StatusEntregador.DISPONIVEL]: 'Disponível',
      [StatusEntregador.EM_ENTREGA]: 'Em Entrega',
      [StatusEntregador.INDISPONIVEL]: 'Indisponível',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <View style={entregadorDetailStyles.center}>
        <ActivityIndicator size="large" color="#110975" />
        <Text style={entregadorDetailStyles.loadingText}>
          Carregando entregador...
        </Text>
      </View>
    );
  }

  if (!entregador) {
    return (
      <View style={entregadorDetailStyles.center}>
        <Text style={entregadorDetailStyles.errorText}>
          Entregador não encontrado
        </Text>
        {onBack && (
          <TouchableOpacity
            style={entregadorDetailStyles.button}
            onPress={onBack}
          >
            <Text style={entregadorDetailStyles.buttonText}>Voltar</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={entregadorDetailStyles.container}>
      <View style={entregadorDetailStyles.content}>
        <View style={entregadorDetailStyles.statusHeader}>
          <Text style={entregadorDetailStyles.nome}>{entregador.nome}</Text>
          <View
            style={[
              entregadorDetailStyles.statusBadge,
              {
                backgroundColor:
                  entregador.status === StatusEntregador.DISPONIVEL
                    ? '#34C759'
                    : entregador.status === StatusEntregador.EM_ENTREGA
                      ? '#FF9500'
                      : '#FF3B30',
              },
            ]}
          >
            <Text style={entregadorDetailStyles.statusText}>
              {getStatusLabel(entregador.status)}
            </Text>
          </View>
        </View>

        <View style={entregadorDetailStyles.section}>
          <Text style={entregadorDetailStyles.sectionTitle}>
            Informações Pessoais
          </Text>
          <View style={entregadorDetailStyles.infoRow}>
            <Text style={entregadorDetailStyles.infoLabel}>CPF:</Text>
            <Text style={entregadorDetailStyles.infoValue}>
              {entregador.cpf}
            </Text>
          </View>
          <View style={entregadorDetailStyles.infoRow}>
            <Text style={entregadorDetailStyles.infoLabel}>Telefone:</Text>
            <Text style={entregadorDetailStyles.infoValue}>
              {entregador.telefone}
            </Text>
          </View>
          <View style={entregadorDetailStyles.infoRow}>
            <Text style={entregadorDetailStyles.infoLabel}>Email:</Text>
            <Text style={entregadorDetailStyles.infoValue}>
              {entregador.email}
            </Text>
          </View>
        </View>

        {entregador.veiculos && entregador.veiculos.length > 0 && (
          <View style={entregadorDetailStyles.section}>
            <Text style={entregadorDetailStyles.sectionTitle}>Veículos</Text>
            {entregador.veiculos.map((veiculo) => (
              <View
                key={veiculo.id}
                style={entregadorDetailStyles.veiculoItem}
              >
                <Text style={entregadorDetailStyles.veiculoPlaca}>
                  {veiculo.placa}
                </Text>
                <Text style={entregadorDetailStyles.veiculoInfo}>
                  {veiculo.marca} {veiculo.modelo}
                </Text>
              </View>
            ))}
          </View>
        )}

        {entregador.pedidos && entregador.pedidos.length > 0 && (
          <View style={entregadorDetailStyles.section}>
            <Text style={entregadorDetailStyles.sectionTitle}>Pedidos</Text>
            <Text style={entregadorDetailStyles.pedidosCount}>
              {entregador.pedidos.length} pedido(s) associado(s)
            </Text>
          </View>
        )}

        <View style={entregadorDetailStyles.actions}>
          {onEdit && (
            <TouchableOpacity
              style={[
                entregadorDetailStyles.actionButton,
                entregadorDetailStyles.editButton,
              ]}
              onPress={() => onEdit(entregador)}
            >
              <Text style={entregadorDetailStyles.actionButtonText}>
                Editar
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              entregadorDetailStyles.actionButton,
              entregadorDetailStyles.deleteButton,
            ]}
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={entregadorDetailStyles.actionButtonText}>
                Deletar
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}


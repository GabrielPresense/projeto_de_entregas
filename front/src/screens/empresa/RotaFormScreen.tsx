import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, FlatList } from 'react-native';
import { rotasService } from '../../services/rotas.service';
import { veiculosService } from '../../services/veiculos.service';
import { Rota, CreateRotaDto, UpdateRotaDto, StatusRota } from '../../types/rota.types';
import { Veiculo } from '../../types/veiculo.types';
import { rotaFormStyles } from '../../styles/rotaStyles';

interface Props {
  rota?: Rota;
  onSave?: (rota: Rota) => void;
  onCancel?: () => void;
}

export default function RotaFormScreen({ rota, onSave, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const [loadingVeiculos, setLoadingVeiculos] = useState(false);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [selectedVeiculo, setSelectedVeiculo] = useState<Veiculo | null>(null);
  const [showVeiculosModal, setShowVeiculosModal] = useState(false);
  const [formData, setFormData] = useState<CreateRotaDto>({
    nome: rota?.nome || '',
    descricao: rota?.descricao || '',
    status: rota?.status || StatusRota.PLANEJADA,
    distancia: rota?.distancia || '',
    tempoEstimado: rota?.tempoEstimado || 0,
    veiculoId: rota?.veiculo?.id || 0,
  });

  useEffect(() => {
    loadVeiculos();
    if (rota?.veiculo?.id) {
      loadVeiculoCompleto(rota.veiculo.id);
    }
  }, []);

  useEffect(() => {
    if (formData.veiculoId) {
      loadVeiculoCompleto(formData.veiculoId);
    } else {
      setSelectedVeiculo(null);
    }
  }, [formData.veiculoId]);

  const loadVeiculos = async () => {
    try {
      setLoadingVeiculos(true);
      const dados = await veiculosService.getAll();
      setVeiculos(dados);
    } catch (error) {
      console.error('Erro ao carregar veículos:', error);
    } finally {
      setLoadingVeiculos(false);
    }
  };

  const loadVeiculoCompleto = async (id: number) => {
    try {
      const veiculo = await veiculosService.getById(id);
      setSelectedVeiculo(veiculo);
    } catch (error) {
      console.error('Erro ao carregar veículo:', error);
    }
  };

  const handleSelectVeiculo = (veiculo: Veiculo) => {
    setFormData({ ...formData, veiculoId: veiculo.id });
    setSelectedVeiculo(veiculo);
    setShowVeiculosModal(false);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      Alert.alert('Erro', 'Nome é obrigatório');
      return;
    }
    if (!formData.descricao.trim()) {
      Alert.alert('Erro', 'Descrição é obrigatória');
      return;
    }
    if (!formData.distancia.trim()) {
      Alert.alert('Erro', 'Distância é obrigatória');
      return;
    }
    if (formData.tempoEstimado <= 0) {
      Alert.alert('Erro', 'Tempo estimado deve ser maior que zero');
      return;
    }
    if (!formData.veiculoId || formData.veiculoId === 0) {
      Alert.alert('Erro', 'Veículo é obrigatório');
      return;
    }

    try {
      setLoading(true);
      let savedRota: Rota;
      if (rota) {
        const updateData: UpdateRotaDto = { nome: formData.nome, descricao: formData.descricao, status: formData.status, distancia: formData.distancia, tempoEstimado: formData.tempoEstimado, veiculoId: formData.veiculoId };
        savedRota = await rotasService.update(rota.id, updateData);
      } else {
        savedRota = await rotasService.create(formData);
      }
      Alert.alert('Sucesso', rota ? 'Rota atualizada!' : 'Rota criada!');
      onSave?.(savedRota);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar rota';
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { label: 'Planejada', value: StatusRota.PLANEJADA },
    { label: 'Em Andamento', value: StatusRota.EM_ANDAMENTO },
    { label: 'Concluída', value: StatusRota.CONCLUIDA },
    { label: 'Cancelada', value: StatusRota.CANCELADA },
  ];

  return (
    <ScrollView style={rotaFormStyles.container}>
      <View style={rotaFormStyles.form}>
        <View style={rotaFormStyles.field}>
          <Text style={rotaFormStyles.label}>Nome *</Text>
          <TextInput style={rotaFormStyles.input} value={formData.nome} onChangeText={(text) => setFormData({ ...formData, nome: text })} placeholder="Ex: Rota Centro-Sul" />
        </View>
        <View style={rotaFormStyles.field}>
          <Text style={rotaFormStyles.label}>Descrição *</Text>
          <TextInput style={rotaFormStyles.input} value={formData.descricao} onChangeText={(text) => setFormData({ ...formData, descricao: text })} placeholder="Ex: Rota que cobre o centro e região sul" multiline />
        </View>
        <View style={rotaFormStyles.field}>
          <Text style={rotaFormStyles.label}>Distância (km) *</Text>
          <TextInput style={rotaFormStyles.input} value={formData.distancia} onChangeText={(text) => setFormData({ ...formData, distancia: text })} placeholder="Ex: 25.5" keyboardType="decimal-pad" />
        </View>
        <View style={rotaFormStyles.field}>
          <Text style={rotaFormStyles.label}>Tempo Estimado (minutos) *</Text>
          <TextInput style={rotaFormStyles.input} value={formData.tempoEstimado.toString()} onChangeText={(text) => { const num = parseInt(text) || 0; setFormData({ ...formData, tempoEstimado: num }); }} placeholder="Ex: 45" keyboardType="numeric" />
        </View>
        <View style={rotaFormStyles.field}>
          <Text style={rotaFormStyles.label}>Veículo *</Text>
          <TouchableOpacity style={rotaFormStyles.input} onPress={() => setShowVeiculosModal(true)}>
            <Text style={{ color: selectedVeiculo ? '#333' : '#999', fontSize: 16 }}>
              {selectedVeiculo ? `${selectedVeiculo.placa} - ${selectedVeiculo.marca} ${selectedVeiculo.modelo}` : 'Selecione um veículo'}
            </Text>
          </TouchableOpacity>
          {selectedVeiculo && (
            <TouchableOpacity style={{ marginTop: 5 }} onPress={() => { setFormData({ ...formData, veiculoId: 0 }); setSelectedVeiculo(null); }}>
              <Text style={{ color: '#FF3B30', fontSize: 12 }}>Remover veículo</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={rotaFormStyles.field}>
          <Text style={rotaFormStyles.label}>Status</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {statusOptions.map((status) => (
              <TouchableOpacity
                key={status.value}
                style={{ padding: 12, borderRadius: 8, backgroundColor: formData.status === status.value ? '#110975' : '#f0f0f0', minWidth: 100, alignItems: 'center' }}
                onPress={() => setFormData({ ...formData, status: status.value })}
              >
                <Text style={{ color: formData.status === status.value ? '#fff' : '#333', fontWeight: '600', fontSize: 12 }}>{status.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={rotaFormStyles.buttons}>
          {onCancel && (
            <TouchableOpacity style={[rotaFormStyles.formButton, rotaFormStyles.cancelButton]} onPress={onCancel} disabled={loading}>
              <Text style={rotaFormStyles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[rotaFormStyles.formButton, rotaFormStyles.saveButton]} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={rotaFormStyles.saveButtonText}>Salvar</Text>}
          </TouchableOpacity>
        </View>
      </View>
      <Modal visible={showVeiculosModal} animationType="slide" transparent={true} onRequestClose={() => setShowVeiculosModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Selecione um Veículo</Text>
              <TouchableOpacity onPress={() => setShowVeiculosModal(false)}>
                <Text style={{ fontSize: 24, color: '#666' }}>✕</Text>
              </TouchableOpacity>
            </View>
            {loadingVeiculos ? (
              <ActivityIndicator size="large" color="#110975" />
            ) : (
              <FlatList
                data={veiculos}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity style={{ padding: 15, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }} onPress={() => handleSelectVeiculo(item)}>
                    <Text style={{ fontSize: 16, fontWeight: '600' }}>{item.placa} - {item.marca} {item.modelo}</Text>
                    <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Tipo: {item.tipo} | {item.disponivel ? 'Disponível' : 'Indisponível'}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}


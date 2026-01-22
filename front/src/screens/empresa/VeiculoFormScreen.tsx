import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { veiculosService } from '../../services/veiculos.service';
import { Veiculo, CreateVeiculoDto, UpdateVeiculoDto, TipoVeiculo } from '../../types/veiculo.types';
import { veiculoFormStyles } from '../../styles/veiculoStyles';

interface Props {
  veiculo?: Veiculo;
  onSave?: (veiculo: Veiculo) => void;
  onCancel?: () => void;
}

export default function VeiculoFormScreen({ veiculo, onSave, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateVeiculoDto>({
    placa: veiculo?.placa || '',
    modelo: veiculo?.modelo || '',
    marca: veiculo?.marca || '',
    tipo: veiculo?.tipo || TipoVeiculo.CARRO,
    capacidade: veiculo?.capacidade || 0,
    disponivel: veiculo?.disponivel ?? true,
  });

  const handleSave = async () => {
    if (!formData.placa.trim()) {
      Alert.alert('Erro', 'Placa é obrigatória');
      return;
    }
    if (!formData.modelo.trim()) {
      Alert.alert('Erro', 'Modelo é obrigatório');
      return;
    }
    if (!formData.marca.trim()) {
      Alert.alert('Erro', 'Marca é obrigatória');
      return;
    }
    if (formData.capacidade <= 0) {
      Alert.alert('Erro', 'Capacidade deve ser maior que zero');
      return;
    }

    try {
      setLoading(true);
      let savedVeiculo: Veiculo;
      if (veiculo) {
        const updateData: UpdateVeiculoDto = { placa: formData.placa, modelo: formData.modelo, marca: formData.marca, tipo: formData.tipo, capacidade: formData.capacidade, disponivel: formData.disponivel };
        savedVeiculo = await veiculosService.update(veiculo.id, updateData);
      } else {
        savedVeiculo = await veiculosService.create(formData);
      }
      Alert.alert('Sucesso', veiculo ? 'Veículo atualizado!' : 'Veículo criado!');
      onSave?.(savedVeiculo);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar veículo';
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const tiposVeiculo = [
    { label: 'Moto', value: TipoVeiculo.MOTO },
    { label: 'Carro', value: TipoVeiculo.CARRO },
    { label: 'Van', value: TipoVeiculo.VAN },
    { label: 'Caminhão', value: TipoVeiculo.CAMINHAO },
  ];

  return (
    <ScrollView style={veiculoFormStyles.container}>
      <View style={veiculoFormStyles.form}>
        <View style={veiculoFormStyles.field}>
          <Text style={veiculoFormStyles.label}>Placa *</Text>
          <TextInput 
            style={veiculoFormStyles.input} 
            value={formData.placa} 
            onChangeText={(text) => setFormData({ ...formData, placa: text.toUpperCase() })} 
            placeholder="Ex: ABC1234" 
            maxLength={7}
            autoCorrect={false}
            autoCapitalize="characters"
            autoComplete="off"
          />
        </View>
        <View style={veiculoFormStyles.field}>
          <Text style={veiculoFormStyles.label}>Marca *</Text>
          <TextInput style={veiculoFormStyles.input} value={formData.marca} onChangeText={(text) => setFormData({ ...formData, marca: text })} placeholder="Ex: Honda" />
        </View>
        <View style={veiculoFormStyles.field}>
          <Text style={veiculoFormStyles.label}>Modelo *</Text>
          <TextInput style={veiculoFormStyles.input} value={formData.modelo} onChangeText={(text) => setFormData({ ...formData, modelo: text })} placeholder="Ex: Civic" />
        </View>
        <View style={veiculoFormStyles.field}>
          <Text style={veiculoFormStyles.label}>Tipo *</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {tiposVeiculo.map((tipo) => (
              <TouchableOpacity
                key={tipo.value}
                style={{ padding: 12, borderRadius: 8, backgroundColor: formData.tipo === tipo.value ? '#110975' : '#f0f0f0', minWidth: 80, alignItems: 'center' }}
                onPress={() => setFormData({ ...formData, tipo: tipo.value })}
              >
                <Text style={{ color: formData.tipo === tipo.value ? '#fff' : '#333', fontWeight: '600' }}>{tipo.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={veiculoFormStyles.field}>
          <Text style={veiculoFormStyles.label}>Capacidade (kg) *</Text>
          <TextInput style={veiculoFormStyles.input} value={formData.capacidade.toString()} onChangeText={(text) => { const num = parseInt(text) || 0; setFormData({ ...formData, capacidade: num }); }} placeholder="Ex: 500" keyboardType="numeric" />
        </View>
        <View style={veiculoFormStyles.field}>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#f0f0f0', borderRadius: 8 }} onPress={() => setFormData({ ...formData, disponivel: !formData.disponivel })}>
            <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: formData.disponivel ? '#34C759' : '#999', backgroundColor: formData.disponivel ? '#34C759' : '#fff', marginRight: 12, justifyContent: 'center', alignItems: 'center' }}>
              {formData.disponivel && <Text style={{ color: '#fff', fontSize: 16 }}>✓</Text>}
            </View>
            <Text style={{ fontSize: 16, color: '#333' }}>Disponível</Text>
          </TouchableOpacity>
        </View>
        <View style={veiculoFormStyles.buttons}>
          {onCancel && (
            <TouchableOpacity style={[veiculoFormStyles.formButton, veiculoFormStyles.cancelButton]} onPress={onCancel} disabled={loading}>
              <Text style={veiculoFormStyles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[veiculoFormStyles.formButton, veiculoFormStyles.saveButton]} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={veiculoFormStyles.saveButtonText}>Salvar</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}


// Tela para criar ou editar um entregador
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { entregadoresService } from '../../services/entregadores.service';
import {
  Entregador,
  CreateEntregadorDto,
  UpdateEntregadorDto,
  StatusEntregador,
} from '../../types/entregador.types';
import { commonStylesWithForm as commonStyles } from '../../styles/commonStyles';
import { clienteSolicitarPedidoStyles as styles } from '../../styles/clienteSolicitarPedidoStyles';

interface Props {
  entregador?: Entregador;
  onSave?: (entregador: Entregador) => void;
  onCancel?: () => void;
}

export default function EntregadorFormScreen({
  entregador,
  onSave,
  onCancel,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateEntregadorDto>({
    nome: entregador?.nome || '',
    cpf: entregador?.cpf || '',
    telefone: entregador?.telefone || '',
    email: entregador?.email || '',
    status: entregador?.status || StatusEntregador.DISPONIVEL,
    temCarroProprio: entregador?.temCarroProprio ?? false,
  });

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      Alert.alert('Erro', 'Nome é obrigatório');
      return;
    }
    if (!formData.cpf.trim()) {
      Alert.alert('Erro', 'CPF é obrigatório');
      return;
    }
    if (!formData.telefone.trim()) {
      Alert.alert('Erro', 'Telefone é obrigatório');
      return;
    }
    if (!formData.email.trim()) {
      Alert.alert('Erro', 'Email é obrigatório');
      return;
    }

    try {
      setLoading(true);
      let savedEntregador: Entregador;

      if (entregador) {
        const updateData: UpdateEntregadorDto = {
          nome: formData.nome,
          cpf: formData.cpf,
          telefone: formData.telefone,
          email: formData.email,
          status: formData.status,
          temCarroProprio: formData.temCarroProprio,
        };
        savedEntregador = await entregadoresService.update(
          entregador.id,
          updateData,
        );
      } else {
        savedEntregador = await entregadoresService.create(formData);
      }

      Alert.alert(
        'Sucesso',
        entregador ? 'Entregador atualizado!' : 'Entregador criado!',
      );
      onSave?.(savedEntregador);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erro ao salvar entregador';
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formContainer}>
          <View style={styles.headerSection}>
            <Text style={styles.stepTitle}>
              {entregador ? '✏️ Editar Entregador' : 'Novo Entregador'}
            </Text>
            <Text style={styles.stepSubtitle}>
              {entregador
                ? 'Atualize os dados do entregador'
                : 'Preencha os dados do entregador'}
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>👤</Text>
              <Text style={styles.sectionTitle}>Dados Pessoais</Text>
            </View>

            <View style={commonStyles.field}>
              <Text style={commonStyles.label}>Nome *</Text>
              <TextInput
                style={commonStyles.input}
                value={formData.nome}
                onChangeText={(text) => setFormData({ ...formData, nome: text })}
                placeholder="Ex: João Silva"
              />
            </View>

            <View style={commonStyles.field}>
              <Text style={commonStyles.label}>CPF *</Text>
              <TextInput
                style={commonStyles.input}
                value={formData.cpf}
                onChangeText={(text) => setFormData({ ...formData, cpf: text })}
                placeholder="Ex: 123.456.789-00"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>📞</Text>
              <Text style={styles.sectionTitle}>Contato</Text>
            </View>

            <View style={commonStyles.field}>
              <Text style={commonStyles.label}>Telefone *</Text>
              <TextInput
                style={commonStyles.input}
                value={formData.telefone}
                onChangeText={(text) =>
                  setFormData({ ...formData, telefone: text })
                }
                placeholder="Ex: (44) 99999-9999"
                keyboardType="phone-pad"
              />
            </View>

            <View style={commonStyles.field}>
              <Text style={commonStyles.label}>Email *</Text>
              <TextInput
                style={commonStyles.input}
                value={formData.email}
                onChangeText={(text) =>
                  setFormData({ ...formData, email: text })
                }
                placeholder="Ex: joao@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🚗</Text>
              <Text style={styles.sectionTitle}>Veículo</Text>
            </View>

            <View style={[commonStyles.field, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
              <Text style={[commonStyles.label, { flex: 1 }]}>Tem carro próprio?</Text>
              <Switch
                value={formData.temCarroProprio}
                onValueChange={(value) =>
                  setFormData({ ...formData, temCarroProprio: value })
                }
                trackColor={{ false: '#ccc', true: '#34C759' }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <View style={styles.buttonsContainer}>
            {onCancel && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, styles.continueButton]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.continueButtonText}>
                  {entregador ? 'Salvar' : 'Criar Entregador'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { entregadorLoginStyles as styles } from '../../styles/entregadorLoginStyles';
import { authService, LoginCredentials } from '../../services/auth.service';
import { commonStyles } from '../../styles/commonStyles';

interface Props {
  onLoginSuccess: (entregadorId: number, primeiroLogin?: boolean) => void;
  onBack: () => void;
}

export default function EntregadorLoginScreen({ onLoginSuccess, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');

  const handleLogin = async () => {
    if (!cpf.trim()) {
      Alert.alert('Erro', 'Digite seu CPF');
      return;
    }
    if (!senha.trim()) {
      Alert.alert('Erro', 'Digite sua senha');
      return;
    }

    try {
      setLoading(true);
      const response = await authService.login({ cpf, senha });

      if (response.success && response.entregador.id) {
        // Passa o entregadorId e primeiroLogin para o App.tsx
        onLoginSuccess(response.entregador.id, response.primeiroLogin);
      } else {
        Alert.alert('Erro', response.message || 'CPF ou senha inválidos');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer login';
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCPF = (text: string) => {
    // Remove tudo que não é número
    const numbers = text.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limited = numbers.slice(0, 11);
    
    // Aplica a máscara
    if (limited.length <= 3) {
      return limited;
    } else if (limited.length <= 6) {
      return `${limited.slice(0, 3)}.${limited.slice(3)}`;
    } else if (limited.length <= 9) {
      return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`;
    } else {
      return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9, 11)}`;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>🚚 Login Entregador</Text>
          <Text style={styles.subtitle}>Digite seu CPF para acessar</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>CPF *</Text>
            <TextInput
              style={styles.input}
              value={cpf}
              onChangeText={(text) => setCpf(formatCPF(text))}
              placeholder="000.000.000-00"
              keyboardType="numeric"
              maxLength={14}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Senha *</Text>
            <TextInput
              style={styles.input}
              value={senha}
              onChangeText={setSenha}
              placeholder="Digite sua senha"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


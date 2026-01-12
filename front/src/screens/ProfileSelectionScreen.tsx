import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { profileSelectionStyles as styles } from '../styles/profileSelectionStyles';

interface Props {
  onSelectProfile: (profile: 'admin' | 'cliente' | 'entregador') => void;
}

export default function ProfileSelectionScreen({ onSelectProfile }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📦 Sistema de Entregas</Text>
        <Text style={styles.subtitle}>Selecione seu perfil</Text>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={[styles.profileButton, styles.adminButton]} onPress={() => onSelectProfile('admin')}>
          <Text style={styles.profileIcon}>👔</Text>
          <Text style={styles.profileTitle}>Administrador</Text>
          <Text style={styles.profileDescription}>Gerencie pedidos, entregadores, veículos e rotas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.profileButton, styles.clienteButton]} onPress={() => onSelectProfile('cliente')}>
          <Text style={styles.profileIcon}>👤</Text>
          <Text style={styles.profileTitle}>Cliente</Text>
          <Text style={styles.profileDescription}>Rastreie seu pedido pelo número (sem login necessário)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.profileButton, styles.entregadorButton]} onPress={() => onSelectProfile('entregador')}>
          <Text style={styles.profileIcon}>🚚</Text>
          <Text style={styles.profileTitle}>Entregador</Text>
          <Text style={styles.profileDescription}>Visualize suas entregas e atualize sua localização</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { clienteMenuStyles as styles } from '../../styles/clienteMenuStyles';

interface Props {
  onSolicitarPedido: () => void;
  onRastrearPedido: () => void;
  showHeader?: boolean;
}

export default function ClienteMenuScreen({ onSolicitarPedido, onRastrearPedido, showHeader = true }: Props) {
  return (
    <View style={[styles.container, !showHeader && { paddingTop: 0 }]}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.title}>👤 Área do Cliente</Text>
          <Text style={styles.subtitle}>Escolha uma opção</Text>
        </View>
      )}
      {!showHeader && (
        <View style={{ alignItems: 'center', marginBottom: 30, paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 16, color: '#666' }}>Escolha uma opção</Text>
        </View>
      )}

      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={[styles.menuButton, styles.solicitarButton]} onPress={onSolicitarPedido}>
          <Text style={styles.menuIcon}>📝</Text>
          <Text style={styles.menuTitle}>Solicitar Pedido</Text>
          <Text style={styles.menuDescription}>Faça uma nova solicitação de entrega</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuButton, styles.rastrearButton]} onPress={onRastrearPedido}>
          <Text style={styles.menuIcon}>📍</Text>
          <Text style={styles.menuTitle}>Rastrear Pedido</Text>
          <Text style={styles.menuDescription}>Acompanhe seu pedido em tempo real</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


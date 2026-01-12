import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { dashboardStatsStyles as styles } from '../styles/dashboardStatsStyles';
import { pedidosService } from '../services/pedidos.service';
import { Pedido, StatusPedido } from '../types/pedido.types';

interface DashboardStats {
  totalHoje: number;
  emAndamento: number;
  entregues: number;
  pendentes: number;
}

export default function DashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({ totalHoje: 0, emAndamento: 0, entregues: 0, pendentes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const pedidos = await pedidosService.getAll();
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const pedidosHoje = pedidos.filter((pedido: Pedido) => {
        const dataPedido = new Date(pedido.createdAt);
        dataPedido.setHours(0, 0, 0, 0);
        return dataPedido.getTime() === hoje.getTime();
      });
      const totalHoje = pedidosHoje.length;
      const emAndamento = pedidosHoje.filter((p: Pedido) => p.status === StatusPedido.EM_TRANSITO || p.status === StatusPedido.EM_PREPARACAO || p.status === StatusPedido.PRONTO_PARA_ENTREGA).length;
      const entregues = pedidosHoje.filter((p: Pedido) => p.status === StatusPedido.ENTREGUE).length;
      const pendentes = pedidosHoje.filter((p: Pedido) => p.status === StatusPedido.PENDENTE).length;
      setStats({ totalHoje, emAndamento, entregues, pendentes });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#110975" />
        <Text style={styles.loadingText}>Carregando estatísticas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Estatísticas Detalhadas</Text>
      <View style={styles.row}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.emAndamento}</Text>
          <Text style={styles.statLabel}>Em Andamento</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.entregues}</Text>
          <Text style={styles.statLabel}>Entregues</Text>
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.pendentes}</Text>
          <Text style={styles.statLabel}>Pendentes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalHoje}</Text>
          <Text style={styles.statLabel}>Total Hoje</Text>
        </View>
      </View>
    </View>
  );
}


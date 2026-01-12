import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { totalHojeStyles as styles } from '../styles/totalHojeStyles';
import { pedidosService } from '../services/pedidos.service';
import { Pedido } from '../types/pedido.types';

export default function TotalHoje() {
  const [valorTotalHoje, setValorTotalHoje] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadValorTotalHoje();
  }, []);

  const loadValorTotalHoje = async () => {
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
      const valorTotal = pedidosHoje.reduce((total: number, p: Pedido) => {
        const valor = parseFloat(p.valor) || 0;
        return total + valor;
      }, 0);
      setValorTotalHoje(valorTotal);
    } catch (error) {
      console.error('Erro ao carregar valor total de hoje:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#110975" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Valor Total Hoje</Text>
        <Text style={styles.value}>{formatCurrency(valorTotalHoje)}</Text>
      </View>
    </View>
  );
}


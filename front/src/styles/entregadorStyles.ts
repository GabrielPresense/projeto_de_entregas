import { StyleSheet } from 'react-native';
import { commonStyles } from './commonStyles';

// Estilos específicos para Entregadores + estilos compartilhados
export const entregadorStyles = StyleSheet.create({
  // Herda todos os estilos comuns
  ...commonStyles,

  // ========== Estilos Específicos de Entregadores ==========
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cardVeiculos: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  cardPedidos: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  statusHeader: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  nome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  veiculoItem: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 8,
  },
  veiculoPlaca: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  veiculoInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  pedidosCount: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
});

// Aliases para compatibilidade com importações antigas
export const entregadoresListStyles = entregadorStyles;
export const entregadorFormStyles = entregadorStyles;
export const entregadorDetailStyles = entregadorStyles;

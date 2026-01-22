import { StyleSheet } from 'react-native';
import { commonStyles } from './commonStyles';

// Estilos específicos para Pedidos + estilos compartilhados
export const pedidoStyles = StyleSheet.create({
  // Herda todos os estilos comuns
  ...commonStyles,

  // ========== Estilos Específicos de Pedidos ==========
  cardLabel: {
    // Override: largura menor para pedidos
    fontSize: 14,
    color: '#999',
    width: 50, // Específico para pedidos
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cardValor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#110975',
  },
  cardEntregador: {
    fontSize: 12,
    color: '#666',
  },
  statusHeader: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  pedidoId: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  // Estilos para modal de seleção de entregador
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalCloseText: {
    fontSize: 24,
    color: '#666',
  },
  modalList: {
    padding: 15,
  },
  saveButton: {
    backgroundColor: '#110975',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  // Estilos para filtros de status
  filtersContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 0,
    marginTop: -1, // Remove a linha do header acima
    paddingVertical: 12, // Padding vertical fixo no container
    height: 60, // Altura fixa: 12 (top) + 36 (botão) + 12 (bottom) = 60
    minHeight: 60, // Garante altura mínima
    maxHeight: 60, // Garante altura máxima
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 0,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1a5f1a',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    overflow: 'hidden',
    flexDirection: 'row',
    marginVertical: 0,
    minWidth: 100,
  },
  filterButtonActive: {
    paddingHorizontal: 16,
    paddingVertical: 0,
    borderRadius: 20,
    backgroundColor: '#1a5f1a',
    borderWidth: 1,
    borderColor: '#1a5f1a',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    overflow: 'hidden',
    flexDirection: 'row',
    marginVertical: 0,
    minWidth: 100,
  },
  filterButtonText: {
    fontSize: 13,
    color: '#b0b0b0',
    fontWeight: '500',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 13,
    marginVertical: 0,
    paddingVertical: 0,
  },
  filterButtonTextActive: {
    fontSize: 13,
    color: '#4ade80',
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 13,
    marginVertical: 0,
    paddingVertical: 0,
  },
  // Estilos para botão de deletar pedidos
  deleteButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

// Aliases para compatibilidade com importações antigas
export const pedidosListStyles = pedidoStyles;
export const pedidoFormStyles = pedidoStyles;
export const pedidoDetailStyles = pedidoStyles;

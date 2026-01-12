import { StyleSheet } from 'react-native';
import {
  sharedCard,
  sharedCardHeader,
  sharedCardTitle,
  sharedStatusBadge,
  sharedStatusText,
  sharedSection,
  sharedSectionTitle,
  sharedInfoRow,
  sharedInfoLabel,
  sharedInfoValue,
  sharedPrimaryButton,
  sharedPrimaryButtonText,
} from './sharedStyles';

// Estilos compartilhados entre todas as telas CRUD
// Economiza código e mantém consistência visual

// Estilos do Formulário (agrupados)
const formStyles = StyleSheet.create({
  padding: {
    padding: 20,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    gap: 10,
  },
  formButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#110975',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});

export const commonStyles = StyleSheet.create({
  // ========== Estilos Gerais ==========
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },

  // ========== Estilos da Lista ==========
  list: {
    padding: 15,
  },
  card: sharedCard,
  cardHeader: {
    ...sharedCardHeader,
    marginBottom: 10,
  },
  cardTitle: {
    ...sharedCardTitle,
    flex: 1,
  },
  statusBadge: sharedStatusBadge,
  statusText: sharedStatusText,
  cardInfo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 14,
    color: '#999',
    width: 100,
  },
  cardValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  refreshHeader: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  refreshButton: {
    padding: 10,
    backgroundColor: '#110975',
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#110975',
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },

  // ========== Estilos da Tela de Detalhes ==========
  detailContainer: {
    padding: 20,
  },
  content: {
    padding: 20,
  },
  section: sharedSection,
  sectionTitle: sharedSectionTitle,
  infoRow: sharedInfoRow,
  infoLabel: {
    ...sharedInfoLabel,
    width: 120,
  },
  infoValue: sharedInfoValue,
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#110975',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    ...sharedPrimaryButton,
    padding: 15,
    marginTop: 10,
  },
  buttonText: {
    ...sharedPrimaryButtonText,
    fontSize: 16,
  },
});

// Exporta commonStyles com formStyles incluído
export const commonStylesWithForm = {
  ...commonStyles,
  form: formStyles,
};

// Para compatibilidade, também adiciona ao commonStyles original
(commonStyles as any).form = formStyles;

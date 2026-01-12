import { StyleSheet } from 'react-native';
import {
  sharedSection,
  sharedSectionTitle,
  sharedInfoRow,
  sharedInfoLabel,
  sharedInfoValue,
  sharedStatusBadge,
  sharedStatusText,
  sharedPrimaryButton,
  sharedPrimaryButtonText,
} from './sharedStyles';

export const entregadorPedidoDetailStyles = StyleSheet.create({
  content: {
    padding: 20,
  },
  header: {
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
  statusBadge: {
    ...sharedStatusBadge,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusText: {
    ...sharedStatusText,
    fontSize: 14,
  },
  section: sharedSection,
  sectionTitle: sharedSectionTitle,
  infoRow: sharedInfoRow,
  infoLabel: sharedInfoLabel,
  infoValue: sharedInfoValue,
  locationBox: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  updateLocationButton: {
    ...sharedPrimaryButton,
    padding: 20,
    borderRadius: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  updateLocationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  updateLocationSubtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  actions: {
    marginTop: 10,
    marginBottom: 20,
  },
  actionButton: {
    ...sharedPrimaryButton,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  finishButton: {
    ...sharedPrimaryButton,
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  actionButtonText: {
    ...sharedPrimaryButtonText,
    fontSize: 16,
  },
  successBox: {
    backgroundColor: '#E8F5E9',
    padding: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#34C759',
    alignItems: 'center',
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34C759',
    marginBottom: 5,
  },
  successSubtext: {
    fontSize: 14,
    color: '#666',
  },
});


import { StyleSheet } from 'react-native';
import {
  sharedSection,
  sharedSectionTitle,
  sharedInfoRow,
  sharedInfoLabel,
  sharedInfoValue,
  sharedStatusBadge,
  sharedStatusText,
} from './sharedStyles';

export const clienteTrackingStyles = StyleSheet.create({
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
  timestampText: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 14,
  },
  successBox: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#34C759',
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


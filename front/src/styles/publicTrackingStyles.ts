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

export const publicTrackingStyles = StyleSheet.create({
  content: {
    padding: 20,
  },
  searchContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    marginTop: 50,
  },
  searchTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  searchSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 15,
  },
  searchButton: {
    backgroundColor: '#110975',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
  trackingIndicator: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
    alignItems: 'center',
  },
  trackingText: {
    color: '#34C759',
    fontSize: 12,
    fontWeight: '600',
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
  actions: {
    marginTop: 20,
    marginBottom: 20,
  },
  newSearchButton: {
    ...sharedPrimaryButton,
    padding: 15,
    marginBottom: 10,
  },
  newSearchButtonText: sharedPrimaryButtonText,
});


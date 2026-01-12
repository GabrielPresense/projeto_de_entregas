import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

// ========== Estilos Compartilhados Reutilizáveis ==========
// Funções utilitárias para criar estilos comuns e evitar duplicação

/**
 * Estilo padrão de card usado em listas
 */
export const sharedCard: ViewStyle = {
  backgroundColor: '#fff',
  borderRadius: 10,
  padding: 15,
  marginBottom: 15,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
};

/**
 * Estilo padrão de header de tela
 */
export const sharedHeader: ViewStyle = {
  backgroundColor: '#fff',
  padding: 20,
  borderBottomWidth: 1,
  borderBottomColor: '#e0e0e0',
};

/**
 * Estilo padrão de título de header
 */
export const sharedHeaderTitle: TextStyle = {
  fontSize: 24,
  fontWeight: 'bold',
  color: '#333',
  marginBottom: 5,
};

/**
 * Estilo padrão de subtítulo de header
 */
export const sharedHeaderSubtitle: TextStyle = {
  fontSize: 14,
  color: '#666',
};

/**
 * Estilo padrão de card header (dentro do card)
 */
export const sharedCardHeader: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 15,
};

/**
 * Estilo padrão de título do card
 */
export const sharedCardTitle: TextStyle = {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#333',
};

/**
 * Estilo padrão de badge de status
 */
export const sharedStatusBadge: ViewStyle = {
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 12,
};

/**
 * Estilo padrão de texto de status
 */
export const sharedStatusText: TextStyle = {
  color: '#fff',
  fontSize: 12,
  fontWeight: '600',
};

/**
 * Estilo padrão de corpo do card
 */
export const sharedCardBody: ViewStyle = {
  marginBottom: 15,
};

/**
 * Estilo padrão de descrição do card
 */
export const sharedCardDescription: TextStyle = {
  fontSize: 14,
  color: '#333',
  marginBottom: 10,
  fontWeight: '500',
};

/**
 * Estilo padrão de linha de informação do card
 */
export const sharedCardInfo: ViewStyle = {
  flexDirection: 'row',
  marginBottom: 8,
};

/**
 * Estilo padrão de label do card
 */
export const sharedCardLabel: TextStyle = {
  fontSize: 14,
  color: '#999',
  width: 80,
};

/**
 * Estilo padrão de valor do card
 */
export const sharedCardValue: TextStyle = {
  fontSize: 14,
  color: '#333',
  flex: 1,
};

/**
 * Estilo padrão de ações do card
 */
export const sharedCardActions: ViewStyle = {
  flexDirection: 'row',
  gap: 10,
  marginTop: 10,
  paddingTop: 15,
  borderTopWidth: 1,
  borderTopColor: '#e0e0e0',
};

/**
 * Estilo padrão de botão primário
 */
export const sharedPrimaryButton: ViewStyle = {
  flex: 1,
  padding: 12,
  backgroundColor: '#110975',
  borderRadius: 8,
  alignItems: 'center',
};

/**
 * Estilo padrão de texto de botão primário
 */
export const sharedPrimaryButtonText: TextStyle = {
  color: '#fff',
  fontSize: 14,
  fontWeight: '600',
};

/**
 * Estilo padrão de botão secundário
 */
export const sharedSecondaryButton: ViewStyle = {
  flex: 1,
  padding: 12,
  backgroundColor: '#f0f0f0',
  borderRadius: 8,
  alignItems: 'center',
};

/**
 * Estilo padrão de texto de botão secundário
 */
export const sharedSecondaryButtonText: TextStyle = {
  color: '#333',
  fontSize: 14,
  fontWeight: '600',
};

/**
 * Estilo padrão de seção
 */
export const sharedSection: ViewStyle = {
  backgroundColor: '#fff',
  borderRadius: 10,
  padding: 15,
  marginBottom: 15,
};

/**
 * Estilo padrão de título de seção
 */
export const sharedSectionTitle: TextStyle = {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#333',
  marginBottom: 15,
};

/**
 * Estilo padrão de linha de informação
 */
export const sharedInfoRow: ViewStyle = {
  flexDirection: 'row',
  marginBottom: 10,
};

/**
 * Estilo padrão de label de informação
 */
export const sharedInfoLabel: TextStyle = {
  fontSize: 14,
  color: '#999',
  width: 100,
};

/**
 * Estilo padrão de valor de informação
 */
export const sharedInfoValue: TextStyle = {
  fontSize: 14,
  color: '#333',
  flex: 1,
};

/**
 * Estilo padrão de botão de retry
 */
export const sharedRetryButton: ViewStyle = {
  marginTop: 20,
  padding: 15,
  backgroundColor: '#110975',
  borderRadius: 8,
  alignItems: 'center',
};

/**
 * Estilo padrão de texto de botão de retry
 */
export const sharedRetryButtonText: TextStyle = {
  color: '#fff',
  fontWeight: '600',
};

/**
 * Estilo padrão de ícone vazio
 */
export const sharedEmptyIcon: TextStyle = {
  fontSize: 60,
  marginBottom: 20,
};

/**
 * Estilo padrão de texto vazio
 */
export const sharedEmptySubtext: TextStyle = {
  fontSize: 14,
  color: '#999',
  marginTop: 10,
  textAlign: 'center',
};

/**
 * Função para criar estilo de botão com cor customizada
 */
export const createButton = (backgroundColor: string): ViewStyle => ({
  flex: 1,
  padding: 12,
  backgroundColor,
  borderRadius: 8,
  alignItems: 'center',
});

/**
 * Função para criar estilo de texto de botão com cor customizada
 */
export const createButtonText = (color: string = '#fff'): TextStyle => ({
  color,
  fontSize: 14,
  fontWeight: '600',
});

/**
 * Função para criar estilo de card com sombra customizada
 */
export const createCard = (options?: {
  backgroundColor?: string;
  borderRadius?: number;
  padding?: number;
  marginBottom?: number;
}): ViewStyle => ({
  backgroundColor: options?.backgroundColor || '#fff',
  borderRadius: options?.borderRadius || 10,
  padding: options?.padding || 15,
  marginBottom: options?.marginBottom || 15,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
});

/**
 * Função para criar estilo de header com opções customizadas
 */
export const createHeader = (options?: {
  backgroundColor?: string;
  padding?: number;
  borderBottomWidth?: number;
}): ViewStyle => ({
  backgroundColor: options?.backgroundColor || '#fff',
  padding: options?.padding || 20,
  borderBottomWidth: options?.borderBottomWidth ?? 1,
  borderBottomColor: '#e0e0e0',
});


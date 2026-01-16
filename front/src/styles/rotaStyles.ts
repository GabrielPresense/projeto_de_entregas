import { StyleSheet } from 'react-native';
import { commonStyles, commonStylesWithForm } from './commonStyles';

// Estilos específicos para Rotas + estilos compartilhados
export const rotaStyles = StyleSheet.create({
  // Herda todos os estilos comuns incluindo form
  ...commonStylesWithForm,
});

// Aliases para compatibilidade com importações antigas
export const rotasListStyles = rotaStyles;
export const rotaFormStyles = rotaStyles;
export const rotaDetailStyles = rotaStyles;

import { StyleSheet } from 'react-native';
import { commonStyles } from './commonStyles';

// Estilos específicos para Rotas + estilos compartilhados
export const rotaStyles = StyleSheet.create({
  // Herda todos os estilos comuns
  ...commonStyles,
});

// Aliases para compatibilidade com importações antigas
export const rotasListStyles = rotaStyles;
export const rotaFormStyles = rotaStyles;
export const rotaDetailStyles = rotaStyles;

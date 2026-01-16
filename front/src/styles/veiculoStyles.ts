import { StyleSheet } from 'react-native';
import { commonStyles, commonStylesWithForm } from './commonStyles';

// Estilos específicos para Veículos + estilos compartilhados
export const veiculoStyles = StyleSheet.create({
  // Herda todos os estilos comuns incluindo form
  ...commonStylesWithForm,
});

// Aliases para compatibilidade com importações antigas
export const veiculosListStyles = veiculoStyles;
export const veiculoFormStyles = veiculoStyles;
export const veiculoDetailStyles = veiculoStyles;

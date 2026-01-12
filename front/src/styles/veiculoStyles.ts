import { StyleSheet } from 'react-native';
import { commonStyles } from './commonStyles';

// Estilos específicos para Veículos + estilos compartilhados
export const veiculoStyles = StyleSheet.create({
  // Herda todos os estilos comuns
  ...commonStyles,
});

// Aliases para compatibilidade com importações antigas
export const veiculosListStyles = veiculoStyles;
export const veiculoFormStyles = veiculoStyles;
export const veiculoDetailStyles = veiculoStyles;

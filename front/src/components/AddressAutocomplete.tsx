import React from 'react';
import {
  View,
  Text,
  TextInput,
} from 'react-native';
import { addressAutocompleteStyles as styles } from '../styles/addressAutocompleteStyles';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSelectAddress: (address: string, lat: number, lng: number) => void;
  placeholder?: string;
  label?: string;
  multiline?: boolean;
  numberOfLines?: number;
}

export default function AddressAutocomplete({
  value,
  onChangeText,
  onSelectAddress,
  placeholder = 'Digite o endereço...',
  label,
  multiline = false,
  numberOfLines = 2,
}: Props) {
  // Quando o usuário digita, apenas atualiza o texto
  // O onSelectAddress será chamado quando necessário (pode ser usado para geocodificação posterior)
  const handleChangeText = (text: string) => {
    onChangeText(text);
    // Limpa coordenadas quando o usuário digita (será geocodificado depois se necessário)
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            multiline && styles.inputMultiline,
          ]}
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
    </View>
  );
}

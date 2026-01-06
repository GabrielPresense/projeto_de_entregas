import { StatusBar } from 'expo-status-bar';
import { Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { homeStyles } from './src/styles/homeStyles';

export default function App() {
  return (
    <View style={homeStyles.container}>
      <StatusBar style="auto" />
      
      <ScrollView contentContainerStyle={homeStyles.scrollContent}>
        {/*Cabeçalho*/}
        <View style={homeStyles.header}>
          <Text style={homeStyles.title}>📦 Entregas</Text>
          <Text style={homeStyles.subtitle}>Sistema de Gestão de Entregas</Text>
        </View>

        {/*Botões principais*/}
        <View style={homeStyles.buttonsContainer}>
          <TouchableOpacity style={homeStyles.button}>
            <Text style={homeStyles.buttonText}>Novo Pedido</Text>
          </TouchableOpacity>

          <TouchableOpacity style={homeStyles.button}>
            <Text style={homeStyles.buttonText}>Meus Pedidos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={homeStyles.button}>
            <Text style={homeStyles.buttonText}>Rastrear Entrega</Text>
          </TouchableOpacity>

          <TouchableOpacity style={homeStyles.button}>
            <Text style={homeStyles.buttonText}>Entregadores</Text>
          </TouchableOpacity>
        </View>
        {/*Informações*/}
        <View style={homeStyles.infoBox}>
          <Text style={homeStyles.infoTitle}>Status de Entregas</Text>
          <Text style={homeStyles.infoText}>Pedidos hoje: 0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

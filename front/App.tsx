import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, ScrollView, BackHandler, Platform } from 'react-native';
import { homeStyles } from './src/styles/homeStyles';
// Tela de seleção de perfil (compartilhada)
import ProfileSelectionScreen from './src/screens/ProfileSelectionScreen';

// Telas do perfil Cliente
import ClienteHomeScreen from './src/screens/cliente/ClienteHomeScreen';
import ClienteTrackingScreen from './src/screens/cliente/ClienteTrackingScreen';
import PublicTrackingScreen from './src/screens/cliente/PublicTrackingScreen';
import ClienteMenuScreen from './src/screens/cliente/ClienteMenuScreen';
import ClienteSolicitarPedidoScreen from './src/screens/cliente/ClienteSolicitarPedidoScreen';

// Telas do perfil Entregador
import EntregadorLoginScreen from './src/screens/entregador/EntregadorLoginScreen';
import EntregadorHomeScreen from './src/screens/entregador/EntregadorHomeScreen';
import EntregadorPedidoDetailScreen from './src/screens/entregador/EntregadorPedidoDetailScreen';

// Telas do perfil Empresa/Administrador
import PedidosListScreen from './src/screens/empresa/PedidosListScreen';
import PedidoFormScreen from './src/screens/empresa/PedidoFormScreen';
import PedidoDetailScreen from './src/screens/empresa/PedidoDetailScreen';
import EntregadoresListScreen from './src/screens/empresa/EntregadoresListScreen';
import EntregadorFormScreen from './src/screens/empresa/EntregadorFormScreen';
import EntregadorDetailScreen from './src/screens/empresa/EntregadorDetailScreen';
import VeiculosListScreen from './src/screens/empresa/VeiculosListScreen';
import VeiculoFormScreen from './src/screens/empresa/VeiculoFormScreen';
import VeiculoDetailScreen from './src/screens/empresa/VeiculoDetailScreen';
import RotasListScreen from './src/screens/empresa/RotasListScreen';
import RotaFormScreen from './src/screens/empresa/RotaFormScreen';
import RotaDetailScreen from './src/screens/empresa/RotaDetailScreen';
import TrackingScreen from './src/screens/empresa/TrackingScreen';
import DashboardStats from './src/components/DashboardStats';
import TotalHoje from './src/components/TotalHoje';
import { Pedido } from './src/types/pedido.types';
import { Entregador } from './src/types/entregador.types';
import { Veiculo } from './src/types/veiculo.types';
import { Rota } from './src/types/rota.types';

type Profile = 'admin' | 'cliente' | 'entregador' | null;
type Screen =
  | 'profileSelection'
  | 'home'
  | 'pedidosList'
  | 'pedidoForm'
  | 'pedidoDetail'
  | 'entregadoresList'
  | 'entregadorForm'
  | 'entregadorDetail'
  | 'veiculosList'
  | 'veiculoForm'
  | 'veiculoDetail'
  | 'rotasList'
  | 'rotaForm'
  | 'rotaDetail'
  | 'tracking'
  | 'clienteHome'
  | 'clienteTracking'
  | 'publicTracking'
  | 'clienteMenu'
  | 'clienteSolicitarPedido'
  | 'entregadorLogin'
  | 'entregadorHome'
  | 'entregadorPedidoDetail';

export default function App() {
  const [profile, setProfile] = useState<Profile>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('profileSelection');
  const [previousScreen, setPreviousScreen] = useState<Screen>('profileSelection');
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [editingPedido, setEditingPedido] = useState<Pedido | null>(null);
  const [selectedEntregador, setSelectedEntregador] = useState<Entregador | null>(null);
  const [editingEntregador, setEditingEntregador] = useState<Entregador | null>(null);
  const [selectedVeiculo, setSelectedVeiculo] = useState<Veiculo | null>(null);
  const [editingVeiculo, setEditingVeiculo] = useState<Veiculo | null>(null);
  const [selectedRota, setSelectedRota] = useState<Rota | null>(null);
  const [editingRota, setEditingRota] = useState<Rota | null>(null);
  const [entregadorId, setEntregadorId] = useState<number | null>(null); // ID do entregador logado
  const [refreshEntregadores, setRefreshEntregadores] = useState(0); // Para forçar atualização da lista

  const resetAllStates = () => {
    setSelectedPedido(null);
    setEditingPedido(null);
    setSelectedEntregador(null);
    setEditingEntregador(null);
    setSelectedVeiculo(null);
    setEditingVeiculo(null);
    setSelectedRota(null);
    setEditingRota(null);
    setEntregadorId(null);
  };

  const handleSelectProfile = (selectedProfile: 'admin' | 'cliente' | 'entregador') => {
    setProfile(selectedProfile);
    if (selectedProfile === 'cliente') {
      // Cliente vai para o menu principal
      setCurrentScreen('clienteMenu');
      setPreviousScreen('clienteMenu');
    } else if (selectedProfile === 'entregador') {
      // Entregador precisa fazer login
      setCurrentScreen('entregadorLogin');
      setPreviousScreen('entregadorLogin');
      setEntregadorId(null);
    } else {
      // Admin vai para a home administrativa
      setCurrentScreen('home');
      setPreviousScreen('home');
    }
  };

  const handleEntregadorLoginSuccess = (id: number) => {
    setEntregadorId(id);
    setCurrentScreen('entregadorHome');
    setPreviousScreen('entregadorHome');
  };

  const handleLogout = () => {
    setProfile(null);
    setEntregadorId(null);
    setCurrentScreen('profileSelection');
    setPreviousScreen('profileSelection');
    resetAllStates();
  };

  const goHome = () => {
    if (profile === 'cliente') {
      setCurrentScreen('clienteMenu');
      setPreviousScreen('clienteMenu');
    } else if (profile === 'entregador' && entregadorId) {
      setCurrentScreen('entregadorHome');
      setPreviousScreen('entregadorHome');
    } else {
      setCurrentScreen('home');
      setPreviousScreen('home');
    }
    resetAllStates();
  };

  const goBack = () => {
    if (currentScreen === 'pedidosList') {
      setCurrentScreen('home');
      resetAllStates();
    } else if (currentScreen === 'pedidoDetail') {
      setCurrentScreen('pedidosList');
      setSelectedPedido(null);
    } else if (currentScreen === 'entregadoresList') {
      setCurrentScreen('home');
      resetAllStates();
    } else {
      setCurrentScreen(previousScreen);
      if (previousScreen === 'home' || previousScreen === 'clienteHome' || previousScreen === 'publicTracking' || previousScreen === 'entregadorHome' || previousScreen === 'clienteMenu') {
        resetAllStates();
      }
    }
  };

  // ========== Handler do botão de voltar nativo do Android ==========
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Se estiver na tela de seleção de perfil, fecha o app
      if (currentScreen === 'profileSelection') {
        return false; // Permite o comportamento padrão (fechar app)
      }

      // Se estiver em uma tela principal (home de cada perfil), faz logout
      if (
        currentScreen === 'home' ||
        currentScreen === 'publicTracking' ||
        currentScreen === 'clienteMenu' ||
        currentScreen === 'entregadorHome' ||
        currentScreen === 'entregadorLogin'
      ) {
        handleLogout();
        return true; // Intercepta o evento
      }

      // Se estiver na tela de pedidosList, volta para home
      if (currentScreen === 'pedidosList') {
        setCurrentScreen('home');
        resetAllStates();
        return true; // Intercepta o evento
      }

      // Se estiver na tela de pedidoDetail, volta para pedidosList
      if (currentScreen === 'pedidoDetail') {
        setCurrentScreen('pedidosList');
        setSelectedPedido(null);
        return true; // Intercepta o evento
      }

      // Se estiver na tela de entregadoresList, volta para home
      if (currentScreen === 'entregadoresList') {
        setCurrentScreen('home');
        resetAllStates();
        return true; // Intercepta o evento
      }

      // Para outras telas, usa o goBack normal
      setCurrentScreen(previousScreen);
      if (previousScreen === 'home' || previousScreen === 'clienteHome' || previousScreen === 'publicTracking' || previousScreen === 'entregadorHome' || previousScreen === 'clienteMenu') {
        resetAllStates();
      }
      return true; // Intercepta o evento
    });

    return () => backHandler.remove();
  }, [currentScreen, previousScreen, handleLogout]);

  // ========== Funções de navegação Admin ==========
  const openPedidosList = () => {
    setPreviousScreen('home');
    setCurrentScreen('pedidosList');
  };

  const openNewPedido = () => {
    setEditingPedido(null);
    setPreviousScreen(currentScreen);
    setCurrentScreen('pedidoForm');
  };

  const handleSelectPedido = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setPreviousScreen('pedidosList');
    setCurrentScreen('pedidoDetail');
  };

  const handleEditPedido = (pedido: Pedido) => {
    setEditingPedido(pedido);
    setPreviousScreen('pedidoDetail');
    setCurrentScreen('pedidoForm');
  };

  const handleSavePedido = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setEditingPedido(null);
    setCurrentScreen('pedidoDetail');
  };

  const handleDeletePedido = () => {
    setSelectedPedido(null);
    setCurrentScreen('pedidosList');
  };

  const openEntregadoresList = () => {
    setPreviousScreen('home');
    setCurrentScreen('entregadoresList');
  };

  const openNewEntregador = () => {
    setEditingEntregador(null);
    setPreviousScreen(currentScreen);
    setCurrentScreen('entregadorForm');
  };

  const handleSelectEntregador = (entregador: Entregador) => {
    setSelectedEntregador(entregador);
    setPreviousScreen('entregadoresList');
    setCurrentScreen('entregadorDetail');
  };

  const handleEditEntregador = (entregador: Entregador) => {
    setEditingEntregador(entregador);
    setPreviousScreen('entregadorDetail');
    setCurrentScreen('entregadorForm');
  };

  const handleSaveEntregador = (entregador: Entregador) => {
    setSelectedEntregador(entregador);
    setEditingEntregador(null);
    setCurrentScreen('entregadorDetail');
  };

  const handleDeleteEntregador = () => {
    setSelectedEntregador(null);
    setRefreshEntregadores(prev => prev + 1); // Força atualização da lista
    setCurrentScreen('entregadoresList');
  };

  const openVeiculosList = () => {
    setPreviousScreen('home');
    setCurrentScreen('veiculosList');
  };

  const openNewVeiculo = () => {
    setEditingVeiculo(null);
    setPreviousScreen(currentScreen);
    setCurrentScreen('veiculoForm');
  };

  const handleSelectVeiculo = (veiculo: Veiculo) => {
    setSelectedVeiculo(veiculo);
    setPreviousScreen('veiculosList');
    setCurrentScreen('veiculoDetail');
  };

  const handleEditVeiculo = (veiculo: Veiculo) => {
    setEditingVeiculo(veiculo);
    setPreviousScreen('veiculoDetail');
    setCurrentScreen('veiculoForm');
  };

  const handleSaveVeiculo = (veiculo: Veiculo) => {
    setSelectedVeiculo(veiculo);
    setEditingVeiculo(null);
    setCurrentScreen('veiculoDetail');
  };

  const handleDeleteVeiculo = () => {
    setSelectedVeiculo(null);
    setCurrentScreen('veiculosList');
  };

  const openRotasList = () => {
    setPreviousScreen('home');
    setCurrentScreen('rotasList');
  };

  const openNewRota = () => {
    setEditingRota(null);
    setPreviousScreen(currentScreen);
    setCurrentScreen('rotaForm');
  };

  const handleSelectRota = (rota: Rota) => {
    setSelectedRota(rota);
    setPreviousScreen('rotasList');
    setCurrentScreen('rotaDetail');
  };

  const handleEditRota = (rota: Rota) => {
    setEditingRota(rota);
    setPreviousScreen('rotaDetail');
    setCurrentScreen('rotaForm');
  };

  const handleSaveRota = (rota: Rota) => {
    setSelectedRota(rota);
    setEditingRota(null);
    setCurrentScreen('rotaDetail');
  };

  const handleDeleteRota = () => {
    setSelectedRota(null);
    setCurrentScreen('rotasList');
  };

  const openTracking = () => {
    setPreviousScreen('home');
    setCurrentScreen('tracking');
  };

  // ========== Funções de navegação Cliente ==========
  const handleClienteSelectPedido = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setPreviousScreen('clienteHome');
    setCurrentScreen('pedidoDetail');
  };

  const handleClienteTrackPedido = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setPreviousScreen('clienteHome');
    setCurrentScreen('clienteTracking');
  };

  const openClienteSolicitarPedido = () => {
    setPreviousScreen('clienteMenu');
    setCurrentScreen('clienteSolicitarPedido');
  };

  const openClienteRastrearPedido = () => {
    setPreviousScreen('clienteMenu');
    setCurrentScreen('publicTracking');
  };

  const handleClientePedidoCreated = (pedidoId: number) => {
    // Após criar o pedido, volta para o menu
    setCurrentScreen('clienteMenu');
    setPreviousScreen('clienteMenu');
  };

  // ========== Funções de navegação Entregador ==========
  const handleEntregadorSelectPedido = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setPreviousScreen('entregadorHome');
    setCurrentScreen('entregadorPedidoDetail');
  };

  const renderScreenHeader = (title: string, showLogout = false) => (
    <View style={homeStyles.screenHeader}>
      <TouchableOpacity onPress={goBack} style={homeStyles.backButton}>
        <Text style={homeStyles.backButtonText}>←</Text>
      </TouchableOpacity>
      <Text style={homeStyles.screenTitle}>{title}</Text>
      {showLogout && (
        <TouchableOpacity onPress={handleLogout} style={{ marginLeft: 'auto', padding: 10 }}>
          <Text style={{ color: '#110975', fontSize: 14, fontWeight: '600' }}>Sair</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ========== Tela de Seleção de Perfil ==========
  if (currentScreen === 'profileSelection') {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar style="auto" />
        <ProfileSelectionScreen onSelectProfile={handleSelectProfile} />
      </View>
    );
  }

  // ========== Telas do Perfil Cliente ==========
  if (profile === 'cliente') {
    if (currentScreen === 'clienteMenu') {
      return (
        <View style={{ flex: 1 }}>
          <StatusBar style="auto" />
          <View style={homeStyles.screenHeader}>
            <Text style={homeStyles.screenTitle}>Área do Cliente</Text>
            <TouchableOpacity onPress={handleLogout} style={{ marginLeft: 'auto', padding: 10 }}>
              <Text style={{ color: '#110975', fontSize: 14, fontWeight: '600' }}>Sair</Text>
            </TouchableOpacity>
          </View>
          <ClienteMenuScreen
            onSolicitarPedido={openClienteSolicitarPedido}
            onRastrearPedido={openClienteRastrearPedido}
          />
        </View>
      );
    }

    if (currentScreen === 'clienteSolicitarPedido') {
      return (
        <View style={{ flex: 1 }}>
          <StatusBar style="auto" />
          {renderScreenHeader('Solicitar Pedido', true)}
          <ClienteSolicitarPedidoScreen
            onSuccess={handleClientePedidoCreated}
            onCancel={goBack}
          />
        </View>
      );
    }

    if (currentScreen === 'publicTracking') {
      return (
        <View style={{ flex: 1 }}>
          <StatusBar style="auto" />
          {renderScreenHeader('Rastrear Pedido', true)}
          <PublicTrackingScreen />
        </View>
      );
    }
  }

  // ========== Telas do Perfil Entregador ==========
  if (profile === 'entregador') {
    if (currentScreen === 'entregadorLogin') {
      return (
        <View style={{ flex: 1 }}>
          <StatusBar style="auto" />
          <EntregadorLoginScreen
            onLoginSuccess={handleEntregadorLoginSuccess}
            onBack={handleLogout}
          />
        </View>
      );
    }

    if (entregadorId && currentScreen === 'entregadorHome') {
      return (
        <View style={{ flex: 1 }}>
          <StatusBar style="auto" />
          <View style={homeStyles.screenHeader}>
            <Text style={homeStyles.screenTitle}>Minhas Entregas</Text>
            <TouchableOpacity onPress={handleLogout} style={{ marginLeft: 'auto', padding: 10 }}>
              <Text style={{ color: '#110975', fontSize: 14, fontWeight: '600' }}>Sair</Text>
            </TouchableOpacity>
          </View>
          <EntregadorHomeScreen entregadorId={entregadorId} onSelectPedido={handleEntregadorSelectPedido} />
        </View>
      );
    }

    if (entregadorId && currentScreen === 'entregadorPedidoDetail' && selectedPedido) {
      return (
        <View style={{ flex: 1 }}>
          <StatusBar style="auto" />
          {renderScreenHeader(`Pedido #${selectedPedido.id}`, true)}
          <EntregadorPedidoDetailScreen pedido={selectedPedido} onBack={goBack} />
        </View>
      );
    }
  }

  // ========== Telas do Perfil Admin ==========
  if (currentScreen === 'pedidosList') {
    return (
      <View style={{ flex: 1 }}>
        {renderScreenHeader('Solicitações de Pedidos', true)}
        <PedidosListScreen onSelectPedido={handleSelectPedido} />
      </View>
    );
  }

  if (currentScreen === 'pedidoForm') {
    return (
      <View style={{ flex: 1 }}>
        {renderScreenHeader(editingPedido ? 'Editar Pedido' : 'Novo Pedido', true)}
        <PedidoFormScreen pedido={editingPedido || undefined} onSave={handleSavePedido} onCancel={goBack} />
      </View>
    );
  }

  if (currentScreen === 'pedidoDetail' && selectedPedido) {
    return (
      <View style={{ flex: 1 }}>
        {renderScreenHeader(`Pedido #${selectedPedido.id}`, true)}
        <PedidoDetailScreen pedidoId={selectedPedido.id} onDelete={handleDeletePedido} onBack={goBack} />
      </View>
    );
  }

  if (currentScreen === 'entregadoresList') {
    return (
      <View style={{ flex: 1 }}>
        {renderScreenHeader('Entregadores', true)}
        <EntregadoresListScreen onSelectEntregador={handleSelectEntregador} onAddEntregador={openNewEntregador} refreshTrigger={refreshEntregadores} />
      </View>
    );
  }

  if (currentScreen === 'entregadorForm') {
    return (
      <View style={{ flex: 1 }}>
        {renderScreenHeader(editingEntregador ? 'Editar Entregador' : 'Novo Entregador', true)}
        <EntregadorFormScreen entregador={editingEntregador || undefined} onSave={handleSaveEntregador} onCancel={goBack} />
      </View>
    );
  }

  if (currentScreen === 'entregadorDetail' && selectedEntregador) {
    return (
      <View style={{ flex: 1 }}>
        {renderScreenHeader(`Entregador: ${selectedEntregador.nome}`, true)}
        <EntregadorDetailScreen entregadorId={selectedEntregador.id} onEdit={handleEditEntregador} onDelete={handleDeleteEntregador} onBack={goBack} />
      </View>
    );
  }

  if (currentScreen === 'veiculosList') {
    return (
      <View style={{ flex: 1 }}>
        {renderScreenHeader('Veículos', true)}
        <VeiculosListScreen onSelectVeiculo={handleSelectVeiculo} />
      </View>
    );
  }

  if (currentScreen === 'veiculoForm') {
    return (
      <View style={{ flex: 1 }}>
        {renderScreenHeader(editingVeiculo ? 'Editar Veículo' : 'Novo Veículo', true)}
        <VeiculoFormScreen veiculo={editingVeiculo || undefined} onSave={handleSaveVeiculo} onCancel={goBack} />
      </View>
    );
  }

  if (currentScreen === 'veiculoDetail' && selectedVeiculo) {
    return (
      <View style={{ flex: 1 }}>
        {renderScreenHeader(`Veículo: ${selectedVeiculo.placa} - ${selectedVeiculo.marca} ${selectedVeiculo.modelo}`, true)}
        <VeiculoDetailScreen veiculoId={selectedVeiculo.id} onEdit={handleEditVeiculo} onDelete={handleDeleteVeiculo} onBack={goBack} />
      </View>
    );
  }

  if (currentScreen === 'rotasList') {
    return (
      <View style={{ flex: 1 }}>
        {renderScreenHeader('Rotas', true)}
        <RotasListScreen onSelectRota={handleSelectRota} />
      </View>
    );
  }

  if (currentScreen === 'rotaForm') {
    return (
      <View style={{ flex: 1 }}>
        {renderScreenHeader(editingRota ? 'Editar Rota' : 'Nova Rota', true)}
        <RotaFormScreen rota={editingRota || undefined} onSave={handleSaveRota} onCancel={goBack} />
      </View>
    );
  }

  if (currentScreen === 'rotaDetail' && selectedRota) {
    return (
      <View style={{ flex: 1 }}>
        {renderScreenHeader(`Rota: ${selectedRota.nome}`, true)}
        <RotaDetailScreen rotaId={selectedRota.id} onEdit={handleEditRota} onDelete={handleDeleteRota} onBack={goBack} />
      </View>
    );
  }

  if (currentScreen === 'tracking') {
    return (
      <View style={{ flex: 1 }}>
        {renderScreenHeader('Rastrear Entrega', true)}
        <TrackingScreen />
      </View>
    );
  }

  // ========== Tela inicial (home) - Perfil Administrador/Empresa ==========
  return (
    <View style={homeStyles.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={homeStyles.scrollContent}>
        <View style={homeStyles.header}>
          <Text style={homeStyles.title}>📦 Entregas</Text>
          <Text style={homeStyles.subtitle}>Sistema de Gestão de Entregas</Text>
          <TouchableOpacity onPress={handleLogout} style={{ marginTop: 10, padding: 10 }}>
            <Text style={{ color: '#110975', fontSize: 14, fontWeight: '600' }}>Sair</Text>
          </TouchableOpacity>
        </View>

        <TotalHoje />

        <View style={homeStyles.buttonsContainer}>
          <TouchableOpacity style={homeStyles.button} onPress={openNewPedido}>
            <Text style={homeStyles.buttonText}>Novo Pedido</Text>
          </TouchableOpacity>
          <TouchableOpacity style={homeStyles.button} onPress={openPedidosList}>
            <Text style={homeStyles.buttonText}>Solicitações de Entregas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={homeStyles.button} onPress={openEntregadoresList}>
            <Text style={homeStyles.buttonText}>Entregadores</Text>
          </TouchableOpacity>
          <TouchableOpacity style={homeStyles.button} onPress={openVeiculosList}>
            <Text style={homeStyles.buttonText}>Veículos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={homeStyles.button} onPress={openRotasList}>
            <Text style={homeStyles.buttonText}>Rotas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={homeStyles.button} onPress={openTracking}>
            <Text style={homeStyles.buttonText}>Rastrear Entrega</Text>
          </TouchableOpacity>
        </View>

        <DashboardStats />
      </ScrollView>
    </View>
  );
}

// Notificações locais, alerta na tela e vibração
import * as Notifications from 'expo-notifications';
import { Alert, Linking, Platform, Vibration } from 'react-native';
import { FOLGA_MIN, VELOCIDADE_A_PE } from './config';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function permissaoNotificacao() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Avisos de ônibus',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
  return status === 'granted';
}

// "Hora de sair": calcula o tempo a pé até o ponto e avisa na hora certa
export async function avisarHoraDeSair(item, parada) {
  if (!(await permissaoNotificacao())) {
    Alert.alert('Notificações desativadas', 'Ative as notificações do app para receber o aviso.', [
      { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
      { text: 'Cancelar', style: 'cancel' },
    ]);
    return;
  }

  const andarMin = Math.ceil(parada.distancia / VELOCIDADE_A_PE);
  const sairEm = item.minutos - andarMin - FOLGA_MIN; // minutos até a hora de sair

  if (sairEm <= 0) { // já está na hora: alerta e vibração imediatos
    Vibration.vibrate([0, 400, 200, 400]);
    Alert.alert('Saia agora!', `O ${item.linha} chega em ${item.minutos} min e o ponto fica a ${andarMin} min a pé.`);
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Hora de sair! Ônibus ${item.linha}`,
      body: `Chega em ${andarMin + FOLGA_MIN} min em ${parada.nome}. O ponto fica a ${andarMin} min a pé.`,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: sairEm * 60 },
  });
  Vibration.vibrate(200);
  Alert.alert('Aviso agendado', `Você será avisado em ${sairEm} min para sair de casa.`);
}

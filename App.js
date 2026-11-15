import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { RAIO_METROS } from './src/config';
import { chegadasProgramadas, paradasProximas } from './src/gtfs';
import { acharCodigoParada, previsaoParada } from './src/olhovivo';
import { avisarHoraDeSair } from './src/alertas';

export default function App() {
  const [paradas, setParadas] = useState([]);
  const [selecionada, setSelecionada] = useState(null);
  const [previsao, setPrevisao] = useState(null); // { fonte, itens, motivo }
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const codigos = useRef({}); // cache: stop_id do GTFS -> código do ponto na Olho Vivo

  // GPS: pede permissão e lista os pontos perto do usuário
  async function localizar() {
    setErro(null);
    setCarregando(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return setErro('permissao');
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lista = paradasProximas(pos.coords.latitude, pos.coords.longitude, RAIO_METROS);
      setParadas(lista);
      if (!lista.length) setErro('vazio');
    } catch (e) {
      setErro('gps');
    } finally {
      setCarregando(false);
    }
  }

  // Tenta o tempo real da Olho Vivo; se falhar, usa os horários programados (GTFS)
  const carregarPrevisao = useCallback(async (parada) => {
    try {
      if (codigos.current[parada.id] === undefined) codigos.current[parada.id] = await acharCodigoParada(parada);
      const cp = codigos.current[parada.id];
      if (!cp) throw new Error('Ponto não encontrado na Olho Vivo');
      setPrevisao({ fonte: 'tempo-real', itens: await previsaoParada(cp) });
    } catch (e) {
      setPrevisao({ fonte: 'programado', itens: chegadasProgramadas(parada.id), motivo: e.message });
    }
  }, []);

  useEffect(() => { localizar(); }, []);

  // atualiza as previsões do ponto aberto a cada 30 s
  useEffect(() => {
    if (!selecionada) return;
    setPrevisao(null);
    carregarPrevisao(selecionada);
    const timer = setInterval(() => carregarPrevisao(selecionada), 30000);
    return () => clearInterval(timer);
  }, [selecionada, carregarPrevisao]);

  return (
    <View style={styles.tela}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Transit <Text style={styles.destaque}>SP</Text></Text>
        <Text style={styles.subtitulo}>Ônibus perto de você</Text>
      </View>

      {selecionada ? (
        <View style={styles.corpo}>
          <Pressable onPress={() => setSelecionada(null)}><Text style={styles.link}>← Voltar aos pontos</Text></Pressable>
          <Text style={styles.nomePonto}>{selecionada.nome}</Text>
          <Text style={styles.detalhe}>A {selecionada.distancia} m de você</Text>

          {!previsao && <ActivityIndicator style={styles.espaco} size="large" color="#0288d1" />}
          {previsao && (
            <>
              <Text style={[styles.selo, previsao.fonte === 'tempo-real' ? styles.verde : styles.laranja]}>
                {previsao.fonte === 'tempo-real' ? '● Tempo real (Olho Vivo)' : '● Horário programado (GTFS) — API indisponível'}
              </Text>
              {previsao.itens.length === 0 && <Text style={styles.detalhe}>Nenhum ônibus previsto agora.</Text>}
              <FlatList
                data={previsao.itens}
                keyExtractor={(i) => i.linha + i.destino}
                renderItem={({ item }) => (
                  <View style={styles.cartao}>
                    <View style={styles.linhaCartao}>
                      <Text style={styles.badge}>{item.linha}</Text>
                      <Text style={styles.minutos}>{item.minutos} min ({item.hora})</Text>
                    </View>
                    <Text style={styles.detalhe}>Destino: {item.destino} {item.acessivel ? '♿' : ''}</Text>
                    <Pressable style={styles.botaoPequeno} onPress={() => avisarHoraDeSair(item, selecionada)}>
                      <Text style={styles.textoBotao}>🔔 Avisar a hora de sair</Text>
                    </Pressable>
                  </View>
                )}
              />
            </>
          )}
        </View>
      ) : (
        <View style={styles.corpo}>
          <Pressable style={styles.botao} onPress={localizar}>
            <Text style={styles.textoBotao}>📍 Atualizar minha localização</Text>
          </Pressable>

          {carregando && <ActivityIndicator style={styles.espaco} size="large" color="#0288d1" />}
          {erro === 'permissao' && (
            <View style={styles.aviso}>
              <Text style={styles.detalhe}>Precisamos do GPS para achar os pontos perto de você.</Text>
              <Pressable onPress={() => Linking.openSettings()}><Text style={styles.link}>Abrir configurações</Text></Pressable>
            </View>
          )}
          {erro === 'gps' && <Text style={styles.aviso}>Não foi possível obter sua localização. Ative o GPS e tente de novo.</Text>}
          {erro === 'vazio' && <Text style={styles.aviso}>Nenhum ponto em {RAIO_METROS} m de você.</Text>}

          <FlatList
            data={paradas}
            keyExtractor={(p) => p.id}
            renderItem={({ item }) => (
              <Pressable style={styles.cartao} onPress={() => setSelecionada(item)}>
                <Text style={styles.nomePonto}>{item.nome}</Text>
                <Text style={styles.detalhe}>{item.distancia} m • toque para ver os próximos ônibus</Text>
              </Pressable>
            )}
          />
        </View>
      )}

      <Text style={styles.rodape}>Dados: SPTrans (Olho Vivo e GTFS) • FIAP Global Solution 2026.2</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#f4f6f9' },
  header: { backgroundColor: '#0288d1', paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20 },
  titulo: { color: '#fff', fontSize: 28, fontWeight: '700' },
  destaque: { color: '#b3e5fc' },
  subtitulo: { color: '#fff', opacity: 0.9 },
  corpo: { flex: 1, padding: 16 },
  botao: { backgroundColor: '#0288d1', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  botaoPequeno: { backgroundColor: '#3f51b5', padding: 10, borderRadius: 6, alignItems: 'center', marginTop: 8 },
  textoBotao: { color: '#fff', fontWeight: '600' },
  cartao: { backgroundColor: '#fff', borderRadius: 8, padding: 14, marginBottom: 10, borderLeftWidth: 5, borderLeftColor: '#0288d1' },
  linhaCartao: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  badge: { backgroundColor: '#0288d1', color: '#fff', fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  minutos: { fontWeight: '700', fontSize: 16 },
  nomePonto: { fontSize: 17, fontWeight: '700', color: '#01579b' },
  detalhe: { color: '#555', marginTop: 2 },
  selo: { fontWeight: '600', marginVertical: 10 },
  verde: { color: '#2e7d32' },
  laranja: { color: '#e65100' },
  aviso: { color: '#555', marginVertical: 10 },
  link: { color: '#0288d1', fontWeight: '600', marginBottom: 8 },
  espaco: { marginTop: 24 },
  rodape: { textAlign: 'center', padding: 10, fontSize: 12, color: '#666' },
});

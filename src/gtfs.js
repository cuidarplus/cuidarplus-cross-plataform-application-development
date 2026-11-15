// Dados estáticos da SPTrans (GTFS) embutidos no app: funcionam offline e sem a API
import stops from '../assets/gtfs/stops.json';
import horarios from '../assets/gtfs/horarios.json';
import { distanciaMetros } from './geo';

// Pontos num raio (metros) em volta do GPS, do mais perto para o mais longe
export function paradasProximas(lat, lon, raio, limite = 10) {
  const delta = raio / 100000; // filtro rápido (em graus) antes do cálculo exato
  const perto = [];
  for (const [id, nome, plat, plon] of stops) {
    if (Math.abs(plat - lat) > delta || Math.abs(plon - lon) > delta) continue;
    const d = distanciaMetros(lat, lon, plat, plon);
    if (d <= raio) perto.push({ id, nome, lat: plat, lon: plon, distancia: Math.round(d) });
  }
  return perto.sort((a, b) => a.distancia - b.distancia).slice(0, limite);
}

const hhmm = (seg) => {
  const s = ((seg % 86400) + 86400) % 86400;
  return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}`;
};

// Próxima chegada programada de cada linha num ponto (usa as frequências do GTFS)
export function chegadasProgramadas(stopId, agora = new Date(), limite = 8) {
  const segAgora = agora.getHours() * 3600 + agora.getMinutes() * 60 + agora.getSeconds();
  const melhores = {}; // uma chegada por linha + destino

  for (const [iViagem, desloc] of horarios.paradas[stopId] || []) {
    const [linha, destino, servico, janelas] = horarios.viagens[iViagem];
    // ontem (1) também conta: viagens que passam da meia-noite (ex.: 24:30)
    for (const ontem of [0, 1]) {
      if (!horarios.servicos[servico][(agora.getDay() - ontem + 7) % 7]) continue;
      const ref = segAgora + 86400 * ontem;
      for (const [ini, fim, intervalo] of janelas) {
        // primeira saída do terminal cuja chegada neste ponto ainda não passou
        let saida = ini;
        if (ref - desloc > ini) saida = intervalo > 0 ? ini + Math.ceil((ref - desloc - ini) / intervalo) * intervalo : Infinity;
        if (saida >= fim) continue;
        const chegada = saida + desloc - 86400 * ontem; // segundos desde 00:00 de hoje
        const chave = `${linha}|${destino}`;
        if (!melhores[chave] || chegada < melhores[chave].chegada) melhores[chave] = { linha, destino, chegada };
      }
    }
  }

  return Object.values(melhores)
    .sort((a, b) => a.chegada - b.chegada)
    .slice(0, limite)
    .map((c) => ({ linha: c.linha, destino: c.destino, hora: hhmm(c.chegada), minutos: Math.max(0, Math.round((c.chegada - segAgora) / 60)), acessivel: null }));
}

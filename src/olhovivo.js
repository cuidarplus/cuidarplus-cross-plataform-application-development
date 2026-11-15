// Cliente da API Olho Vivo (SPTrans). No celular o cookie de sessão é guardado automaticamente.
import { API_BASE, API_TOKEN } from './config';
import { distanciaMetros } from './geo';

let autenticado = false;

// fetch com limite de tempo, para o app não ficar travado
async function pedir(caminho, opcoes) {
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), 8000);
  try {
    return await fetch(`${API_BASE}/${caminho}`, { ...opcoes, signal: controle.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function autenticar() {
  const r = await pedir(`Login/Autenticar?token=${API_TOKEN}`, { method: 'POST' });
  autenticado = (await r.text()).trim() === 'true';
  if (!autenticado) throw new Error('Login recusado pela SPTrans');
}

async function consultar(caminho) {
  if (!autenticado) await autenticar();
  let r = await pedir(caminho);
  if (r.status === 401) { // sessão expirou: autentica de novo
    await autenticar();
    r = await pedir(caminho);
  }
  if (!r.ok) throw new Error(`Olho Vivo respondeu HTTP ${r.status}`);
  return r.json();
}

// O código do ponto na Olho Vivo (cp) não é o stop_id do GTFS:
// procura pelo nome e escolhe o resultado mais perto da coordenada (até 80 m)
export async function acharCodigoParada(parada) {
  const lista = await consultar(`Parada/Buscar?termosBusca=${encodeURIComponent(parada.nome)}`);
  let codigo = null;
  let menor = 80;
  for (const p of lista) {
    const d = distanciaMetros(parada.lat, parada.lon, p.py, p.px);
    if (d < menor) { menor = d; codigo = p.cp; }
  }
  return codigo;
}

const minutosDoDia = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// Próximo ônibus de cada linha que passa no ponto, em tempo real
export async function previsaoParada(cp) {
  const dados = await consultar(`Previsao/Parada?codigoParada=${cp}`);
  if (!dados.p || !dados.p.l) return []; // sem previsão no momento
  const agora = minutosDoDia(dados.hr);
  return dados.p.l
    .filter((l) => l.vs && l.vs.length)
    .map((l) => ({
      linha: l.c,
      destino: l.lt1,
      hora: l.vs[0].t,
      minutos: (minutosDoDia(l.vs[0].t) - agora + 1440) % 1440,
      acessivel: l.vs[0].a,
    }))
    .sort((a, b) => a.minutos - b.minutos);
}

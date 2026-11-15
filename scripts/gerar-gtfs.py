# Gera assets/gtfs/stops.json e horarios.json a partir dos arquivos GTFS da SPTrans.
# Uso: python scripts/gerar-gtfs.py <pasta_com_os_txt>
import csv, json, sys, os
from collections import defaultdict

pasta = sys.argv[1] if len(sys.argv) > 1 else '.'
ler = lambda f: list(csv.DictReader(open(os.path.join(pasta, f), encoding='utf-8-sig', newline='')))

def seg(hhmmss):  # "24:00:27" -> segundos (aceita horas >= 24)
    h, m, s = map(int, hhmmss.split(':'))
    return h * 3600 + m * 60 + s

stops = ler('stops.txt')
trips = ler('trips.txt')
freqs = ler('frequencies.txt')
times = ler('stop_times.txt')
calendar = ler('calendar.txt')

# dias de operação na ordem do Date.getDay() do JavaScript (domingo = 0)
dias = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
servicos = {c['service_id']: [int(c[d]) for d in dias] for c in calendar}

# janelas de frequência por viagem: [inicio, fim, intervalo] em segundos
janelas = defaultdict(list)
for f in freqs:
    janelas[f['trip_id']].append([seg(f['start_time']), seg(f['end_time']), int(f['headway_secs'])])

# viagens: [linha, destino, servico, janelas]
idx = {}
lista = []
for t in trips:
    idx[t['trip_id']] = len(lista)
    lista.append([t['route_id'], t['trip_headsign'], t['service_id'], janelas[t['trip_id']]])

# deslocamento (em segundos) de cada parada em relação ao início da viagem
por_viagem = defaultdict(list)
for r in times:
    por_viagem[r['trip_id']].append((int(r['stop_sequence']), r['stop_id'], seg(r['arrival_time'])))

por_parada = defaultdict(list)
for trip_id, itens in por_viagem.items():
    itens.sort()
    base = itens[0][2]
    for _, stop_id, chegada in itens:
        por_parada[stop_id].append([idx[trip_id], chegada - base])

os.makedirs('assets/gtfs', exist_ok=True)
json.dump([[s['stop_id'], s['stop_name'], float(s['stop_lat']), float(s['stop_lon'])] for s in stops],
          open('assets/gtfs/stops.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
json.dump({'servicos': servicos, 'viagens': lista, 'paradas': por_parada},
          open('assets/gtfs/horarios.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('ok:', len(stops), 'paradas,', len(lista), 'viagens')

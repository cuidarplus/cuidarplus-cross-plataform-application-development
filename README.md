# CuidarPlus - Transit SP

## Sobre o projeto

O CuidarPlus - Transit SP é um aplicativo mobile desenvolvido em React Native com Expo para ajudar pessoas a se deslocarem melhor no transporte público de São Paulo. O objetivo principal é facilitar a localização de pontos de ônibus próximos, informar a previsão de chegada e avisar o usuário quando é hora de sair para não perder o veículo.

A proposta do projeto é simples e direta: usar a localização do usuário, consultar dados da SPTrans e entregar uma experiência útil, rápida e acessível no dia a dia.

## Problema que o projeto resolve

Muitas pessoas enfrentam incerteza ao usar transporte público, principalmente em relação a:

- qual ponto de ônibus está mais perto;
- quanto tempo falta para o próximo ônibus chegar;
- se a previsão está atualizada em tempo real;
- quando sair de casa ou do local atual para chegar ao ponto no momento certo.

O aplicativo busca reduzir essa incerteza e aumentar a previsibilidade da rotina de deslocamento urbano.

## Objetivo

O objetivo do CuidarPlus é oferecer uma solução prática para:

- localizar ônibus próximos ao usuário;
- mostrar previsões de chegada por linha e destino;
- usar dados em tempo real quando disponíveis;
- manter funcionamento mesmo sem acesso à API, com dados programados do GTFS;
- enviar alertas locais para avisar o momento ideal de sair.

## Funcionalidades

### 1. Localização de paradas próximas

Ao abrir o app, o usuário concede acesso à sua localização. O sistema busca as paradas mais próximas dentro de um raio configurado e exibe uma lista ordenada por distância.

### 2. Consulta de previsão

Ao selecionar uma parada, o aplicativo tenta consultar a previsão em tempo real da SPTrans. Caso a API não esteja disponível ou falhe, ele usa os horários programados armazenados localmente no projeto.

### 3. Exibição por linha e destino

Cada ônibus é apresentado com:

- linha;
- destino;
- tempo estimado de chegada;
- horário previsto;
- indicação de acessibilidade, quando houver.

### 4. Alerta de saída

O usuário pode ativar um aviso para uma linha específica. O app calcula o tempo necessário para caminhar até a parada, considera a margem de segurança e agenda uma notificação local para alertar no momento correto.

### 5. Atualização automática

A previsão da parada selecionada é atualizada periodicamente para manter o usuário informado sem precisar recarregar a tela manualmente.

## Como o sistema funciona

O app funciona em três etapas principais:

1. O usuário permite o uso da localização.
2. O sistema identifica as paradas mais próximas da sua posição.
3. O usuário escolhe uma parada e consulta as previsões.

Se a API de tempo real estiver disponível, os dados são mostrados em tempo real. Se não estiver, o app utiliza o banco de dados GTFS embutido no projeto para manter a funcionalidade.

## Tecnologias utilizadas

- React Native
- Expo
- Expo Location
- Expo Notifications
- JavaScript
- JSON e dados públicos GTFS

## Estrutura do projeto

```text
.
├── App.js                     # Tela principal do aplicativo
├── index.js                  # Inicialização do Expo
├── app.json                  # Configuração do app mobile
├── package.json              # Dependências e scripts
├── PARTICIPANTES.txt          # Participantes do projeto
├── assets/
│   ├── icon.png
│   ├── favicon.png
│   ├── splash-icon.png
│   └── gtfs/
│       ├── horarios.json
│       └── stops.json
├── scripts/
│   └── gerar-gtfs.py         # Geração dos arquivos de dados GTFS
├── src/
│   ├── alertas.js            # Lógica de notificações e alertas
│   ├── config.js             # Configurações do app e token
│   ├── geo.js               # Cálculo de distância geográfica
│   ├── gtfs.js               # Busca por paradas e horários programados
│   ├── olhovivo.js           # Integração com a API da SPTrans
│   └── ...
├── README.md
└── package-lock.json
```

## Arquitetura do sistema

O projeto foi pensado como uma aplicação cliente mobile simples, sem backend próprio. Isso significa que grande parte da lógica fica no próprio app, que acessa:

- GPS do dispositivo;
- dados do GTFS locais;
- API da SPTrans para previsões em tempo real;
- notificações do sistema operacional.

Essa arquitetura torna o desenvolvimento mais rápido e funciona bem para um protótipo ou solução acessível em ambiente acadêmico.

## Fluxo de uso

### Cenário de uso comum

1. O usuário abre o aplicativo.
2. O app solicita permissão de localização.
3. O sistema mostra os pontos de ônibus mais próximos.
4. O usuário escolhe uma parada.
5. O app exibe os próximos ônibus e seus destinos.
6. O usuário pode ativar o alerta para sair no momento certo.

## Integração com dados externos

### GTFS

O projeto inclui dados GTFS processados em formato JSON para permitir acesso rápido a horários programados. Isso deixa o app funcional mesmo sem internet ou sem resposta imediata da API.

### SPTrans / Olho Vivo

A integração com a API Olho Vivo oferece previsões mais próximas da realidade em tempo real, especialmente para mostrar horários mais precisos e atualizados.

## Dependências do projeto

As principais dependências estão definidas em `package.json` e incluem:

- `expo`
- `expo-location`
- `expo-notifications`
- `react`
- `react-native`

## Como executar o projeto

### Pré-requisitos

- Node.js instalado
- npm ou yarn
- Expo instalado
- Emulador Android ou dispositivo físico
- Permissões de localização e notificações habilitadas

### Instalação

```bash
npm install
```

### Iniciar o app

```bash
npm start
```

### Rodar no Android

```bash
npm run android
```

### Rodar no iOS

```bash
npm run ios
```

### Rodar no navegador web

```bash
npm run web
```

## Participantes

- Danilo Roberto Anterio dos Santos RM566966
- Jose Ribeiro dos Santos Neto RM567692

## Projeto FIAP

Global Solution 2026.2 - Cross-Platform Application Development

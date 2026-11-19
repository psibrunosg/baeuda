# Baeuda — Arquitetura Base e Protótipo Greybox 3D da Aula 1

- **Data:** 2026-11-19
- **Status:** Aprovado em design (aguardando revisão final da spec)
- **Escopo:** Estrutura inicial do repositório `baeuda`, arquitetura orientada a domínio + adaptador Greybox↔GLB em React Three Fiber e implementação completa do ciclo de 7 telas da **Aula 1 (Café da Esquina)** sem tradução.

---

## 1. Visão e Princípios Inegociáveis

`baeuda` é um aplicativo de aquisição natural de idiomas **100% sem tradução**, construído sobre três regras pedagógicas que governam arquitetura, cena 3D e UI:

1. **Zero português na experiência do aluno:** a interface voltada ao aluno usa apenas som nativo (inglês), gestos/expressões 3D, contrastes visuais e ícones universais. Textos em inglês aparecem **somente** na barra recolhível de debug (`DEV`) quando um arquivo `.mp3` ainda não existir em `public/audio/`.
2. **Erro como *Recast*, nunca punição:** não existem vidas, barras de erro, som de falha, X vermelho ou rebaixamento de nível. Tocar no item errado gera uma resposta acolhedora do Leo nomeando o objeto tocado e repetindo o pedido com calma.
3. **Respeito ao Período Silencioso:** falar no Micro-Eco (Tela 6) é sempre opcional e sem cronômetro; o caminho silencioso é acolhido com o mesmo calor narrativo que o caminho vocal.

---

## 2. Stack Técnica e Estrutura de Pastas

- **Runtime:** Vite + React 19 + TypeScript (mobile-first, SPA leve pronta para evoluir a PWA).
- **3D:** `three`, `@react-three/fiber`, `@react-three/drei`.
- **Testes:** Vitest (`vitest`, `@vitest/ui` opcional) + TypeScript strict (`tsc --noEmit`).
- **Persistência:** `localStorage` versionado (`schemaVersion: 1`).

```text
baeuda/
├── public/
│   ├── audio/
│   │   └── lesson1/
│   │       └── README.md         # Checklist dos .mp3 esperados e falas exatas
│   └── models/
│       └── README.md             # Contrato para cafe_esquina.glb e leo_barista.glb
├── src/
│   ├── domain/                   # TypeScript puro (sem React, Three.js ou DOM)
│   │   ├── types.ts              # ConceptId, AcquisitionStage, LearnerProfile, etc.
│   │   ├── constellation.ts      # Grafo de conceitos, evolução monotônica e arestas
│   │   ├── learnerMemory.ts      # Atualização de preferência, conforto oral e locais
│   │   └── lessonEngine.ts       # Máquina de estados determinística das 7 telas
│   ├── content/                  # Conteúdo declarativo (extensível para Aula 2+)
│   │   ├── audioManifest.ts      # Chaves tipadas, caminhos .mp3, durações e visemas
│   │   └── lesson1Cafe.ts        # Definição das 7 telas, alvos, Recasts e conceitos
│   ├── services/                 # Efeitos colaterais isolados do domínio
│   │   ├── audioPlayer.ts        # Player .mp3 + fallback de relógio virtual/visemas
│   │   ├── voiceCapture.ts       # Detecção acolhedora de fala via Web Audio RMS
│   │   └── learnerStorage.ts     # Leitura/escrita resiliente em localStorage
│   ├── scene/                    # React Three Fiber (contrato idêntico ao Blender)
│   │   ├── contracts.ts          # Constantes prop_*, cam_*, NLA clips e visemas
│   │   ├── ExperienceCanvas.tsx  # <Canvas> único, CameraRig e iluminação cozy
│   │   ├── NeighborhoodMap.tsx   # Mapa greybox com neblina + Café da Esquina
│   │   ├── CafeScene.tsx         # Adaptador greybox ↔ GLB (balcão, props, FX)
│   │   ├── LeoBarista.tsx        # Adaptador greybox ↔ GLB (poses NLA + lip-sync)
│   │   └── Constellation3D.tsx   # Nuvem estelar 3D com estágios e pontes
│   ├── ui/                       # HUD 0%-português + ferramentas DEV
│   │   ├── LessonHud.tsx         # Botão ▶, botão ?, anel de pour, microfone/aceno
│   │   ├── TopNav.tsx            # Alternador icônico Mapa ↔ Constelação + relógio
│   │   ├── SensoryCard.tsx       # Ficha Sensorial sem tradução ao tocar em estrela
│   │   └── DebugAudioBar.tsx     # Caption de fallback + controles DEV recolhíveis
│   ├── App.tsx                   # Orquestração entre domínio, serviços, cena e HUD
│   ├── main.tsx
│   └── index.css
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-11-19-baeuda-lesson1-greybox-design.md
```

**Regra de dependência:** `domain` não importa de nenhum outro módulo. `content` importa apenas de `domain`. `services`, `scene` e `ui` importam de `domain` e `content`. `App.tsx` conecta as bordas sem carregar regras pedagógicas.

---

## 3. Modelo de Domínio e Persistência

### 3.1 Tipos Centrais (`src/domain/types.ts`)

- **`ConceptId`:** `'cup' | 'coffee' | 'water' | 'hot' | 'cold' | 'pour'`
- **`AcquisitionStage`:** `'seed' | 'root' | 'voice'`
  - Ordem estritamente monotônica: `seed < root < voice`. Nenhum erro ou tempo ocioso rebaixa um conceito; o esquecimento futuro apenas atenua o brilho visual.
- **`DrinkChoice`:** `'hot_coffee' | 'cold_water' | 'cold_coffee'`
- **`OralComfort`:** `'unknown' | 'silent' | 'vocal'`
- **`LocationId`:** `'cafe' | 'market' | 'plaza'`
- **`LocationStatus`:** `'unexplored' | 'discovered' | 'familiar'`
- **`ConceptNode`:**
  - `id: ConceptId`
  - `stage: AcquisitionStage`
  - `originLocation: LocationId`
  - `neededHint: boolean`
  - `lastContactAt: string` (ISO 8601)
- **`ConstellationEdge`:**
  - `from: ConceptId`
  - `to: ConceptId`
  - `kind: 'situational' | 'contrast' | 'narrative'`
  - Arestas da Aula 1:
    - Situacionais: `cup—coffee`, `cup—water`, `coffee—pour`, `water—pour`, `coffee—hot`, `water—cold`
    - Contraste (linha pontilhada dupla): `hot↔cold`
- **`LearnerProfile` (`schemaVersion: 1`):**
  - `schemaVersion: 1`
  - `preferredDrink: DrinkChoice | null`
  - `oralComfort: OralComfort`
  - `immersionSeconds: number`
  - `completedLessonIds: string[]`
  - `locations: Record<LocationId, LocationStatus>` (inicial: `cafe: 'discovered'`, `market: 'unexplored'`, `plaza: 'unexplored'`; ao concluir Aula 1, `cafe` passa a `'familiar'`)
  - `constellation: Partial<Record<ConceptId, ConceptNode>>`

### 3.2 Persistência (`src/services/learnerStorage.ts`)

- Chave: `'baeuda.learnerProfile.v1'`.
- Se o JSON estiver ausente, inválido ou com `schemaVersion` incompatível, retorna `createInitialProfile()` sem lançar exceção.
- Expõe `loadProfile()`, `saveProfile(profile)` e `resetProfile()` (usado no painel DEV).

---

## 4. Máquina de Estados da Aula 1 (7 Telas e Rede de Segurança)

A máquina de estados em `src/domain/lessonEngine.ts` é uma função pura `lessonReducer(state, event) -> { state, effects }`.

### 4.1 As 7 Telas e Sub-passos

| Tela | ID da Fase | Câmera | O que acontece na cena | Interação do aluno | Conceitos trabalhados |
|---|---|---|---|---|---|
| 1 | `map_arrival` | `cam_mapa` → `cam_balcao` | Mapa greybox sob neblina com Café da Esquina iluminado e Leo acenando na porta | Toca na porta (`prop_cafe_door`) ou botão `▶` (destrava autoplay); Leo cumprimenta (`hi_leo`, `wave_hi`) | Cola social: `hi` |
| 2 | `counter_intro` | `cam_balcao` | Demo sequencial: `cup` (`prop_cup_empty`), `coffee` (`prop_jar_coffee`), `water` (`prop_water_cold`). Depois 3 rodadas TPR (`ask_cup`, `ask_water`, `ask_coffee`) | Toca no prop correspondente enquanto Leo estende a palma (`ask_palm`) | `cup`, `coffee`, `water` (+ `please`, `thanks`) |
| 3 | `thermal_contrast` | `cam_contraste` | Demo sensorial: café fumegante (`demo_hot_coffee`, `blow_hot`) vs. água com gelo (`demo_cold_water`, `shiver_cold`). Depois 2 clientes: silhueta com frio pede `hot coffee`, ciclista pede `cold water` | Toca em `prop_cup_hot` na rodada 1 e `prop_water_cold` na rodada 2 | `hot`, `cold` |
| 4 | `action_pour` | `cam_despejo` | Xícara vazia ao centro (`prop_cup_empty`). Rodada 1: jarra de café (`prop_jar_coffee`). Rodada 2: garrafa de água (`prop_water_cold`) | Pressiona e segura (mouse ou toque) sobre a jarra/garrafa até completar 100% (~1,4 s); soltar antes pausa sem punição | `pour` |
| 5 | `personal_choice` | `cam_balcao` | Balcão mostra 3 bebidas prontas: `prop_cup_hot`, `prop_water_cold` e `prop_iced_coffee` (`cold coffee`). Leo pergunta (`choice_prompt`) | Toca na bebida desejada; grava `preferredDrink`. `cold_coffee` dispara `surprised_happy` (`choice_cold_coffee_nice`); as demais disparam `nod_thanks` (`choice_confirm_hot_coffee` / `choice_confirm_cold_water`) | Combinação ativa `hot/cold + coffee/water` |
| 6 | `micro_echo` | `cam_balcao` | Leo segura a bebida escolhida e convida sem cronômetro (`echo_prompt_<drink>`). Mostra botão de microfone + botão de aceno silencioso | Fala no microfone (`VOICE_DETECTED` → onda verde, `echo_vocal_<drink>`, `oralComfort = 'vocal'`, promove conceitos da bebida para `voice`) **ou** toca no aceno (`SILENT_WAVE` → `echo_silent_<drink>`, `oralComfort = 'silent'`, Leo sorri e entrega) | Produção opcional (`voice`) |
| 7 | `farewell_constellation` | `cam_caixa` → `cam_constelacao` | Bebida servida + caixa misteriosa (`prop_box_mystery`) pousa no balcão (`farewell_see_you`, `farewell_box`). 6 orbes de luz voam dos props até a Constelação | Observa o nascimento das 6 estrelas e explora a Constelação interativa (com `hot ↔ cold` ligado) | Consolidação dos 6 nós + gancho da Aula 2 |

**Comportamento ao retornar após concluir a Aula 1:** se `localStorage` já contiver `completedLessonIds` com `'lesson1_cafe'`, o app abre no Mapa do Bairro com o Café em estado `'familiar'` e a Constelação já acessível no topo com as estrelas salvas. Tocar na porta do Café permite rejogar a Aula 1 preservando a progressão monotônica da Constelação (nenhuma estrela é rebaixada).

### 4.2 Rede de Segurança (Recast, Hesitação e `?`)

- **Toque errado (`PROP_TAPPED` fora do alvo):**
  - Dispara fala de *Recast* correspondente ao objeto tocado (`recast_cup`, `recast_coffee`, `recast_water`, `recast_hot_coffee`, `recast_cold_water`) seguida da repetição calma do pedido atual.
  - Leo executa `nod_thanks` leve → `ask_palm` (nunca gesto negativo).
  - Marca o(s) conceito(s) daquela rodada com `neededHint = true` (ao final da aula, nasce como `'seed'`; sem pista/erro, nasce como `'root'`).
- **Hesitação (`HESITATION_TIMEOUT` após 5 segundos sem interação em passo aguardando ação):**
  - Ativa `hintMode = 'glow'` (brilho quente pulsante no prop-alvo).
  - Reproduz o prompt atual com `playbackRate = 0.8`.
  - Marca `neededHint = true` apenas se o usuário ainda não tinha interagido.
- **Botão `?` ("Não Entendi", `HELP_REQUESTED`):**
  - Sem tradução: ativa `hintMode = 'contrast'` (na Tela 3 pulsa vapor âmbar vs. gelo azul; na Tela 4 mostra arco direcional sobre a xícara; na Tela 2 isola e ilumina o prop-alvo) e toca a palavra-chave isolada (`demo_cup`, `demo_coffee`, `demo_water`, `word_hot`, `word_cold` ou `pour_coffee_prompt`).
  - Marca `neededHint = true` para o conceito da rodada.
- **Regras de classificação final dos 6 conceitos:**
  - `voice`: conceitos ligados à bebida escolhida quando o aluno optou por falar na Tela 6 (`hot_coffee` → `['cup', 'coffee', 'hot']`, `cold_water` → `['cup', 'water', 'cold']`, `cold_coffee` → `['cup', 'coffee', 'cold']`).
  - `root`: conceitos completados sem erro/pista (`neededHint === false`) que não atingiram `voice`.
  - `seed`: conceitos em que o aluno acionou `?`, precisou de *Recast* ou recebeu pista de hesitação.

---

## 5. Arquitetura 3D (React Three Fiber) e Contrato Greybox ↔ GLB

### 5.1 `<Canvas>` Único e Câmera (`src/scene/ExperienceCanvas.tsx`)

- Um único `<Canvas shadows="percentage" dpr={[1, 1.5]} camera={{ position: [4.2, 3.6, 5.4], fov: 42 }}>` cobre `100vw × 100vh`.
- **`CameraRig`:** interpola posição e ponto de foco (`lookAt`) no `useFrame` com `THREE.MathUtils.damp(cur, target, 5, delta)` entre as âncoras de `contracts.ts` (`cam_mapa`, `cam_balcao`, `cam_contraste`, `cam_despejo`, `cam_caixa`, `cam_constelacao`). Quando o usuário está na visão livre de Mapa ou Constelação, habilita `<OrbitControls makeDefault enableDamping dampingFactor={0.08} />` com limites de zoom e ângulo polar.
- **Regra de performance:** zero `setState` dentro de `useFrame`. Todo movimento contínuo (respiração do Leo, lip-sync, piscadas, vapor, gelo, nível de líquido no *pour*, flutuação das estrelas e voo dos 6 orbes) muta refs diretamente com `delta`.

### 5.2 Contratos Blender (`src/scene/contracts.ts`)

Todos os nomes coincidem com o guia de modelagem Blender para que a troca futura por `.glb` não exija alteração de código de jogo:

- **Props (`PropName`):** `prop_cafe_door`, `prop_cup_empty`, `prop_cup_hot`, `prop_jar_coffee`, `prop_water_cold`, `prop_iced_coffee`, `prop_box_mystery`.
- **Clipes NLA (`LeoAnimation`):** `idle_breathe`, `wave_hi`, `present_left`, `present_right`, `ask_palm`, `blow_hot`, `shiver_cold`, `nod_thanks`, `surprised_happy`, `farewell_box`.
- **Visemas (`VisemeId`):** `viseme_aa`, `viseme_ee`, `viseme_oo`, `viseme_fv`, `viseme_mbp` (+ expressão `blink`).
- **Helper `findPropName(object)`:** sobe `object.parent` até localizar um nome com prefixo `prop_`. Funciona tanto nos `<group name="prop_...">` do greybox quanto em meshes multi-material exportadas do Blender.

### 5.3 Adaptador Greybox ↔ GLB

- `CafeScene.tsx` e `LeoBarista.tsx` recebem `assetMode: 'greybox' | 'glb'` (padrão `'greybox'`).
- **Greybox (`CafeGreybox` + `LeoGreybox`):**
  - Estética *cozy low-poly diorama*: madeira quente no balcão, fachada terracota com toldo listrado, luz pendente acolhedora, chaminé soltando vapor suave, quarteirões vizinhos (Mercado e Praça) envoltos em neblina translúcida.
  - **Feedback sensorial nos props:** vapor animado (esferas suaves subindo com fade) + brilho âmbar em `prop_cup_hot`; cubos translúcidos + brilho azulado em `prop_water_cold` e `prop_iced_coffee`; inclinação suave da jarra + jato cilíndrico + nível de líquido subindo dentro de `prop_cup_empty` durante `action_pour`; laço e leve brilho de aroma em `prop_box_mystery`.
  - **Leo greybox articulado:** tronco com avental verde-oliva, cabeça expressiva com olhos que piscam a cada ~3,5 s, sobrancelhas, braços com pivôs de ombro que executam as poses correspondentes a cada clipe NLA e boca geométrica que escala em largura/abertura conforme o visema ativo lido de `speechRef.current`.
- **GLB (`CafeGlb` + `LeoGlb`):**
  - Implementados lado a lado usando `useGLTF`, `useAnimations` (com crossfade suave de `0.25s` e retorno automático a `idle_breathe` após ações *one-shot*) e `morphTargetDictionary`/`morphTargetInfluences` para os 5 visemas + `blink`.
  - Incluem `<ErrorBoundary>` dedicado para cair automaticamente em `greybox` caso o usuário alterne para `glb` no painel DEV antes de adicionar os arquivos em `public/models/`.

### 5.4 Constelação 3D (`src/scene/Constellation3D.tsx`)

- Renderiza os 6 nós da Aula 1 em constelação espacial acima do cenário com rotação suave e interação via clique/toque:
  - `seed`: esfera menor + anel tracejado translúcido;
  - `root`: esfera sólida nítida + halo estável;
  - `voice`: estrela facetada luminosa + aura pulsante.
- Linhas situacionais contínuas e linha pontilhada dupla em destaque ligando `hot ↔ cold`.
- Ao tocar em um nó, toca o áudio isolado do conceito e abre a `SensoryCard`.

---

## 6. Manifesto de Áudio, Captura de Voz e UI Zero-Português

### 6.1 Manifesto e Player (`audioManifest.ts` + `audioPlayer.ts`)

- O manifesto define todas as falas tipadas (`SpeechKey`) da Aula 1 (cumprimento, demos, pedidos TPR, *Recasts*, contraste, *pour*, escolha pessoal, Micro-Eco, despedida e palavras isoladas `word_hot` / `word_cold`), cada uma com:
  - `src`: `/audio/lesson1/<key>.mp3`
  - `phrase`: frase em inglês (usada apenas para debug quando o `.mp3` não existe)
  - `fallbackDurationMs`: duração realista de fallback
  - `cues`: array de `{ at: number; viseme: VisemeId | null }`
- **`speechRef` compartilhado:** `{ getCurrentTime: () => number; isPlaying: () => boolean; cues: VisemeCue[] }` — permite que `LeoBarista` leia o tempo exato no `useFrame` tanto quando toca um `HTMLAudioElement` real quanto quando roda no relógio virtual de fallback.
- **Fallback automático:** ao tentar tocar `line.src`, se o `.mp3` retornar erro de carregamento/404 ou falhar na decodificação, o player inicia imediatamente o relógio virtual de duração `fallbackDurationMs / playbackRate`, aciona o callback de status `{ mode: 'fallback', key, src, phrase }` para a `DebugAudioBar` e dispara `onEnded` ao concluir — sem interromper a aula.
- **Lifecycle:** para e limpa o áudio ativo e timeouts ao iniciar uma nova fala ou ao desmontar (`dispose()`).

### 6.2 Captura de Voz (`src/services/voiceCapture.ts`)

- Ao tocar no microfone na Tela 6 (ou no Eco Rápido da Ficha Sensorial), abre `getUserMedia({ audio: true })` + `AudioContext` + `AnalyserNode`, calculando o nível RMS em tempo real para desenhar a onda sonora visual no botão.
- Se a energia RMS superar o limiar de fala por ~250 ms acumulados (ou dentro de uma janela de 5 s), encerra o microfone com sucesso e dispara `VOICE_DETECTED` (aceitando qualquer sotaque/tentativa audível).
- Se `getUserMedia` não existir ou for negado pelo usuário, retorna graciosamente `unavailable` sem exibir alerta bloqueante; o botão de aceno silencioso permanece sempre clicável e a `DebugAudioBar` oferece um botão de simulação de voz para testes sem microfone.

### 6.3 UI 0%-Português (`src/ui/`)

- **`TopNav.tsx`:** seletor icônico de dois estados (ícone de Mapa ↔ ícone de Constelação) + ícone de relógio com minutos de imersão (ex.: `01:24`, sem rótulos em português).
- **`LessonHud.tsx`:**
  - Na entrada (`map_arrival`): botão flutuante `▶` para destravar áudio no mobile/desktop (tocar direto na porta do café também funciona).
  - Durante passos interativos: botão circular `?` no canto inferior direito (Não Entendi).
  - Na Tela 4 (`action_pour`): anel visual de preenchimento acompanhando o progresso de despejo (`0–100%`).
  - Na Tela 6 (`micro_echo`): botão central de microfone com onda sonora verde ao falar + botão discreto de mão acenando ao lado para seguir em silêncio.
- **`SensoryCard.tsx`:** painel inferior sem português aberto ao tocar em uma estrela da Constelação — mostra ícone/miniatura visual do conceito, estágio visual (`seed`/`root`/`voice`), botão de áudio (replay), ponte de contraste visual (quando o conceito tem par de contraste como `hot ↔ cold`), botão de atalho para voltar ao Café e botão de microfone (Eco Rápido, que permite promover um nó `seed`/`root` para `voice`).
- **`DebugAudioBar.tsx`:** badge discreto `DEV` no canto superior esquerdo. Quando o `AudioPlayer` cai em fallback por `.mp3` ausente, exibe uma pílula compacta com o texto em inglês da fala atual + caminho do arquivo faltante; ao expandir o painel `DEV`, permite: alternar exibição de captions, simular fala no Micro-Eco, pular para qualquer uma das 7 telas, alternar `greybox`/`glb` e resetar `localStorage`.

---

## 7. Estratégia de Testes e Critérios de Sucesso

### 7.1 Testes Automatizados (Vitest)

1. **`src/domain/__tests__/constellation.test.ts`**
   - Criação de nós, promoção monotônica (`seed → root → voice`, nunca rebaixando `voice` para `root`/`seed`), verificação das arestas situacionais e da aresta de contraste `hot ↔ cold`.
2. **`src/domain/__tests__/lessonEngine.test.ts`**
   - Caminho feliz completo das 7 telas (de `map_arrival` até `farewell_constellation`) gerando os 6 conceitos no perfil final.
   - Toque errado dispara *Recast* sem punição e marca `neededHint = true` (nó final nasce como `seed`).
   - Evento `HESITATION_TIMEOUT` ativa brilho no alvo e solicita replay em `0.8x`.
   - Evento `HELP_REQUESTED` (`?`) ativa destaque visual/contraste e toca a palavra isolada.
   - Escolha criativa `cold_coffee` na Tela 5 dispara `surprised_happy` e grava `preferredDrink = 'cold_coffee'`.
   - Micro-Eco vocal promove os conceitos da bebida escolhida para `voice` e grava `oralComfort = 'vocal'`; aceno silencioso mantém `oralComfort = 'silent'` e avança normalmente.
3. **`src/services/__tests__/learnerStorage.test.ts`**
   - Salvar e recarregar `LearnerProfile` completo; recuperação limpa diante de JSON corrompido ou versão antiga.
4. **`src/services/__tests__/audioPlayer.test.ts`**
   - Resolução exata de visemas dado um timestamp `t` (antes, durante e após o último cue).
   - Fallback temporizado acionado automaticamente quando o elemento de áudio dispara erro, executando `onEnded` e limpando timers no `dispose()`.

### 7.2 Verificação de Build e Experiência Real

- `npm test` passando 100%.
- `npx tsc --noEmit` sem erros de tipagem.
- `npm run build` gerando bundle de produção limpo.
- Inspeção interativa no navegador percorrendo todas as 7 telas da Aula 1 (incluindo clique na porta, TPR, *Recast*, contraste `hot`/`cold`, gesto contínuo `pour`, escolha `cold coffee`, Micro-Eco, transição para Constelação 3D, Ficha Sensorial e persistência ao recarregar a página), sem erros de console WebGL ou warnings depreciados de shadow map.

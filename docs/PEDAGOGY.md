# Baeuda — Visão Pedagógica Macro (`Pre-A1 → B1`)

**Version:** 1.0 · **Updated:** 2026-11-24 · [GDD](GDD.md) · [Architecture](ARCHITECTURE.md)

> **Propósito:** Definir a espinha dorsal pedagógica do Baeuda do `Pre-A1` ao `B1`, unindo ciência de aquisição de linguagem (como nativos constroem gramática pelo uso + o que jovens/adultos precisam em L2) à arquitetura do bairro 3D vivo em espiral. Este documento é a bússola macro para as fases futuras de produto e engenharia.

---

## 1. Princípios Científicos

A pedagogia do Baeuda se apoia em três pilares complementares: **Aquisição Baseada no Uso (L1)**, ***Focus on Form* Contextual (L2)** e **Memória Ativa com Transferência**.

### 1.1 Aquisição Baseada no Uso (*Usage-Based Linguistics* — Tomasello)
Nativos não aprendem gramática por tabelas abstratas nem por "chaves inatas"; a gramática **emerge do uso comunicativo** em quatro estágios progressivos:

1. **Blocos concretos (*Holophrases* — `Pre-A1`):** expressões inteiras ligadas diretamente a ações e objetos visíveis (*"Hot coffee"*, *"Cold water"*, *"Two apples"*), sem análise gramatical.
2. **Ilhas de construção (*Item-Based Constructions* — `A1`):** padrões ancorados em verbos e cenas de alta frequência (*"I want ___"*, *"Put it next to ___"*, *"I need ___"*). A estrutura pertence primeiro àquele contexto específico.
3. **Aspecto antes de Tempo (*Aspect Hypothesis* — `A1 → A2`):** humanos apreendem o **estado visível do evento** (acontecendo agora vs. concluído — ex.: *Leo is pouring* vs. *Leo poured*, *The cup broke*) antes de dominar tempo verbal abstrato no calendário. Em um diorama 3D, aspecto é **observável na cena**.
4. **Esquematização por variedade (*Type Frequency* — `A2 → B1`):** quando o mesmo padrão reaparece em muitos verbos, lojas e moradores diferentes (Café, Pizzaria, Farmácia, Correio, Praça), o cérebro abstrai a construção geral e passa a produzir frases inéditas com segurança.

### 1.2 Imersão + *Focus on Form* Contextual (Long, Schmidt, Ellis)
A pesquisa em aquisição de segunda língua (SLA) mostra um limite claro da imersão pura em jovens e adultos: embora construa fluência e compreensão, o filtro cognitivo da língua materna (*learned attention*) faz o cérebro **ignorar marcas de baixa saliência perceptual** (`-ed`, `-s`, `did`, auxiliares, preposições `in/on/at`, conectivos), causando fossilização.

A resposta do Baeuda **não** é voltar ao ensino tradicional de regras isoladas (*Focus on Forms*), e sim aplicar ***Focus on Form* (FonF)** dentro da imersão:
- **Significado e causa-e-efeito 3D vêm sempre primeiro.** Nenhuma lição começa com explicação gramatical ou tabela bilíngue.
- **Saliência perceptual no momento certo (*Noticing*):** quando uma marca nova importa para cumprir uma tarefa ou quando ocorre um erro, o jogo a torna perceptível por três meios diegéticos:
  1. **Contraste visual na cena 3D** (ex.: bolo *assando agora* vs. bolo *que assou ontem*; copo *cheio* vs. *vazio*).
  2. ***Recast* natural do NPC com ênfase prosódica** (o morador reformula naturalmente no diálogo, sem quebrar o papel).
  3. **Micro-dica sob demanda (*"Notice the pattern"*)** em inglês simples com 2 exemplos contrastados — sempre opcional, nunca obrigatória.

### 1.3 Recall Ativo, Espaçamento e Produção (Bjork, Swain)
- **Dificuldade desejável:** manter o atraso de dica (`5000 ms` nos interiores 3D) e só revelar pistas após hesitação ou erro real.
- **Produção (*Output Hypothesis*):** compreender não basta; falar em voz alta (`speak_aloud`) e montar respostas (`word_bank`, `fill_blank`, `Talk`) forçam o cérebro a notar lacunas sintáticas.
- **Intercalação (*Interleaving*) e Espaçamento (SRS):** o mesmo conceito volta em intervalos crescentes e em **modos diferentes** (3D → Prática → História → Diálogo), evitando memorização mecânica de tela.

---

## 2. A Espiral do Bairro Vivo (`Pre-A1 → B1`)

Em vez de descartar cenários antigos a cada nível, o Baeuda adota o modelo de **Bairro Vivo em Espiral + Evolução Temporal**: o mesmo boulevard (11 lojas, interiores 3D e moradores conhecidos) ganha novas camadas linguísticas e narrativas. Como o aluno já conhece o espaço e os personagens, a carga cognitiva do cenário cai a zero — sobrando atenção para notar construções mais complexas.

### 2.1 Matriz Curricular Macro

| Nível CEFR | Estágio Cognitivo-Linguístico | Atos Comunicativos & Estruturas Emergentes | Como o Bairro 3D Responde | Foco de Saliência (*Focus on Form*) | Marco do Bairro (Transição sem dicas) |
|---|---|---|---|---|---|
| **Pre-A1** | Blocos concretos (*Holophrases*) | Identificar objetos, cores/temperaturas, quantidades (`one/two`), pedir e agradecer (*please/thanks*). | Café (Ciclos 1–3) + descobertas iniciais na rua + mochila básica. | Som → objeto + pares mínimos concretos (`hot/cold`, `big/small`, `full/empty`). | **Pre-A1 Graduation Shift (Café):** atender pedidos combinados em sequência sem dica. |
| **A1** | Ilhas de construção + Aspecto presente | Preferências (*like/want/need*), posição espacial (*next to/in/on/behind*), compras e serviços simples, ações em curso (*Present Continuous* visual: *"She is baking"*). | Retorno espiral ao Café (`cafe_a1_spiral`) + Mercado, Praça, Pizzaria e Farmácia integrados; rotinas dos moradores e cadeia de 5 quests. | Ordem adjetivo + substantivo, plural contável (`two red apples`), preposições espaciais e `-ing` visível na animação. | **Dia de Feira no Bairro:** cumprir 3 demandas reais entre lojas combinando quantidade, espaço, preferência e ação em curso. |
| **A2** | Aspecto → Tempo (Passado/Futuro) + Conectivos | Narrar eventos recém-ocorridos (*Past Simple* a partir de ações concluídas na cena), planos imediatos (*going to / will*), comparações (*bigger/better/cheaper*), causa e contraste (*because/so/but*), resolver pequenos imprevistos (pedido errado, sintoma, atraso). | Mesmo bairro com **linha do tempo viva** (ontem/hoje/amanhã; manhã/tarde/noite); revisitas espirais à Pizzaria, Farmácia, Barbearia e Correio/Banco com imprevistos reais; *Stories* em arcos multi-episódio. | Contraste visual de aspecto → tempo (`is pouring` vs. `poured` / `baked`), auxiliares de pergunta (`Did you...?`), conectivos causais. | **Noite de Festival / Imprevisto no Bairro:** reconstruir o que aconteceu durante o dia, explicar um problema ocorrido e combinar o plano da noite. |
| **B1** | Esquemas abstratos + Pragmática & Registro | Expressar e defender opiniões, negociar alternativas, formular hipóteses (*if / would / might*), conectar experiências passadas ao presente (*Present Perfect*: *"Have you ever...?"*, *"It has been..."*), lidar com mal-entendidos e alternar registro (casual com Leo vs. formal no Banco/Correio). | Eventos comunitários no boulevard, mediação de conflitos/trocas entre lojas, entrevistas nos *Stories* e diálogos `Talk` com ramificação real e consequência narrativa. | Modais de polidez e hipótese (`could/would/might`), contraste *Past Simple* vs. *Present Perfect* ancorado no estado atual do bairro, marcadores discursivos (*actually, however, in my opinion*). | **Conselho do Bairro (*Neighborhood Assembly*):** conversa multi-turno com ramificação onde o aluno ouve pontos de vista, negocia e sintetiza um acordo entre moradores. |

### 2.2 Progressão por Habilidade Comunicativa

- **Escuta (*Listening*):** `Pre-A1` (palavras e frases curtas com áudio normal `0.95x` / lento `0.70x`) → `A1` (turnos de 1–2 frases com contexto visual) → `A2` (narrativas breves com imprevistos e pistas de tempo) → `B1` (diálogos multi-turno com nuances de intenção e registro).
- **Fala (*Speaking*):** `Pre-A1` (repetição guiada de blocos) → `A1` (respostas estruturadas com lacunas variáveis) → `A2` (recontar o que ocorreu / explicar um problema) → `B1` (opinar, justificar e negociar em turnos encadeados).
- **Leitura & Escrita (*Reading/Writing*):** sempre secundárias à escuta/cena no `Pre-A1`, crescendo gradualmente em `CuriosityModal`, `Word Bank`, `Fill-in-the-Blank` e `Stories` até reconstrução de bilhetes, avisos do bairro e resumos curtos no `B1`.

---

## 3. Ciclo de Continuidade & Memória Unificada

Para que o aprendizado seja contínuo entre sessões — e não uma coleção de minigames soltos — todos os modos do Baeuda devem ler e alimentar uma **única memória pedagógica**.

### 3.1 Ciclo de 4 Passos de Cada Construção
Toda palavra ou estrutura gramatical percorre o mesmo ciclo em espiral:

```
1. Encontrar (3D / Rua)  →  2. Notar (Focus on Form)  →  3. Praticar & Falar (Practice / Talk / Stories)  →  4. Consolidar & Transferir (SRS + Revisita Espiral)
```

1. **Encontrar:** primeiro contato sensorial em um interior 3D ou na rua (causa e efeito real).
2. **Notar:** contraste perceptual ou *recast* do NPC destacando a forma-alvo no momento de uso.
3. **Praticar & Falar:** consolidação ativa em formatos variados (`word_bank`, `fill_blank`, `listen_choose`, `speak_aloud`, `Stories`, `Talk`).
4. **Consolidar & Transferir:** retorno espaçado (SRS / Mistakes Lab) e reuso espontâneo em **outro cenário ou nível** do bairro.

### 3.2 Maturidade na Constelação (`seed → root → voice → fluent`)
A constelação do aluno evolui do modelo atual de 3 estágios para 4 estágios explícitos de evidência real:

| Estágio | Evidência Exigida | Significado Pedagógico |
|---|---|---|
| **`seed`** | 1º contato bem-sucedido no 3D/rua (com ou sem dica) | Reconhecimento inicial ancorado em contexto |
| **`root`** | Acerto sem dica em revisão espaçada ou prática | Memória receptiva/estrutural consolidada |
| **`voice`** | Produção ativa bem-sucedida (`speak_aloud` ou resposta em `Talk`) | Capacidade produtiva no contexto original |
| **`fluent`** | Uso correto em **contexto novo / revisita espiral** após intervalo longo, sem dica | Transferência real (pronto para sustentar o próximo nível) |

### 3.3 Transição entre Níveis (Híbrido: Constelação + Marco do Bairro)
O avanço entre `Pre-A1 → A1 → A2 → B1` combina **progresso orgânico visível** com **evidência de transferência**:
1. Os pilares do nível atual (conceitos/construções na Constelação + interiores/práticas-chave) atingem maturidade mínima (`root`/`voice`).
2. Ao atingir essa prontidão, a cidade desbloqueia o **Marco do Bairro** correspondente (ex.: *Graduation Shift*, *Dia de Feira*, *Noite de Festival*, *Conselho do Bairro*).
3. Concluir o Marco **sem dicas** sela a passagem de nível, atualiza a camada espiral do bairro e libera novas construções e arcos narrativos.

### 3.4 Ritmo Guiado de Sessão (*Next Best Step*)
Ao entrar na cidade, o aluno deve sempre encontrar uma recomendação clara e silenciosa (sem poluir o HUD) que equilibra automaticamente cada sessão:
- **~60% Avanço Espiral:** próximo interior, ciclo espiral ou unidade do nível atual.
- **~25% Retenção Ativa:** revisão SRS de conceitos perto de decair + `Mistakes Lab`.
- **~15% Aplicação Aberta:** `Baeuda Stories`, `Travel Dialogues` (`Talk`) ou preparação para o Marco do Bairro.

---

## 4. Mapa de Evolução (Do Atual ao `B1`)

Esta visão será executada em **3 fases sequenciais**, cada uma com sua própria especificação técnica e plano de implementação:

| Fase | Status | Escopo | O que já existe hoje | Lacunas a endereçar na fase |
|---|---|---|---|---|
| **Fase 1 — Fundação: Mapa Curricular & Motor de Continuidade** | ✅ Concluída (2026-11-24) | Fonte única de verdade do currículo (`Pre-A1 → B1`), memória/SRS unificada entre todos os modos, estágio `fluent` e recomendador de *Next Best Step*. | `curriculumMap.ts` (`Pre-A1 → B1` + 4 Marcos), `cefrEngine.ts` híbrido (`Pre-A1 → B1` + Pizzaria/Farmácia), `constellation.ts` (`seed → root → voice → fluent`), `recordPedagogicalEvidence` unificado (`interior_3d`, `street`, `practice`, `story`, `talk`, `srs`), `srsEngine.ts` (urgência `fluent` + `getRetentionStatus`), `nextBestStep.ts` (ritmo 60/25/15) e UI silenciosa em `GuidancePill` / `CityMinimapModal`. | Concluída — validada com 23 arquivos / 79 testes unitários e build de produção verde. |
| **Fase 2 — Consolidação Espiral (`Pre-A1 → A2`)** | Planejada | Fechar a trilha contínua `Pre-A1 → A2` com tudo que o bairro já tem, adicionando revisitas espirais e *Focus on Form* contextual. | 5 interiores 3D (Café, Mercado, Praça, Pizzaria, Farmácia), 11 lojas, 5 quests, 4 unidades de prática, 3 histórias e 5 diálogos. | Criar camadas espirais A1/A2 nos interiores existentes; implementar os Marcos jogáveis de A1 (*Dia de Feira*) e A2 (*Noite de Festival*); adicionar contraste visual de aspecto→tempo e micro-dicas *"Notice the pattern"*. |
| **Fase 3 — Expansão de Proficiência (`A2+ → B1`)** | Planejada | Levar o bairro ao nível `B1` com pragmática, hipóteses, *Present Perfect*, registro e diálogos ramificados. | Base de `Talk` (`travelDialogues.ts`), `Stories` (`cityStories.ts`) e `Lesson Engine 2.0`. | Diálogos `Talk` com ramificação real e consequência no bairro; unidades e arcos narrativos B1; evento final **Conselho do Bairro**. |

---

## 5. Decisões Pedagógicas Consolidadas

- **P-001 (2026-11-24):** Adotar **Imersão Baseada no Uso + *Focus on Form* Contextual** como modelo central — sem tabelas bilíngues, mas com saliência perceptual intencional (contraste 3D, *recast* e micro-dica opcional em inglês simples) para evitar fossilização em L2.
- **P-002 (2026-11-24):** Estruturar `Pre-A1 → B1` como **Bairro Vivo em Espiral + Evolução Temporal** sobre o boulevard existente, priorizando profundidade comunicativa e *type frequency* em vez de multiplicar mapas desconexos.
- **P-003 (2026-11-24):** Validar passagens de nível pelo modelo híbrido **Constelação/SRS (`seed → root → voice → fluent`) + Marco do Bairro sem dicas**.

# Baeuda — Game Design Document

**Version:** 1.0 · **Updated:** 2026-11-24 · [Architecture](ARCHITECTURE.md) · [Pedagogy](PEDAGOGY.md) · [Features](#feature-index) · [Decisions](#decisions) · [Change log](#change-log)

## Summary
Baeuda é um jogo 3D de imersão espacial para aprendizado de inglês (Pre-A1 → A2) em um bairro vivo estilo diorama. O jogador caminha por um boulevard com 11 lojas interativas, entra em interiores 3D jogáveis (Café, Mercado, Praça, Pizzaria e Farmácia), resolve quizzes de voz/texto, completa lições multi-formato e acompanha histórias dos moradores sem depender de listas mecânicas de tradução.

| | |
|---|---|
| Genre and camera | Diorama 3D educativo · 3ª pessoa (`🚶`), 1ª pessoa (`👁`) e visão aérea (`🛰`) |
| Audience | Iniciantes a pré-intermediários em inglês (Pre-A1 → A2), casual, todas as idades |
| Platforms and input | Web desktop & mobile (mouse/toque, WASD/setas, teclado e microfone Web Speech) |
| Session | Micro-sessões de 2–5 min por loja/unidade; progressão contínua salva localmente |
| Engine | React 19 + Three.js 0.176 + React Three Fiber 9 + Drei + Postprocessing (Vite 6) |
| Scope | Produto web completo (MVP + Módulos A, B e C implementados) |
| References | *Animal Crossing* (bairro vivo e customização), *Duolingo* (loop curto, Word Bank, Stories, Quests), *Speak* (prática falada em voz alta) |

## Pillars
1. **Imersão antes de tradução.** O significado nasce de causa e efeito no mundo 3D + áudio natural em inglês (`en-US`), nunca de tabelas bilíngues; a HUD superior (`TopNav` e `LessonHud`) é 100% icônica.
2. **Recall ativo com ajuda progressiva.** O jogo pede primeiro por áudio/contexto e só acende o destaque visual após hesitação (`5000 ms`) ou erro — evitando "clicar onde brilha" sem pensar.
3. **A cidade reage ao seu progresso.** Concluir lições muda o clima/hora do bairro, libera quarteirões, concede moedas para vestir o avatar 3D e destrava episódios com os moradores.
4. **Chrome silencioso, palco protagonista.** Interface neutra (`unslop`, hairlines de `1px`, raios concêntricos) com um único acento vibrante (`#ea580c`) para que o bairro 3D seja sempre o foco.

## Core loop
```
Explorar a rua 3D → Interagir com loja / interior / lição → Falar ou montar inglês → Ganhar moedas, XP e itens → Vestir avatar & abrir novas metas/histórias → Voltar à cidade
```
- **Seconds:** caminhar pela rua, clicar objetos/NPCs ([street-exploration](features/street-exploration/design.md)) ou preparar pedidos no balcão 3D ([interactive-interiors](features/interactive-interiors/design.md)).
- **Minutes:** concluir uma Unidade de Prática (Word Bank + Fill + Listen + Speak), episódio narrativo ou diálogo `Talk` ([practice-and-retention](features/practice-and-retention/design.md)).
- **Session and between sessions:** manter a ofensiva diária (`dailyStreak`), completar as 3 metas do dia para abrir o Baú (`+35` moedas), revisar erros no `Mistakes Lab` e no `Smart Review` (SRS).

## Feature index

| Feature | Status | Scope | Summary | Docs |
|---|---|---|---|---|
| Street exploration | implemented | MVP | Boulevard 3D com 11 lojas, 3 câmeras, curiosidades, mochila e 5 quests | [design](features/street-exploration/design.md) |
| Interactive interiors | implemented | MVP | 5 cenas 3D jogáveis (Café, Mercado, Praça, Pizzaria, Farmácia) com recall ativo | [design](features/interactive-interiors/design.md) |
| Practice and retention | implemented | MVP | Lesson Engine 2.0, Mistakes Lab, Daily Quests + Baú, Stories, Talk, SRS e Avatar Shop | [design](features/practice-and-retention/design.md) |
| Atmospheric visuals | implemented | polish | Sky Dome procedural, Sol/Lua/Estrelas, pétalas/vagalumes, Bloom seletivo e texturas PBR | [design](features/street-exploration/design.md) |
| Travel dialogues | implemented | MVP | Simulador de conversa em 5 cenários (Café, Farmácia, Pizzaria, Barbearia, Correio/Banco) | [design](features/practice-and-retention/design.md) |
| Badges and mini-games | implemented | MVP | 14 medalhas de profissão, Connect-the-Dots SVG, Memory Match 3×4/4×3 e 6 decks (incl. SRS e A2) | [design](features/practice-and-retention/design.md) |
| Avatar wardrobe | implemented | MVP | Economia de moedas e 12 itens (Boutique & Barber) aplicados ao vivo no avatar 3D | [design](features/practice-and-retention/design.md) |

## Milestones
1. **M1, Core Café & Street:** Lição 1 do Café + rua 3D caminhável + persistência · concluído.
2. **M2, Living Neighborhood:** 11 lojas interativas, 3 câmeras, curiosidades, inventário/quests, minimapa e 5 diálogos · concluído.
3. **M3, Interiors & Retention:** Pizzaria 3D, Farmácia 3D, Avatar Shop, Lesson Engine 2.0, Daily Quests e Baeuda Stories · concluído.
4. **M4, Visual & UX Polish:** Isolamento de raycast 3D, FOV responsivo, Sky Dome + Bloom, `unslop` + tokens concêntricos · concluído.

## Decisions

| ID | Date | Decision | Alternatives considered | Why | Affects |
|---|---|---|---|---|---|
| D-001 | 2026-11-23 | Desmontar cenas 3D inativas em vez de ocultar com `visible={false}` | Manter todas montadas com `visible={false}` | Playtest provou vazamento de raycast da porta do Café e árvores para dentro da Pizzaria/Farmácia/Mercado | [interactive-interiors](features/interactive-interiors/design.md) |
| D-002 | 2026-11-23 | `FOV` responsivo (`42° → 62°`) + recuo em `Z` para telas portrait (`aspect < 1`) | `FOV` fixo `42°` | Playtest em `449×605` cortava pote de açúcar no Café e tigelas laterais na Pizzaria/Farmácia | [interactive-interiors](features/interactive-interiors/design.md) |
| D-003 | 2026-11-23 | Substituir emoji `🪙` por `CoinIcon` SVG e remover emojis Unicode 13/14 do SRS | Manter emojis nativos | Renderizavam como retângulo quebrado (`□`) no Windows/Chromium | [practice-and-retention](features/practice-and-retention/design.md) |
| D-004 | 2026-11-24 | Atraso de `5000 ms` antes de acender o anel de dica nos interiores | Destacar alvo em `t = 0` | Evitar spoiler imediato e forçar associação áudio → objeto | [interactive-interiors](features/interactive-interiors/design.md) |
| D-005 | 2026-11-24 | Unificar `TopNav` em cluster silencioso (`hud-status-cluster`) e tokens concêntricos (`R2 = R1 - B - S6`) | 5 pílulas coloridas independentes | Reduzir poluição visual seguindo `unslop` e `dimensional-drawing` | [street-exploration](features/street-exploration/design.md) |

## Open questions
- **Assumptions to confirm:**
  - `[ASSUMPTION]` Persistência 100% local (`localStorage`) é suficiente antes de adicionar login/nuvem.
  - `[ASSUMPTION]` Síntese de voz nativa (`window.speechSynthesis` `en-US`) atende ao MVP antes de gravar áudios `.mp3` dedicados em `public/audio/lesson1/`.
- **Risks:**
  - Compatibilidade de `SpeechRecognition` em navegadores sem Web Speech API (mitigado pelo botão *"Can't speak now · Continue"* no modo `speak_aloud`).
  - Peso do chunk `three-vendor` (`~324 kB` gzip) em conexões móveis 3G lentas.

## Change log
**1.0 (2026-11-24):** GDD inicial consolidando arquitetura, visual atmosférico, interiores 3D, Lesson Engine 2.0, Daily Quests e Baeuda Stories; D-001 a D-005 registrados.

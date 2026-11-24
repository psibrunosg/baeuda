# Practice and retention: testing

**Updated:** 2026-11-24 · [Design](design.md) · [Implementation](implementation.md)

## Acceptance criteria
- [x] As 4 unidades de prática contêm `word_bank`, `fill_blank`, `listen_choose` e `speak_aloud`, validam respostas/palavras faladas e geram fila de erros + recompensas por precisão. *(`src/domain/__tests__/practiceLessons.test.ts` › practiceLessons)*
- [x] `dailyQuests` acompanha as 3 metas, libera o baú de `+35` moedas, impede resgate duplicado no mesmo dia e reseta no dia seguinte. *(`src/domain/__tests__/dailyQuests.test.ts` › dailyQuests)*
- [x] `CITY_STORIES` entrega 3 episódios (`Pre-A1`, `A1`, `A2`), cada um com pelo menos 2 perguntas e alternativa correta. *(`src/domain/__tests__/cityStories.test.ts` › cityStories)*
- [x] `avatarShop` deduz moedas na compra, bloqueia saldo insuficiente, equipa itens grátis/já possuídos e calcula `dailyStreak` consecutivo. *(`src/domain/__tests__/avatarShop.test.ts` › avatarShop)*
- [x] `srsEngine` prioriza conceitos com dica prévia/estágio inicial e monta 6 pares sem glifos quebrados. *(`src/domain/__tests__/srsEngine.test.ts` › srsEngine)*
- [x] `travelDialogues` cobre os 5 cenários da cidade e `badgesAndGames` avalia 14 medalhas + deck `a2_directions`. *(`src/domain/__tests__/travelDialogues.test.ts` › travelDialogues; `src/domain/__tests__/badgesAndGames.test.ts` › badgesAndGames)*
- [ ] Reconhecimento de fala real (`SpeechRecognition`) em microfone físico de navegador mobile. *(not proven: testado em lógica pura `evaluateSpokenWords`, falta teste em dispositivo com microfone)*

## Playtest checks
1. Abrir `🏆` → `⚡ Practice`, completar a Unidade 1 errando propositalmente 1 item para confirmar repetição no final, tela de resumo e aparição do banner `🩹 Mistakes Lab`.
2. Abrir `🎯 Quests`, verificar atualização das barras e resgate do Baú ao fechar as 3 metas.
3. Abrir `📖 Stories`, testar `🔊` e `🐢` em um episódio e confirmar crédito de moedas.

## History
- 2026-11-24: critérios registrados com cobertura unitária completa de domínio (`20` arquivos, `60` testes).

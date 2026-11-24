# Street exploration: testing

**Updated:** 2026-11-24 · [Design](design.md) · [Implementation](implementation.md)

## Acceptance criteria
- [x] `CURIOSITY_CATALOG` valida respostas exatas e com 1 erro de digitação (Levenshtein `<= 1`). *(`src/domain/__tests__/curiosityCatalog.test.ts` › curiosityCatalog)*
- [x] Cadeia de 5 missões avança na ordem correta e consome o item alvo da mochila. *(`src/domain/__tests__/inventoryAndQuests.test.ts` › inventoryAndQuests)*
- [x] `TopNav` e `LessonHud` mantêm 0 letras visíveis (contrato 100% icônico). *(`src/ui/__tests__/uiComponents.test.ts` › uiComponents)*
- [x] Modo `?dev=1` controla a visibilidade de `DebugAudioBar` (oculto por padrão). *(`src/ui/__tests__/uiComponents.test.ts` › uiComponents)*
- [x] Texturas procedurais e geometrias da rua inicializam com vértices/normais finitos e null-safe em SSR. *(`src/scene/__tests__/cafeAssets.test.ts` › sculpted 3D geometries)*
- [ ] Colisão deslizante AABB com obstáculos da rua em celular touch real. *(not proven: testado em navegador desktop/emulado, falta validação em dispositivo físico)*

## Playtest checks
1. Na rua, caminhar com `WASD` e clique no chão; alternar `🚶 → 👁 → 🛰` e verificar que a câmera não corta prédios ao sul.
2. Clicar em um NPC da rua, errar uma letra no `CuriosityModal` (verificar dica mascarada), acertar e confirmar `+5` moedas e toast.
3. Abrir `🗺`, teletransportar para a Padaria e confirmar que `Escape` fecha o modal.

## History
- 2026-11-24: critérios registrados a partir da suíte Vitest (`20` arquivos, `60` testes).

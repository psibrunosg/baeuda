# Interactive interiors: testing

**Updated:** 2026-11-24 · [Design](design.md) · [Implementation](implementation.md)

## Acceptance criteria
- [x] `lessonReducer` percorre todas as fases da Lição 1 (demo, TPR, contraste, pour, escolha, micro-echo e conclusão) e aciona dica em hesitação. *(`src/domain/__tests__/lessonEngine.test.ts` › lessonEngine)*
- [x] Todos os `CameraAnchorId` em `CAMERA_ANCHORS` possuem posições e alvos finitos válidos. *(`src/scene/__tests__/contracts.test.ts` › contracts)*
- [x] Toda `SpeechKey` de interiores (Café, Mercado, Praça, Pizzaria, Farmácia) existe no `AUDIO_MANIFEST` com cues ordenados e encerramento `viseme: null`. *(`src/content/__tests__/contentIntegrity.test.ts` › contentIntegrity)*
- [x] `resolveWorldAtmosphere` e `getGuidanceCopy` retornam atmosfera e instruções válidas para todos os interiores. *(`src/domain/__tests__/immersion.test.ts` › immersion)*
- [ ] Verificação visual ao vivo em tela retrato (`< 500px`) de que todos os props da Pizzaria e Farmácia ficam dentro do frame após D-002. *(not proven: validado via build e revisão de código; pendente re-playtest visual em viewport retrato)*

## Playtest checks
1. Abrir `🗺` → `🍕 Enter Pizzeria Kitchen`, clicar na direita da tela e confirmar que não vaza clique para o Café; montar a pizza em 4 passos e verificar vapor + `+20` moedas.
2. Abrir `🗺` → `💊 Enter Pharmacy Counter`, aguardar 5 s para o anel verde acender no termômetro e completar os 3 passos.
3. Abrir `🗺` → `☕ Replay Café Lesson 1` e completar um ciclo de `Pour` segurando o botão ou tecla `Space`.

## History
- 2026-11-24: critérios registrados após D-001, D-002 e D-004.

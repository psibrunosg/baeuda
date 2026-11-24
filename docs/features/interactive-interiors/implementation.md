# Interactive interiors: implementation

**Updated:** 2026-11-24 · [Design](design.md) · [Testing](testing.md)

## Approach
Cada interior é um componente R3F isolado montado condicionalmente em `ExperienceCanvas.tsx` (D-001). `CafeScene` é dirigido pela máquina de estados pura `lessonReducer` (`src/domain/lessonEngine.ts`), enquanto `PizzeriaScene` e `PharmacyScene` gerenciam progressão sequencial local com `hintVisible` atrasado em `5000 ms` e efeitos visuais PBR + Bloom (forno a lenha, vapor animado e cruz verde luminosa).

## Code map
| File / module | Role in this feature |
|---|---|
| `src/scene/ExperienceCanvas.tsx` | Montagem condicional das cenas, `CameraRig` responsivo e `EffectComposer` (`Bloom`) |
| `src/domain/lessonEngine.ts` | Máquina de estados pura da Lição 1 do Café (demo, TPR, contraste, pour, escolha, micro-echo) |
| `src/scene/CafeScene.tsx` | Balcão 3D da Lição 1 do Café + `LeoBarista.tsx` (lip-sync por visemas) |
| `src/scene/CafeDynamicSession.tsx` | Ciclos avançados do Café (`cafe_c2_food`, `cafe_c3_quantity`, `cafe_pre_a1_shift`, `cafe_a1_spiral`) |
| `src/scene/MarketScene.tsx` | Interior/pátio jogável do Mercado de Frutas |
| `src/scene/PlazaScene.tsx` | Cena jogável da Praça Central (ritmo fast/slow) |
| `src/scene/PizzeriaScene.tsx` | Cozinha 3D da Pizzaria (4 camadas de pizza + vapor + Chef animado) |
| `src/scene/PharmacyScene.tsx` | Balcão 3D da Farmácia (3 itens de cuidado + bandeja + Farmacêutica animada) |

## Data and config
- **Config constants:** `POUR_DURATION_SEC = 1.4` e `HESITATION_MS = 5000` em `src/App.tsx`; `CAMERA_ANCHORS` em `src/scene/contracts.ts`.
- **Persistence:** `completedLessonIds`, `completedCafeCycles`, `locations`, `constellation` e `streetDiscoveries` em `LearnerProfile` ([Architecture](../../ARCHITECTURE.md)).

## Deviations from design
Nenhuma; o código corresponde integralmente ao `design.md`.

## History
- 2026-11-24: documentado após isolamento de raycasting (D-001) e upgrade visual PBR/Bloom.

# Baeuda — Architecture

**Updated:** 2026-11-24 · [GDD](GDD.md)

## 1. Stack
| | |
|---|---|
| Engine / framework | React `19.1.0` + Three.js `0.176.0` + `@react-three/fiber` `9.1.0` + `@react-three/drei` `10.7.0` + `@react-three/postprocessing` |
| Language | TypeScript `5.8.0` (strict, `tsc --noEmit`) |
| Build / bundler | Vite `6.3.0` (`@vitejs/plugin-react`) |
| Target runtime | Navegadores modernos desktop & mobile (WebGL 2, Web Audio API, SpeechSynthesis, SpeechRecognition opcional) |
| Testing | Vitest `3.1.0` (`20` arquivos, `60` testes) |
| Hosting / distribution | Repositório privado GitHub (`psibrunosg/baeuda`); workflow pronto em `.github/workflows/deploy.yml` |

## 2. Structure
`App.tsx` detém o estado de alto nível (`LearnerProfile`, `activeView`, modais abertos e áudio) e coordena o palco 3D (`ExperienceCanvas`) com a camada DOM de HUD e modais lazy-loaded.

```text
App.tsx (State + Persistence + Audio)
 ├── ExperienceCanvas (WebGL Canvas + AtmosphericSky + Selective Bloom)
 │    └── Montagem condicional da cena ativa única (zero raycast leak):
 │        map → NeighborhoodMap | lesson → CafeScene + LeoBarista
 │        cafe_cycle → CafeDynamicSession + LeoBarista | market → MarketScene
 │        plaza → PlazaScene | pizzeria → PizzeriaScene | pharmacy → PharmacyScene
 ├── Floating HUD (TopNav · GuidancePill · LessonHud · InventoryQuestBar · Subtitles)
 └── React.Suspense Modals (lazy chunks):
      BadgesHub · LessonPracticeModal · DailyQuestsModal · CityStoriesModal
      TravelDialogueModal · CityMinimapModal · AvatarCustomizerModal · CuriosityModal
```

## 3. Module map
| Module / folder | Responsibility | Used by features |
|---|---|---|
| `src/App.tsx` | Orquestração de estado, persistência throttled, atalhos (`Escape`) e áudio | [street-exploration](features/street-exploration/implementation.md), [interactive-interiors](features/interactive-interiors/implementation.md), [practice-and-retention](features/practice-and-retention/implementation.md) |
| `src/scene/ExperienceCanvas.tsx` | Canvas R3F, iluminação, `CameraRig` responsivo, isolamento de cenas e `Bloom` | [street-exploration](features/street-exploration/implementation.md), [interactive-interiors](features/interactive-interiors/implementation.md) |
| `src/scene/cafeTextures.ts` | Texturas PBR procedurais determinísticas (madeira, terracota, azulejo, paralelepípedo) | [street-exploration](features/street-exploration/implementation.md), [interactive-interiors](features/interactive-interiors/implementation.md) |
| `src/services/audioPlayer.ts` | Reprodução de falas `SpeechKey` via `speechSynthesis` (`en-US`) + relógio de visemas | [street-exploration](features/street-exploration/implementation.md), [interactive-interiors](features/interactive-interiors/implementation.md) |
| `src/services/soundEngine.ts` | Efeitos sonoros procedurais Web Audio (`playSuccessChime`, `playRewardFanfare`, `playSoftErrorTone`) | [interactive-interiors](features/interactive-interiors/implementation.md), [practice-and-retention](features/practice-and-retention/implementation.md) |
| `src/services/learnerStorage.ts` | Leitura/gravação segura de `LearnerProfile` (`schemaVersion: 1`) no `localStorage` | [practice-and-retention](features/practice-and-retention/implementation.md) |

## 4. Cross-cutting conventions
- **Persistence:** `LearnerProfile` (`schemaVersion: 1` em `src/domain/types.ts`). Ticks puros de relógio (`immersionSeconds`) são gravados a cada `15 s`; qualquer progresso real (moedas, quests, erros, unidades, histórias, avatar) persiste imediatamente e também em `pagehide`/`visibilitychange`.
- **Randomness:** Embaralhamentos determinísticos (`mulberry32` em `cafeTextures.ts`; LCG `16807` em `badgesAndGames.ts`, `TravelDialogueModal.tsx` e `LessonPracticeModal.tsx`) para resultados reprodutíveis em testes.
- **Rendering / UI layering:** `Canvas` em `z: 0`, vignette `z: 5`, `GuidancePill` `z: 18`, `TopNav` e `LessonHud` `z: 20`, `CuriosityModal` `z: 24`, modais principais `z: 26`, `speech-subtitle-pill` `z: 32`.
- **Design tokens (`src/index.css`):** grid `4px/8px` (`--s-1: 16px`, `--s-2: 12px`, `--s-4: 8px`, `--s-6: 4px`), hairline `--b-1: 1px` e raios concêntricos (`--r-1: 20px`, `--r-2: calc(var(--r-1) - var(--b-1) - var(--s-6))` = `15px`, `--r-3: 10px`).
- **Assets:** Geometrias e texturas 100% procedurais (`assetMode: 'greybox'`), com contrato pronto para `.glb` em `src/scene/contracts.ts`.

## 5. File layout
```text
src/
 ├── App.tsx              # Orquestrador principal
 ├── index.css            # Tokens dimensionais, HUD e estilos dos modais
 ├── content/             # audioManifest.ts (SpeechKeys) e scripts de lição
 ├── domain/              # Lógica pura (lessonEngine, practiceLessons, dailyQuests, cityStories, srsEngine, avatarShop, cefrEngine)
 ├── scene/               # Cenas 3D R3F (NeighborhoodMap, CityShops, interiors, AtmosphericSky, LeoBarista)
 ├── services/            # audioPlayer, soundEngine, learnerStorage, voiceCapture
 └── ui/                  # HUD e modais React (lazy-loaded)
```

## 6. Performance budget
- **Frame loop:** `dt = Math.min(delta, 0.05)` obrigatório em todo `useFrame`; zero alocações de `THREE.Vector3` dentro de `useFrame`; contagem de `<pointLight>` fixa no `ExperienceCanvas` para evitar recompilação de shaders.
- **Bundle splitting (`vite.config.ts`):** `three-vendor`, `react-vendor`, `city-shops` e cada modal em chunk lazy próprio (`1.2 kB`–`3.4 kB` gzip).

## 7. Testing and tooling
- `npm test` executa `vitest run` sobre `src/**/__tests__/*.test.ts`.
- Modo debug via query string `?dev=1` exibe `DebugAudioBar` (oculto por padrão em produção e validado por `uiComponents.test.ts`).

## 8. Build and release
- Dev: `npm run dev -- --port 5173`
- Build & typecheck: `npm run build` (`tsc --noEmit && vite build`)
- Base path dinâmico em `vite.config.ts`: `process.env.GITHUB_ACTIONS ? '/baeuda/' : '/'`.

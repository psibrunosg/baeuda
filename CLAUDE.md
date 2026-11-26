# Baeuda

Jogo 3D de ensino de inglês (React 19, three.js, R3F, Vite, TypeScript strict). Docs: `docs/ARCHITECTURE.md`, `docs/GDD.md`, `docs/PEDAGOGY.md`.

Verificar: `npm test` e `npm run build`. Em um worktree novo, rode `npm ci` antes.

## Trabalho em equipe

- **Diretor** (sessão principal): escolhe as issues, abre um líder por issue, revisa e mescla.
- **Líder** (uma sessão, um worktree, uma branch, um PR por issue): planeja, delega, integra e abre o PR com `Closes #N`. Nunca mescla.
- **Subagentes do líder** (`.claude/agents/`): `explorador` antes de editar, `implementador` para escrever, `revisor` antes do PR. São 3 papéis; o `implementador` pode ser chamado em várias partes, uma por vez. Só um escreve por vez.

## Arquivos compartilhados

`src/App.tsx`, `src/domain/types.ts`, `src/scene/ExperienceCanvas.tsx`, `src/scene/worldNavigation.ts`, `src/ui/CityMinimapModal.tsx`, `src/content/audioManifest.ts`, `src/scene/NeighborhoodMap.tsx`, `src/domain/immersion.ts`, `src/index.css`, `package.json`.

Faça neles só a ligação mínima (registro, tipo, montagem), em um commit separado no fim (o commit anterior pode não compilar sozinho). Não reorganize nem reformate. A lógica nova vai em arquivos novos da própria issue. O diretor mescla um PR por vez; depois disso, atualize sua branch com a `master`.

## Novo mapa ou interior

1. Cena em `src/scene/maps/<Nome>.tsx`, sobre `WorldMapBase` (modelo: `InteriorHouseLeo.tsx`).
2. Id em `WorldMapId` (`types.ts`) e configuração em `WORLD_MAP_REGISTRY` e `ACTIVE_WORLD_MAPS` (`worldNavigation.ts`).
3. Montagem em `ExperienceCanvas.tsx`, com portal de ida e volta.
4. Falas em um arquivo próprio, `src/content/speech/<nome>.ts` (modelo: `bakery.ts`); nos compartilhados, só o tipo em `SpeechKey` e o spread em `audioManifest.ts`. Conteúdo conforme `docs/PEDAGOGY.md`.
5. Porta na cidade com `PortalTrigger` em `NeighborhoodMap.tsx`, sem invadir a rua.
6. Texto da pílula de orientação em `immersion.ts`; recompensa (item na mochila) em `App.tsx`.
7. Geometrias e materiais: reutilize `toyKit.tsx`, `toyProps.ts`, `cafeGeometries.ts`, `cafeTextures.ts`. Sem assets baixados e sem dependências novas.

## Armadilhas

- `RoundedBox` (drei) infla quando a altura é menor que 2×raio; use `boxGeometry`.
- Mapa oculto não anima: use `useMapFrame` (`mapVisibility.ts`).
- `?dev=1` abre o painel para pular fases.
- Cada worktree recebe sua porta no preview (e um progresso salvo próprio). Não encerre o servidor de outra sessão.
- Interiores já são enquadrados dentro do HUD (`ExperienceCanvas.tsx`); confira que entrada, saída e alvos não ficam cobertos.
- Texto de issues antigas pode ter perdido letras por escape (`rickColor` = `brickColor`).

## Pronto

Testes e build passam, a cena foi vista no navegador (computador e retrato de celular), há teste para lógica nova, e o PR diz o que não foi verificado.

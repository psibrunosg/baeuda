# Baeuda

Jogo 3D de ensino de inglês (React 19, three.js, R3F, Vite, TypeScript strict). Docs: `docs/ARCHITECTURE.md`, `docs/GDD.md`, `docs/PEDAGOGY.md`.

Verificar: `npm test` e `npm run build`. Em um worktree novo, rode `npm ci` antes.

## Trabalho em equipe

- **Diretor** (sessão principal): escolhe as issues, abre um líder por issue, revisa e mescla.
- **Líder** (uma sessão, um worktree, uma branch, um PR por issue): planeja, delega, integra e abre o PR com `Closes #N`. Nunca mescla.
- **Subagentes do líder** (`.claude/agents/`): `explorador` antes de editar, `implementador` para escrever, `revisor` antes do PR. No máximo 3, e só um escrevendo por vez.

## Arquivos compartilhados

`src/App.tsx`, `src/domain/types.ts`, `src/scene/ExperienceCanvas.tsx`, `src/scene/worldNavigation.ts`, `src/ui/CityMinimapModal.tsx`, `src/content/audioManifest.ts`, `src/index.css`, `package.json`.

Faça neles só a ligação mínima (registro, tipo, montagem), em um commit separado no fim. Não reorganize nem reformate. A lógica nova vai em arquivos novos da própria issue. O diretor mescla um PR por vez; depois disso, atualize sua branch com a `master`.

## Novo mapa ou interior

1. Cena em `src/scene/maps/<Nome>.tsx`, sobre `WorldMapBase` (modelo: `InteriorHouseLeo.tsx`).
2. Id em `WorldMapId` (`types.ts`) e configuração em `WORLD_MAP_REGISTRY` e `ACTIVE_WORLD_MAPS` (`worldNavigation.ts`).
3. Montagem em `ExperienceCanvas.tsx`, com portal de ida e volta.
4. Falas novas em `SpeechKey` e `audioManifest.ts`; conteúdo conforme `docs/PEDAGOGY.md`.
5. Geometrias e materiais: reutilize `toyKit.tsx`, `toyProps.ts`, `cafeGeometries.ts`, `cafeTextures.ts`. Sem assets baixados e sem dependências novas.

## Armadilhas

- `RoundedBox` (drei) infla quando a altura é menor que 2×raio; use `boxGeometry`.
- Mapa oculto não anima: use `useMapFrame` (`mapVisibility.ts`).
- `?dev=1` abre o painel para pular fases. A porta 5173 é única: não encerre o servidor de outra sessão.

## Pronto

Testes e build passam, a cena foi vista no navegador (computador e retrato de celular), há teste para lógica nova, e o PR diz o que não foi verificado.

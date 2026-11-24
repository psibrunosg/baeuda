# Street exploration: implementation

**Updated:** 2026-11-24 · [Design](design.md) · [Testing](testing.md)

## Approach
`NeighborhoodMap` renderiza o diorama completo da rua (montado condicionalmente por `ExperienceCanvas` quando `activeView === 'map' || activeView === 'badges'`, ver [Architecture](../../ARCHITECTURE.md)) com física de movimento baseada em `useRef` (zero re-renders React por frame). Lojas são divididas em dois módulos (`CityShops.tsx` e `CityShopsPhase2.tsx`) em um chunk separado `city-shops`.

## Code map
| File / module | Role in this feature |
|---|---|
| `src/scene/NeighborhoodMap.tsx` | Boulevard, colisões AABB, avatar caminhável, restauração de pose e montagem das 11 lojas |
| `src/scene/CityShops.tsx` | 5 lojas Fase 1 (Bakery, Tire Shop, Clothing Store, Tech Shop, Construction Site) |
| `src/scene/CityShopsPhase2.tsx` | 6 lojas Fase 2 (Pharmacy, Pet Shop, Barber Shop, Bookshop, Pizzeria, Post & Bank) |
| `src/domain/curiosityCatalog.ts` | Catálogo de curiosidades e validação tolerante (`Levenshtein <= 1`) |
| `src/domain/inventoryAndQuests.ts` | Mochila e cadeia de 5 missões persistidas no perfil |
| `src/ui/CuriosityModal.tsx` | Cartão interativo de quiz por texto, dicas e voz |
| `src/ui/InventoryQuestBar.tsx` | Pílula de missão (topo esquerdo) e barra da mochila (inferior direito) |
| `src/ui/CityMinimapModal.tsx` | Diretório de teleporte rápido dos 14 locais e atalhos de interiores |
| `src/ui/TopNav.tsx` | Cluster icônico unificado (`hud-status-cluster`) e seletor de câmera/vista |

## Data and config
- **Config constants:** `WALK_SPEED = 2.4`, `WALK_Z_MIN = 0.65`, `WALK_Z_MAX = 3.15`, `OBSTACLE_AABBS` em `NeighborhoodMap.tsx`.
- **Persistence:** `streetDiscoveries`, `inventoryIds` e `completedQuestIds` em `LearnerProfile` ([Architecture](../../ARCHITECTURE.md)).

## Deviations from design
Nenhuma; o código corresponde integralmente ao `design.md`.

## History
- 2026-11-24: documentado após estabilização de `NeighborhoodMap`, `TopNav` e `CityMinimapModal`.

# Practice and retention: implementation

**Updated:** 2026-11-24 · [Design](design.md) · [Testing](testing.md)

## Approach
Cada subsistema de retenção vive como módulo puro em `src/domain/` coberto por testes unitários, enquanto a UI correspondente é carregada sob demanda via `React.lazy()` em `App.tsx` (chunks de `1.2 kB` a `3.4 kB` gzip) e estilizada com os tokens concêntricos de `src/index.css`.

## Code map
| File / module | Role in this feature |
|---|---|
| `src/domain/practiceLessons.ts` | 4 Unidades CEFR, validação de Word Bank / Speak Aloud, Mistakes Lab e cálculo de recompensas |
| `src/ui/LessonPracticeModal.tsx` | Sessão interativa com barra de progresso, combo `🔥`, áudio `0.70x`/`0.95x` e tela de resumo |
| `src/domain/dailyQuests.ts` | Estado diário (reset por data), 3 metas e resgate único do Baú (`+35` moedas) |
| `src/ui/DailyQuestsModal.tsx` | Painel de metas diárias, Baú de Recompensa e Trilha Visual CEFR |
| `src/domain/cityStories.ts` | 3 episódios narrativos (`Pre-A1`, `A1`, `A2`) com perguntas de compreensão |
| `src/ui/CityStoriesModal.tsx` | Feed progressivo de história com áudio normal/lento por fala |
| `src/domain/avatarShop.ts` | Catálogo de 12 estilos, moedas, compra/equip e `updateDailyStreak` |
| `src/ui/AvatarCustomizerModal.tsx` | Loja visual Boutique & Barber com `CoinIcon` SVG |
| `src/domain/srsEngine.ts` | Priorização de revisão espaçada (`Smart Review`) |
| `src/domain/travelDialogues.ts` | 5 cenários de diálogo real com opções embaralhadas em `TravelDialogueModal.tsx` |
| `src/ui/BadgesHub.tsx` | Hub de 14 medalhas, Connect, Memory e barra rápida para Practice/Quests/Stories/Talk |

## Data and config
- **Config constants:** `DAILY_CHEST_REWARD_COINS = 35` em `dailyQuests.ts`; `PRACTICE_UNITS` em `practiceLessons.ts`; `CITY_STORIES` em `cityStories.ts`; `AVATAR_SHOP_ITEMS` em `avatarShop.ts`.
- **Persistence:** `coins`, `dailyStreak`, `avatarStyle`, `unlockedStyleIds`, `mistakeExerciseIds`, `completedPracticeUnitIds`, `completedStoryIds` e `dailyQuests` em `LearnerProfile` ([Architecture](../../ARCHITECTURE.md)).

## Deviations from design
Nenhuma; o código corresponde integralmente ao `design.md`.

## History
- 2026-11-24: documentado após entrega dos Módulos A, B e C.

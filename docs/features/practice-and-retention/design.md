# Practice and retention

**Status:** implemented · **Updated:** 2026-11-24 · [GDD](../../GDD.md) · [Implementation](implementation.md) · [Testing](testing.md)

Camada de retenção e treino ativo inspirada em *Duolingo*, *Babbel* e *Speak*: combina unidades multi-formato (**Word Bank**, **Fill-in-the-Blank**, **Listen & Choose** e **Speak Aloud** com áudio normal `0.95x` e lento `0.70x`), **Mistakes Lab**, **Daily Quests + Baú Diário**, **Baeuda Stories**, **Travel Dialogues**, **SRS Smart Review** e **Avatar Wardrobe** — unindo repetição espaçada à economia de moedas da cidade 3D.

## Rules
1. Cada uma das 4 Unidades CEFR (`Pre-A1 → A2`) mistura os 4 tipos de exercício; qualquer erro é reenfileirado no fim da sessão e salvo em `mistakeExerciseIds` para o **Mistakes Lab**.
2. Em `speak_aloud`, o reconhecimento destaca cada palavra reconhecida em verde e aceita acertos com `>= 75%` das palavras; há fallback acessível (*"Can't speak now · Continue"*).
3. **Daily Quests** rastreiam 3 metas diárias (reset automático à meia-noite ISO `YYYY-MM-DD`): `1` prática/mini-game, `3` descobertas na rua e `1` história ou diálogo; concluir as 3 libera o Baú Diário (`+35` moedas, 1x por dia).
4. **Baeuda Stories** oferecem 3 episódios narrativos (`Pre-A1`, `A1`, `A2`) com balões progressivos, áudio normal/lento e perguntas de compreensão no meio da história.
5. **Avatar Shop** permite comprar e equipar 12 estilos (4 casacos, 4 chapéus, 4 cores de cabelo) aplicados imediatamente no avatar 3D, exibindo moedas com `CoinIcon` SVG (D-003).

## Numbers
| Name | Value | Unit | What to watch in playtests |
|---|---|---|---|
| Practice units | `4` | units | Progressão `Pre-A1` (2), `A1` (1), `A2` (1) |
| Slow audio rate | `0.70` | × speed | Clareza sem distorcer a prosódia do TTS |
| Speak aloud pass ratio | `75` | % words | Tolerância justa para sotaques de iniciantes |
| Practice reward | `10` / `15` / `20` | coins | Escala por precisão (`<70%` / `70–89%` / `>=90%`) |
| Daily Chest reward | `+35` | coins | Recompensa máxima por fechar as 3 metas do dia |
| Story episode reward | `20`–`25` | coins | Incentivo para leitura/escuta contextual |
| Starting wallet | `15` | coins | Permite comprar o 1º item da Barbearia/Boutique cedo |

## Edge cases
- Tentar resgatar o Baú Diário duas vezes no mesmo dia é ignorado (`claimed: false`).
- Itens já comprados no `AvatarCustomizerModal` podem ser equipados livremente a custo `0`.

## History
- 2026-11-24: documentado consolidando Módulos A, B, C e Avatar Shop (inclui D-003).

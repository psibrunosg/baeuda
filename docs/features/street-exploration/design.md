# Street exploration

**Status:** implemented · **Updated:** 2026-11-24 · [GDD](../../GDD.md) · [Implementation](implementation.md) · [Testing](testing.md)

O jogador caminha livremente por um boulevard 3D cercado por 11 lojas interativas, árvores, bancos e moradores. Tocar em objetos e profissões abre cartões de curiosidade (com áudio, digitação tolerante, dicas e microfone), alimenta a mochila e avança uma cadeia de 5 missões no bairro — sustentando os pilares de **Imersão antes de tradução** e **A cidade reage ao seu progresso**.

## Rules
1. O avatar move-se via clique no chão de paralelepípedo ou teclas `WASD`/setas, com colisão deslizante AABB 2D contra carro estacionado, banco e ponto de ônibus.
2. Três modos de câmera alternam em ciclo na `TopNav`: 3ª pessoa (`🚶`), 1ª pessoa (`👁`, avatar oculto) e visão aérea orbital (`🛰`).
3. Na 3ª pessoa, a coordenada `Z` da câmera é limitada a `<= 3.15` para nunca atravessar prédios da calçada Sul.
4. Clicar em NPCs/props com `curiosityId` abre `CuriosityModal` (validação com Levenshtein `<= 1`, dica de 3 opções e máscara de letras); acertar concede `+5` moedas, registra descoberta e adiciona item colecionável na mochila quando aplicável.
5. Clicar no botão `🗺` na `TopNav` estando na rua abre `CityMinimapModal` com teleporte instantâneo para os 14 pontos da cidade e atalhos de interiores/prática.
6. A pílula de missão ativa (`.quest-pill`) fica no canto superior esquerdo na rua e some automaticamente sob qualquer modal.

## Numbers
| Name | Value | Unit | What to watch in playtests |
|---|---|---|---|
| Walk speed | `2.4` | units/s | Velocidade confortável para atravessar as 11 lojas sem cansar |
| Walk Z bounds | `0.65`–`3.15` | units | Manter avatar na calçada/boulevard sem entrar em fachadas |
| 3rd-person camera Z clamp | `<= 3.15` | units | Evitar corte por prédios da calçada Sul |
| Curiosity reward | `+5` | coins | Recompensa por curiosidade resolvida |
| Quest delivery reward | `+15` | coins | Recompensa por entregar item da mochila ao NPC da missão |
| Chained neighborhood quests | `5` | quests | Barista Leo → Mechanic → Vet → Librarian → Chef |

## Edge cases
- Digitar dentro de `CuriosityModal` ignora eventos `WASD`/setas no `NeighborhoodMap` (guarda `INPUT`/`TEXTAREA`).
- Ao voltar de qualquer interior 3D para a rua, a posição/rotação do avatar é restaurada a partir de `avatarPoseRef`.

## History
- 2026-11-24: documentado a partir do código implementado (inclui D-005).

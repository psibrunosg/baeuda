# Interactive interiors

**Status:** implemented · **Updated:** 2026-11-24 · [GDD](../../GDD.md) · [Implementation](implementation.md) · [Testing](testing.md)

Entrar em um estabelecimento transporta o jogador para um balcão 3D dedicado onde cada pedido ou tarefa combina fala em inglês com manipulação direta de objetos 3D (servir bebidas/bolo no Café, escolher frutas no Mercado, tocar ritmo na Praça, montar pizza em 4 camadas na Pizzaria e montar kit de cuidados em 3 etapas na Farmácia) — servindo aos pilares **Imersão antes de tradução** e **Recall ativo com ajuda progressiva**.

## Rules
1. Apenas a cena 3D correspondente ao `activeView` atual permanece montada no `ExperienceCanvas` (D-001), garantindo isolamento total de raycasting entre cenas.
2. Em viewports retrato (`aspect < 1`), o `CameraRig` amplia o `FOV` até `62°` e recua a câmera em `Z` (`(1 - aspect) * 1.45`) para manter todos os objetos do balcão enquadrados (D-002).
3. Na Lição 1 do Café, na Pizzaria e na Farmácia, o destaque visual do objeto alvo só acende após `5000 ms` de hesitação ou após um toque fora de ordem (D-004).
4. Concluir a cozinha da Pizzaria ou o balcão da Farmácia recompensa `+20` moedas, adiciona o item (`pizza` ou `medicine`) à mochila, atualiza `dailyStreak` e retorna à rua.
5. Pressionar `Escape` ou clicar em `← Street` encerra áudio/microfone e retorna imediatamente à rua 3D.

## Numbers
| Name | Value | Unit | What to watch in playtests |
|---|---|---|---|
| Hesitation hint delay | `5000` | ms | Tempo suficiente para ouvir e tentar antes do brilho aparecer |
| Coffee pour hold duration | `1.4` | s | Sensação tátil de encher o copo sem cansar |
| Desktop FOV | `42` | deg | Enquadramento natural em 16:9 |
| Portrait max FOV | `62` | deg | Todos os props do balcão visíveis em `~450px` de largura |
| Pizzeria build steps | `4` | steps | Dough → Sauce → Cheese → Pepperoni & Basil |
| Pharmacy care steps | `3` | steps | Thermometer → Band-aid → Medicine |
| Interior completion reward | `+20` | coins | Incentivo para completar interiores 3D |

## Edge cases
- Tocar em ingredientes fora de ordem na Pizzaria ou Farmácia emite `playSoftErrorTone()`, repete o áudio da etapa atual e acende imediatamente o anel de dica.
- Trocar de interior durante um `setTimeout` de conclusão limpa timers pendentes no cleanup do `useEffect`.

## History
- 2026-11-24: documentado a partir dos 5 interiores implementados (inclui D-001, D-002 e D-004).

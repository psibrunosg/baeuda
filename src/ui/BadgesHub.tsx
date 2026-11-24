import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createConnectColumns,
  createMemoryCards,
  deterministicShuffle,
  EVALUATION_DECKS,
  evaluateNeighborhoodBadges,
  type EvaluationDeckId,
} from '../domain/badgesAndGames';
import { buildSrsReviewPairs } from '../domain/srsEngine';
import type { ConceptId, LearnerProfile, SpeechKey } from '../domain/types';
import { playRewardFanfare, playSoftErrorTone, playSuccessChime } from '../services/soundEngine';

type HubTab = 'badges' | 'connect' | 'memory';
type ActiveDeckChoice = EvaluationDeckId | 'srs_smart';

interface BadgesHubProps {
  profile: LearnerProfile;
  cefrBadge: string;
  onPlayAudio: (key: SpeechKey) => void;
  onCompleteGame: (gameKey: string, reviewedConceptIds?: ConceptId[]) => void;
  onOpenDialogues?: () => void;
  onOpenPractice?: () => void;
  onOpenQuests?: () => void;
  onOpenStories?: () => void;
  onClose: () => void;
}

export function BadgesHub({
  profile,
  cefrBadge,
  onPlayAudio,
  onCompleteGame,
  onOpenDialogues,
  onOpenPractice,
  onOpenQuests,
  onOpenStories,
  onClose,
}: BadgesHubProps) {
  const [tab, setTab] = useState<HubTab>('badges');
  const [deckId, setDeckId] = useState<ActiveDeckChoice>('professions');
  const [seed, setSeed] = useState(11);

  // Connect-the-Dots state
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matchedConnectIds, setMatchedConnectIds] = useState<string[]>([]);
  const [wrongPairFlash, setWrongPairFlash] = useState<string | null>(null);

  // Memory Match state
  const [flippedCardIds, setFlippedCardIds] = useState<string[]>([]);
  const [matchedMemoryPairIds, setMatchedMemoryPairIds] = useState<string[]>([]);
  const wrongTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const memoryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (wrongTimerRef.current) {
      clearTimeout(wrongTimerRef.current);
      wrongTimerRef.current = null;
    }
    if (memoryTimerRef.current) {
      clearTimeout(memoryTimerRef.current);
      memoryTimerRef.current = null;
    }
  };

  useEffect(() => () => clearTimers(), []);

  const badges = useMemo(() => evaluateNeighborhoodBadges(profile), [profile]);
  const srsPairs = useMemo(() => buildSrsReviewPairs(profile, 6), [profile]);
  const srsConceptIds = useMemo(
    () =>
      srsPairs
        .filter((pair) => pair.id.startsWith('srs_') && !pair.id.startsWith('srs_city_'))
        .map((pair) => pair.id.replace(/^srs_/, '') as ConceptId),
    [srsPairs],
  );
  const connectCols = useMemo(() => {
    if (deckId === 'srs_smart') {
      return { left: srsPairs, right: deterministicShuffle(srsPairs, seed) };
    }
    return createConnectColumns(deckId, seed);
  }, [deckId, seed, srsPairs]);
  const memoryCards = useMemo(() => {
    if (deckId === 'srs_smart') {
      const raw = srsPairs.flatMap((pair) => [
        { cardId: `${pair.id}_icon`, pairId: pair.id, kind: 'icon' as const, display: pair.icon, speechKey: pair.speechKey },
        { cardId: `${pair.id}_word`, pairId: pair.id, kind: 'word' as const, display: pair.label, speechKey: pair.speechKey },
      ]);
      return deterministicShuffle(raw, seed);
    }
    return createMemoryCards(deckId, seed);
  }, [deckId, seed, srsPairs]);

  const resetGames = (nextDeckId: ActiveDeckChoice, nextSeed = seed + 3) => {
    clearTimers();
    setDeckId(nextDeckId);
    setSeed(nextSeed);
    setSelectedLeft(null);
    setMatchedConnectIds([]);
    setWrongPairFlash(null);
    setFlippedCardIds([]);
    setMatchedMemoryPairIds([]);
  };

  const handleSelectLeft = (pairId: string, speechKey: SpeechKey) => {
    if (matchedConnectIds.includes(pairId)) return;
    setSelectedLeft(pairId);
    onPlayAudio(speechKey);
  };

  const handleSelectRight = (pairId: string, speechKey: SpeechKey) => {
    onPlayAudio(speechKey);
    if (!selectedLeft || matchedConnectIds.includes(pairId)) return;
    if (selectedLeft === pairId) {
      const nextMatched = [...matchedConnectIds, pairId];
      setMatchedConnectIds(nextMatched);
      setSelectedLeft(null);
      if (nextMatched.length === connectCols.left.length) {
        playRewardFanfare();
        onCompleteGame(
          `world_game_connect_${deckId}`,
          deckId === 'srs_smart' ? srsConceptIds : undefined,
        );
      } else {
        playSuccessChime();
      }
    } else {
      playSoftErrorTone();
      setWrongPairFlash(pairId);
      if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
      wrongTimerRef.current = setTimeout(() => {
        wrongTimerRef.current = null;
        setWrongPairFlash(null);
      }, 650);
    }
  };

  const handleFlipMemory = (cardId: string, pairId: string, speechKey: SpeechKey) => {
    if (matchedMemoryPairIds.includes(pairId)) return;
    if (flippedCardIds.includes(cardId) || flippedCardIds.length >= 2) return;

    onPlayAudio(speechKey);
    const nextFlipped = [...flippedCardIds, cardId];
    setFlippedCardIds(nextFlipped);

    if (nextFlipped.length === 2) {
      const firstCard = memoryCards.find((c) => c.cardId === nextFlipped[0]);
      if (firstCard && firstCard.pairId === pairId) {
        const nextMatched = [...matchedMemoryPairIds, pairId];
        setMatchedMemoryPairIds(nextMatched);
        setFlippedCardIds([]);
        if (nextMatched.length === 6) {
          playRewardFanfare();
          onCompleteGame(
            `world_game_memory_${deckId}`,
            deckId === 'srs_smart' ? srsConceptIds : undefined,
          );
        } else {
          playSuccessChime();
        }
      } else {
        playSoftErrorTone();
        if (memoryTimerRef.current) clearTimeout(memoryTimerRef.current);
        memoryTimerRef.current = setTimeout(() => {
          memoryTimerRef.current = null;
          setFlippedCardIds([]);
        }, 1400);
      }
    }
  };

  const connectWon = matchedConnectIds.length === connectCols.left.length;
  const memoryWon = matchedMemoryPairIds.length === 6;

  return (
    <section
      className="badges-hub-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Badges and Learning Games"
    >
      <div className="badges-hub-panel">
        <header className="badges-hub-header">
          <div className="badges-hub-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'badges'}
              className={tab === 'badges' ? 'active' : ''}
              onClick={() => setTab('badges')}
            >
              Badges
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'connect'}
              className={tab === 'connect' ? 'active' : ''}
              onClick={() => setTab('connect')}
            >
              Connect
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'memory'}
              className={tab === 'memory' ? 'active' : ''}
              onClick={() => setTab('memory')}
            >
              Memory
            </button>
          </div>
          <div className="badges-hub-meta">
            <span className="cefr-pill-tag">{cefrBadge}</span>
            <button type="button" className="badges-close-btn" aria-label="Close" onClick={onClose}>
              ✕
            </button>
          </div>
        </header>

        {(onOpenPractice || onOpenQuests || onOpenStories || onOpenDialogues) && (
          <div className="hub-quick-strip" aria-label="Learning Modes">
            {onOpenPractice && (
              <button type="button" className="hub-quick-pill primary" onClick={onOpenPractice}>
                ⚡ Practice
              </button>
            )}
            {onOpenQuests && (
              <button type="button" className="hub-quick-pill" onClick={onOpenQuests}>
                🎯 Quests
              </button>
            )}
            {onOpenStories && (
              <button type="button" className="hub-quick-pill" onClick={onOpenStories}>
                📖 Stories
              </button>
            )}
            {onOpenDialogues && (
              <button type="button" className="hub-quick-pill" onClick={onOpenDialogues}>
                💬 Talk
              </button>
            )}
          </div>
        )}

        {tab !== 'badges' && (
          <div className="deck-selector">
            <button
              type="button"
              className={deckId === 'srs_smart' ? 'deck-pill active' : 'deck-pill'}
              onClick={() => resetGames('srs_smart')}
            >
              <span>🧠</span>
              <span>Smart Review</span>
            </button>
            {EVALUATION_DECKS.map((d) => (
              <button
                key={d.id}
                type="button"
                className={deckId === d.id ? 'deck-pill active' : 'deck-pill'}
                onClick={() => resetGames(d.id)}
              >
                <span>{d.icon}</span>
                <span>{d.title}</span>
              </button>
            ))}
          </div>
        )}

        {tab === 'badges' && (
          <div className="badges-grid">
            {badges.map((b) => (
              <button
                key={b.id}
                type="button"
                className={`badge-card tier-${b.tier}`}
                onClick={() => onPlayAudio(b.speechKey)}
              >
                <span className="badge-icon">{b.icon}</span>
                <span className="badge-title">{b.profession}</span>
                <span className="badge-sub">
                  {b.title} · {b.progress}/{b.target}
                </span>
              </button>
            ))}
          </div>
        )}

        {tab === 'connect' && (
          <div className="connect-game">
            <div className="connect-board">
              <div className="connect-col">
                {connectCols.left.map((pair) => {
                  const isMatched = matchedConnectIds.includes(pair.id);
                  const isSelected = selectedLeft === pair.id;
                  return (
                    <button
                      key={pair.id}
                      type="button"
                      className={`connect-item left ${isMatched ? 'matched' : ''} ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectLeft(pair.id, pair.speechKey)}
                    >
                      <span className="connect-emoji">{pair.icon}</span>
                      <span className="connect-hint">{pair.hint}</span>
                      <span className="connect-dot" />
                    </button>
                  );
                })}
              </div>

              <svg className="connect-lines" viewBox="0 0 100 300" preserveAspectRatio="none" aria-hidden="true">
                {matchedConnectIds.map((id) => {
                  const lIdx = connectCols.left.findIndex((p) => p.id === id);
                  const rIdx = connectCols.right.findIndex((p) => p.id === id);
                  if (lIdx < 0 || rIdx < 0) return null;
                  const y1 = 25 + lIdx * 50;
                  const y2 = 25 + rIdx * 50;
                  return (
                    <line
                      key={id}
                      x1="4"
                      y1={y1}
                      x2="96"
                      y2={y2}
                      stroke="#ea580c"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>

              <div className="connect-col">
                {connectCols.right.map((pair) => {
                  const isMatched = matchedConnectIds.includes(pair.id);
                  const isWrong = wrongPairFlash === pair.id;
                  return (
                    <button
                      key={pair.id}
                      type="button"
                      className={`connect-item right ${isMatched ? 'matched' : ''} ${isWrong ? 'wrong' : ''}`}
                      onClick={() => handleSelectRight(pair.id, pair.speechKey)}
                    >
                      <span className="connect-dot" />
                      <span className="connect-word">{pair.label}</span>
                      <span className="connect-audio" aria-hidden="true">🔊</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {connectWon && (
              <div className="game-win-banner">
                <span>🎉 Great match!</span>
                <button type="button" onClick={() => resetGames(deckId, seed + 5)}>
                  Play again
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'memory' && (
          <div className="memory-game">
            <div className="memory-grid">
              {memoryCards.map((card) => {
                const isMatched = matchedMemoryPairIds.includes(card.pairId);
                const isRevealed = isMatched || flippedCardIds.includes(card.cardId);
                return (
                  <button
                    key={card.cardId}
                    type="button"
                    className={`memory-card ${isRevealed ? 'revealed' : ''} ${isMatched ? 'matched' : ''}`}
                    onClick={() => handleFlipMemory(card.cardId, card.pairId, card.speechKey)}
                  >
                    {isRevealed ? (
                      <span className={card.kind === 'icon' ? 'memory-emoji' : 'memory-word'}>
                        {card.display}
                      </span>
                    ) : (
                      <span className="memory-back">?</span>
                    )}
                  </button>
                );
              })}
            </div>
            {memoryWon && (
              <div className="game-win-banner">
                <span>🎉 Memory master!</span>
                <button type="button" onClick={() => resetGames(deckId, seed + 7)}>
                  Play again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

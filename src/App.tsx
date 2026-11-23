import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CONCEPT_AUDIO_KEY } from './content/audioManifest';
import { LESSON1_CAFE_SCRIPT } from './content/lesson1Cafe';
import {
  createLesson1State,
  lessonReducer,
  type LessonEffect,
  type LessonEvent,
  type LessonPhase,
} from './domain/lessonEngine';
import { countEarnedBadges, evaluateNeighborhoodBadges } from './domain/badgesAndGames';
import { CURIOSITY_CATALOG } from './domain/curiosityCatalog';
import { evaluateCefrProgress } from './domain/cefrEngine';
import { getActiveQuest } from './domain/inventoryAndQuests';
import {
  applyCafeCycleOutcome,
  applyLesson2Outcome,
  applyLesson3Outcome,
  createInitialProfile,
  recordStreetDiscovery,
} from './domain/learnerMemory';
import { resolveWorldAtmosphere, type GuidanceContext } from './domain/immersion';
import type { CafeCycleId, ConceptId, LearnerProfile, PropName, SpeechKey } from './domain/types';
import { createAudioPlayer, type AudioStatus } from './services/audioPlayer';
import { loadProfile, resetProfile, saveProfile } from './services/learnerStorage';
import { startVoiceCapture, type VoiceCaptureHandle } from './services/voiceCapture';
import type { AssetMode } from './scene/contracts';
import { ExperienceCanvas, type ActiveView, type CameraMode } from './scene/ExperienceCanvas';
import type { MarketStage } from './scene/MarketScene';
import type { PlazaStage } from './scene/PlazaScene';
import { BadgesHub } from './ui/BadgesHub';
import { CuriosityModal } from './ui/CuriosityModal';
import { DebugAudioBar } from './ui/DebugAudioBar';
import { GuidancePill } from './ui/GuidancePill';
import { InventoryQuestBar } from './ui/InventoryQuestBar';
import { LessonHud } from './ui/LessonHud';
import { TopNav } from './ui/TopNav';

const POUR_DURATION_SEC = 1.4;
const HESITATION_MS = 5000;

export default function App() {
  const [profile, setProfile] = useState<LearnerProfile>(() => loadProfile());
  const [lesson, setLesson] = useState(() => createLesson1State());
  const [activeView, setActiveView] = useState<ActiveView>('map');
  const [cameraMode, setCameraMode] = useState<CameraMode>('third_person');
  const [activeCuriosityId, setActiveCuriosityId] = useState<string | null>(null);
  const [inventoryIds, setInventoryIds] = useState<string[]>(() => profile.inventoryIds ?? []);
  const [completedQuestIds, setCompletedQuestIds] = useState<string[]>(
    () => profile.completedQuestIds ?? [],
  );
  const isDevMode =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('dev') === '1';
  const [activeCafeCycle, setActiveCafeCycle] =
    useState<Exclude<CafeCycleId, 'cafe_c1_drinks'>>('cafe_c2_food');
  const [marketStage, setMarketStage] = useState<MarketStage>('explore');
  const [plazaStage, setPlazaStage] = useState<PlazaStage>('explore');
  const [mapBlockedHint, setMapBlockedHint] = useState(false);
  const [assetMode, setAssetMode] = useState<AssetMode>('greybox');
  const [selectedConcept, setSelectedConcept] = useState<ConceptId | null>(null);
  const [pourProgressUi, setPourProgressUi] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [audioStatus, setAudioStatus] = useState<AudioStatus>({
    mode: 'idle',
    key: null,
    src: null,
    phrase: null,
    isPlaying: false,
  });

  const profileRef = useRef(profile);
  profileRef.current = profile;

  const lessonRef = useRef(lesson);
  lessonRef.current = lesson;

  const pourProgressRef = useRef(0);
  const isPouringRef = useRef(false);
  const voiceHandleRef = useRef<VoiceCaptureHandle | null>(null);
  const voiceTokenRef = useRef(0);
  const unmountedRef = useRef(false);
  const hesitationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapBlockedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMountedRef = useRef(false);
  const skipNextPersistRef = useRef(false);
  const persistedProfileRef = useRef(profile);

  const audioPlayer = useMemo(
    () =>
      createAudioPlayer({
        onStatusChange: setAudioStatus,
      }),
    [],
  );

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      audioPlayer.dispose();
      voiceTokenRef.current += 1;
      voiceHandleRef.current?.stop();
      voiceHandleRef.current = null;
      if (hesitationTimerRef.current) {
        clearTimeout(hesitationTimerRef.current);
        hesitationTimerRef.current = null;
      }
      if (mapBlockedTimerRef.current) {
        clearTimeout(mapBlockedTimerRef.current);
        mapBlockedTimerRef.current = null;
      }
    };
  }, [audioPlayer]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      persistedProfileRef.current = profile;
      return;
    }
    const merged: LearnerProfile = {
      ...profile,
      inventoryIds,
      completedQuestIds,
    };
    const prev = persistedProfileRef.current;
    const onlyClockChanged =
      prev.immersionSeconds !== merged.immersionSeconds &&
      prev.completedLessonIds === merged.completedLessonIds &&
      prev.completedCafeCycles === merged.completedCafeCycles &&
      prev.streetDiscoveries === merged.streetDiscoveries &&
      prev.locations === merged.locations &&
      prev.constellation === merged.constellation &&
      prev.inventoryIds === merged.inventoryIds &&
      prev.completedQuestIds === merged.completedQuestIds;

    // Throttle pure 1s clock ticks to every 15s; persist all real progress immediately
    if (onlyClockChanged && merged.immersionSeconds % 15 !== 0) {
      return;
    }
    persistedProfileRef.current = merged;
    saveProfile(merged);
  }, [profile, inventoryIds, completedQuestIds]);

  const stopVoice = useCallback(() => {
    voiceTokenRef.current += 1;
    voiceHandleRef.current?.stop();
    voiceHandleRef.current = null;
    if (!unmountedRef.current) {
      setIsListening(false);
      setVoiceLevel(0);
    }
  }, []);

  // Escape key exits interiors or closes CuriosityModal / BadgesHub
  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (activeCuriosityId) {
        setActiveCuriosityId(null);
      } else if (activeView !== 'map') {
        audioPlayer.stop();
        stopVoice();
        setActiveView('map');
      }
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [activeCuriosityId, activeView, audioPlayer, stopVoice]);

  const resetPourState = useCallback(() => {
    pourProgressRef.current = 0;
    isPouringRef.current = false;
    setPourProgressUi(0);
  }, []);

  const dispatchRef = useRef<(event: LessonEvent) => void>(() => {});

  const runEffects = useCallback(
    (effects: LessonEffect[]) => {
      for (const effect of effects) {
        if (effect.type === 'play_audio') {
          audioPlayer.play(effect.key, {
            playbackRate: effect.playbackRate,
            followUpKey: effect.followUpKey,
            onEnded: () => {
              if (!unmountedRef.current) {
                dispatchRef.current({ type: 'AUDIO_ENDED' });
              }
            },
          });
        } else if (effect.type === 'commit_profile') {
          profileRef.current = effect.profile;
          setProfile(effect.profile);
          setActiveView('badges');
        }
      }
    },
    [audioPlayer],
  );

  const dispatch = useCallback(
    (event: LessonEvent) => {
      const { state: nextState, effects } = lessonReducer(
        lessonRef.current,
        event,
        profileRef.current,
        new Date().toISOString(),
        LESSON1_CAFE_SCRIPT,
      );
      lessonRef.current = nextState;
      setLesson(nextState);
      if (event.type === 'POUR_COMPLETED' || event.type === 'JUMP_TO_PHASE') {
        resetPourState();
      }
      runEffects(effects);
    },
    [resetPourState, runEffects],
  );

  dispatchRef.current = dispatch;

  // Immersion seconds counter while active in lesson or constellation
  useEffect(() => {
    if (activeView === 'map') return;
    const id = setInterval(() => {
      setProfile((prev) => ({ ...prev, immersionSeconds: prev.immersionSeconds + 1 }));
    }, 1000);
    return () => clearInterval(id);
  }, [activeView]);

  // 5s Hesitation safety net whenever awaiting learner input (except silent-period Micro-Eco)
  useEffect(() => {
    if (hesitationTimerRef.current) {
      clearTimeout(hesitationTimerRef.current);
      hesitationTimerRef.current = null;
    }
    if (
      activeView !== 'lesson' ||
      !lesson.awaitingInput ||
      lesson.phase === 'micro_echo' ||
      audioStatus.isPlaying
    ) {
      return;
    }
    hesitationTimerRef.current = setTimeout(() => {
      dispatch({ type: 'HESITATION_TIMEOUT' });
    }, HESITATION_MS);
    return () => {
      if (hesitationTimerRef.current) {
        clearTimeout(hesitationTimerRef.current);
        hesitationTimerRef.current = null;
      }
      if (mapBlockedTimerRef.current) {
        clearTimeout(mapBlockedTimerRef.current);
        mapBlockedTimerRef.current = null;
      }
    };
  }, [activeView, lesson.awaitingInput, lesson.phase, lesson.roundIndex, audioStatus.isPlaying, dispatch]);

  // Continuous hold-to-pour loop for Screen 4
  useEffect(() => {
    if (activeView !== 'lesson' || lesson.phase !== 'action_pour' || !lesson.awaitingInput) {
      return;
    }
    let rafId = 0;
    let last = performance.now();

    const stopPour = () => {
      isPouringRef.current = false;
    };
    window.addEventListener('pointerup', stopPour);
    window.addEventListener('pointercancel', stopPour);

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (isPouringRef.current) {
        const next = Math.min(1, pourProgressRef.current + dt / POUR_DURATION_SEC);
        pourProgressRef.current = next;
        setPourProgressUi(next);
        if (next >= 1) {
          isPouringRef.current = false;
          dispatch({ type: 'POUR_COMPLETED' });
          return;
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointerup', stopPour);
      window.removeEventListener('pointercancel', stopPour);
    };
  }, [activeView, lesson.phase, lesson.awaitingInput, lesson.roundIndex, dispatch]);

  const handleEnterCafe = useCallback(() => {
    audioPlayer.stop();
    stopVoice();
    resetPourState();
    setSelectedConcept(null);

    const cefr = evaluateCefrProgress(profileRef.current);
    if (cefr.nextCafeCycle !== 'cafe_c1_drinks') {
      const cycle = cefr.nextCafeCycle;
      setActiveCafeCycle(cycle);
      setActiveView('cafe_cycle');
      const introMap: Record<Exclude<CafeCycleId, 'cafe_c1_drinks'>, SpeechKey> = {
        cafe_c2_food: 'cafe_c2_intro',
        cafe_c3_quantity: 'cafe_c3_intro',
        cafe_pre_a1_shift: 'cafe_shift_order_1',
        cafe_a1_spiral: 'cafe_a1_intro',
      };
      audioPlayer.play(introMap[cycle]);
      return;
    }

    setActiveView('lesson');
    if (
      lessonRef.current.completed ||
      lessonRef.current.phase !== 'map_arrival' ||
      lessonRef.current.subStep !== 'idle_map'
    ) {
      const fresh = createLesson1State();
      lessonRef.current = fresh;
      setLesson(fresh);
    }
    dispatch({ type: 'ENTER_CAFE' });
  }, [audioPlayer, dispatch, resetPourState, stopVoice]);

  const handleCompleteCafeCycle = useCallback(
    (cycleId: CafeCycleId, concepts: readonly ConceptId[]) => {
      const next = applyCafeCycleOutcome(
        profileRef.current,
        cycleId,
        concepts,
        new Date().toISOString(),
      );
      profileRef.current = next;
      setProfile(next);
      setActiveView('badges');
    },
    [],
  );

  const handlePropTap = useCallback(
    (prop: PropName) => {
      if (prop === 'prop_cafe_door') {
        handleEnterCafe();
        return;
      }
      dispatch({ type: 'PROP_TAPPED', prop });
    },
    [dispatch, handleEnterCafe],
  );

  const beginVoiceCapture = useCallback(
    async (onSuccess: () => void) => {
      stopVoice();
      const token = voiceTokenRef.current;
      setIsListening(true);
      const isCurrent = () => voiceTokenRef.current === token && !unmountedRef.current;
      const clearListening = () => {
        voiceHandleRef.current = null;
        setIsListening(false);
        setVoiceLevel(0);
      };
      const handle = await startVoiceCapture({
        onLevel: (level) => {
          if (!isCurrent()) return;
          setVoiceLevel(level);
        },
        onDetected: () => {
          if (!isCurrent()) return;
          clearListening();
          onSuccess();
        },
        onUnavailable: () => {
          if (!isCurrent()) return;
          clearListening();
        },
        onTimeout: () => {
          if (!isCurrent()) return;
          clearListening();
        },
      });
      if (!isCurrent()) {
        handle.stop();
        return;
      }
      voiceHandleRef.current = handle;
    },
    [stopVoice],
  );

  const handleStartMic = useCallback(
    () => beginVoiceCapture(() => dispatch({ type: 'VOICE_DETECTED' })),
    [beginVoiceCapture, dispatch],
  );

  const handleEnterMarket = useCallback(() => {
    audioPlayer.stop();
    stopVoice();
    setSelectedConcept(null);
    setMarketStage('explore');
    setActiveView('market');
    audioPlayer.play('market_hi_maya');
  }, [audioPlayer, stopVoice]);

  const handleCompleteMarket = useCallback(() => {
    const next = applyLesson2Outcome(profileRef.current, new Date().toISOString());
    profileRef.current = next;
    setProfile(next);
    setActiveView('badges');
  }, []);

  const handleEnterPlaza = useCallback(() => {
    audioPlayer.stop();
    stopVoice();
    setSelectedConcept(null);
    setPlazaStage('explore');
    setActiveView('plaza');
    audioPlayer.play('plaza_hi_sam');
  }, [audioPlayer, stopVoice]);

  const handleCompletePlaza = useCallback(() => {
    const next = applyLesson3Outcome(profileRef.current, new Date().toISOString());
    profileRef.current = next;
    setProfile(next);
    setActiveView('badges');
  }, []);

  const handleStartNextLesson = useCallback(() => {
    const locs = profileRef.current.locations;
    const cefr = evaluateCefrProgress(profileRef.current);
    if (!cefr.preA1Ready) {
      handleEnterCafe();
    } else if (locs.market === 'discovered') {
      handleEnterMarket();
    } else if (locs.plaza === 'discovered') {
      handleEnterPlaza();
    } else {
      handleEnterCafe();
    }
  }, [handleEnterCafe, handleEnterMarket, handleEnterPlaza]);

  const handleExploreObject = useCallback(
    (key: SpeechKey) => {
      audioPlayer.play(key);
      if (key.startsWith('world_')) {
        setProfile((prev) => recordStreetDiscovery(prev, key));
      }
      if (key === 'world_bakery_bread') {
        setInventoryIds((prev) => (prev.includes('bread') ? prev : [...prev, 'bread']));
      } else if (key === 'world_pharmacy_medicine') {
        setInventoryIds((prev) => (prev.includes('medicine') ? prev : [...prev, 'medicine']));
      } else if (key === 'world_pet_food') {
        setInventoryIds((prev) => (prev.includes('petfood') ? prev : [...prev, 'petfood']));
      }
    },
    [audioPlayer],
  );

  const handleMapBlockedBump = useCallback(() => {
    setMapBlockedHint(true);
    if (mapBlockedTimerRef.current) {
      clearTimeout(mapBlockedTimerRef.current);
    }
    mapBlockedTimerRef.current = setTimeout(() => {
      if (!unmountedRef.current) {
        setMapBlockedHint(false);
      }
    }, 3200);
  }, []);

  const handleSelectConcept = useCallback(
    (id: ConceptId) => {
      stopVoice();
      setSelectedConcept(id);
      audioPlayer.play(CONCEPT_AUDIO_KEY[id]);
    },
    [audioPlayer, stopVoice],
  );

  const handleSelectView = useCallback(
    (view: 'map' | 'badges') => {
      audioPlayer.stop();
      stopVoice();
      resetPourState();
      setSelectedConcept(null);
      setActiveView(view);
    },
    [audioPlayer, resetPourState, stopVoice],
  );

  const handleJumpPhase = useCallback(
    (phase: LessonPhase) => {
      audioPlayer.stop();
      stopVoice();
      resetPourState();
      setSelectedConcept(null);
      setActiveView(phase === 'map_arrival' ? 'map' : 'lesson');
      dispatch({ type: 'JUMP_TO_PHASE', phase });
    },
    [audioPlayer, dispatch, resetPourState, stopVoice],
  );

  const handleReset = useCallback(() => {
    audioPlayer.stop();
    stopVoice();
    resetPourState();
    resetProfile();
    const freshProfile = createInitialProfile();
    const freshLesson = createLesson1State();
    profileRef.current = freshProfile;
    lessonRef.current = freshLesson;
    skipNextPersistRef.current = true;
    setProfile(freshProfile);
    setLesson(freshLesson);
    setSelectedConcept(null);
    setActiveCuriosityId(null);
    setInventoryIds([]);
    setCompletedQuestIds([]);
    setActiveView('map');
  }, [audioPlayer, resetPourState, stopVoice]);

  const handlePourStart = useCallback(() => {
    if (lessonRef.current.phase === 'action_pour' && lessonRef.current.awaitingInput) {
      isPouringRef.current = true;
    }
  }, []);

  const handlePourEnd = useCallback(() => {
    isPouringRef.current = false;
  }, []);

  const handleSilentWave = useCallback(() => {
    stopVoice();
    dispatch({ type: 'SILENT_WAVE' });
  }, [dispatch, stopVoice]);

  const starCount = Object.keys(profile.constellation).length;
  const badgeCount = countEarnedBadges(evaluateNeighborhoodBadges(profile));
  const cefrProgress = evaluateCefrProgress(profile);
  const { timeOfDay, weather } = resolveWorldAtmosphere(profile.completedLessonIds);
  const cefrBadge =
    cefrProgress.level === 'pre_a1'
      ? `Pre-A1 · ${cefrProgress.preA1StepsDone}/${cefrProgress.preA1StepsTotal}`
      : cefrProgress.levelLabel;

  const guidanceContext: GuidanceContext =
    activeView === 'badges'
      ? 'constellation'
      : activeView === 'cafe_cycle'
        ? activeCafeCycle
        : activeView === 'market'
          ? marketStage === 'explore'
            ? 'market_explore'
            : marketStage === 'contrast'
              ? 'market_contrast'
              : 'market_basket'
          : activeView === 'plaza'
            ? plazaStage === 'explore'
              ? 'plaza_explore'
              : 'plaza_rhythm'
            : activeView === 'map'
              ? mapBlockedHint
                ? 'map_locked_border'
                : 'map_explore'
              : lesson.phase === 'action_pour'
                ? 'cafe_pour'
                : lesson.phase === 'personal_choice'
                  ? 'cafe_choice'
                  : lesson.phase === 'micro_echo'
                    ? 'cafe_echo'
                    : lesson.awaitingInput
                      ? 'cafe_tap_prop'
                      : 'cafe_listen';

  return (
    <main className="app-shell">
      <ExperienceCanvas
        activeView={activeView}
        cameraMode={cameraMode}
        assetMode={assetMode}
        cameraAnchor={lesson.cameraAnchor}
        cafeStatus={profile.locations.cafe}
        locations={profile.locations}
        timeOfDay={timeOfDay}
        weather={weather}
        phase={lesson.phase}
        leoAnim={lesson.leoAnim}
        speechRef={audioPlayer.speechRef}
        highlightedProp={lesson.highlightedProp}
        hintMode={lesson.hintMode}
        customerMood={lesson.customerMood}
        activePourLiquid={lesson.activePourLiquid}
        pourProgressRef={pourProgressRef}
        isPouringRef={isPouringRef}
        mysteryBoxVisible={lesson.mysteryBoxVisible}
        orbsLaunching={lesson.orbsLaunching}
        constellationNodes={profile.constellation}
        selectedConcept={selectedConcept}
        activeCafeCycle={activeCafeCycle}
        marketStage={marketStage}
        plazaStage={plazaStage}
        onEnterCafe={handleEnterCafe}
        onCompleteCafeCycle={handleCompleteCafeCycle}
        onEnterMarket={handleEnterMarket}
        onEnterPlaza={handleEnterPlaza}
        onMarketStageChange={setMarketStage}
        onCompleteMarket={handleCompleteMarket}
        onPlazaStageChange={setPlazaStage}
        onCompletePlaza={handleCompletePlaza}
        onExploreObject={handleExploreObject}
        onInspectCuriosity={(id) => {
          const item = CURIOSITY_CATALOG[id];
          if (!item) return;
          stopVoice();
          setActiveCuriosityId(id);
          audioPlayer.play(item.speechKey);
        }}
        onMapBlockedBump={handleMapBlockedBump}
        onPropTap={handlePropTap}
        onPourStart={handlePourStart}
        onPourEnd={handlePourEnd}
        onSelectConcept={handleSelectConcept}
      />

      <TopNav
        activeView={activeView}
        cameraMode={cameraMode}
        starCount={badgeCount}
        immersionSeconds={profile.immersionSeconds}
        onSelectView={handleSelectView}
        onCycleCameraMode={() =>
          setCameraMode((prev) =>
            prev === 'third_person'
              ? 'first_person'
              : prev === 'first_person'
                ? 'overview'
                : 'third_person',
          )
        }
      />

      {activeView !== 'badges' && !activeCuriosityId && (
        <GuidancePill
          context={guidanceContext}
          starCount={starCount}
          cefrBadge={cefrBadge}
          darkSurface={activeView === 'map' && timeOfDay === 'night'}
        />
      )}

      <LessonHud
        activeView={activeView}
        phase={lesson.phase}
        awaitingInput={lesson.awaitingInput}
        pourProgress={pourProgressUi}
        isListening={isListening}
        voiceLevel={voiceLevel}
        onStartCafe={handleStartNextLesson}
        onRequestHelp={() => {
          stopVoice();
          dispatch({ type: 'HELP_REQUESTED' });
        }}
        onStartMic={handleStartMic}
        onSilentWave={handleSilentWave}
        onHoldPourStart={handlePourStart}
        onHoldPourEnd={handlePourEnd}
      />

      {activeView === 'map' && activeCuriosityId && CURIOSITY_CATALOG[activeCuriosityId] && (
        <CuriosityModal
          item={CURIOSITY_CATALOG[activeCuriosityId]}
          onPlayAudio={(key) => {
            stopVoice();
            audioPlayer.play(key);
          }}
          onSolved={(item) => {
            setProfile((prev) => recordStreetDiscovery(prev, item.discoveryKey));
            if (item.collectible) {
              const cid = item.collectible.itemId;
              setInventoryIds((prev) => (prev.includes(cid) ? prev : [...prev, cid]));
            }
          }}
          onClose={() => setActiveCuriosityId(null)}
        />
      )}

      {activeView === 'map' && !activeCuriosityId && (
        <InventoryQuestBar
          inventoryIds={inventoryIds}
          activeQuest={getActiveQuest(completedQuestIds)}
          onPlayAudio={(key) => {
            stopVoice();
            audioPlayer.play(key);
          }}
          onDeliverQuest={(quest) => {
            stopVoice();
            audioPlayer.play(quest.doneSpeechKey);
            setInventoryIds((prev) => prev.filter((id) => id !== quest.targetItemId));
            setCompletedQuestIds((prev) => (prev.includes(quest.id) ? prev : [...prev, quest.id]));
            setProfile((prev) => recordStreetDiscovery(prev, `world_${quest.id}`));
          }}
        />
      )}

      {activeView === 'badges' && (
        <BadgesHub
          profile={profile}
          cefrBadge={cefrBadge}
          onPlayAudio={(key) => {
            stopVoice();
            audioPlayer.play(key);
          }}
          onCompleteGame={(gameKey) => {
            setProfile((prev) => recordStreetDiscovery(prev, gameKey));
          }}
          onClose={() => {
            stopVoice();
            setActiveView('map');
          }}
        />
      )}

      {activeView !== 'map' && activeView !== 'badges' && (
        <button
          type="button"
          className="back-street-btn"
          aria-label="Back to street"
          onClick={() => handleSelectView('map')}
        >
          ← Street
        </button>
      )}

      {!isDevMode && audioStatus.phrase && !activeCuriosityId && (
        <div className="speech-subtitle-pill" role="status" aria-live="polite">
          <span>{audioStatus.isPlaying ? '🔊' : '✓'}</span>
          <span>“{audioStatus.phrase}”</span>
        </div>
      )}

      {isDevMode && (
        <DebugAudioBar
          audioStatus={audioStatus}
          phase={lesson.phase}
          assetMode={assetMode}
          onToggleAssetMode={() => setAssetMode((m) => (m === 'greybox' ? 'glb' : 'greybox'))}
          onJumpPhase={handleJumpPhase}
          onSimulateVoice={() => {
            if (activeView === 'lesson' && lesson.phase === 'micro_echo') {
              stopVoice();
              dispatch({ type: 'VOICE_DETECTED' });
            }
          }}
          onResetProfile={handleReset}
        />
      )}
    </main>
  );
}

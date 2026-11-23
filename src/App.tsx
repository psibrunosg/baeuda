import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LESSON1_CAFE_SCRIPT } from './content/lesson1Cafe';
import {
  createLesson1State,
  lessonReducer,
  type LessonEffect,
  type LessonEvent,
  type LessonPhase,
} from './domain/lessonEngine';
import { countEarnedBadges, evaluateNeighborhoodBadges } from './domain/badgesAndGames';
import {
  awardCoins,
  getEffectiveAvatarStyle,
  getEffectiveCoins,
  purchaseOrEquipStyle,
  updateDailyStreak,
} from './domain/avatarShop';
import { CURIOSITY_CATALOG } from './domain/curiosityCatalog';
import { evaluateCefrProgress } from './domain/cefrEngine';
import { getActiveQuest } from './domain/inventoryAndQuests';
import {
  addInventoryItem,
  applyCafeCycleOutcome,
  applyLesson2Outcome,
  applyLesson3Outcome,
  applySrsReviewOutcome,
  completeQuestInProfile,
  createInitialProfile,
  recordStreetDiscovery,
} from './domain/learnerMemory';
import { resolveWorldAtmosphere, type GuidanceContext } from './domain/immersion';
import type { CafeCycleId, ConceptId, LearnerProfile, PropName, SpeechKey } from './domain/types';
import { createAudioPlayer, type AudioStatus } from './services/audioPlayer';
import { playRewardFanfare, playSuccessChime } from './services/soundEngine';
import { loadProfile, resetProfile, saveProfile } from './services/learnerStorage';
import { startVoiceCapture, type VoiceCaptureHandle } from './services/voiceCapture';
import type { AssetMode } from './scene/contracts';
import { ExperienceCanvas, type ActiveView, type CameraMode } from './scene/ExperienceCanvas';
import type { MarketStage } from './scene/MarketScene';
import type { PlazaStage } from './scene/PlazaScene';
import { AvatarCustomizerModal } from './ui/AvatarCustomizerModal';
import { BadgesHub } from './ui/BadgesHub';
import { CityMinimapModal } from './ui/CityMinimapModal';
import { CuriosityModal } from './ui/CuriosityModal';
import { DebugAudioBar } from './ui/DebugAudioBar';
import { GuidancePill } from './ui/GuidancePill';
import { InventoryQuestBar } from './ui/InventoryQuestBar';
import { LessonHud } from './ui/LessonHud';
import { TopNav } from './ui/TopNav';
import { TravelDialogueModal } from './ui/TravelDialogueModal';

const POUR_DURATION_SEC = 1.4;
const HESITATION_MS = 5000;

export default function App() {
  const [profile, setProfile] = useState<LearnerProfile>(() => loadProfile());
  const [lesson, setLesson] = useState(() => createLesson1State());
  const [activeView, setActiveView] = useState<ActiveView>('map');
  const [cameraMode, setCameraMode] = useState<CameraMode>('third_person');
  const [minimapOpen, setMinimapOpen] = useState(false);
  const [travelDialogueOpen, setTravelDialogueOpen] = useState(false);
  const [wardrobeOpen, setWardrobeOpen] = useState(false);
  const [teleportRequest, setTeleportRequest] = useState<{
    x: number;
    z: number;
    yaw: number;
    seq: number;
  } | null>(null);
  const [activeCuriosityId, setActiveCuriosityId] = useState<string | null>(null);
  const [rewardToast, setRewardToast] = useState<string | null>(null);
  const rewardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [subtitleVisible, setSubtitleVisible] = useState(false);

  const showRewardToast = useCallback((msg: string) => {
    setRewardToast(msg);
    if (rewardTimerRef.current) clearTimeout(rewardTimerRef.current);
    rewardTimerRef.current = setTimeout(() => {
      if (!unmountedRef.current) setRewardToast(null);
    }, 2600);
  }, []);
  const isDevMode =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('dev') === '1';
  const [activeCafeCycle, setActiveCafeCycle] =
    useState<Exclude<CafeCycleId, 'cafe_c1_drinks'>>('cafe_c2_food');
  const [marketStage, setMarketStage] = useState<MarketStage>('explore');
  const [plazaStage, setPlazaStage] = useState<PlazaStage>('explore');
  const [mapBlockedHint, setMapBlockedHint] = useState(false);
  const [assetMode, setAssetMode] = useState<AssetMode>('greybox');
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

  const updateProfile = useCallback((updater: (prev: LearnerProfile) => LearnerProfile) => {
    setProfile((prev) => {
      const next = updater(prev);
      profileRef.current = next;
      return next;
    });
  }, []);

  const inventoryIds = profile.inventoryIds ?? [];
  const completedQuestIds = profile.completedQuestIds ?? [];

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
      if (rewardTimerRef.current) {
        clearTimeout(rewardTimerRef.current);
        rewardTimerRef.current = null;
      }
    };
  }, [audioPlayer]);

  // Auto-fade subtitle pill 2.5s after audio stops playing
  useEffect(() => {
    if (!audioStatus.phrase) {
      setSubtitleVisible(false);
      return;
    }
    setSubtitleVisible(true);
    if (audioStatus.isPlaying) return;
    const id = setTimeout(() => {
      if (!unmountedRef.current) setSubtitleVisible(false);
    }, 2500);
    return () => clearTimeout(id);
  }, [audioStatus.phrase, audioStatus.isPlaying]);

  // Flush latest profile on page hide / tab close so throttled immersion seconds are never lost
  useEffect(() => {
    const flush = () => {
      if (persistedProfileRef.current !== profileRef.current) {
        persistedProfileRef.current = profileRef.current;
        saveProfile(profileRef.current);
      }
    };
    const onVisChange = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisChange);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, []);

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
    const prev = persistedProfileRef.current;
    const onlyClockChanged =
      prev.immersionSeconds !== profile.immersionSeconds &&
      prev.preferredDrink === profile.preferredDrink &&
      prev.oralComfort === profile.oralComfort &&
      prev.completedLessonIds === profile.completedLessonIds &&
      prev.completedCafeCycles === profile.completedCafeCycles &&
      prev.streetDiscoveries === profile.streetDiscoveries &&
      prev.locations === profile.locations &&
      prev.constellation === profile.constellation &&
      prev.inventoryIds === profile.inventoryIds &&
      prev.completedQuestIds === profile.completedQuestIds &&
      prev.coins === profile.coins &&
      prev.avatarStyle === profile.avatarStyle &&
      prev.unlockedStyleIds === profile.unlockedStyleIds &&
      prev.dailyStreak === profile.dailyStreak;

    // Throttle pure 1s clock ticks to every 15s; persist all real progress immediately
    if (onlyClockChanged && profile.immersionSeconds % 15 !== 0) {
      return;
    }
    persistedProfileRef.current = profile;
    saveProfile(profile);
  }, [profile]);

  const stopVoice = useCallback(() => {
    voiceTokenRef.current += 1;
    voiceHandleRef.current?.stop();
    voiceHandleRef.current = null;
    if (!unmountedRef.current) {
      setIsListening(false);
      setVoiceLevel(0);
    }
  }, []);

  // Escape key exits interiors or closes modals
  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (wardrobeOpen) {
        setWardrobeOpen(false);
      } else if (travelDialogueOpen) {
        setTravelDialogueOpen(false);
      } else if (minimapOpen) {
        setMinimapOpen(false);
      } else if (activeCuriosityId) {
        setActiveCuriosityId(null);
      } else if (activeView !== 'map') {
        audioPlayer.stop();
        stopVoice();
        setActiveView('map');
      }
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [activeCuriosityId, activeView, audioPlayer, minimapOpen, stopVoice, travelDialogueOpen, wardrobeOpen]);

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
          const rewarded = updateDailyStreak(awardCoins(effect.profile, 20));
          profileRef.current = rewarded;
          setProfile(rewarded);
          showRewardToast('⭐ Lesson complete! +20 🪙 earned!');
          setActiveView('badges');
        }
      }
    },
    [audioPlayer, showRewardToast],
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
      updateProfile((prev) =>
        updateDailyStreak(
          awardCoins(
            applyCafeCycleOutcome(prev, cycleId, concepts, new Date().toISOString()),
            20,
          ),
        ),
      );
      showRewardToast('☕ Café cycle complete! +20 🪙 earned!');
      setActiveView('badges');
    },
    [showRewardToast, updateProfile],
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
    setMarketStage('explore');
    setActiveView('market');
    audioPlayer.play('market_hi_maya');
  }, [audioPlayer, stopVoice]);

  const handleCompleteMarket = useCallback(() => {
    updateProfile((prev) =>
      updateDailyStreak(awardCoins(applyLesson2Outcome(prev, new Date().toISOString()), 20)),
    );
    showRewardToast('🍎 Market lesson complete! +20 🪙 earned!');
    setActiveView('badges');
  }, [showRewardToast, updateProfile]);

  const handleEnterPlaza = useCallback(() => {
    audioPlayer.stop();
    stopVoice();
    setPlazaStage('explore');
    setActiveView('plaza');
    audioPlayer.play('plaza_hi_sam');
  }, [audioPlayer, stopVoice]);

  const handleCompletePlaza = useCallback(() => {
    updateProfile((prev) =>
      updateDailyStreak(awardCoins(applyLesson3Outcome(prev, new Date().toISOString()), 20)),
    );
    showRewardToast('⛲ Plaza lesson complete! +20 🪙 earned!');
    setActiveView('badges');
  }, [showRewardToast, updateProfile]);

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
      const itemMap: Partial<Record<SpeechKey, { id: string; toast: string }>> = {
        world_bakery_bread: { id: 'bread', toast: '🎒 +1 🥖 Fresh bread in backpack!' },
        world_pharmacy_medicine: { id: 'medicine', toast: '🎒 +1 💊 Medicine in backpack!' },
        world_pet_food: { id: 'petfood', toast: '🎒 +1 🦴 Pet food in backpack!' },
      };
      const pickup = itemMap[key];
      if (key.startsWith('world_') || pickup) {
        updateProfile((prev) => {
          let next = key.startsWith('world_') ? recordStreetDiscovery(prev, key) : prev;
          if (pickup && !(next.inventoryIds ?? []).includes(pickup.id)) {
            playSuccessChime();
            showRewardToast(pickup.toast);
            next = addInventoryItem(next, pickup.id);
          }
          return next;
        });
      }
    },
    [audioPlayer, showRewardToast, updateProfile],
  );

  const handleInspectCuriosity = useCallback(
    (id: string) => {
      const item = CURIOSITY_CATALOG[id];
      if (!item) return;
      stopVoice();
      setActiveCuriosityId(id);
      audioPlayer.play(item.speechKey);
    },
    [audioPlayer, stopVoice],
  );

  const handleEnterPizzeria = useCallback(() => {
    audioPlayer.stop();
    stopVoice();
    resetPourState();
    setMinimapOpen(false);
    setActiveCuriosityId(null);
    setActiveView('pizzeria');
  }, [audioPlayer, resetPourState, stopVoice]);

  const handleCompletePizzeria = useCallback(() => {
    updateProfile((prev) =>
      addInventoryItem(
        updateDailyStreak(awardCoins(recordStreetDiscovery(prev, 'world_pizzeria_kitchen'), 20)),
        'pizza',
      ),
    );
    showRewardToast('🍕 Hot pizza made & added to backpack! +20 🪙 earned!');
    setActiveView('map');
  }, [showRewardToast, updateProfile]);

  const handleEnterPharmacy = useCallback(() => {
    audioPlayer.stop();
    stopVoice();
    resetPourState();
    setMinimapOpen(false);
    setActiveCuriosityId(null);
    setActiveView('pharmacy');
  }, [audioPlayer, resetPourState, stopVoice]);

  const handleCompletePharmacy = useCallback(() => {
    updateProfile((prev) =>
      updateDailyStreak(awardCoins(recordStreetDiscovery(prev, 'world_pharmacy_counter'), 20)),
    );
    showRewardToast('💊 Patient cared for! +20 🪙 earned!');
    setActiveView('map');
  }, [showRewardToast, updateProfile]);

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

  const handleSelectView = useCallback(
    (view: 'map' | 'badges') => {
      audioPlayer.stop();
      stopVoice();
      resetPourState();
      if (view === 'map' && activeView === 'map') {
        setMinimapOpen((prev) => !prev);
        return;
      }
      setMinimapOpen(false);
      setActiveView(view);
    },
    [activeView, audioPlayer, resetPourState, stopVoice],
  );

  const handleJumpPhase = useCallback(
    (phase: LessonPhase) => {
      audioPlayer.stop();
      stopVoice();
      resetPourState();
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
    setActiveCuriosityId(null);
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
            : activeView === 'pizzeria'
              ? 'pizzeria_kitchen'
              : activeView === 'pharmacy'
                ? 'pharmacy_counter'
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
        avatarStyle={getEffectiveAvatarStyle(profile)}
        teleportRequest={teleportRequest}
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
        streetDiscoveries={profile.streetDiscoveries ?? []}
        activeCafeCycle={activeCafeCycle}
        marketStage={marketStage}
        plazaStage={plazaStage}
        onEnterCafe={handleEnterCafe}
        onCompleteCafeCycle={handleCompleteCafeCycle}
        onEnterMarket={handleEnterMarket}
        onEnterPlaza={handleEnterPlaza}
        onEnterPizzeria={handleEnterPizzeria}
        onCompletePizzeria={handleCompletePizzeria}
        onEnterPharmacy={handleEnterPharmacy}
        onCompletePharmacy={handleCompletePharmacy}
        onMarketStageChange={setMarketStage}
        onCompleteMarket={handleCompleteMarket}
        onPlazaStageChange={setPlazaStage}
        onCompletePlaza={handleCompletePlaza}
        onExploreObject={handleExploreObject}
        onInspectCuriosity={handleInspectCuriosity}
        onMapBlockedBump={handleMapBlockedBump}
        onPropTap={handlePropTap}
        onPourStart={handlePourStart}
        onPourEnd={handlePourEnd}
      />

      <TopNav
        activeView={activeView}
        cameraMode={cameraMode}
        starCount={badgeCount}
        immersionSeconds={profile.immersionSeconds}
        coins={getEffectiveCoins(profile)}
        streakCount={profile.dailyStreak?.count ?? 1}
        onSelectView={handleSelectView}
        onOpenWardrobe={() => {
          stopVoice();
          setWardrobeOpen((prev) => !prev);
        }}
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

      {activeView !== 'badges' &&
        !activeCuriosityId &&
        !wardrobeOpen &&
        !minimapOpen &&
        !travelDialogueOpen && (
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
            updateProfile((prev) => {
              let next = updateDailyStreak(
                awardCoins(recordStreetDiscovery(prev, item.discoveryKey), 5),
              );
              if (item.collectible) {
                const cid = item.collectible.itemId;
                const label = `${item.collectible.icon} ${item.collectible.label}`;
                if (!(next.inventoryIds ?? []).includes(cid)) {
                  showRewardToast(`🎒 +1 ${label} & +5 🪙!`);
                  next = addInventoryItem(next, cid);
                } else {
                  showRewardToast('🪙 +5 coins earned!');
                }
              } else {
                showRewardToast('🪙 +5 coins earned!');
              }
              return next;
            });
          }}
          onClose={() => setActiveCuriosityId(null)}
        />
      )}

      {activeView === 'map' &&
        !activeCuriosityId &&
        !wardrobeOpen &&
        !minimapOpen &&
        !travelDialogueOpen && (
          <InventoryQuestBar
            inventoryIds={inventoryIds}
            activeQuest={getActiveQuest(completedQuestIds)}
            onPlayAudio={(key) => {
              stopVoice();
              audioPlayer.play(key);
            }}
            onDeliverQuest={(quest) => {
              stopVoice();
              playRewardFanfare();
              audioPlayer.play(quest.doneSpeechKey);
              updateProfile((prev) =>
                completeQuestInProfile(
                  updateDailyStreak(
                    awardCoins(recordStreetDiscovery(prev, `world_${quest.id}`), 15),
                  ),
                  quest.id,
                  quest.targetItemId,
                ),
              );
              showRewardToast(`🎉 ${quest.npcName} loved the ${quest.targetIcon}! +15 🪙`);
            }}
            onInspectEmptyBag={() => showRewardToast('🎒 Tap shops & fruits to collect items!')}
          />
        )}

      {rewardToast && (
        <div className="reward-toast" role="status" aria-live="polite">
          {rewardToast}
        </div>
      )}

      {activeView === 'map' && minimapOpen && (
        <CityMinimapModal
          onSelectLocation={(entry) => {
            setTeleportRequest((prev) => ({
              x: entry.x,
              z: entry.z,
              yaw: entry.yaw,
              seq: (prev?.seq ?? 0) + 1,
            }));
            setMinimapOpen(false);
          }}
          onEnterPizzeria={handleEnterPizzeria}
          onEnterPharmacy={handleEnterPharmacy}
          onClose={() => setMinimapOpen(false)}
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
          onCompleteGame={(gameKey, reviewedConceptIds) => {
            const nowIso = new Date().toISOString();
            updateProfile((prev) => {
              let next = updateDailyStreak(awardCoins(recordStreetDiscovery(prev, gameKey), 10));
              if (reviewedConceptIds && reviewedConceptIds.length > 0) {
                next = applySrsReviewOutcome(next, reviewedConceptIds, nowIso);
              }
              return next;
            });
            showRewardToast('🏆 Mini-game complete! +10 🪙');
          }}
          onOpenDialogues={() => {
            stopVoice();
            setActiveView('map');
            setTravelDialogueOpen(true);
          }}
          onClose={() => {
            stopVoice();
            setActiveView('map');
          }}
        />
      )}

      {activeView !== 'map' && activeView !== 'badges' && (
        <div className="interior-top-actions">
          <button
            type="button"
            className="back-street-btn"
            aria-label="Back to street"
            onClick={() => {
              setTravelDialogueOpen(false);
              handleSelectView('map');
            }}
          >
            ← Street
          </button>
        </div>
      )}

      {travelDialogueOpen && (
        <TravelDialogueModal
          completedDiscoveries={profile.streetDiscoveries ?? []}
          onPlayAudio={(key) => {
            stopVoice();
            audioPlayer.play(key);
          }}
          onComplete={(scenarioId) => {
            updateProfile((prev) =>
              updateDailyStreak(
                awardCoins(recordStreetDiscovery(prev, `world_dialogue_${scenarioId}`), 15),
              ),
            );
            showRewardToast(`🎉 ${scenarioId.toUpperCase()} mastered! +15 🪙`);
          }}
          onClose={() => setTravelDialogueOpen(false)}
        />
      )}

      {wardrobeOpen && (
        <AvatarCustomizerModal
          profile={profile}
          onSelectItem={(item) => {
            const result = purchaseOrEquipStyle(profileRef.current, item.id);
            if (!result.insufficientCoins) {
              profileRef.current = result.profile;
              setProfile(result.profile);
              if (result.purchased) {
                playRewardFanfare();
                showRewardToast(`✨ New style: ${item.label}!`);
              } else {
                playSuccessChime();
              }
            }
            return {
              purchased: result.purchased,
              insufficientCoins: result.insufficientCoins,
            };
          }}
          onClose={() => setWardrobeOpen(false)}
        />
      )}

      {!isDevMode && subtitleVisible && audioStatus.phrase && !activeCuriosityId && (
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

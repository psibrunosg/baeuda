import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import {
  claimDailyChest,
  DAILY_CHEST_REWARD_COINS,
  recordDailyQuestProgress,
} from './domain/dailyQuests';
import { evaluateCefrProgress } from './domain/cefrEngine';
import {
  DIALOGUE_CONCEPTS,
  INTERIOR_CONCEPTS,
  PRACTICE_UNIT_CONCEPTS,
  STORY_CONCEPTS,
} from './domain/curriculumMap';
import { getActiveQuest } from './domain/inventoryAndQuests';
import {
  addInventoryItem,
  applyCafeCycleOutcome,
  applyLesson2Outcome,
  applyLesson3Outcome,
  completeQuestInProfile,
  createInitialProfile,
  recordPedagogicalEvidence,
  recordStreetDiscovery,
} from './domain/learnerMemory';
import { computeNextBestStep } from './domain/nextBestStep';
import type { DialogueScenarioId } from './domain/travelDialogues';
import { resolveWorldAtmosphere, type GuidanceContext } from './domain/immersion';
import type {
  CafeCycleId,
  ConceptId,
  LearnerProfile,
  NextStepRecommendation,
  PropName,
  SpeechKey,
  WorldMapId,
} from './domain/types';
import { ACTIVE_WORLD_MAPS, WORLD_MAP_REGISTRY, type AvatarPose } from './scene/worldNavigation';
import { createAudioPlayer, type AudioStatus } from './services/audioPlayer';
import { playPourTick, playRewardFanfare, playShopBell, playSuccessChime } from './services/soundEngine';
import { loadProfile, resetProfile, saveProfile } from './services/learnerStorage';
import { startVoiceCapture, type VoiceCaptureHandle } from './services/voiceCapture';
import type { AssetMode } from './scene/contracts';
import { ExperienceCanvas, type ActiveView, type CameraMode } from './scene/ExperienceCanvas';
import type { MarketStage } from './scene/MarketScene';
import type { PlazaStage } from './scene/PlazaScene';
import { CuriosityModal } from './ui/CuriosityModal';
import { DebugAudioBar } from './ui/DebugAudioBar';
import { GuidancePill } from './ui/GuidancePill';
import { InventoryQuestBar } from './ui/InventoryQuestBar';
import { LessonHud } from './ui/LessonHud';
import { TopNav } from './ui/TopNav';

const AvatarCustomizerModal = lazy(() =>
  import('./ui/AvatarCustomizerModal').then((m) => ({ default: m.AvatarCustomizerModal })),
);
const BadgesHub = lazy(() =>
  import('./ui/BadgesHub').then((m) => ({ default: m.BadgesHub })),
);
const CityMinimapModal = lazy(() =>
  import('./ui/CityMinimapModal').then((m) => ({ default: m.CityMinimapModal })),
);
const TravelDialogueModal = lazy(() =>
  import('./ui/TravelDialogueModal').then((m) => ({ default: m.TravelDialogueModal })),
);
const LessonPracticeModal = lazy(() =>
  import('./ui/LessonPracticeModal').then((m) => ({ default: m.LessonPracticeModal })),
);
const DailyQuestsModal = lazy(() =>
  import('./ui/DailyQuestsModal').then((m) => ({ default: m.DailyQuestsModal })),
);
const CityStoriesModal = lazy(() =>
  import('./ui/CityStoriesModal').then((m) => ({ default: m.CityStoriesModal })),
);

const POUR_DURATION_SEC = 1.4;
const HESITATION_MS = 5000;

export default function App() {
  const [profile, setProfile] = useState<LearnerProfile>(() => loadProfile());
  const [lesson, setLesson] = useState(() => createLesson1State());
  const [activeView, setActiveView] = useState<ActiveView>('map');
  const [currentMapId, setCurrentMapId] = useState<WorldMapId>(() => {
    const saved = profile.currentMapId;
    return saved && ACTIVE_WORLD_MAPS.includes(saved) ? saved : 'town';
  });
  const [cameraSnapSeq, setCameraSnapSeq] = useState(0);
  const [mapFading, setMapFading] = useState(false);
  const mapFadeTimerRef = useRef<number | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>('fixed_2_5d');
  const [minimapOpen, setMinimapOpen] = useState(false);
  const [travelDialogueOpen, setTravelDialogueOpen] = useState(false);
  const [activeDialogueScenarioId, setActiveDialogueScenarioId] = useState<DialogueScenarioId>('cafe');
  const [wardrobeOpen, setWardrobeOpen] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [questsOpen, setQuestsOpen] = useState(false);
  const [storiesOpen, setStoriesOpen] = useState(false);
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
      prev.dailyStreak === profile.dailyStreak &&
      prev.mistakeExerciseIds === profile.mistakeExerciseIds &&
      prev.completedPracticeUnitIds === profile.completedPracticeUnitIds &&
      prev.completedStoryIds === profile.completedStoryIds &&
      prev.completedDialogueIds === profile.completedDialogueIds &&
      prev.completedInteriors === profile.completedInteriors &&
      prev.completedMilestoneIds === profile.completedMilestoneIds &&
      prev.recentSessionBuckets === profile.recentSessionBuckets &&
      prev.dailyQuests === profile.dailyQuests;

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
      if (storiesOpen) {
        setStoriesOpen(false);
      } else if (questsOpen) {
        setQuestsOpen(false);
      } else if (practiceOpen) {
        setPracticeOpen(false);
      } else if (wardrobeOpen) {
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
  }, [activeCuriosityId, activeView, audioPlayer, minimapOpen, practiceOpen, questsOpen, stopVoice, storiesOpen, travelDialogueOpen, wardrobeOpen]);

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
    let lastPourSfxAt = 0;

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
        if (now - lastPourSfxAt >= 135) {
          lastPourSfxAt = now;
          playPourTick(next);
        }
        if (next >= 1) {
          isPouringRef.current = false;
          playSuccessChime();
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
    playShopBell();

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
      const nowIso = new Date().toISOString();
      updateProfile((prev) =>
        updateDailyStreak(
          awardCoins(
            recordPedagogicalEvidence(
              applyCafeCycleOutcome(prev, cycleId, concepts, nowIso),
              {
                mode: 'interior_3d',
                contextId: cycleId,
                concepts,
                interiorId: 'cafe',
                completedMilestoneId:
                  cycleId === 'cafe_pre_a1_shift' ? 'pre_a1_graduation_shift' : undefined,
                bucket: 'spiral',
                nowIso,
              },
            ),
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
    const nowIso = new Date().toISOString();
    updateProfile((prev) =>
      updateDailyStreak(
        awardCoins(
          recordPedagogicalEvidence(applyLesson2Outcome(prev, nowIso), {
            mode: 'interior_3d',
            contextId: 'lesson2_market',
            concepts: INTERIOR_CONCEPTS.market,
            interiorId: 'market',
            completedActivityId: 'lesson2_market',
            bucket: 'spiral',
            nowIso,
          }),
          20,
        ),
      ),
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
    const nowIso = new Date().toISOString();
    updateProfile((prev) =>
      updateDailyStreak(
        awardCoins(
          recordPedagogicalEvidence(applyLesson3Outcome(prev, nowIso), {
            mode: 'interior_3d',
            contextId: 'lesson3_plaza',
            concepts: INTERIOR_CONCEPTS.plaza,
            interiorId: 'plaza',
            completedActivityId: 'lesson3_plaza',
            bucket: 'spiral',
            nowIso,
          }),
          20,
        ),
      ),
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
        world_barber_scissors: { id: 'scissors', toast: '🎒 +1 ✂️ Barber scissors in backpack!' },
        world_post_package: { id: 'package', toast: '🎒 +1 📦 Package in backpack!' },
        bakery_done: { id: 'bread', toast: '🎒 +1 🥖 Warm bread in backpack!' },
        school_done: { id: 'notebook', toast: '🎒 +1 📓 School notebook in backpack!' },
        family_done: { id: 'cookie', toast: '🎒 +1 🍪 Cookie from Grandma in backpack!' },
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
    playShopBell();
    setMinimapOpen(false);
    setActiveCuriosityId(null);
    setActiveView('pizzeria');
  }, [audioPlayer, resetPourState, stopVoice]);

  const handleCompletePizzeria = useCallback(() => {
    const nowIso = new Date().toISOString();
    updateProfile((prev) =>
      addInventoryItem(
        updateDailyStreak(
          awardCoins(
            recordPedagogicalEvidence(prev, {
              mode: 'interior_3d',
              contextId: 'pizzeria_kitchen',
              concepts: INTERIOR_CONCEPTS.pizzeria,
              interiorId: 'pizzeria',
              completedActivityId: 'interior_pizzeria',
              bucket: 'spiral',
              nowIso,
            }),
            20,
          ),
        ),
        'pizza',
      ),
    );
    showRewardToast('🍕 Hot pizza made & added to backpack! +20 coins earned!');
    setActiveView('map');
  }, [showRewardToast, updateProfile]);

  const handleEnterPharmacy = useCallback(() => {
    audioPlayer.stop();
    stopVoice();
    resetPourState();
    playShopBell();
    setMinimapOpen(false);
    setActiveCuriosityId(null);
    setActiveView('pharmacy');
  }, [audioPlayer, resetPourState, stopVoice]);

  const handleCompletePharmacy = useCallback(() => {
    const nowIso = new Date().toISOString();
    updateProfile((prev) =>
      addInventoryItem(
        updateDailyStreak(
          awardCoins(
            recordPedagogicalEvidence(prev, {
              mode: 'interior_3d',
              contextId: 'pharmacy_counter',
              concepts: INTERIOR_CONCEPTS.pharmacy,
              interiorId: 'pharmacy',
              completedActivityId: 'interior_pharmacy',
              bucket: 'spiral',
              nowIso,
            }),
            20,
          ),
        ),
        'medicine',
      ),
    );
    showRewardToast('💊 Patient cared for & medicine packed! +20 coins earned!');
    setActiveView('map');
  }, [showRewardToast, updateProfile]);

  const handleTriggerNextStep = useCallback(
    (recommendation: NextStepRecommendation) => {
      audioPlayer.stop();
      stopVoice();
      resetPourState();
      setMinimapOpen(false);
      setActiveCuriosityId(null);
      setWardrobeOpen(false);
      setQuestsOpen(false);
      setPracticeOpen(false);
      setStoriesOpen(false);
      setTravelDialogueOpen(false);

      const { target } = recommendation;
      if (target.kind === 'enter_interior') {
        if (target.interiorId === 'cafe') {
          if (target.cafeCycleId === 'cafe_c1_drinks') {
            playShopBell();
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
          } else if (target.cafeCycleId) {
            playShopBell();
            const cycle = target.cafeCycleId;
            setActiveCafeCycle(cycle);
            setActiveView('cafe_cycle');
            const introMap: Record<Exclude<CafeCycleId, 'cafe_c1_drinks'>, SpeechKey> = {
              cafe_c2_food: 'cafe_c2_intro',
              cafe_c3_quantity: 'cafe_c3_intro',
              cafe_pre_a1_shift: 'cafe_shift_order_1',
              cafe_a1_spiral: 'cafe_a1_intro',
            };
            audioPlayer.play(introMap[cycle]);
          } else {
            handleEnterCafe();
          }
        } else if (target.interiorId === 'market') {
          handleEnterMarket();
        } else if (target.interiorId === 'plaza') {
          handleEnterPlaza();
        } else if (target.interiorId === 'pizzeria') {
          handleEnterPizzeria();
        } else if (target.interiorId === 'pharmacy') {
          handleEnterPharmacy();
        }
      } else if (target.kind === 'open_practice') {
        setActiveView('map');
        setPracticeOpen(true);
      } else if (target.kind === 'open_srs') {
        setActiveView('badges');
      } else if (target.kind === 'open_story') {
        setActiveView('map');
        setStoriesOpen(true);
      } else if (target.kind === 'open_talk') {
        const validScenarios: readonly DialogueScenarioId[] = [
          'cafe',
          'pharmacy',
          'pizzeria',
          'barber',
          'postbank',
        ];
        if (
          target.scenarioId &&
          (validScenarios as readonly string[]).includes(target.scenarioId)
        ) {
          setActiveDialogueScenarioId(target.scenarioId as DialogueScenarioId);
        }
        setActiveView('map');
        setTravelDialogueOpen(true);
      } else if (target.kind === 'explore_street') {
        setActiveView('map');
        showRewardToast('🧭 Explore the boulevard & tap glowing objects!');
      }
    },
    [
      audioPlayer,
      dispatch,
      handleEnterCafe,
      handleEnterMarket,
      handleEnterPharmacy,
      handleEnterPizzeria,
      handleEnterPlaza,
      resetPourState,
      showRewardToast,
      stopVoice,
    ],
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
  const nextBestStep = useMemo(() => computeNextBestStep(profile), [profile]);
  const activeQuest = getActiveQuest(completedQuestIds);
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
                : activeView === 'map' && currentMapId === 'interior_bakery'
                  ? 'bakery_task'
                : activeView === 'map' && currentMapId === 'school'
                  ? 'school_task'
                : activeView === 'map' && currentMapId === 'interior_house_leo'
                  ? 'home_task'
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

  const handleTravelToMap = useCallback(
    (target: WorldMapId, spawn?: AvatarPose) => {
      if (!ACTIVE_WORLD_MAPS.includes(target)) return;
      if (mapFadeTimerRef.current) {
        window.clearTimeout(mapFadeTimerRef.current);
      }
      audioPlayer.stop();
      stopVoice();
      setMinimapOpen(false);
      setMapFading(true);

      const targetConfig = WORLD_MAP_REGISTRY[target];
      const nextSpawn = spawn ?? targetConfig.defaultSpawn;

      mapFadeTimerRef.current = window.setTimeout(() => {
        setCurrentMapId(target);
        setActiveView('map');
        setTeleportRequest((prev) => ({
          x: nextSpawn.x,
          z: nextSpawn.z,
          yaw: nextSpawn.yaw,
          seq: (prev?.seq ?? 0) + 1,
        }));
        setCameraSnapSeq((s) => s + 1);
        updateProfile((prev) => {
          const visited = prev.visitedMapIds ?? ['town'];
          const nextVisited = visited.includes(target) ? visited : [...visited, target];
          return {
            ...prev,
            currentMapId: target,
            visitedMapIds: nextVisited,
          };
        });

        mapFadeTimerRef.current = window.setTimeout(() => {
          setMapFading(false);
          mapFadeTimerRef.current = null;
        }, 160);
      }, 150);
    },
    [audioPlayer, stopVoice, updateProfile],
  );

  useEffect(() => {
    return () => {
      if (mapFadeTimerRef.current) window.clearTimeout(mapFadeTimerRef.current);
    };
  }, []);

  return (
    <main className="app-shell">
      <ExperienceCanvas
        onExitInterior={() => handleSelectView('map')}
        activeView={activeView}
        currentMapId={currentMapId}
        cameraSnapSeq={cameraSnapSeq}
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
        activeQuestPosition={activeQuest?.npcPosition ?? null}
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
        onTravelToMap={handleTravelToMap}
        onOpenWardrobe={() => {
          stopVoice();
          setWardrobeOpen(true);
        }}
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
          setCameraMode((prev) => (prev === 'fixed_2_5d' ? 'overview' : 'fixed_2_5d'))
        }
      />

      {activeView !== 'badges' &&
        !activeCuriosityId &&
        !wardrobeOpen &&
        !minimapOpen &&
        !travelDialogueOpen &&
        !practiceOpen &&
        !questsOpen &&
        !storiesOpen && (
          <GuidancePill
            context={guidanceContext}
            starCount={starCount}
            cefrBadge={cefrBadge}
            darkSurface={activeView === 'map' && timeOfDay === 'night'}
            nextStep={activeView === 'map' ? nextBestStep : undefined}
            onTriggerNextStep={activeView === 'map' ? handleTriggerNextStep : undefined}
          />
        )}

      {!activeCuriosityId &&
        !wardrobeOpen &&
        !minimapOpen &&
        !travelDialogueOpen &&
        !practiceOpen &&
        !questsOpen &&
        !storiesOpen && (
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
      )}

      {activeView === 'map' && activeCuriosityId && CURIOSITY_CATALOG[activeCuriosityId] && (
        <CuriosityModal
          item={CURIOSITY_CATALOG[activeCuriosityId]}
          onPlayAudio={(key) => {
            stopVoice();
            audioPlayer.play(key);
          }}
          onSolved={(item) => {
            updateProfile((prev) => {
              let next = recordDailyQuestProgress(
                updateDailyStreak(awardCoins(recordStreetDiscovery(prev, item.discoveryKey), 5)),
                'discovery',
              );
              if (item.collectible) {
                const cid = item.collectible.itemId;
                const label = `${item.collectible.icon} ${item.collectible.label}`;
                if (!(next.inventoryIds ?? []).includes(cid)) {
                  showRewardToast(`🎒 +1 ${label} & +5 coins!`);
                  next = addInventoryItem(next, cid);
                } else {
                  showRewardToast('★ +5 coins earned!');
                }
              } else {
                showRewardToast('★ +5 coins earned!');
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
        !travelDialogueOpen &&
        !practiceOpen &&
        !questsOpen &&
        !storiesOpen && (
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
              // npcPosition is a town coordinate; inside another map it can land in a wall.
              if (quest.npcPosition && currentMapId === 'town') {
                setTeleportRequest((prev) => ({
                  x: quest.npcPosition!.x,
                  z: quest.npcPosition!.z,
                  yaw: quest.npcPosition!.yaw,
                  seq: (prev?.seq ?? 0) + 1,
                }));
              }
              updateProfile((prev) =>
                completeQuestInProfile(
                  updateDailyStreak(
                    awardCoins(recordStreetDiscovery(prev, `world_${quest.id}`), 15),
                  ),
                  quest.id,
                  quest.targetItemId,
                ),
              );
              showRewardToast(`🎉 ${quest.npcName} loved the ${quest.targetIcon}! +15 coins`);
            }}
            onInspectEmptyBag={() => showRewardToast('🎒 Tap shops & fruits to collect items!')}
          />
        )}

      {activeView === 'map' && currentMapId !== 'town' && (
        <button
          type="button"
          className="world-map-return-pill"
          onClick={() => handleTravelToMap('town')}
          aria-label="Return to Baeuda Town"
        >
          <span>{WORLD_MAP_REGISTRY[currentMapId].icon} {WORLD_MAP_REGISTRY[currentMapId].label}</span>
          <span className="world-map-return-cta">↩ Town</span>
        </button>
      )}

      {mapFading && <div className="map-transition-curtain" aria-hidden="true" />}

      {rewardToast && (
        <div className="reward-toast" role="status" aria-live="polite">
          {rewardToast}
        </div>
      )}

      <Suspense fallback={null}>
        {activeView === 'map' && minimapOpen && (
          <CityMinimapModal
            currentMapId={currentMapId}
            onTravelToMap={(mapId) => handleTravelToMap(mapId)}
            nextStep={nextBestStep}
            onTriggerNextStep={handleTriggerNextStep}
            onSelectLocation={(entry) => {
              if (currentMapId !== 'town') {
                handleTravelToMap('town', {
                  x: entry.x,
                  y: 0.06,
                  z: entry.z,
                  yaw: entry.yaw,
                });
                return;
              }
              setTeleportRequest((prev) => ({
                x: entry.x,
                z: entry.z,
                yaw: entry.yaw,
                seq: (prev?.seq ?? 0) + 1,
              }));
              setMinimapOpen(false);
            }}
            onOpenPractice={() => {
              audioPlayer.stop();
              stopVoice();
              setMinimapOpen(false);
              setPracticeOpen(true);
            }}
            onOpenQuests={() => {
              audioPlayer.stop();
              stopVoice();
              setMinimapOpen(false);
              setQuestsOpen(true);
            }}
            onOpenStories={() => {
              audioPlayer.stop();
              stopVoice();
              setMinimapOpen(false);
              setStoriesOpen(true);
            }}
            onReplayCafeLesson1={() => {
              audioPlayer.stop();
              stopVoice();
              resetPourState();
              setMinimapOpen(false);
              setActiveView('lesson');
              dispatch({ type: 'ENTER_CAFE' });
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
                let next = recordDailyQuestProgress(
                  updateDailyStreak(awardCoins(recordStreetDiscovery(prev, gameKey), 10)),
                  'practice',
                );
                if (reviewedConceptIds && reviewedConceptIds.length > 0) {
                  next = recordPedagogicalEvidence(next, {
                    mode: 'srs',
                    contextId: gameKey,
                    concepts: reviewedConceptIds,
                    bucket: 'retention',
                    nowIso,
                  });
                }
                return next;
              });
              showRewardToast('🏆 Mini-game complete! +10 coins');
            }}
            onOpenDialogues={() => {
              stopVoice();
              setActiveView('map');
              setTravelDialogueOpen(true);
            }}
            onOpenPractice={() => {
              stopVoice();
              setActiveView('map');
              setPracticeOpen(true);
            }}
            onOpenQuests={() => {
              stopVoice();
              setActiveView('map');
              setQuestsOpen(true);
            }}
            onOpenStories={() => {
              stopVoice();
              setActiveView('map');
              setStoriesOpen(true);
            }}
            onClose={() => {
              stopVoice();
              setActiveView('map');
            }}
          />
        )}

        {travelDialogueOpen && (
          <TravelDialogueModal
            key={activeDialogueScenarioId}
            initialScenarioId={activeDialogueScenarioId}
            completedDiscoveries={profile.streetDiscoveries ?? []}
            onPlayAudio={(key) => {
              stopVoice();
              audioPlayer.play(key);
            }}
            onComplete={(scenarioId) => {
              const nowIso = new Date().toISOString();
              updateProfile((prev) =>
                recordDailyQuestProgress(
                  updateDailyStreak(
                    awardCoins(
                      recordPedagogicalEvidence(
                        recordStreetDiscovery(prev, `world_dialogue_${scenarioId}`),
                        {
                          mode: 'talk',
                          contextId: `talk_${scenarioId}`,
                          concepts: DIALOGUE_CONCEPTS[scenarioId] ?? [],
                          producedOutput: true,
                          completedDialogueId: scenarioId,
                          bucket: 'application',
                          nowIso,
                        },
                      ),
                      15,
                    ),
                  ),
                  'story_or_dialogue',
                ),
              );
              showRewardToast(`🎉 ${scenarioId.toUpperCase()} mastered! +15 coins`);
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

        {practiceOpen && (
          <LessonPracticeModal
            completedUnitIds={profile.completedPracticeUnitIds ?? []}
            mistakeExerciseIds={profile.mistakeExerciseIds ?? []}
            onCompleteSession={(payload) => {
              const nowIso = new Date().toISOString();
              updateProfile((prev) => {
                const prevMistakes = prev.mistakeExerciseIds ?? [];
                const clearedSet = new Set(payload.clearedMistakeIds);
                const mergedMistakes = Array.from(
                  new Set([
                    ...prevMistakes.filter((id) => !clearedSet.has(id)),
                    ...payload.newMistakeIds,
                  ]),
                );
                const isMistakesSession = payload.unitId === null;
                const concepts = payload.unitId
                  ? (PRACTICE_UNIT_CONCEPTS[payload.unitId] ?? [])
                  : [];
                let next = recordDailyQuestProgress(
                  updateDailyStreak(awardCoins(prev, payload.coinsEarned)),
                  'practice',
                );
                if (payload.unitId) {
                  next = recordStreetDiscovery(next, `world_practice_${payload.unitId}`);
                }
                next = recordPedagogicalEvidence(next, {
                  mode: 'practice',
                  contextId: isMistakesSession
                    ? 'practice_mistakes_lab'
                    : `practice_${payload.unitId}`,
                  concepts,
                  succeeded: true,
                  neededHint: payload.newMistakeIds.length > 0,
                  producedOutput: true,
                  completedActivityId: payload.unitId ?? undefined,
                  bucket: isMistakesSession ? 'retention' : 'spiral',
                  nowIso,
                });
                return {
                  ...next,
                  mistakeExerciseIds: mergedMistakes,
                };
              });
              showRewardToast(`⚡ Practice complete (${payload.accuracy}%)! +${payload.coinsEarned} coins`);
            }}
            onClose={() => setPracticeOpen(false)}
          />
        )}

        {questsOpen && (
          <DailyQuestsModal
            profile={profile}
            onClaimChest={() => {
              const res = claimDailyChest(profileRef.current);
              if (res.claimed) {
                playRewardFanfare();
                profileRef.current = res.profile;
                setProfile(res.profile);
                showRewardToast(`🎁 Daily Chest opened! +${DAILY_CHEST_REWARD_COINS} coins!`);
              }
            }}
            onOpenPractice={() => {
              setQuestsOpen(false);
              setPracticeOpen(true);
            }}
            onOpenStories={() => {
              setQuestsOpen(false);
              setStoriesOpen(true);
            }}
            onClose={() => setQuestsOpen(false)}
          />
        )}

        {storiesOpen && (
          <CityStoriesModal
            completedStoryIds={profile.completedStoryIds ?? []}
            onCompleteStory={(story) => {
              const nowIso = new Date().toISOString();
              updateProfile((prev) =>
                recordDailyQuestProgress(
                  updateDailyStreak(
                    awardCoins(
                      recordPedagogicalEvidence(
                        recordStreetDiscovery(prev, `world_${story.id}`),
                        {
                          mode: 'story',
                          contextId: story.id,
                          concepts: STORY_CONCEPTS[story.id] ?? [],
                          completedActivityId: story.id,
                          bucket: 'application',
                          nowIso,
                        },
                      ),
                      story.rewardCoins,
                    ),
                  ),
                  'story_or_dialogue',
                ),
              );
              showRewardToast(`📖 "${story.title}" finished! +${story.rewardCoins} coins`);
            }}
            onClose={() => setStoriesOpen(false)}
          />
        )}
      </Suspense>

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

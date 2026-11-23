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
import { createInitialProfile, promoteConceptToVoice } from './domain/learnerMemory';
import type { ConceptId, LearnerProfile, PropName, SpeechKey } from './domain/types';
import { createAudioPlayer, type AudioStatus } from './services/audioPlayer';
import { loadProfile, resetProfile, saveProfile } from './services/learnerStorage';
import { startVoiceCapture, type VoiceCaptureHandle } from './services/voiceCapture';
import type { AssetMode } from './scene/contracts';
import { ExperienceCanvas, type ActiveView } from './scene/ExperienceCanvas';
import { DebugAudioBar } from './ui/DebugAudioBar';
import { LessonHud } from './ui/LessonHud';
import { SensoryCard } from './ui/SensoryCard';
import { TopNav } from './ui/TopNav';

const POUR_DURATION_SEC = 1.4;
const HESITATION_MS = 5000;

export default function App() {
  const [profile, setProfile] = useState<LearnerProfile>(() => loadProfile());
  const [lesson, setLesson] = useState(() => createLesson1State());
  const [activeView, setActiveView] = useState<ActiveView>('map');
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
    if (persistedProfileRef.current === profile) {
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
          setActiveView('constellation');
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

  const handleQuickEcho = useCallback(
    (conceptId: ConceptId) =>
      beginVoiceCapture(() => {
        const nowIso = new Date().toISOString();
        setProfile((prev) => promoteConceptToVoice(prev, conceptId, nowIso));
        audioPlayer.play(CONCEPT_AUDIO_KEY[conceptId]);
      }),
    [audioPlayer, beginVoiceCapture],
  );

  const handleExploreObject = useCallback(
    (key: SpeechKey) => {
      audioPlayer.play(key);
    },
    [audioPlayer],
  );

  const handleSelectConcept = useCallback(
    (id: ConceptId) => {
      stopVoice();
      setSelectedConcept(id);
      audioPlayer.play(CONCEPT_AUDIO_KEY[id]);
    },
    [audioPlayer, stopVoice],
  );

  const handleSelectView = useCallback(
    (view: 'map' | 'constellation') => {
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
  const selectedNode = selectedConcept ? (profile.constellation[selectedConcept] ?? null) : null;

  return (
    <main className="app-shell">
      <ExperienceCanvas
        activeView={activeView}
        assetMode={assetMode}
        cameraAnchor={lesson.cameraAnchor}
        cafeStatus={profile.locations.cafe}
        locations={profile.locations}
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
        onEnterCafe={handleEnterCafe}
        onExploreObject={handleExploreObject}
        onPropTap={handlePropTap}
        onPourStart={handlePourStart}
        onPourEnd={handlePourEnd}
        onSelectConcept={handleSelectConcept}
      />

      <TopNav
        activeView={activeView}
        starCount={starCount}
        immersionSeconds={profile.immersionSeconds}
        onSelectView={handleSelectView}
      />

      <LessonHud
        activeView={activeView}
        phase={lesson.phase}
        awaitingInput={lesson.awaitingInput}
        pourProgress={pourProgressUi}
        isListening={isListening}
        voiceLevel={voiceLevel}
        onStartCafe={handleEnterCafe}
        onRequestHelp={() => {
          stopVoice();
          dispatch({ type: 'HELP_REQUESTED' });
        }}
        onStartMic={handleStartMic}
        onSilentWave={handleSilentWave}
        onHoldPourStart={handlePourStart}
        onHoldPourEnd={handlePourEnd}
      />

      {activeView === 'constellation' && (
        <SensoryCard
          node={selectedNode}
          isListening={isListening}
          onReplayAudio={(id) => {
            stopVoice();
            audioPlayer.play(CONCEPT_AUDIO_KEY[id]);
          }}
          onSelectConcept={(id) => {
            stopVoice();
            setSelectedConcept(id);
          }}
          onGoToCafe={handleEnterCafe}
          onQuickEcho={handleQuickEcho}
          onClose={() => {
            stopVoice();
            setSelectedConcept(null);
          }}
        />
      )}

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
          } else if (activeView === 'constellation' && selectedConcept) {
            stopVoice();
            const nowIso = new Date().toISOString();
            setProfile((prev) => promoteConceptToVoice(prev, selectedConcept, nowIso));
          }
        }}
        onResetProfile={handleReset}
      />
    </main>
  );
}

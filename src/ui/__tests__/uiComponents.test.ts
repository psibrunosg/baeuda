import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { CURIOSITY_CATALOG } from '../../domain/curiosityCatalog';
import { applySrsReviewOutcome, createInitialProfile } from '../../domain/learnerMemory';
import { AvatarCustomizerModal } from '../AvatarCustomizerModal';
import { BadgesHub } from '../BadgesHub';
import { CuriosityModal } from '../CuriosityModal';
import { DebugAudioBar } from '../DebugAudioBar';
import { GuidancePill } from '../GuidancePill';
import { LessonHud } from '../LessonHud';
import { TopNav } from '../TopNav';
import { TravelDialogueModal } from '../TravelDialogueModal';

vi.mock('../../scene/ExperienceCanvas', () => ({
  ExperienceCanvas: () => null,
}));

import App from '../../App';

const FORBIDDEN_PORTUGUESE_PATTERN =
  /\b(café|xícara|[aá]gua|quente|frio|fria|despejar|ajuda|ol[aá]|oi|obrigado|obrigada|constela[cç][aã]o|mapa|falar|continuar|fechar)\b/i;

function visibleText(markup: string): string {
  return markup.replace(/<[^>]+>/g, '');
}

describe('TopNav', () => {
  it('formats immersionSeconds as MM:SS and shows star badge only when starCount > 0', () => {
    const emptyMarkup = renderToStaticMarkup(
      createElement(TopNav, {
        activeView: 'map',
        starCount: 0,
        immersionSeconds: 65,
        onSelectView: vi.fn(),
      }),
    );

    expect(emptyMarkup).toContain('01:05');
    expect(emptyMarkup).not.toContain('star-badge');
    expect(visibleText(emptyMarkup)).not.toMatch(/[a-zA-ZÀ-ÿ]/);
    expect(emptyMarkup).not.toMatch(FORBIDDEN_PORTUGUESE_PATTERN);

    const litMarkup = renderToStaticMarkup(
      createElement(TopNav, {
        activeView: 'badges',
        starCount: 6,
        immersionSeconds: 600,
        onSelectView: vi.fn(),
      }),
    );

    expect(litMarkup).toContain('10:00');
    expect(litMarkup).toContain('<span class="star-badge">6</span>');
    expect(litMarkup).toMatch(/class="active"[^>]*aria-label="Badges"/);
    expect(visibleText(litMarkup)).not.toMatch(/[a-zA-ZÀ-ÿ]/);
    expect(litMarkup).not.toMatch(FORBIDDEN_PORTUGUESE_PATTERN);
  });

  it('marks Map button active during both map and lesson views', () => {
    const lessonMarkup = renderToStaticMarkup(
      createElement(TopNav, {
        activeView: 'lesson',
        starCount: 0,
        immersionSeconds: 12,
        onSelectView: vi.fn(),
      }),
    );

    expect(lessonMarkup).toMatch(/class="active"[^>]*aria-label="Map"/);
  });
});

describe('LessonHud', () => {
  const baseProps = {
    pourProgress: 0,
    isListening: false,
    voiceLevel: 0,
    onStartCafe: vi.fn(),
    onRequestHelp: vi.fn(),
    onStartMic: vi.fn(),
    onSilentWave: vi.fn(),
    onHoldPourStart: vi.fn(),
    onHoldPourEnd: vi.fn(),
  };

  it('renders only the play icon on the map view and nothing on constellation view', () => {
    const mapMarkup = renderToStaticMarkup(
      createElement(LessonHud, {
        activeView: 'map',
        phase: 'map_arrival',
        awaitingInput: false,
        ...baseProps,
      }),
    );
    expect(mapMarkup).toContain('aria-label="Enter"');
    expect(mapMarkup).toContain('▶');
    expect(mapMarkup).not.toContain('aria-label="Help"');
    expect(visibleText(mapMarkup)).not.toMatch(/[a-zA-ZÀ-ÿ]/);
    expect(mapMarkup).not.toMatch(FORBIDDEN_PORTUGUESE_PATTERN);

    const badgesMarkup = renderToStaticMarkup(
      createElement(LessonHud, {
        activeView: 'badges',
        phase: 'farewell_constellation',
        awaitingInput: false,
        ...baseProps,
      }),
    );
    expect(badgesMarkup).toBe('');
  });

  it('renders hold-to-pour conic ring and help button during action_pour awaitingInput', () => {
    const markup = renderToStaticMarkup(
      createElement(LessonHud, {
        activeView: 'lesson',
        phase: 'action_pour',
        awaitingInput: true,
        ...baseProps,
        pourProgress: 0.5,
      }),
    );

    expect(markup).toContain('aria-label="Pour"');
    expect(markup).toContain('180deg');
    expect(markup).toContain('<svg');
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).not.toContain('🫗');
    expect(markup).toContain('aria-label="Help"');
    expect(visibleText(markup)).not.toMatch(/[a-zA-ZÀ-ÿ]/);
    expect(markup).not.toMatch(FORBIDDEN_PORTUGUESE_PATTERN);
  });

  it('renders mic and silent wave buttons during micro_echo awaitingInput', () => {
    const markup = renderToStaticMarkup(
      createElement(LessonHud, {
        activeView: 'lesson',
        phase: 'micro_echo',
        awaitingInput: true,
        ...baseProps,
        isListening: true,
        voiceLevel: 0.4,
      }),
    );

    expect(markup).toContain('aria-label="Speak"');
    expect(markup).toContain('scale(1.1)');
    expect(markup).toContain('aria-label="Continue"');
    expect(markup).toContain('👋');
    expect(markup).toContain('aria-label="Help"');
    expect(visibleText(markup)).not.toMatch(/[a-zA-ZÀ-ÿ]/);
    expect(markup).not.toMatch(FORBIDDEN_PORTUGUESE_PATTERN);
  });

  it('hides action and help buttons when awaitingInput is false', () => {
    const markup = renderToStaticMarkup(
      createElement(LessonHud, {
        activeView: 'lesson',
        phase: 'counter_intro',
        awaitingInput: false,
        ...baseProps,
      }),
    );

    expect(markup).toBe('');
  });
});

describe('Active Modals & SRS Hub', () => {
  it('renders BadgesHub, CuriosityModal, TravelDialogueModal, and AvatarCustomizerModal cleanly', () => {
    const profile = createInitialProfile();
    const badgesMarkup = renderToStaticMarkup(
      createElement(BadgesHub, {
        profile,
        cefrBadge: 'Pre-A1 · 0/4',
        onPlayAudio: vi.fn(),
        onCompleteGame: vi.fn(),
        onClose: vi.fn(),
      }),
    );
    expect(badgesMarkup).toContain('role="dialog"');
    expect(badgesMarkup).toContain('Badges and Learning Games');

    const curiosityMarkup = renderToStaticMarkup(
      createElement(CuriosityModal, {
        item: CURIOSITY_CATALOG.fruit_apple,
        onPlayAudio: vi.fn(),
        onSolved: vi.fn(),
        onClose: vi.fn(),
      }),
    );
    expect(curiosityMarkup).toContain('role="dialog"');
    expect(curiosityMarkup).toContain('aria-label="Check answer"');

    const dialogueMarkup = renderToStaticMarkup(
      createElement(TravelDialogueModal, {
        onComplete: vi.fn(),
        onClose: vi.fn(),
      }),
    );
    expect(dialogueMarkup).toContain('Travel City Conversations');
    expect(dialogueMarkup).toContain('Where is the train station?');

    const wardrobeMarkup = renderToStaticMarkup(
      createElement(AvatarCustomizerModal, {
        profile,
        onSelectItem: vi.fn(() => ({ purchased: false, insufficientCoins: false })),
        onClose: vi.fn(),
      }),
    );
    expect(wardrobeMarkup).toContain('class="badges-hub-backdrop"');
    expect(wardrobeMarkup).toContain('Avatar Wardrobe');
  });

  it('updates constellation lastContactAt and clears neededHint on SRS review completion', () => {
    const base = createInitialProfile();
    base.constellation.coffee = {
      id: 'coffee',
      stage: 'seed',
      originLocation: 'cafe',
      neededHint: true,
      lastContactAt: '2026-01-01T00:00:00.000Z',
    };
    const updated = applySrsReviewOutcome(base, ['coffee'], '2026-11-23T18:00:00.000Z');
    expect(updated.constellation.coffee?.stage).toBe('root');
    expect(updated.constellation.coffee?.neededHint).toBe(false);
    expect(updated.constellation.coffee?.lastContactAt).toBe('2026-11-23T18:00:00.000Z');
  });
});

describe('DebugAudioBar', () => {
  const debugHandlers = {
    onToggleAssetMode: vi.fn(),
    onJumpPhase: vi.fn(),
    onSimulateVoice: vi.fn(),
    onResetProfile: vi.fn(),
  };

  it('renders fallback English caption pill when audio mode is fallback', () => {
    const markup = renderToStaticMarkup(
      createElement(DebugAudioBar, {
        audioStatus: {
          mode: 'fallback',
          key: 'demo_cup',
          src: '/audio/lesson1/demo_cup.mp3',
          phrase: 'Cup.',
          isPlaying: true,
        },
        phase: 'counter_intro',
        assetMode: 'greybox',
        ...debugHandlers,
      }),
    );

    expect(markup).toContain('DEV · counter_intro');
    expect(markup).toContain('Cup.');
    expect(markup).toContain('fallback (missing /audio/lesson1/demo_cup.mp3)');
  });

  it('hides fallback caption pill when audio mode is idle or audio', () => {
    const idleMarkup = renderToStaticMarkup(
      createElement(DebugAudioBar, {
        audioStatus: {
          mode: 'idle',
          key: null,
          src: null,
          phrase: null,
          isPlaying: false,
        },
        phase: 'map_arrival',
        assetMode: 'greybox',
        ...debugHandlers,
      }),
    );

    expect(idleMarkup).toContain('DEV · map_arrival');
    expect(idleMarkup).not.toContain('dev-caption-pill');
  });
});

describe('GuidancePill', () => {
  it('renders progressive immersion stages from onboarding PT -> blended PT+EN -> immersive EN', () => {
    const onboarding = renderToStaticMarkup(
      createElement(GuidancePill, { context: 'cafe_pour', starCount: 0 }),
    );
    expect(onboarding).toContain('data-immersion-tier="onboarding"');
    expect(onboarding).toContain('Segure o botão ou a jarra para servir');
    expect(onboarding.match(/guidance-dot lit/g)).toHaveLength(1);

    const blended = renderToStaticMarkup(
      createElement(GuidancePill, { context: 'cafe_pour', starCount: 6 }),
    );
    expect(blended).toContain('data-immersion-tier="blended"');
    expect(blended).toContain('<strong class="guidance-keyword">pour</strong>');
    expect(blended.match(/guidance-dot lit/g)).toHaveLength(2);

    const immersive = renderToStaticMarkup(
      createElement(GuidancePill, { context: 'cafe_pour', starCount: 15 }),
    );
    expect(immersive).toContain('data-immersion-tier="immersive"');
    expect(immersive).toContain('Hold to ');
    expect(immersive).toContain('<strong class="guidance-keyword">pour</strong>');
    expect(immersive.match(/guidance-dot lit/g)).toHaveLength(3);
  });
});

describe('App', () => {
  it('renders the initial map shell cleanly without DEV chrome by default', () => {
    const markup = renderToStaticMarkup(createElement(App));

    expect(markup).toContain('class="app-shell"');
    expect(markup).toContain('00:00');
    expect(markup).toContain('aria-label="Enter"');
    expect(markup).not.toContain('DEV · map_arrival');
    expect(markup).toContain('data-immersion-tier="onboarding"');
  });
});

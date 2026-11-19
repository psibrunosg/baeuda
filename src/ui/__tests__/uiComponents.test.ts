import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ConceptNode } from '../../domain/types';
import { DebugAudioBar } from '../DebugAudioBar';
import { LessonHud } from '../LessonHud';
import { SensoryCard } from '../SensoryCard';
import { TopNav } from '../TopNav';

vi.mock('../../scene/ExperienceCanvas', () => ({
  ExperienceCanvas: () => null,
}));

import App from '../../App';

const FORBIDDEN_PORTUGUESE_PATTERN =
  /\b(café|xícara|[aá]gua|quente|frio|fria|despejar|ajuda|ol[aá]|oi|obrigado|obrigada|constela[cç][aã]o|mapa|falar|continuar|fechar)\b/i;

function visibleText(markup: string): string {
  return markup.replace(/<[^>]+>/g, '');
}

function makeNode(
  id: ConceptNode['id'],
  stage: ConceptNode['stage'] = 'root',
): ConceptNode {
  return {
    id,
    stage,
    originLocation: 'cafe',
    neededHint: stage === 'seed',
    lastContactAt: '2026-11-19T14:00:00.000Z',
  };
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
        activeView: 'constellation',
        starCount: 6,
        immersionSeconds: 600,
        onSelectView: vi.fn(),
      }),
    );

    expect(litMarkup).toContain('10:00');
    expect(litMarkup).toContain('<span class="star-badge">6</span>');
    expect(litMarkup).toMatch(/class="active"[^>]*aria-label="Constellation"/);
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

    const constMarkup = renderToStaticMarkup(
      createElement(LessonHud, {
        activeView: 'constellation',
        phase: 'farewell_constellation',
        awaitingInput: false,
        ...baseProps,
      }),
    );
    expect(constMarkup).toBe('');
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

describe('SensoryCard', () => {
  const handlers = {
    onReplayAudio: vi.fn(),
    onSelectConcept: vi.fn(),
    onGoToCafe: vi.fn(),
    onQuickEcho: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders nothing when node is null', () => {
    const markup = renderToStaticMarkup(
      createElement(SensoryCard, { node: null, isListening: false, ...handlers }),
    );
    expect(markup).toBe('');
  });

  it('renders stage dots and contrast toggle for concepts with a contrast partner', () => {
    const markup = renderToStaticMarkup(
      createElement(SensoryCard, {
        node: makeNode('hot', 'root'),
        isListening: false,
        ...handlers,
      }),
    );

    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('aria-label="hot"');
    expect(markup).toContain('🔥');
    expect(markup).toContain('❄️');
    expect(markup).toContain('aria-label="Contrast"');
    expect(markup.match(/stage-dot lit/g)).toHaveLength(2);
    expect(visibleText(markup)).not.toMatch(/[a-zA-ZÀ-ÿ]/);
    expect(markup).not.toMatch(FORBIDDEN_PORTUGUESE_PATTERN);
  });

  it('omits contrast button for concepts without a contrast partner and reflects seed/voice ranks', () => {
    const seedMarkup = renderToStaticMarkup(
      createElement(SensoryCard, {
        node: makeNode('cup', 'seed'),
        isListening: true,
        ...handlers,
      }),
    );

    expect(seedMarkup).not.toContain('aria-label="Contrast"');
    expect(seedMarkup.match(/stage-dot lit/g)).toHaveLength(1);
    expect(seedMarkup).toContain('#10b981');
    expect(visibleText(seedMarkup)).not.toMatch(/[a-zA-ZÀ-ÿ]/);
    expect(seedMarkup).not.toMatch(FORBIDDEN_PORTUGUESE_PATTERN);

    const voiceMarkup = renderToStaticMarkup(
      createElement(SensoryCard, {
        node: makeNode('coffee', 'voice'),
        isListening: false,
        ...handlers,
      }),
    );
    expect(voiceMarkup.match(/stage-dot lit/g)).toHaveLength(3);

    const pourMarkup = renderToStaticMarkup(
      createElement(SensoryCard, {
        node: makeNode('pour', 'root'),
        isListening: false,
        ...handlers,
      }),
    );
    expect(pourMarkup).toContain('<svg');
    expect(pourMarkup).toContain('aria-hidden="true"');
    expect(pourMarkup).not.toContain('🫗');
    expect(visibleText(pourMarkup)).not.toMatch(/[a-zA-ZÀ-ÿ]/);
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

describe('App', () => {
  it('renders the initial map shell with TopNav, LessonHud play button, and DebugAudioBar', () => {
    const markup = renderToStaticMarkup(createElement(App));

    expect(markup).toContain('class="app-shell"');
    expect(markup).toContain('00:00');
    expect(markup).toContain('aria-label="Enter"');
    expect(markup).toContain('DEV · map_arrival');
    expect(markup).not.toMatch(FORBIDDEN_PORTUGUESE_PATTERN);
  });
});

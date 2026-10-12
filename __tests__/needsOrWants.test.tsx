import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParams } from '../src/navigation/types';
import {
  createNeedsOrWantsRound,
  NEEDS_OR_WANTS_SCENARIOS,
} from '../src/games/needsOrWants/NeedsOrWantsScenarios';
import {
  needsOrWantsReducer,
  newNeedsOrWantsSession,
} from '../src/games/needsOrWants/NeedsOrWantsSession';
import { NeedsOrWantsScreen } from '../src/games/needsOrWants/NeedsOrWantsScreen';
import { NeedsOrWantsResult } from '../src/games/needsOrWants/NeedsOrWantsResult';
import { AppButton } from '../src/components/AppButton';
import { ScreenContainer } from '../src/components/ScreenContainer';
import { GamesScreen } from '../src/screens/GamesScreen';
import { GameGridCard } from '../src/components/GameGridCard';
import { appConfig } from '../src/config/appConfig';
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('../src/components/Icon', () => ({ Icon: () => null }));
const rounds = createNeedsOrWantsRound(() => 0.5);

test('rounds contain five unique situations covering needs and wants without mutating the bank', () => {
  const before = JSON.stringify(NEEDS_OR_WANTS_SCENARIOS);
  for (const value of [0, 0.1, 0.5, 0.999]) {
    const round = createNeedsOrWantsRound(() => value);
    expect(round).toHaveLength(5);
    expect(new Set(round.map(s => s.id)).size).toBe(5);
    expect(round.filter(s => s.classification === 'need')).toHaveLength(3);
    expect(round.filter(s => s.classification === 'want')).toHaveLength(2);
  }
  expect(JSON.stringify(NEEDS_OR_WANTS_SCENARIOS)).toBe(before);
});
test.each(NEEDS_OR_WANTS_SCENARIOS)(
  '$id explains both correct and incorrect classifications',
  scenario => {
    for (const selected of ['need', 'want'] as const) {
      const state = needsOrWantsReducer(newNeedsOrWantsSession([scenario]), {
        type: 'start',
      });
      const answered = needsOrWantsReducer(state, {
        type: 'answer',
        classification: selected,
      });
      expect(answered.answers[0]).toEqual({
        scenario,
        selected,
        correct: selected === scenario.classification,
      });
      expect(answered.phase).toBe('feedback');
      expect(scenario.context.length).toBeGreaterThan(20);
      expect(scenario.explanation.length).toBeGreaterThan(20);
    }
  },
);
test('same-item context changes classification and wants can fit a responsible budget', () => {
  expect(
    NEEDS_OR_WANTS_SCENARIOS.find(s => s.id === 'notebook')!.classification,
  ).toBe('need');
  expect(
    NEEDS_OR_WANTS_SCENARIOS.find(s => s.id === 'notebook-design')!
      .classification,
  ).toBe('want');
  expect(
    NEEDS_OR_WANTS_SCENARIOS.find(s => s.id === 'tea')!.explanation,
  ).toContain('reasonable');
});
test('repeated answers and Continue taps cannot duplicate responses or skip questions; restart clears the round', () => {
  let state = newNeedsOrWantsSession(rounds);
  expect(
    needsOrWantsReducer(state, { type: 'answer', classification: 'need' }),
  ).toBe(state);
  state = needsOrWantsReducer(state, { type: 'start' });
  for (const scenario of rounds) {
    state = needsOrWantsReducer(state, {
      type: 'answer',
      classification: scenario.classification,
    });
    expect(
      needsOrWantsReducer(state, { type: 'answer', classification: 'want' }),
    ).toBe(state);
    state = needsOrWantsReducer(state, { type: 'continue' });
    expect(needsOrWantsReducer(state, { type: 'continue' })).toBe(state);
  }
  expect(state.phase).toBe('completed');
  expect(state.answers).toHaveLength(5);
  expect(state.answers.every(a => a.correct)).toBe(true);
  const restarted = needsOrWantsReducer(state, {
    type: 'restart',
    scenarios: rounds,
  });
  expect(restarted).toMatchObject({ phase: 'intro', index: 0, answers: [] });
});

const defaultFlightEnabled = appConfig.ENABLE_SAVINGS_FLIGHT;
let renderer: ReactTestRenderer | undefined;
const navigation = { navigate: jest.fn(), popTo: jest.fn() };
const props = { navigation } as unknown as NativeStackScreenProps<
  MainStackParams,
  'NeedsOrWants'
>;
async function press(title: string) {
  await act(async () => {
    renderer!.root
      .findAll(
        node =>
          node.props.accessibilityRole === 'button' &&
          typeof node.props.onPress === 'function',
      )
      .find(b => b.props.accessibilityLabel === title)!
      .props.onPress();
  });
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  navigation.navigate.mockReset();
});
afterEach(async () => {
  if (renderer) {
    await act(async () => renderer!.unmount());
    renderer = undefined;
  }
  Object.assign(appConfig, { ENABLE_SAVINGS_FLIGHT: defaultFlightEnabled });
  jest.restoreAllMocks();
});
test('screen supports five answers, feedback, review, replay and exit with no timer', async () => {
  jest.spyOn(Math, 'random').mockReturnValue(0.5);
  await act(async () => {
    renderer = create(<NeedsOrWantsScreen {...props} />);
  });
  await press('Start playing');
  for (let index = 0; index < 5; index++) {
    const label =
      rounds[index].classification === 'need' ? "It's a need" : "It's a want";
    await press(label);
    expect(
      renderer!.root
        .findAll(node => node.props.accessibilityRole === 'button')
        .some(
          b =>
            b.props.accessibilityLabel === "It's a need" ||
            b.props.accessibilityLabel === "It's a want",
        ),
    ).toBe(false);
    await press(index === 4 ? 'See my results' : 'Next question');
  }
  const result = renderer!.root.findByType(NeedsOrWantsResult);
  expect(result.props.answers).toHaveLength(5);
  expect(
    result.props.answers.every((a: { correct: boolean }) => a.correct),
  ).toBe(true);
  expect(JSON.stringify(renderer!.toJSON())).not.toContain(rounds[0].context);
  await press('Review my choices');
  expect(JSON.stringify(renderer!.toJSON())).toContain(rounds[0].context);
  await press('Back to Games');
  expect(navigation.popTo).toHaveBeenCalledWith('Games');
  await press('Play Again');
  expect(
    renderer!.root
      .findAllByType(AppButton)
      .some(button => button.props.title === 'Start playing'),
  ).toBe(false);
  await press("It's a need");
  await press('Start over');
  expect(
    renderer!.root
      .findAllByType(AppButton)
      .some(b => b.props.title === 'Start playing'),
  ).toBe(true);
  expect(
    renderer!.root.findAllByType(AppButton).map(button => button.props.title),
  ).not.toContain('Back to Games');
});

test.each([
  { width: 390, height: 840, fontScale: 1, fixed: true },
  { width: 320, height: 480, fontScale: 1, fixed: false },
  { width: 390, height: 840, fontScale: 1.6, fixed: false },
])(
  'answer cards stay reachable with height $height and text scale $fontScale',
  async ({ width, height, fontScale, fixed }) => {
    jest
      .spyOn(require('react-native'), 'useWindowDimensions')
      .mockReturnValue({ width, height, fontScale, scale: 2 });
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    await act(async () => {
      renderer = create(<NeedsOrWantsScreen {...props} />);
    });
    await press('Start playing');
    expect(!!renderer!.root.findByType(ScreenContainer).props.footer).toBe(
      fixed,
    );
    const buttons = renderer!.root.findAll(
      node =>
        node.props.accessibilityRole === 'button' &&
        typeof node.props.onPress === 'function',
    );
    expect(buttons.map(button => button.props.accessibilityLabel)).toEqual([
      "It's a need",
      "It's a want",
    ]);
    expect(buttons[0].props.accessibilityHint).toContain(
      'Essential for daily life',
    );
    expect(buttons[1].props.accessibilityHint).toContain(
      'An extra for enjoyment',
    );
    const wrong = rounds[0].classification === 'need' ? buttons[1] : buttons[0];
    await act(async () => {
      wrong.props.onPress();
      wrong.props.onPress();
    });
    expect(JSON.stringify(renderer!.toJSON())).toContain(
      'Let’s learn together',
    );
    expect(JSON.stringify(renderer!.toJSON())).toContain(rounds[0].explanation);
    expect(
      renderer!.root.findByProps({ accessibilityLabel: 'Questions answered' })
        .props.accessibilityValue.now,
    ).toBe(1);
    await press('Next question');
    expect(JSON.stringify(renderer!.toJSON())).toContain(rounds[1].context);
    expect(
      renderer!.root.findByProps({ accessibilityLabel: 'Questions answered' })
        .props.accessibilityValue.now,
    ).toBe(1);
  },
);
test('Games exposes Needs or Wants while Savings Flight remains disabled', async () => {
  Object.assign(appConfig, { ENABLE_SAVINGS_FLIGHT: false });
  await act(async () => {
    renderer = create(
      <GamesScreen
        {...(props as unknown as NativeStackScreenProps<
          MainStackParams,
          'Games'
        >)}
      />,
    );
  });
  const titles = [
    ...renderer!.root.findAllByType(GameGridCard).map(card => card.props.label),
    ...renderer!.root
      .findAllByType(AppButton)
      .map(button => button.props.title),
  ];
  expect(titles).toEqual(['Play Needs or Wants', 'Play Budget Challenge']);
  await press('Play Needs or Wants');
  expect(navigation.navigate).toHaveBeenCalledWith('NeedsOrWants');
});

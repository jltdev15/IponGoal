import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParams } from '../src/navigation/types';
import { AppButton } from '../src/components/AppButton';
import { BudgetChallengeScreen } from '../src/games/budgetChallenge/BudgetChallengeScreen';
import { BudgetChallengeResult } from '../src/games/budgetChallenge/BudgetChallengeResult';
import { GameChoiceCard } from '../src/games/GameControls';
import {
  BUDGET_CATEGORIES,
  budgetReducer,
  budgetSummary,
  newBudgetSession,
  budgetFeedback,
} from '../src/games/budgetChallenge/BudgetChallengeSession';
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
function complete(options: number[]) {
  let state = budgetReducer(newBudgetSession(), { type: 'start' });
  for (const optionIndex of options) {
    state = budgetReducer(state, { type: 'answer', optionIndex });
    state = budgetReducer(state, { type: 'continue' });
  }
  return state;
}
test('a planned want fits essentials and savings exactly; skipping it allows more savings', () => {
  const withTreat = budgetSummary(complete([0, 0, 0, 0, 0]).answers);
  expect(withTreat).toMatchObject({
    spending: 24000,
    plannedSavings: 6000,
    affordableSavings: 6000,
    remaining: 0,
    unmetNeeds: [],
    shortfall: 0,
  });
  const noTreat = budgetSummary(complete([0, 0, 0, 1, 1]).answers);
  expect(noTreat).toMatchObject({
    spending: 19000,
    plannedSavings: 11000,
    remaining: 0,
    unmetNeeds: [],
  });
});
test('unfunded needs and overbudget plans are explicit, never create imaginary affordable savings', () => {
  const gaps = budgetSummary(complete([2, 2, 2, 1, 1]).answers);
  expect(gaps.unmetNeeds.map(c => c.id)).toEqual([
    'transport',
    'lunch',
    'materials',
  ]);
  let state = budgetReducer(newBudgetSession(), { type: 'start' });
  state = budgetReducer(state, { type: 'answer', optionIndex: 1 });
  expect(budgetFeedback(state)).toContain('remaining essentials');
  state = complete([1, 1, 1, 2, 0]);
  expect(budgetSummary(state.answers)).toMatchObject({
    spending: 41000,
    plannedSavings: 6000,
    shortfall: 17000,
    affordableSavings: 0,
  });
  expect(budgetFeedback(state)).toContain('planning shortfall');
  expect(budgetSummary(complete([1, 1, 1, 2, 1]).answers).plannedSavings).toBe(
    0,
  );
  expect(
    budgetSummary(complete([0, 0, 0, 2, 0]).answers).affordableSavings,
  ).toBe(3000);
});
test('all 243 plans conserve centavos and separate spending, planned savings, unallocated money and shortfalls', () => {
  for (let value = 0; value < 243; value++) {
    let code = value;
    const options = Array.from({ length: 5 }, () => {
      const choice = code % 3;
      code = Math.floor(code / 3);
      return choice;
    });
    const state = complete(options);
    const s = budgetSummary(state.answers);
    expect(state.phase).toBe('completed');
    expect(state.answers).toHaveLength(5);
    expect(s.spending + s.plannedSavings + s.remaining).toBe(30000);
    expect(s.shortfall).toBe(Math.max(0, -s.remaining));
    expect(s.affordableSavings).toBeLessThanOrEqual(
      Math.max(0, 30000 - s.spending),
    );
    expect(
      state.answers.every(a => Number.isSafeInteger(a.amount) && a.amount >= 0),
    ).toBe(true);
  }
});
test('invalid or repeated answers cannot allocate twice; Continue cannot skip and restart clears everything', () => {
  let state = newBudgetSession();
  expect(budgetReducer(state, { type: 'answer', optionIndex: 0 })).toBe(state);
  state = budgetReducer(state, { type: 'start' });
  expect(budgetReducer(state, { type: 'answer', optionIndex: 99 })).toBe(state);
  state = budgetReducer(state, { type: 'answer', optionIndex: 0 });
  expect(budgetReducer(state, { type: 'answer', optionIndex: 1 })).toBe(state);
  state = budgetReducer(state, { type: 'continue' });
  expect(budgetReducer(state, { type: 'continue' })).toBe(state);
  expect(budgetReducer(state, { type: 'restart' })).toEqual(newBudgetSession());
});
let renderer: ReactTestRenderer;
const navigation = { navigate: jest.fn(), popTo: jest.fn() };
const props = { navigation } as unknown as NativeStackScreenProps<
  MainStackParams,
  'BudgetChallenge'
>;
async function press(title: string) {
  await act(async () =>
    renderer.root
      .findAll(
        node =>
          node.props.accessibilityRole === 'button' &&
          typeof node.props.onPress === 'function',
      )
      .find(b => b.props.accessibilityLabel === title)!
      .props.onPress(),
  );
}
afterEach(async () => {
  if (renderer) {
    await act(async () => renderer.unmount());
  }
});
test('untimed screen completes five choices with feedback, review, replay, restart and exit', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  await act(async () => {
    renderer = create(<BudgetChallengeScreen {...props} />);
  });
  await press('Start Budget Challenge');
  for (let index = 0; index < 5; index++) {
    await press(BUDGET_CATEGORIES[index].options[0].label);
    expect(
      renderer.root
        .findAllByType(AppButton)
        .some(b => b.props.title === BUDGET_CATEGORIES[index].options[0].label),
    ).toBe(false);
    await press(index === 4 ? 'See Budget Review' : 'Next Choice');
  }
  expect(
    budgetSummary(renderer.root.findByType(BudgetChallengeResult).props.answers)
      .shortfall,
  ).toBe(0);
  expect(JSON.stringify(renderer.toJSON())).not.toContain(
    BUDGET_CATEGORIES[0].options[0].explanation,
  );
  await press('Review my choices');
  expect(JSON.stringify(renderer.toJSON())).toContain(
    BUDGET_CATEGORIES[0].options[0].explanation,
  );
  await press('Back to Games');
  expect(navigation.popTo).toHaveBeenCalledWith('Games');
  await press('Play Again');
  await press(BUDGET_CATEGORIES[0].options[0].label);
  await press('Restart Budget');
  expect(
    renderer.root
      .findAllByType(AppButton)
      .some(b => b.props.title === 'Start Budget Challenge'),
  ).toBe(true);
  expect(
    renderer!.root.findAllByType(AppButton).map(button => button.props.title),
  ).not.toContain('Back to Games');
});

test('budget shows pending essentials before answers and distinguishes covered from unfunded', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  await act(async () => {
    renderer = create(<BudgetChallengeScreen {...props} />);
  });
  const text = () => JSON.stringify(renderer.toJSON());
  await press('Start Budget Challenge');
  expect(text()).toContain('Pending');
  expect(text()).not.toContain('Unfunded');
  const choices = renderer.root.findAllByType(GameChoiceCard);
  expect(choices).toHaveLength(3);
  expect(choices.map(button => button.props.index)).toEqual([0, 1, 2]);
  await press(BUDGET_CATEGORIES[0].options[2].label);
  expect(text()).toContain('Unfunded');
  expect(text()).toContain('Pending');
  await press('Next Choice');
  await press(BUDGET_CATEGORIES[1].options[0].label);
  expect(text()).toContain('Covered');
  expect(text()).toContain('Unfunded');
  expect(text()).toContain('Pending');
});

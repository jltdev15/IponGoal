import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParams } from '../src/navigation/types';
import { AppButton } from '../src/components/AppButton';
import { GoalBuilderScreen } from '../src/games/goalBuilder/GoalBuilderScreen';
import { GoalBuilderResult } from '../src/games/goalBuilder/GoalBuilderResult';
import {
  PRACTICE_GOALS,
  PracticeGoalId,
  WEEKLY_CHOICES,
  GOAL_EVENTS,
  STARTING_SAVINGS,
  WEEKLY_ALLOWANCE,
  goalBuilderReducer,
  newGoalBuilderSession,
  weeksToGoal,
} from '../src/games/goalBuilder/GoalBuilderSession';
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
function setup(
  goalId: PracticeGoalId = 'books',
  target = 30000,
  weekly = 6000,
) {
  let state = goalBuilderReducer(newGoalBuilderSession(), { type: 'start' });
  state = goalBuilderReducer(state, { type: 'goal', goalId });
  state = goalBuilderReducer(state, { type: 'target', amount: target });
  return goalBuilderReducer(state, { type: 'weekly', amount: weekly });
}
test('week estimates round up and handle exact, completed, and zero-contribution plans', () => {
  expect(weeksToGoal(30000, 10000, 6000)).toBe(4);
  expect(weeksToGoal(30000, 10000, 4000)).toBe(5);
  expect(weeksToGoal(30000, 10000, 2000)).toBe(10);
  expect(weeksToGoal(30000, 10000, 0)).toBeNull();
  expect(weeksToGoal(30000, 30000, 0)).toBe(0);
  expect(weeksToGoal(30000, 35000, 6000)).toBe(0);
});
test('goal and price choices are constrained; overcommitting cannot begin, and setup can be revised', () => {
  let state = setup('bag', 100000, 10000);
  expect(state.phase).toBe('plan');
  expect(goalBuilderReducer(state, { type: 'begin' })).toBe(state);
  expect(goalBuilderReducer(state, { type: 'weekly', amount: 6001 })).toBe(
    state,
  );
  state = goalBuilderReducer(state, { type: 'back' });
  expect(goalBuilderReducer(state, { type: 'target', amount: 99999 })).toBe(
    state,
  );
  state = goalBuilderReducer(state, { type: 'back' });
  state = goalBuilderReducer(state, { type: 'goal', goalId: 'bike' });
  expect(state.target).toBe(300000);
  state = goalBuilderReducer(state, { type: 'target', amount: 500000 });
  state = goalBuilderReducer(state, { type: 'weekly', amount: 2000 });
  expect(goalBuilderReducer(state, { type: 'begin' }).phase).toBe('question');
});
test('essential costs and an affordable want change the balance and future timeline without using the reserve', () => {
  let state = goalBuilderReducer(setup(), { type: 'begin' });
  for (const optionIndex of [0, 1, 0]) {
    state = goalBuilderReducer(state, { type: 'answer', optionIndex });
    state = goalBuilderReducer(state, { type: 'continue' });
  }
  expect(state.answers.map(a => a.contribution)).toEqual([2000, 6000, 4000]);
  expect(state.answers.map(a => a.savingsAfter)).toEqual([12000, 10000, 14000]);
  expect(state.answers.map(a => a.reserve)).toEqual([4000, 4000, 4000]);
  expect(state.savings).toBe(14000);
  expect(weeksToGoal(state.target, state.savings, state.weekly)).toBe(3);
  expect(GOAL_EVENTS[2].options.every(o => o.thoughtful)).toBe(true);
});
test('all 144 goal/target/affordable contribution/answer paths conserve allowance plus existing savings and finish three weeks', () => {
  for (const goal of PRACTICE_GOALS) {
    for (const target of goal.targets) {
      for (const weekly of WEEKLY_CHOICES.filter(amount => amount <= 6000)) {
        for (let path = 0; path < 8; path++) {
          let state = goalBuilderReducer(setup(goal.id, target, weekly), {
            type: 'begin',
          });
          for (let index = 0; index < 3; index++) {
            state = goalBuilderReducer(state, {
              type: 'answer',
              optionIndex: Math.floor(path / 2 ** index) % 2,
            });
            const a = state.answers[index];
            expect(
              a.savingsAfter + a.spending + a.reserve + a.unallocated,
            ).toBe(a.savingsBefore + WEEKLY_ALLOWANCE);
            expect(a.contribution).toBeLessThanOrEqual(weekly);
            expect(a.savingsAfter).toBeGreaterThanOrEqual(0);
            expect(Number.isSafeInteger(a.savingsAfter)).toBe(true);
            state = goalBuilderReducer(state, { type: 'continue' });
          }
          expect(state.phase).toBe('completed');
          const outflow = state.answers.reduce(
            (sum, a) => sum + a.spending + a.reserve + a.unallocated,
            0,
          );
          expect(state.savings + outflow).toBe(
            STARTING_SAVINGS + 3 * WEEKLY_ALLOWANCE,
          );
        }
      }
    }
  }
});
test('answers resolve once; repeated Continue cannot skip a week, terminal actions do nothing, and restart clears the plan', () => {
  let state = newGoalBuilderSession();
  expect(goalBuilderReducer(state, { type: 'answer', optionIndex: 0 })).toBe(
    state,
  );
  state = goalBuilderReducer(setup(), { type: 'begin' });
  expect(goalBuilderReducer(state, { type: 'answer', optionIndex: 10 })).toBe(
    state,
  );
  for (let index = 0; index < 3; index++) {
    state = goalBuilderReducer(state, { type: 'answer', optionIndex: 0 });
    expect(goalBuilderReducer(state, { type: 'answer', optionIndex: 1 })).toBe(
      state,
    );
    state = goalBuilderReducer(state, { type: 'continue' });
    expect(goalBuilderReducer(state, { type: 'continue' })).toBe(state);
  }
  expect(goalBuilderReducer(state, { type: 'answer', optionIndex: 0 })).toBe(
    state,
  );
  expect(goalBuilderReducer(state, { type: 'restart' })).toEqual(
    newGoalBuilderSession(),
  );
});
let renderer: ReactTestRenderer | undefined;
const navigation = { popTo: jest.fn() };
const props = { navigation } as unknown as NativeStackScreenProps<
  MainStackParams,
  'GoalBuilder'
>;
async function press(title: string) {
  await act(async () =>
    renderer!.root
      .findAllByType(AppButton)
      .find(b => b.props.title === title)!
      .props.onPress(),
  );
}
afterEach(async () => {
  if (renderer) {
    await act(async () => renderer!.unmount());
    renderer = undefined;
  }
});
test('screen builds a plan, flags an unaffordable contribution, completes weeks, reviews, replays, and exits', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  await act(async () => {
    renderer = create(<GoalBuilderScreen {...props} />);
  });
  await press('Start Goal Builder');
  await press('Choose Book collection');
  await press('Target ₱300.00');
  await press('Save ₱100.00 weekly');
  const begin = () =>
    renderer!.root
      .findAllByType(AppButton)
      .find(b => b.props.title === 'Explore Three Practice Weeks')!;
  expect(begin().props.disabled).toBe(true);
  await press('Save ₱60.00 weekly');
  expect(begin().props.disabled).toBe(false);
  await press('Explore Three Practice Weeks');
  for (let index = 0; index < 3; index++) {
    await press(GOAL_EVENTS[index].options[index === 1 ? 1 : 0].label);
    await press(index === 2 ? 'See Goal Review' : 'Next Practice Week');
  }
  expect(
    renderer!.root.findByType(GoalBuilderResult).props.session.savings,
  ).toBe(14000);
  await press('Build Another Goal');
  await press('Start Goal Builder');
  await press('Restart Practice');
  expect(
    renderer!.root
      .findAllByType(AppButton)
      .some(b => b.props.title === 'Start Goal Builder'),
  ).toBe(true);
  expect(
    renderer!.root.findAllByType(AppButton).map(button => button.props.title),
  ).not.toContain('Back to Games');
});

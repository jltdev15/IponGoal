import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParams } from '../src/navigation/types';
import { AppButton } from '../src/components/AppButton';
import { SAVE_OR_SPEND_SCENARIOS } from '../src/games/saveOrSpend/SaveOrSpendScenarios';
import {
  newSaveOrSpendSession,
  saveOrSpendReducer,
} from '../src/games/saveOrSpend/SaveOrSpendSession';
import { SaveOrSpendScreen } from '../src/games/saveOrSpend/SaveOrSpendScreen';
import { SaveOrSpendResult } from '../src/games/saveOrSpend/SaveOrSpendResult';
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
function round(choices: number[], count = 5) {
  let state = saveOrSpendReducer(newSaveOrSpendSession(), { type: 'start' });
  for (let index = 0; index < count; index++) {
    state = saveOrSpendReducer(state, {
      type: 'answer',
      optionIndex: choices[index],
    });
    state = saveOrSpendReducer(state, { type: 'continue' });
  }
  return state;
}
test.each(SAVE_OR_SPEND_SCENARIOS)(
  '$id conserves money for both choices and records the exact explanation',
  scenario => {
    const index = SAVE_OR_SPEND_SCENARIOS.indexOf(scenario);
    for (let optionIndex = 0; optionIndex < 2; optionIndex++) {
      const state = round(
        Array.from({ length: 5 }, (_, i) => (i === index ? optionIndex : 0)),
        index + 1,
      );
      const answer = state.answers[index];
      expect(answer.option).toEqual(scenario.options[optionIndex]);
      expect(
        answer.savingsAfter +
          answer.option.outcome.spending +
          answer.option.outcome.unallocated,
      ).toBe(scenario.savingsBefore + scenario.newMoney);
      expect(Number.isSafeInteger(answer.savingsAfter)).toBe(true);
      expect(answer.savingsAfter).toBeGreaterThanOrEqual(0);
    }
  },
);
test('new allowance spending protects existing savings, a split saves the remainder, and an essential repair reduces savings', () => {
  const state = round([1, 1, 1, 1, 0]);
  expect(state.answers.map(a => a.savingsAfter)).toEqual([
    50000, 60000, 80000, 40000, 50000,
  ]);
  expect(state.answers[1].option.outcome.spending).toBe(10000);
  expect(state.answers[3].option.thoughtful).toBe(true);
  expect(state.answers[4].option.thoughtful).toBe(true);
  expect(SAVE_OR_SPEND_SCENARIOS[4].options.every(o => o.thoughtful)).toBe(
    true,
  );
});
test('all 32 rounds complete all examples, never carry balances forward or skip after reaching a goal', () => {
  for (let value = 0; value < 32; value++) {
    const state = round(
      Array.from({ length: 5 }, (_, i) => Math.floor(value / 2 ** i) % 2),
    );
    expect(state.phase).toBe('completed');
    expect(state.answers).toHaveLength(5);
    expect(state.answers[3].scenario.savingsBefore).toBe(50000);
  }
  expect(round([0, 1, 0, 1, 0]).answers[2].savingsAfter).toBe(100000);
});
test('repeated or invalid actions cannot duplicate answers, skip situations, or alter completed results; restart clears the session', () => {
  let state = newSaveOrSpendSession();
  expect(saveOrSpendReducer(state, { type: 'answer', optionIndex: 0 })).toBe(
    state,
  );
  state = saveOrSpendReducer(state, { type: 'start' });
  expect(saveOrSpendReducer(state, { type: 'answer', optionIndex: -1 })).toBe(
    state,
  );
  state = saveOrSpendReducer(state, { type: 'answer', optionIndex: 0 });
  expect(saveOrSpendReducer(state, { type: 'answer', optionIndex: 1 })).toBe(
    state,
  );
  state = saveOrSpendReducer(state, { type: 'continue' });
  expect(saveOrSpendReducer(state, { type: 'continue' })).toBe(state);
  state = round([0, 1, 0, 1, 0]);
  expect(saveOrSpendReducer(state, { type: 'answer', optionIndex: 1 })).toBe(
    state,
  );
  expect(saveOrSpendReducer(state, { type: 'continue' })).toBe(state);
  expect(saveOrSpendReducer(state, { type: 'restart' })).toEqual(
    newSaveOrSpendSession(),
  );
});
let renderer: ReactTestRenderer | undefined;
const navigation = { popTo: jest.fn() };
const props = { navigation } as unknown as NativeStackScreenProps<
  MainStackParams,
  'SaveOrSpend'
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
test('untimed screen supports supportive feedback, five answers, review, replay, restart, and exit', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  await act(async () => {
    renderer = create(<SaveOrSpendScreen {...props} />);
  });
  await press('Start Save or Spend');
  const choices = [1, 1, 0, 1, 0];
  for (let index = 0; index < 5; index++) {
    await press(SAVE_OR_SPEND_SCENARIOS[index].options[choices[index]].label);
    expect(
      renderer!.root
        .findAllByType(AppButton)
        .some(
          b =>
            b.props.title ===
            SAVE_OR_SPEND_SCENARIOS[index].options[choices[index]].label,
        ),
    ).toBe(false);
    await press(index === 4 ? 'See Learning Summary' : 'Next Situation');
  }
  const answers = renderer!.root.findByType(SaveOrSpendResult).props.answers;
  expect(answers).toHaveLength(5);
  expect(
    answers.filter(
      (a: { option: { thoughtful: boolean } }) => a.option.thoughtful,
    ),
  ).toHaveLength(4);
  await press('Play Again');
  await press('Start Save or Spend');
  await press('Restart Practice');
  expect(
    renderer!.root
      .findAllByType(AppButton)
      .some(b => b.props.title === 'Start Save or Spend'),
  ).toBe(true);
  expect(
    renderer!.root.findAllByType(AppButton).map(button => button.props.title),
  ).not.toContain('Back to Games');
});

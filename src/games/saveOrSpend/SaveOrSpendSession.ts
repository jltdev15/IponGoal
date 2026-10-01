import {
  SAVE_OR_SPEND_SCENARIOS,
  SaveOrSpendScenario,
  SaveOrSpendOption,
} from './SaveOrSpendScenarios';
export type SaveOrSpendAnswer = {
  scenario: SaveOrSpendScenario;
  option: SaveOrSpendOption;
  savingsAfter: number;
};
export type SaveOrSpendSession = {
  phase: 'intro' | 'question' | 'feedback' | 'completed';
  index: number;
  answers: readonly SaveOrSpendAnswer[];
};
export type SaveOrSpendAction =
  | { type: 'start' | 'continue' | 'restart' }
  | { type: 'answer'; optionIndex: number };
export const newSaveOrSpendSession = (): SaveOrSpendSession => ({
  phase: 'intro',
  index: 0,
  answers: [],
});
// No stores, repositories, persistence, or rewards. Examples have independent starting balances.
export function saveOrSpendReducer(
  state: SaveOrSpendSession,
  action: SaveOrSpendAction,
): SaveOrSpendSession {
  if (action.type === 'restart') {
    return newSaveOrSpendSession();
  }
  if (action.type === 'start' && state.phase === 'intro') {
    return { ...state, phase: 'question' };
  }
  if (action.type === 'answer' && state.phase === 'question') {
    const scenario = SAVE_OR_SPEND_SCENARIOS[state.index];
    const option = scenario.options[action.optionIndex];
    if (!option) {
      return state;
    }
    return {
      ...state,
      phase: 'feedback',
      answers: [
        ...state.answers,
        {
          scenario,
          option,
          savingsAfter: scenario.savingsBefore + option.outcome.savingsDelta,
        },
      ],
    };
  }
  if (action.type === 'continue' && state.phase === 'feedback') {
    return state.index + 1 === SAVE_OR_SPEND_SCENARIOS.length
      ? { ...state, phase: 'completed' }
      : { ...state, phase: 'question', index: state.index + 1 };
  }
  return state;
}

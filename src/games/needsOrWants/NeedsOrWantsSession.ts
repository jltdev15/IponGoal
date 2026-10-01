import { Classification, NeedsOrWantsScenario } from './NeedsOrWantsScenarios';
export type ClassificationAnswer = {
  scenario: NeedsOrWantsScenario;
  selected: Classification;
  correct: boolean;
};
export type NeedsOrWantsSession = {
  phase: 'intro' | 'question' | 'feedback' | 'completed';
  scenarios: readonly NeedsOrWantsScenario[];
  index: number;
  answers: readonly ClassificationAnswer[];
};
export type NeedsOrWantsAction =
  | { type: 'start' }
  | { type: 'answer'; classification: Classification }
  | { type: 'continue' }
  | { type: 'restart'; scenarios: readonly NeedsOrWantsScenario[] };
export function newNeedsOrWantsSession(
  scenarios: readonly NeedsOrWantsScenario[],
): NeedsOrWantsSession {
  return { phase: 'intro', scenarios: [...scenarios], index: 0, answers: [] };
}
// Session memory only: no goal, savings, settings, database, or persistent rewards.
export function needsOrWantsReducer(
  state: NeedsOrWantsSession,
  action: NeedsOrWantsAction,
): NeedsOrWantsSession {
  switch (action.type) {
    case 'restart':
      return newNeedsOrWantsSession(action.scenarios);
    case 'start':
      return state.phase === 'intro' ? { ...state, phase: 'question' } : state;
    case 'answer': {
      if (
        state.phase !== 'question' ||
        !['need', 'want'].includes(action.classification)
      ) {
        return state;
      }
      const scenario = state.scenarios[state.index];
      if (!scenario) {
        return state;
      }
      return {
        ...state,
        phase: 'feedback',
        answers: [
          ...state.answers,
          {
            scenario,
            selected: action.classification,
            correct: scenario.classification === action.classification,
          },
        ],
      };
    }
    case 'continue':
      if (state.phase !== 'feedback') {
        return state;
      }
      return state.index + 1 === state.scenarios.length
        ? { ...state, phase: 'completed' }
        : { ...state, phase: 'question', index: state.index + 1 };
  }
}

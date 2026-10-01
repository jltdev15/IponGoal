export const WEEKLY_ALLOWANCE = 30000;
export const WEEKLY_ESSENTIALS = 20000;
export const WEEKLY_RESERVE = 4000;
export const WEEKLY_AVAILABLE =
  WEEKLY_ALLOWANCE - WEEKLY_ESSENTIALS - WEEKLY_RESERVE;
export const STARTING_SAVINGS = 10000;
export const WEEKLY_CHOICES = [2000, 4000, 6000, 10000] as const;
export const PRACTICE_GOALS = [
  { id: 'books', title: 'Book collection', targets: [30000, 50000] },
  { id: 'bag', title: 'Schoolbag', targets: [60000, 100000] },
  { id: 'bike', title: 'Bicycle', targets: [300000, 500000] },
] as const;
export type PracticeGoalId = (typeof PRACTICE_GOALS)[number]['id'];
export type GoalEventOption = {
  label: string;
  extraFromAllowance: number;
  expenseFromSavings: number;
  thoughtful: boolean;
  explanation: string;
};
export type GoalEvent = {
  id: string;
  title: string;
  context: string;
  options: readonly GoalEventOption[];
};
export const GOAL_EVENTS: readonly GoalEvent[] = [
  {
    id: 'materials',
    title: 'Week 1: extra school materials',
    context:
      'This week you receive ₱300 new allowance. Your regular ₱200 essentials and separate ₱40 emergency reserve are covered first. Required extra school materials cost ₱40 from the remaining ₱60. There is no other money for them. Adjust this week’s goal contribution if needed.',
    options: [
      {
        label: 'Fund materials and adjust this week',
        extraFromAllowance: 4000,
        expenseFromSavings: 0,
        thoughtful: true,
        explanation:
          'Covering a required school expense is responsible. Only ₱20 remains available for goal saving this week, so a larger contribution must temporarily fall. Existing goal savings are untouched.',
      },
      {
        label: 'Keep the contribution; leave materials unfunded',
        extraFromAllowance: 0,
        expenseFromSavings: 0,
        thoughtful: false,
        explanation:
          'This keeps the goal growing faster but leaves required school materials unfunded. A timeline is not a reason to ignore an essential need.',
      },
    ],
  },
  {
    id: 'repair',
    title: 'Week 2: essential equipment repair',
    context:
      'Another ₱300 allowance covers this week’s regular essentials, ₱40 reserve, and your planned contribution. School equipment also needs an essential ₱80 repair. There is no other repair money available: use existing practice goal savings. The separate emergency reserve is already committed to another family need and cannot cover this repair.',
    options: [
      {
        label: 'Delay repair to keep goal savings',
        extraFromAllowance: 0,
        expenseFromSavings: 0,
        thoughtful: false,
        explanation:
          'Leaving essential equipment unusable protects a number, but does not meet the school need. Revise the timeline rather than treating it as a deadline that must be met at any cost.',
      },
      {
        label: 'Pay ₱80 repair from practice savings',
        extraFromAllowance: 0,
        expenseFromSavings: 8000,
        thoughtful: true,
        explanation:
          'The necessary repair uses existing goal savings. This week’s new contribution still gets added. Your balance may fall and the goal may take longer; that is a reason to adjust the plan, not a failure.',
      },
    ],
  },
  {
    id: 'treat',
    title: 'Week 3: a budgeted want',
    context:
      'This week’s new ₱300 allowance covers regular essentials and the separate ₱40 reserve. A ₱20 treat with friends is optional. It must fit within the remaining ₱60 along with goal saving; reduce this week’s contribution if needed. Existing goal savings and the reserve are not used for the treat.',
    options: [
      {
        label: 'Enjoy ₱20 treat within the allowance',
        extraFromAllowance: 2000,
        expenseFromSavings: 0,
        thoughtful: true,
        explanation:
          'An affordable want can fit after essentials and reserves. Up to ₱40 remains for this week’s goal contribution. Choosing enjoyment can be reasonable when you accept the trade-off.',
      },
      {
        label: 'Skip the treat and keep the contribution',
        extraFromAllowance: 0,
        expenseFromSavings: 0,
        thoughtful: true,
        explanation:
          'Keeping the planned contribution is reasonable too. Both choices fit the allowance and protect essentials; choose what matches your priorities.',
      },
    ],
  },
];
export function weeksToGoal(
  target: number,
  saved: number,
  weekly: number,
): number | null {
  const remaining = Math.max(0, target - saved);
  if (!remaining) {
    return 0;
  }
  return weekly > 0 ? Math.ceil(remaining / weekly) : null;
}
export type GoalEventAnswer = {
  event: GoalEvent;
  option: GoalEventOption;
  savingsBefore: number;
  savingsAfter: number;
  contribution: number;
  spending: number;
  reserve: number;
  unallocated: number;
};
export type GoalBuilderSession = {
  phase:
    | 'intro'
    | 'goal'
    | 'target'
    | 'plan'
    | 'question'
    | 'feedback'
    | 'completed';
  goalId: PracticeGoalId;
  target: number;
  weekly: number;
  savings: number;
  index: number;
  answers: readonly GoalEventAnswer[];
};
export type GoalBuilderAction =
  | { type: 'start' | 'back' | 'begin' | 'continue' | 'restart' }
  | { type: 'goal'; goalId: PracticeGoalId }
  | { type: 'target'; amount: number }
  | { type: 'weekly'; amount: number }
  | { type: 'answer'; optionIndex: number };
export const newGoalBuilderSession = (): GoalBuilderSession => ({
  phase: 'intro',
  goalId: 'books',
  target: 30000,
  weekly: 4000,
  savings: STARTING_SAVINGS,
  index: 0,
  answers: [],
});
export function goalBuilderReducer(
  state: GoalBuilderSession,
  action: GoalBuilderAction,
): GoalBuilderSession {
  if (action.type === 'restart') {
    return newGoalBuilderSession();
  }
  if (action.type === 'start' && state.phase === 'intro') {
    return { ...state, phase: 'goal' };
  }
  if (action.type === 'goal' && state.phase === 'goal') {
    const goal = PRACTICE_GOALS.find(g => g.id === action.goalId);
    return goal
      ? { ...state, goalId: goal.id, target: goal.targets[0], phase: 'target' }
      : state;
  }
  if (action.type === 'target' && state.phase === 'target') {
    const goal = PRACTICE_GOALS.find(g => g.id === state.goalId)!;
    return goal.targets.some(amount => amount === action.amount)
      ? { ...state, target: action.amount, phase: 'plan' }
      : state;
  }
  if (action.type === 'weekly' && state.phase === 'plan') {
    return WEEKLY_CHOICES.some(amount => amount === action.amount)
      ? { ...state, weekly: action.amount }
      : state;
  }
  if (action.type === 'back') {
    if (state.phase === 'target') {
      return { ...state, phase: 'goal' };
    }
    if (state.phase === 'plan') {
      return { ...state, phase: 'target' };
    }
  }
  if (
    action.type === 'begin' &&
    state.phase === 'plan' &&
    state.weekly <= WEEKLY_AVAILABLE
  ) {
    return { ...state, phase: 'question' };
  }
  if (action.type === 'answer' && state.phase === 'question') {
    const event = GOAL_EVENTS[state.index];
    const option = event.options[action.optionIndex];
    if (!option || option.expenseFromSavings > state.savings) {
      return state;
    }
    const contribution = Math.min(
      state.weekly,
      WEEKLY_AVAILABLE - option.extraFromAllowance,
    );
    const savingsAfter =
      state.savings + contribution - option.expenseFromSavings;
    const answer: GoalEventAnswer = {
      event,
      option,
      savingsBefore: state.savings,
      savingsAfter,
      contribution,
      spending:
        WEEKLY_ESSENTIALS +
        option.extraFromAllowance +
        option.expenseFromSavings,
      reserve: WEEKLY_RESERVE,
      unallocated: WEEKLY_AVAILABLE - contribution - option.extraFromAllowance,
    };
    return {
      ...state,
      phase: 'feedback',
      savings: savingsAfter,
      answers: [...state.answers, answer],
    };
  }
  if (action.type === 'continue' && state.phase === 'feedback') {
    return state.index + 1 === GOAL_EVENTS.length
      ? { ...state, phase: 'completed' }
      : { ...state, phase: 'question', index: state.index + 1 };
  }
  return state;
}

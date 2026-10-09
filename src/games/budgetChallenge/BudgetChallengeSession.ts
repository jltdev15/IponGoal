import { formatCurrency } from '../../utils/currency';

export const DAILY_BUDGET = 30000;
export const SAVINGS_TARGET = 6000;
export type BudgetOption = {
  label: string;
  amount: number | 'remaining';
  explanation: string;
};
export type BudgetCategory = {
  id: string;
  title: string;
  context: string;
  essential: number;
  options: readonly BudgetOption[];
};
export const BUDGET_CATEGORIES: readonly BudgetCategory[] = [
  {
    id: 'transport',
    title: 'Transportation',
    essential: 5000,
    context:
      'Your family gives you ₱300 for this whole school day. A safe round-trip ride costs ₱50. Walking is unsafe on this route.',
    options: [
      {
        label: 'Safe round-trip ride · ₱50',
        amount: 5000,
        explanation: 'This covers your safe trip to school and home.',
      },
      {
        label: 'Premium ride · ₱100',
        amount: 10000,
        explanation:
          'The premium ride also meets the need, but uses ₱50 more that could cover another priority.',
      },
      {
        label: 'Leave transportation unfunded · ₱0',
        amount: 0,
        explanation:
          'This leaves the safe ride unfunded. Saving money does not replace a safe way to travel.',
      },
    ],
  },
  {
    id: 'lunch',
    title: 'Lunch',
    essential: 10000,
    context:
      'Lunch comes from the same ₱300 allowance. You have no packed food. A filling meal costs ₱100; a special meal costs ₱150.',
    options: [
      {
        label: 'Filling lunch · ₱100',
        amount: 10000,
        explanation: 'A filling lunch meets your food need for today.',
      },
      {
        label: 'Special lunch · ₱150',
        amount: 15000,
        explanation:
          'This meets your food need, but costs ₱50 more. Check whether your other priorities still fit.',
      },
      {
        label: 'Leave lunch unfunded · ₱0',
        amount: 0,
        explanation:
          'You still need food today. Leaving lunch unfunded is a gap in the plan, even if more money appears available.',
      },
    ],
  },
  {
    id: 'materials',
    title: 'School materials',
    essential: 4000,
    context:
      'Required materials for today cost ₱40 from the same allowance. A decorated set costs ₱80 and does the same schoolwork.',
    options: [
      {
        label: 'Required materials · ₱40',
        amount: 4000,
        explanation:
          'This covers the materials you need for today’s schoolwork.',
      },
      {
        label: 'Decorated set · ₱80',
        amount: 8000,
        explanation:
          'The extra decoration is optional. It uses ₱40 more while meeting the same school need.',
      },
      {
        label: 'Leave materials unfunded · ₱0',
        amount: 0,
        explanation:
          'Required school materials remain unfunded. A complete plan needs to make room for them.',
      },
    ],
  },
  {
    id: 'snacks',
    title: 'Optional snacks',
    essential: 0,
    context:
      'Your filling lunch and drinking water are enough for today if you funded lunch. Snacks are a want paid from the same ₱300 allowance.',
    options: [
      {
        label: 'Planned snack · ₱50',
        amount: 5000,
        explanation:
          'A planned treat can be reasonable when essential needs and your savings plan fit the budget.',
      },
      {
        label: 'Skip optional snacks · ₱0',
        amount: 0,
        explanation:
          'Skipping this optional treat can leave more room for savings or another priority. Buying a want is not automatically wrong.',
      },
      {
        label: 'Snack bundle · ₱80',
        amount: 8000,
        explanation:
          'Check the trade-off: this bundle costs ₱30 more than the planned snack and may leave less for savings.',
      },
    ],
  },
  {
    id: 'savings',
    title: 'Savings allocation',
    essential: 0,
    context:
      'Aim to set aside ₱60 from today’s allowance after essential needs. This is fictional new money, separate from your existing savings.',
    options: [
      {
        label: 'Plan to save ₱60',
        amount: 6000,
        explanation:
          'Setting aside ₱60 meets today’s practice target if the full plan fits the allowance and covers essentials.',
      },
      {
        label: 'Save all money left to plan',
        amount: 'remaining',
        explanation:
          'This allocates what is left after your planned spending. Check any unfunded essentials before treating it as available savings.',
      },
      {
        label: 'No savings today · ₱0',
        amount: 0,
        explanation:
          'Sometimes essentials take priority over savings. Review whether a less costly optional choice could make room for today’s target.',
      },
    ],
  },
];
export type BudgetAnswer = {
  categoryId: string;
  optionIndex: number;
  amount: number;
};
export type BudgetSession = {
  phase: 'intro' | 'question' | 'feedback' | 'completed';
  index: number;
  answers: readonly BudgetAnswer[];
};
export type BudgetAction =
  | { type: 'start' | 'continue' | 'restart' }
  | { type: 'answer'; optionIndex: number };
export const newBudgetSession = (): BudgetSession => ({
  phase: 'intro',
  index: 0,
  answers: [],
});
export function budgetSummary(answers: readonly BudgetAnswer[]) {
  const spending = answers
    .filter(a => a.categoryId !== 'savings')
    .reduce((sum, a) => sum + a.amount, 0);
  const plannedSavings =
    answers.find(a => a.categoryId === 'savings')?.amount ?? 0;
  const remaining = DAILY_BUDGET - spending - plannedSavings;
  const unmetNeeds = BUDGET_CATEGORIES.filter(
    c =>
      c.essential > 0 &&
      (answers.find(a => a.categoryId === c.id)?.amount ?? 0) < c.essential,
  );
  return {
    spending,
    plannedSavings,
    remaining,
    shortfall: Math.max(0, -remaining),
    affordableSavings: Math.min(
      plannedSavings,
      Math.max(0, DAILY_BUDGET - spending),
    ),
    unmetNeeds,
  };
}
export function budgetReducer(
  state: BudgetSession,
  action: BudgetAction,
): BudgetSession {
  if (action.type === 'restart') {
    return newBudgetSession();
  }
  if (action.type === 'start' && state.phase === 'intro') {
    return { ...state, phase: 'question' };
  }
  if (action.type === 'answer' && state.phase === 'question') {
    const category = BUDGET_CATEGORIES[state.index];
    const option = category.options[action.optionIndex];
    if (!option) {
      return state;
    }
    const amount =
      option.amount === 'remaining'
        ? Math.max(0, budgetSummary(state.answers).remaining)
        : option.amount;
    return {
      ...state,
      phase: 'feedback',
      answers: [
        ...state.answers,
        { categoryId: category.id, optionIndex: action.optionIndex, amount },
      ],
    };
  }
  if (action.type === 'continue' && state.phase === 'feedback') {
    return state.index === BUDGET_CATEGORIES.length - 1
      ? { ...state, phase: 'completed' }
      : { ...state, phase: 'question', index: state.index + 1 };
  }
  return state;
}
export function budgetFeedback(state: BudgetSession): string {
  const summary = budgetSummary(state.answers);
  const futureEssentials = BUDGET_CATEGORIES.slice(state.index + 1).reduce(
    (sum, c) => sum + c.essential,
    0,
  );
  const unmetAnswered = summary.unmetNeeds.filter(c =>
    state.answers.some(a => a.categoryId === c.id),
  );
  if (summary.shortfall > 0) {
    return `Your plan exceeds the allowance by ${formatCurrency(
      summary.shortfall,
    )}. This planning shortfall means the money is not available. Try a lower-cost choice next time.`;
  }
  if (unmetAnswered.length) {
    return `Still unfunded: ${unmetAnswered
      .map(c => c.title)
      .join(
        ', ',
      )}. Money left over is not a complete plan when essential needs are missing.`;
  }
  const priorities = futureEssentials + (state.index < 4 ? SAVINGS_TARGET : 0);
  if (summary.remaining < priorities) {
    return `You have ${formatCurrency(
      summary.remaining,
    )} not assigned yet, but still need ${formatCurrency(
      priorities,
    )} for remaining essentials and the savings target. Review an earlier upgrade or optional expense.`;
  }
  return state.index < 4
    ? `The remaining ${formatCurrency(
        summary.remaining,
      )} can cover your remaining essentials and the ₱60 savings target.`
    : 'Review your full plan below. More than one combination can be responsible.';
}

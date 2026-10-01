export type PracticeOutcome = {
  savingsDelta: number;
  spending: number;
  unallocated: number;
};
export type SaveOrSpendOption = {
  label: string;
  thoughtful: boolean;
  explanation: string;
  outcome: PracticeOutcome;
};
export type SaveOrSpendScenario = {
  id: string;
  title: string;
  context: string;
  savingsBefore: number;
  newMoney: number;
  options: readonly SaveOrSpendOption[];
};
// Five separate fictional examples, not a shared wallet. All amounts are centavos.
export const SAVE_OR_SPEND_SCENARIOS: readonly SaveOrSpendScenario[] = [
  {
    id: 'extra',
    title: 'Extra allowance',
    savingsBefore: 50000,
    newMoney: 10000,
    context:
      'You receive ₱100 extra allowance. Your essential needs are covered. You have ₱500 saved toward a fictional ₱1,000 schoolbag goal. Your current game works, but new cosmetic game credits cost ₱100.',
    options: [
      {
        label: 'Save the extra ₱100',
        thoughtful: true,
        explanation:
          'Saving this extra allowance moves your chosen schoolbag goal forward. You already have a working game and your needs are covered.',
        outcome: { savingsDelta: 10000, spending: 0, unallocated: 0 },
      },
      {
        label: 'Spend ₱100 on game credits',
        thoughtful: false,
        explanation:
          'The credits are optional. They use the new allowance and delay the schoolbag goal; your existing ₱500 savings are unchanged.',
        outcome: { savingsDelta: 0, spending: 10000, unallocated: 0 },
      },
    ],
  },
  {
    id: 'split',
    title: 'Make room for lunch',
    savingsBefore: 50000,
    newMoney: 20000,
    context:
      'You receive ₱200 new allowance. Tomorrow’s filling lunch needs ₱100, and there is no packed lunch or other lunch money. Your fictional savings start at ₱500. Entertainment would use the whole new allowance.',
    options: [
      {
        label: 'Spend all ₱200 on entertainment',
        thoughtful: false,
        explanation:
          'Using the whole allowance for entertainment leaves tomorrow’s food unfunded. Existing savings do not decrease, but the known need still matters.',
        outcome: { savingsDelta: 0, spending: 20000, unallocated: 0 },
      },
      {
        label: 'Pay lunch ₱100 and save ₱100',
        thoughtful: true,
        explanation:
          'This covers the known lunch expense from new allowance and transfers the other ₱100 into practice savings. A responsible choice can combine spending and saving.',
        outcome: { savingsDelta: 10000, spending: 10000, unallocated: 0 },
      },
    ],
  },
  {
    id: 'wait',
    title: 'A sale can wait',
    savingsBefore: 80000,
    newMoney: 20000,
    context:
      'You have ₱800 saved toward a fictional ₱1,000 schoolbag goal and receive ₱200 extra allowance. Essentials are covered. An entertainment subscription on sale costs ₱200; free entertainment you enjoy is already available.',
    options: [
      {
        label: 'Save ₱200 toward the schoolbag',
        thoughtful: true,
        explanation:
          'Waiting on optional entertainment completes this example’s schoolbag goal. A discount still costs money, so compare it with your own priority.',
        outcome: { savingsDelta: 20000, spending: 0, unallocated: 0 },
      },
      {
        label: 'Spend ₱200 on the subscription',
        thoughtful: false,
        explanation:
          'This spends the new allowance while your existing ₱800 stays saved. The sale does not make the subscription essential, and your chosen goal has to wait.',
        outcome: { savingsDelta: 0, spending: 20000, unallocated: 0 },
      },
    ],
  },
  {
    id: 'repair',
    title: 'An essential repair',
    savingsBefore: 50000,
    newMoney: 0,
    context:
      'School equipment needs an essential ₱100 repair before you can use it for class. There is no new allowance or other available repair money. You have ₱500 in existing fictional savings; the repair must come from those savings.',
    options: [
      {
        label: 'Keep all savings and delay the repair',
        thoughtful: false,
        explanation:
          'Keeping the savings amount unchanged leaves essential school equipment unusable. Goal progress should not take priority over this necessary expense.',
        outcome: { savingsDelta: 0, spending: 0, unallocated: 0 },
      },
      {
        label: 'Spend ₱100 from practice savings',
        thoughtful: true,
        explanation:
          'A necessary expense can be a responsible use of savings. This repair reduces existing practice savings from ₱500 to ₱400; no new allowance is involved.',
        outcome: { savingsDelta: -10000, spending: 10000, unallocated: 0 },
      },
    ],
  },
  {
    id: 'treat',
    title: 'A planned treat',
    savingsBefore: 50000,
    newMoney: 5000,
    context:
      'Your essential needs, emergency reserve, and planned goal savings are already covered. You have ₱500 in fictional goal savings plus ₱50 new allowance set aside for a treat with friends. The reserve is separate and neither option uses it.',
    options: [
      {
        label: 'Enjoy the planned ₱50 treat',
        thoughtful: true,
        explanation:
          'An affordable want can fit after essentials, reserves, and planned savings are covered. Spending the new ₱50 leaves existing practice savings unchanged.',
        outcome: { savingsDelta: 0, spending: 5000, unallocated: 0 },
      },
      {
        label: 'Save the optional ₱50 instead',
        thoughtful: true,
        explanation:
          'Extra saving is reasonable too. Both options fit this situation; choose according to your priorities rather than assuming saving is always the only good answer.',
        outcome: { savingsDelta: 5000, spending: 0, unallocated: 0 },
      },
    ],
  },
];

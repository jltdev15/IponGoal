export type Classification = 'need' | 'want';
export type NeedsOrWantsScenario = {
  id: string;
  item: string;
  context: string;
  classification: Classification;
  explanation: string;
};
export const ROUND_LENGTH = 5;
export const NEEDS_OR_WANTS_SCENARIOS: readonly NeedsOrWantsScenario[] = [
  {
    id: 'notebook',
    item: 'A basic notebook',
    context: 'Your notebook is full, and you need one for tomorrow’s class.',
    classification: 'need',
    explanation:
      'The notebook supports an essential school activity. Meeting this need can come before optional saving.',
  },
  {
    id: 'lunch',
    item: 'A filling lunch',
    context: 'You have not eaten, and you need a meal during your school day.',
    classification: 'need',
    explanation:
      'A meal meets a basic food need. Spending on food is responsible when you need to eat.',
  },
  {
    id: 'ride',
    item: 'A safe ride home',
    context:
      'School is over, and walking home would be unsafe. You need transportation.',
    classification: 'need',
    explanation:
      'Safe transportation meets an important need. Protect travel money before buying optional items.',
  },
  {
    id: 'medicine',
    item: 'Necessary medicine',
    context:
      'Your family has identified an essential medicine expense that needs to be paid.',
    classification: 'need',
    explanation:
      'An essential health expense is a need. A savings goal should not leave necessary care unfunded.',
  },
  {
    id: 'internet',
    item: 'Internet access for school',
    context:
      'An assignment requires internet access, and you have no usable free alternative.',
    classification: 'need',
    explanation:
      'In this situation, basic internet access supports required schoolwork. Context matters when deciding what is a need.',
  },
  {
    id: 'tea',
    item: 'Milk tea as a treat',
    context:
      'You have eaten and have drinking water. You would like milk tea for enjoyment.',
    classification: 'want',
    explanation:
      'The drink is optional here. A planned treat can be reasonable after food, other needs, and savings are covered.',
  },
  {
    id: 'credits',
    item: 'Cosmetic game credits',
    context:
      'Your game is free to play. These credits only change how your character looks.',
    classification: 'want',
    explanation:
      'Cosmetic credits are optional. Waiting can protect money for your chosen goal.',
  },
  {
    id: 'case',
    item: 'A decorative phone case',
    context:
      'Your phone already has a working protective case. You want a different design.',
    classification: 'want',
    explanation:
      'Changing the design is optional because protection is already covered. A discount would still use money.',
  },
  {
    id: 'notebook-design',
    item: 'An extra decorated notebook',
    context:
      'You already have enough usable school notebooks. This extra one is only for its design.',
    classification: 'want',
    explanation:
      'The extra notebook is optional in this context. The same kind of item can be a need in another situation.',
  },
  {
    id: 'premium-video',
    item: 'A premium video subscription',
    context:
      'The subscription is for entertainment. Your schoolwork and essential internet access are covered.',
    classification: 'want',
    explanation:
      'Extra entertainment is a want. Wants can fit a budget, but they should not crowd out important needs.',
  },
];
function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function createNeedsOrWantsRound(
  random: () => number = Math.random,
): NeedsOrWantsScenario[] {
  const needs = shuffled(
    NEEDS_OR_WANTS_SCENARIOS.filter(s => s.classification === 'need'),
    random,
  ).slice(0, 3);
  const wants = shuffled(
    NEEDS_OR_WANTS_SCENARIOS.filter(s => s.classification === 'want'),
    random,
  ).slice(0, 2);
  return shuffled([...needs, ...wants], random);
}

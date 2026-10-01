export type FlightLevelId = 'needs' | 'save' | 'budget' | 'goal';
export type FlightMode = 'manual' | 'assisted';
export type GameStatus =
  | 'idle'
  | 'playing'
  | 'decision'
  | 'paused'
  | 'hit'
  | 'completed'
  | 'gameOver';
export type DecisionPhase = 'reading' | 'choosing' | 'feedback';
export type FinancialOutcome = {
  savingsDelta: number;
  spent: number;
  reserved: number;
  budgetCost: number;
};
export type ScenarioOption = {
  id: string;
  label: string;
  recommended: boolean;
  explanation: string;
  outcome: FinancialOutcome;
};
export type FlightScenario = {
  id: string;
  prompt: string;
  concept: string;
  options: readonly [ScenarioOption, ScenarioOption];
};
export type FlightLevel = {
  id: FlightLevelId;
  title: string;
  description: string;
  goalName: string;
  target: number;
  startingSavings: number;
  budget: number | null;
  takeaway: string;
};
export const FLIGHT = {
  width: 360,
  height: 400,
  playerX: 62,
  playerSize: 36,
  hitInset: 7,
  gravity: 420,
  jumpVelocity: -190,
  maxFallVelocity: 240,
  scrollSpeed: 110,
  speedIncrease: 4,
  decisionSpeed: 48,
  gateWidth: 90,
  gateHeight: 140,
  upperGateTop: 25,
  lowerGateTop: 235,
  obstacleWidth: 46,
  gapHeight: 204,
  obstaclesPerDecision: 3,
  decisions: 5,
  lives: 3,
  fixedStep: 1 / 120,
  maxFrameDelta: 0.1,
  invulnerableSeconds: 1.5,
} as const;
export const LEVELS: readonly FlightLevel[] = [
  {
    id: 'needs',
    title: 'Needs vs Wants',
    description: 'Protect school, food, travel, and health needs.',
    goalName: 'Headphones',
    target: 200000,
    startingSavings: 80000,
    budget: null,
    takeaway:
      'Meeting important needs comes before optional saving or spending.',
  },
  {
    id: 'save',
    title: 'Save or Spend',
    description: 'Practice trade-offs, patience, and affordable treats.',
    goalName: 'Bicycle',
    target: 300000,
    startingSavings: 100000,
    budget: null,
    takeaway:
      'Save intentionally, delay unnecessary purchases, and make room for planned enjoyment.',
  },
  {
    id: 'budget',
    title: 'Budget Flight',
    description:
      'Plan transport, lunch, materials, snacks, and savings within ₱300.',
    goalName: 'School bag',
    target: 200000,
    startingSavings: 80000,
    budget: 30000,
    takeaway:
      'A budget gives every peso a purpose. Earlier choices affect what you can afford later.',
  },
  {
    id: 'goal',
    title: 'Goal Rush',
    description: 'Collect fictional windfalls and protect an important goal.',
    goalName: 'New phone',
    target: 500000,
    startingSavings: 300000,
    budget: null,
    takeaway:
      'Goal progress matters, but essential expenses and emergency reserves matter too.',
  },
];
export function getFlightLevel(id: FlightLevelId): FlightLevel {
  const level = LEVELS.find(item => item.id === id);
  if (!level) {
    throw new Error('Unknown practice level.');
  }
  return level;
}

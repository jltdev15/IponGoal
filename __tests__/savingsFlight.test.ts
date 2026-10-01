import * as flightConfig from '../src/games/savingsFlight/SavingsFlightConfig';
import { FLIGHT, LEVELS } from '../src/games/savingsFlight/SavingsFlightConfig';
import { SavingsFlightEngine } from '../src/games/savingsFlight/SavingsFlightEngine';
import { SCENARIOS } from '../src/games/savingsFlight/SavingsFlightScenarios';
import {
  integrate,
  overlaps,
  playerBounds,
} from '../src/games/savingsFlight/SavingsFlightPhysics';

function reachDecision(engine: SavingsFlightEngine, manual = false) {
  for (
    let i = 0;
    i < 3000 && engine.getSnapshot().gameStatus === 'playing';
    i++
  ) {
    if (manual && engine.getFrame().playerY > 185) {
      engine.tap();
    }
    engine.advance(1 / 60);
  }
  expect(engine.getSnapshot().gameStatus).toBe('decision');
}
function finish(
  engine: SavingsFlightEngine,
  select = (e: SavingsFlightEngine) =>
    e.getSnapshot().currentScenario!.options.findIndex(o => o.recommended),
  manual = false,
) {
  engine.start();
  for (let i = 0; i < 5; i++) {
    reachDecision(engine, manual);
    engine.resolveDecision(select(engine));
    engine.continueFlight();
  }
}

test('physics uses forgiving inset rectangles and finite gravity', () => {
  const bounds = playerBounds(100);
  expect(bounds.width).toBeLessThan(FLIGHT.playerSize);
  expect(
    overlaps(bounds, { x: FLIGHT.playerX, y: 100, width: 5, height: 36 }),
  ).toBe(false);
  expect(
    overlaps(bounds, { x: FLIGHT.playerX + 10, y: 110, width: 10, height: 10 }),
  ).toBe(true);
  expect(integrate(100, 0, 0.1)).toEqual({ y: 104.2, velocity: 42 });
  expect(integrate(100, 1000, 0.1).velocity).toBe(FLIGHT.maxFallVelocity);
});

test('fixed stepping produces equal flight at 30, 60, and 120 FPS; huge deltas are bounded', () => {
  const flights = [30, 60, 120].map(fps => {
    const e = new SavingsFlightEngine('needs', 'assisted');
    e.start();
    for (let i = 0; i < fps * 2; i++) {
      e.advance(1 / fps);
    }
    return e;
  });
  expect(flights[0].getFrame().obstacleX).toBeCloseTo(
    flights[1].getFrame().obstacleX,
    8,
  );
  expect(flights[1].getFrame().obstacleX).toBeCloseTo(
    flights[2].getFrame().obstacleX,
    8,
  );
  const e = new SavingsFlightEngine('needs', 'assisted');
  e.start();
  e.advance(100);
  expect(e.getSnapshot().activeSeconds).toBeLessThanOrEqual(0.1);
  e.advance(NaN);
  e.advance(-1);
  expect(Number.isFinite(e.getFrame().obstacleX)).toBe(true);
});

test.each(LEVELS)(
  '$title assisted mode completes all decisions without tapping or collecting coins',
  level => {
    const e = new SavingsFlightEngine(level.id, 'assisted');
    finish(e);
    const s = e.getSnapshot();
    expect(s.gameStatus).toBe('completed');
    expect(s.decisionCount).toBe(5);
    expect(s.correctDecisionCount).toBe(5);
    expect(s.score).toBe(0);
    expect(s.coinsCollected).toBe(0);
    expect(s.lives).toBe(3);
    expect(s.activeSeconds).toBeGreaterThan(60);
    expect(s.activeSeconds).toBeLessThan(90);
    expect(s.decisions).toHaveLength(5);
  },
);

test('budget planned allocation uses exactly ₱300 and saves ₱60', () => {
  const e = new SavingsFlightEngine('budget', 'assisted');
  finish(e);
  expect(e.getSnapshot()).toMatchObject({
    budgetRemaining: 0,
    practiceSpent: 24000,
    practiceSavings: 86000,
  });
});

test('budget never goes negative; unaffordable choices move no money and explain shortfalls', () => {
  const e = new SavingsFlightEngine('budget', 'assisted');
  e.start();
  for (let i = 0; i < 5; i++) {
    reachDecision(e);
    const before = e.getSnapshot();
    const index = before.currentScenario!.options.findIndex(
      o => !o.recommended,
    );
    const cost = before.currentScenario!.options[index].outcome.budgetCost;
    e.resolveDecision(index);
    const after = e.getSnapshot();
    expect(after.budgetRemaining).toBeGreaterThanOrEqual(0);
    if (cost > before.budgetRemaining!) {
      expect(after.budgetRemaining).toBe(before.budgetRemaining);
      expect(after.practiceSavings).toBe(before.practiceSavings);
      expect(after.practiceSpent).toBe(before.practiceSpent);
      expect(after.feedback!.explanation).toContain('not enough');
    }
    e.continueFlight();
  }
});

test.each(LEVELS)(
  '$title outcomes match every authored option and preserve separate arcade score',
  level => {
    for (let scenarioIndex = 0; scenarioIndex < 5; scenarioIndex++) {
      for (let index = 0; index < 2; index++) {
        const e = new SavingsFlightEngine(level.id, 'assisted');
        e.start();
        for (let previous = 0; previous < scenarioIndex; previous++) {
          reachDecision(e);
          e.resolveDecision(
            e
              .getSnapshot()
              .currentScenario!.options.findIndex(o => o.recommended),
          );
          e.continueFlight();
        }
        reachDecision(e);
        const before = e.getSnapshot();
        const option = before.currentScenario!.options[index];
        e.resolveDecision(index);
        const after = e.getSnapshot();
        const affordable =
          before.budgetRemaining === null ||
          option.outcome.budgetCost <= before.budgetRemaining;
        expect(after.practiceSavings).toBe(
          before.practiceSavings +
            (affordable ? option.outcome.savingsDelta : 0),
        );
        expect(after.practiceSpent).toBe(
          before.practiceSpent + (affordable ? option.outcome.spent : 0),
        );
        expect(after.practiceReserved).toBe(
          before.practiceReserved + (affordable ? option.outcome.reserved : 0),
        );
        expect(after.score).toBe(before.score);
        expect(after.decisionCount).toBe(before.decisionCount + 1);
        expect(after.decisions[scenarioIndex].answer).toBe(option.label);
      }
    }
  },
);

test('buttons resolve once, reading and feedback are untimed, and pause freezes everything', () => {
  const e = new SavingsFlightEngine('save', 'assisted');
  e.start();
  e.advance(0.1);
  e.pause();
  const paused = e.getSnapshot();
  const frame = e.getFrame();
  e.advance(0.1);
  e.tap();
  e.resolveDecision(0);
  e.start();
  expect(e.getSnapshot()).toEqual(paused);
  expect(e.getFrame()).toEqual(frame);
  e.resume();
  reachDecision(e);
  const reading = e.getSnapshot();
  e.advance(0.1);
  expect(e.getSnapshot()).toEqual(reading);
  e.resolveDecision(10);
  expect(e.getSnapshot()).toEqual(reading);
  e.resolveDecision(0);
  const answered = e.getSnapshot();
  e.resolveDecision(1);
  e.advance(0.1);
  expect(e.getSnapshot()).toEqual(answered);
  e.pause();
  e.resume();
  expect(e.getSnapshot()).toEqual(answered);
});

test('manual flight earns obstacle points independently of decisions', () => {
  const e = new SavingsFlightEngine('needs', 'manual');
  finish(e, undefined, true);
  expect(e.getSnapshot()).toMatchObject({
    gameStatus: 'completed',
    score: 15,
    correctDecisionCount: 5,
  });
  expect(e.getSnapshot().coinsCollected).toBeGreaterThan(0);
  expect(e.getSnapshot().practiceSavings).toBe(
    95000 + e.getSnapshot().coinsCollected * 1000,
  );
});

test('gate and button paths give the same financial outcome for either gate', () => {
  for (let index = 0; index < 2; index++) {
    const gate = new SavingsFlightEngine('needs', 'manual');
    gate.start();
    reachDecision(gate, true);
    const button = new SavingsFlightEngine('needs', 'manual');
    button.start();
    reachDecision(button, true);
    button.resolveDecision(index);
    gate.flyToChoose();
    for (
      let i = 0;
      i < 600 && gate.getSnapshot().decisionPhase === 'choosing';
      i++
    ) {
      if (index === 0 && gate.getFrame().playerY > 70) {
        gate.tap();
      }
      gate.advance(1 / 60);
    }
    expect(gate.getSnapshot().decisionPhase).toBe('feedback');
    expect(gate.getSnapshot().practiceSavings).toBe(
      button.getSnapshot().practiceSavings,
    );
    expect(gate.getSnapshot().feedback).toEqual(button.getSnapshot().feedback);
  }
});

test('checkpoint rollback preserves resolved answers and rolls back post-checkpoint coins and score', () => {
  const e = new SavingsFlightEngine('needs', 'manual');
  e.start();
  reachDecision(e, true);
  e.resolveDecision(0);
  e.continueFlight();
  const checkpoint = e.getSnapshot();
  for (let i = 0; i < 350; i++) {
    if (e.getFrame().playerY > 185) {
      e.tap();
    }
    e.advance(1 / 60);
  }
  expect(e.getSnapshot().score).toBeGreaterThan(checkpoint.score);
  for (let i = 0; i < 200 && e.getSnapshot().gameStatus === 'playing'; i++) {
    e.advance(1 / 60);
  }
  expect(e.getSnapshot()).toMatchObject({
    gameStatus: 'hit',
    lives: 2,
    score: checkpoint.score,
    practiceSavings: checkpoint.practiceSavings,
    coinsCollected: checkpoint.coinsCollected,
    decisions: checkpoint.decisions,
  });
  e.continueFlight();
  reachDecision(e, true);
  expect(e.getSnapshot().score).toBe(checkpoint.score + 3);
});

test('three collisions end supportively at the latest checkpoint; idle and terminal states do not advance', () => {
  const e = new SavingsFlightEngine('needs', 'manual');
  const idle = e.getSnapshot();
  e.tap();
  e.advance(0.1);
  expect(e.getSnapshot()).toEqual(idle);
  e.start();
  for (let hit = 0; hit < 3; hit++) {
    for (let i = 0; i < 500 && e.getSnapshot().gameStatus === 'playing'; i++) {
      e.advance(1 / 60);
    }
    if (hit < 2) {
      expect(e.getSnapshot().gameStatus).toBe('hit');
      e.continueFlight();
    }
  }
  expect(e.getSnapshot()).toMatchObject({
    gameStatus: 'gameOver',
    lives: 0,
    decisionCount: 0,
  });
  const over = e.getSnapshot();
  e.advance(0.1);
  e.continueFlight();
  e.resume();
  expect(e.getSnapshot()).toEqual(over);
});

test('authored content contains essential spending and optional spending that is responsible', () => {
  expect(
    SCENARIOS.needs[0].options.find(o => o.recommended)!.outcome.spent,
  ).toBe(6000);
  expect(SCENARIOS.save[4].options.every(o => o.recommended)).toBe(true);
  expect(
    SCENARIOS.goal[2].options.find(o => o.recommended)!.outcome.savingsDelta,
  ).toBe(-10000);
  expect(
    SCENARIOS.goal[3].options.find(o => o.recommended)!.outcome.savingsDelta,
  ).toBe(10000);
});

test('covering an affordable need remains thoughtful after an earlier budget mistake', () => {
  const engine = new SavingsFlightEngine('budget', 'assisted');
  engine.start();
  reachDecision(engine);
  engine.resolveDecision(1);
  engine.continueFlight();
  reachDecision(engine);
  engine.resolveDecision(1);
  expect(engine.getSnapshot().feedback).toMatchObject({ thoughtful: true });
  expect(engine.getSnapshot().feedback!.explanation).toContain('shortfall');
});
test('Goal Rush keeps the emergency reserve separate from goal savings and spending', () => {
  const engine = new SavingsFlightEngine('goal', 'assisted');
  finish(engine);
  expect(engine.getSnapshot().practiceReserved).toBe(5000);
  expect(engine.getSnapshot().practiceSpent).toBe(15000);
  expect(engine.getSnapshot().practiceSavings).toBe(330000);
});

test('a player between gate openings is not automatically assigned an answer', () => {
  const engine = new SavingsFlightEngine('needs', 'manual');
  engine.start();
  reachDecision(engine, true);
  engine.flyToChoose();
  for (let i = 0; i < 600; i++) {
    if (engine.getFrame().playerY > 210) {
      engine.tap();
    }
    engine.advance(1 / 60);
  }
  expect(engine.getSnapshot()).toMatchObject({
    decisionPhase: 'choosing',
    decisionCount: 0,
    lives: 3,
  });
  expect(engine.getFrame().gateX).toBe(FLIGHT.playerX);
  engine.resolveDecision(0);
  expect(engine.getSnapshot()).toMatchObject({
    decisionPhase: 'feedback',
    decisionCount: 1,
  });
});

test('already reaching the practice target does not skip educational decisions', () => {
  const level = flightConfig.getFlightLevel('needs');
  const mock = jest
    .spyOn(flightConfig, 'getFlightLevel')
    .mockReturnValue({ ...level, target: level.startingSavings });
  try {
    const engine = new SavingsFlightEngine('needs', 'assisted');
    finish(engine);
    expect(engine.getSnapshot()).toMatchObject({
      gameStatus: 'completed',
      decisionCount: 5,
    });
  } finally {
    mock.mockRestore();
  }
});

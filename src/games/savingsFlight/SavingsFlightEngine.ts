import {
  DecisionPhase,
  FLIGHT,
  FlightLevel,
  FlightLevelId,
  FlightMode,
  FlightScenario,
  GameStatus,
  getFlightLevel,
} from './SavingsFlightConfig';
import { SCENARIOS } from './SavingsFlightScenarios';
import {
  integrate,
  obstacleGap,
  overlaps,
  playerBounds,
} from './SavingsFlightPhysics';

export type DecisionRecord = {
  scenarioId: string;
  prompt: string;
  concept: string;
  answer: string;
  thoughtful: boolean;
  explanation: string;
};
export type EngineSnapshot = {
  gameStatus: GameStatus;
  decisionPhase: DecisionPhase;
  score: number;
  lives: number;
  currentScenario: FlightScenario | null;
  practiceSavings: number;
  practiceSpent: number;
  practiceReserved: number;
  budgetRemaining: number | null;
  decisionCount: number;
  correctDecisionCount: number;
  coinsCollected: number;
  activeSeconds: number;
  decisions: readonly DecisionRecord[];
  feedback: DecisionRecord | null;
};
export type FlightCheckpoint = Pick<
  EngineSnapshot,
  | 'score'
  | 'practiceSavings'
  | 'practiceReserved'
  | 'practiceSpent'
  | 'budgetRemaining'
  | 'decisionCount'
  | 'correctDecisionCount'
  | 'coinsCollected'
  | 'decisions'
>;
export type FlightResult = EngineSnapshot & {
  level: FlightLevel;
  mode: FlightMode;
};
export type FlightFrame = {
  playerY: number;
  obstacleX: number;
  gapTop: number;
  gapBottom: number;
  coinX: number;
  coinY: number;
  coinValue: number;
  coinVisible: boolean;
  gateX: number;
  choosing: boolean;
  invulnerable: boolean;
};

// Pure in-memory simulation: this module has no persistence or savings-store access.
export class SavingsFlightEngine {
  readonly level: FlightLevel;
  readonly mode: FlightMode;
  revision = 0;
  private state: EngineSnapshot;
  private checkpoint: FlightCheckpoint;
  private previousStatus: GameStatus = 'playing';
  private accumulator = 0;
  private playerY = 182;
  private velocity = 0;
  private worldOffset = 0;
  private section = 0;
  private passed = false;
  private collected = false;
  private gateX = 260;
  private invulnerable = 0;

  constructor(levelId: FlightLevelId, mode: FlightMode) {
    this.level = getFlightLevel(levelId);
    this.mode = mode;
    this.state = {
      gameStatus: 'idle',
      decisionPhase: 'reading',
      score: 0,
      lives: FLIGHT.lives,
      currentScenario: null,
      practiceSavings: this.level.startingSavings,
      practiceSpent: 0,
      practiceReserved: 0,
      budgetRemaining: this.level.budget,
      decisionCount: 0,
      correctDecisionCount: 0,
      coinsCollected: 0,
      activeSeconds: 0,
      decisions: [],
      feedback: null,
    };
    this.checkpoint = this.saveCheckpoint();
  }

  getSnapshot(): EngineSnapshot {
    return { ...this.state, decisions: [...this.state.decisions] };
  }
  getResult(): FlightResult {
    return { ...this.getSnapshot(), level: this.level, mode: this.mode };
  }
  getFrame(): FlightFrame {
    const index =
      this.state.decisionCount * FLIGHT.obstaclesPerDecision + this.section;
    const gap = obstacleGap(index);
    const x = FLIGHT.width + 20 - this.worldOffset;
    return {
      playerY: this.playerY,
      obstacleX: x,
      gapTop: gap.top,
      gapBottom: gap.bottom,
      coinX: x + 100,
      coinY: (gap.top + gap.bottom) / 2,
      coinValue:
        this.level.id === 'goal' ? [1000, 2000, 5000][index % 3] : 1000,
      coinVisible:
        this.mode === 'manual' && this.level.id !== 'budget' && !this.collected,
      gateX: this.gateX,
      choosing:
        this.state.gameStatus === 'decision' &&
        this.state.decisionPhase === 'choosing',
      invulnerable: this.invulnerable > 0,
    };
  }
  private changed() {
    this.revision += 1;
  }
  private saveCheckpoint(): FlightCheckpoint {
    const s = this.state;
    return {
      score: s.score,
      practiceSavings: s.practiceSavings,
      practiceSpent: s.practiceSpent,
      practiceReserved: s.practiceReserved,
      budgetRemaining: s.budgetRemaining,
      decisionCount: s.decisionCount,
      correctDecisionCount: s.correctDecisionCount,
      coinsCollected: s.coinsCollected,
      decisions: [...s.decisions],
    };
  }
  private resetSection() {
    this.worldOffset = 0;
    this.playerY = 182;
    this.velocity = 0;
    this.passed = false;
    this.collected = false;
    this.accumulator = 0;
  }
  start() {
    if (this.state.gameStatus !== 'idle') {
      return;
    }
    this.state.gameStatus = 'playing';
    this.changed();
  }
  tap() {
    if (
      this.mode === 'manual' &&
      (this.state.gameStatus === 'playing' ||
        (this.state.gameStatus === 'decision' &&
          this.state.decisionPhase === 'choosing'))
    ) {
      this.velocity = FLIGHT.jumpVelocity;
    }
  }
  pause() {
    if (!['playing', 'decision', 'hit'].includes(this.state.gameStatus)) {
      return;
    }
    this.previousStatus = this.state.gameStatus;
    this.state.gameStatus = 'paused';
    this.accumulator = 0;
    this.changed();
  }
  resume() {
    if (this.state.gameStatus !== 'paused') {
      return;
    }
    this.state.gameStatus = this.previousStatus;
    this.accumulator = 0;
    this.changed();
  }
  flyToChoose() {
    if (
      this.mode !== 'manual' ||
      this.state.gameStatus !== 'decision' ||
      this.state.decisionPhase !== 'reading'
    ) {
      return;
    }
    this.state.decisionPhase = 'choosing';
    this.playerY = 182;
    this.velocity = 0;
    this.gateX = 260;
    this.accumulator = 0;
    this.changed();
  }
  resolveDecision(optionIndex: number) {
    const s = this.state;
    if (s.gameStatus !== 'decision' || s.decisionPhase === 'feedback') {
      return;
    }
    const scenario = s.currentScenario;
    const option = scenario?.options[optionIndex];
    if (!scenario || !option) {
      return;
    }
    const outcome = option.outcome;
    const affordable =
      (s.budgetRemaining === null || outcome.budgetCost <= s.budgetRemaining) &&
      s.practiceSavings + outcome.savingsDelta >= 0;
    let explanation = option.explanation;
    const thoughtful = option.recommended && affordable;
    if (!affordable) {
      explanation =
        'There is not enough practice money for this choice. No money was moved. Earlier spending can leave later needs or savings unfunded.';
    } else {
      s.practiceSavings += outcome.savingsDelta;
      s.practiceSpent += outcome.spent;
      s.practiceReserved += outcome.reserved;
      if (s.budgetRemaining !== null) {
        s.budgetRemaining -= outcome.budgetCost;
        const remainingPlan = [25000, 15000, 11000, 6000, 0][s.decisionCount];
        if (s.budgetRemaining < remainingPlan) {
          explanation +=
            ' Your remaining budget cannot cover the rest of the original plan; a shortfall remains.';
        }
      }
    }
    const record: DecisionRecord = {
      scenarioId: scenario.id,
      prompt: scenario.prompt,
      concept: scenario.concept,
      answer: option.label,
      thoughtful,
      explanation,
    };
    s.decisions = [...s.decisions, record];
    s.feedback = record;
    s.decisionCount += 1;
    s.correctDecisionCount += thoughtful ? 1 : 0;
    s.decisionPhase = 'feedback';
    this.section = 0;
    this.checkpoint = this.saveCheckpoint();
    this.accumulator = 0;
    this.changed();
  }
  continueFlight() {
    const s = this.state;
    if (s.gameStatus === 'hit') {
      s.gameStatus = 'playing';
    } else if (s.gameStatus === 'decision' && s.decisionPhase === 'feedback') {
      s.gameStatus =
        s.decisionCount === FLIGHT.decisions ? 'completed' : 'playing';
      s.currentScenario = null;
      s.feedback = null;
      s.decisionPhase = 'reading';
      this.resetSection();
    } else {
      return;
    }
    this.changed();
  }
  private hit() {
    const lives = this.state.lives - 1;
    Object.assign(this.state, this.checkpoint, {
      lives,
      gameStatus: lives === 0 ? 'gameOver' : 'hit',
      currentScenario: null,
      feedback: null,
      decisionPhase: 'reading',
    });
    this.section = 0;
    this.resetSection();
    this.invulnerable = FLIGHT.invulnerableSeconds;
    this.changed();
  }
  advance(seconds: number) {
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return;
    }
    const running = () =>
      this.state.gameStatus === 'playing' ||
      (this.state.gameStatus === 'decision' &&
        this.state.decisionPhase === 'choosing');
    if (!running()) {
      return;
    }
    this.accumulator += Math.min(seconds, FLIGHT.maxFrameDelta);
    while (this.accumulator >= FLIGHT.fixedStep && running()) {
      this.accumulator -= FLIGHT.fixedStep;
      this.step(FLIGHT.fixedStep);
    }
  }
  private step(dt: number) {
    this.state.activeSeconds += dt;
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    const choosing = this.state.gameStatus === 'decision';
    const gap = obstacleGap(this.state.decisionCount * 3 + this.section);
    if (this.mode === 'assisted') {
      this.playerY = (gap.top + gap.bottom) / 2 - FLIGHT.playerSize / 2;
    } else {
      const next = integrate(this.playerY, this.velocity, dt);
      this.playerY = next.y;
      this.velocity = next.velocity;
    }
    if (choosing) {
      // Decision flight is safe: no collisions, and both answer buttons remain available.
      this.playerY = Math.max(
        FLIGHT.upperGateTop,
        Math.min(
          FLIGHT.lowerGateTop + FLIGHT.gateHeight - FLIGHT.playerSize,
          this.playerY,
        ),
      );
      this.gateX = Math.max(
        FLIGHT.playerX,
        this.gateX - FLIGHT.decisionSpeed * dt,
      );
      if (this.gateX <= FLIGHT.playerX) {
        const center = this.playerY + FLIGHT.playerSize / 2;
        if (
          center >= FLIGHT.upperGateTop &&
          center <= FLIGHT.upperGateTop + FLIGHT.gateHeight
        ) {
          this.resolveDecision(0);
        } else if (
          center >= FLIGHT.lowerGateTop &&
          center <= FLIGHT.lowerGateTop + FLIGHT.gateHeight
        ) {
          this.resolveDecision(1);
        }
        // Park at the gates if between openings. Steering and answer buttons
        // remain available without a timeout or an accidental automatic answer.
      }
      return;
    }
    this.worldOffset +=
      (FLIGHT.scrollSpeed + this.state.decisionCount * FLIGHT.speedIncrease) *
      dt;
    const frame = this.getFrame();
    const player = playerBounds(this.playerY);
    if (
      this.mode === 'manual' &&
      this.invulnerable === 0 &&
      (player.y < 0 ||
        player.y + player.height > FLIGHT.height ||
        overlaps(player, {
          x: frame.obstacleX,
          y: 0,
          width: FLIGHT.obstacleWidth,
          height: gap.top,
        }) ||
        overlaps(player, {
          x: frame.obstacleX,
          y: gap.bottom,
          width: FLIGHT.obstacleWidth,
          height: FLIGHT.height - gap.bottom,
        }))
    ) {
      this.hit();
      return;
    }
    if (!this.passed && frame.obstacleX + FLIGHT.obstacleWidth < player.x) {
      this.passed = true;
      if (this.mode === 'manual') {
        this.state.score += 1;
        this.changed();
      }
    }
    if (
      frame.coinVisible &&
      overlaps(player, {
        x: frame.coinX - 12,
        y: frame.coinY - 12,
        width: 24,
        height: 24,
      })
    ) {
      this.collected = true;
      this.state.coinsCollected += 1;
      this.state.practiceSavings += frame.coinValue;
      this.changed();
    }
    if (frame.coinX < -24) {
      this.section += 1;
      // Preserve altitude between ordinary obstacles; reset only horizontal objects.
      this.worldOffset = 0;
      this.passed = false;
      this.collected = false;
      this.changed();
      if (this.section === FLIGHT.obstaclesPerDecision) {
        this.state.gameStatus = 'decision';
        this.state.currentScenario =
          SCENARIOS[this.level.id][this.state.decisionCount];
        this.state.decisionPhase = 'reading';
        this.accumulator = 0;
        this.changed();
      }
    }
  }
}

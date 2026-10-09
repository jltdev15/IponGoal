import {
  goalBuilderReducer,
  newGoalBuilderSession,
} from '../src/games/goalBuilder/GoalBuilderSession';
import {
  saveOrSpendReducer,
  newSaveOrSpendSession,
} from '../src/games/saveOrSpend/SaveOrSpendSession';
import {
  budgetReducer,
  newBudgetSession,
} from '../src/games/budgetChallenge/BudgetChallengeSession';
import { createNeedsOrWantsRound } from '../src/games/needsOrWants/NeedsOrWantsScenarios';
import {
  newNeedsOrWantsSession,
  needsOrWantsReducer,
} from '../src/games/needsOrWants/NeedsOrWantsSession';
jest.mock('@op-engineering/op-sqlite', () => {
  const { DatabaseSync: SQLite } = require('node:sqlite');
  return {
    open: () => {
      const db = new SQLite(':memory:');
      return {
        executeSync: (sql: string, params: unknown[] = []) => {
          const statement = db.prepare(sql);
          if (/^(SELECT|PRAGMA)/i.test(sql.trim())) {
            return { rows: statement.all(...params) };
          }
          statement.run(...params);
          return { rows: [] };
        },
        close: () => db.close(),
      };
    },
  };
});
import { SavingsFlightEngine } from '../src/games/savingsFlight/SavingsFlightEngine';
import { LEVELS } from '../src/games/savingsFlight/SavingsFlightConfig';
import { migrations } from '../src/database/migrations';
import {
  initializeDatabase,
  resetDatabase,
  execute,
  rows,
} from '../src/database/database';
import {
  createUser,
  authenticateUser,
  getUserById,
  getUserByUsername,
  updateProfile,
} from '../src/database/repositories/userRepository';
import {
  createGoal,
  updateGoal,
  getGoalById,
  getGoalsByUser,
  completeGoal,
  archiveGoal,
  restoreGoal,
  deleteGoal,
} from '../src/database/repositories/goalRepository';
import {
  addSavings,
  updateSavings,
  deleteSavings,
  getSavingsHistory,
  getTotalSavings,
} from '../src/database/repositories/savingsRepository';
import {
  saveSession,
  clearSession,
  rememberedUserId,
  setSetting,
} from '../src/database/repositories/settingsRepository';
import {
  toCentavos,
  MAX_CENTAVOS,
  formatCurrency,
} from '../src/utils/currency';
import { isValidDate, localDate, periodBounds } from '../src/utils/dates';
import { goalProgress, statistics } from '../src/utils/calculations';
import { validateRegistration } from '../src/utils/validation';
const input = {
  name: 'New Phone',
  targetAmount: 1500000,
  targetDate: null,
  category: 'Electronics',
  icon: 'phone',
  note: '',
};
let userId: string, otherId: string;
beforeAll(async () => {
  initializeDatabase();
  userId = (
    await createUser('John Student', 'john', 'test123', 'test123', 'Grade 10')
  ).id;
  otherId = (
    await createUser('Other Student', 'other', 'test123', 'test123', '')
  ).id;
});
beforeEach(() => {
  execute('DELETE FROM savings');
  execute('DELETE FROM goals');
  clearSession();
});
test('registration hashes passwords and strips them from public profiles', () => {
  const stored = getUserByUsername('JOHN')!;
  expect(stored.passwordHash).toMatch(/^pbkdf2-sha256\$210000\$/);
  expect(stored.passwordHash).not.toContain('test123');
  expect(getUserById(userId)).not.toHaveProperty('passwordHash');
});
test('duplicate usernames are rejected case-insensitively', async () => {
  await expect(
    createUser('Jane', 'JOHN', '123456', '123456', ''),
  ).rejects.toThrow('already used');
});
test('registration validates mismatched and short passwords and usernames', () => {
  expect(() =>
    validateRegistration('John', 'john', '123456', '654321'),
  ).toThrow('do not match');
  expect(() => validateRegistration('John', 'john', '123', '123')).toThrow(
    '6–128',
  );
  expect(() => validateRegistration('John', 'abc', '123456', '123456')).toThrow(
    '4–32',
  );
  expect(() => validateRegistration(' ', 'john', '123456', '123456')).toThrow(
    'full name',
  );
});
test('offline login works and rejects wrong credentials', async () => {
  expect((await authenticateUser('JOHN', 'test123')).id).toBe(userId);
  await expect(authenticateUser('john', 'incorrect')).rejects.toThrow(
    'Incorrect username or password',
  );
  await expect(authenticateUser('missing', 'test123')).rejects.toThrow(
    'Incorrect username or password',
  );
});
test('remembered sessions persist, logout clears only session, and login still works', async () => {
  saveSession(userId, true);
  expect(rememberedUserId()).toBe(userId);
  clearSession();
  expect(rememberedUserId()).toBeUndefined();
  expect((await authenticateUser('john', 'test123')).id).toBe(userId);
  saveSession(userId, false);
  expect(rememberedUserId()).toBeUndefined();
});
test('malformed session preferences do not crash', () => {
  setSetting('session', 'invalid');
  expect(rememberedUserId()).toBeUndefined();
});
test('goal creation stores starting savings as a transaction', () => {
  const id = createGoal(userId, input, 450000),
    g = getGoalById(userId, id)!;
  expect(g.savedAmount).toBe(450000);
  expect(g.entryCount).toBe(1);
  expect(getSavingsHistory(userId)[0].note).toBe('Starting savings');
  expect(g.status).toBe('active');
});
test('starting savings reaching the target complete the goal', () => {
  const id = createGoal(userId, input, 1500000);
  expect(getGoalById(userId, id)!.status).toBe('completed');
});
test('goal edits and deletion of empty goals', () => {
  const id = createGoal(userId, input, 0);
  updateGoal(userId, id, { ...input, name: 'Laptop' });
  expect(getGoalById(userId, id)!.name).toBe('Laptop');
  deleteGoal(userId, id);
  expect(getGoalById(userId, id)).toBeUndefined();
});
test('goal deletion cascades savings', () => {
  const id = createGoal(userId, input, 100);
  deleteGoal(userId, id);
  expect(getSavingsHistory(userId)).toHaveLength(0);
});
test('archive retains history, excludes active/completed counts, and restores', () => {
  const id = createGoal(userId, input, 100);
  archiveGoal(userId, id);
  expect(getTotalSavings(userId)).toBe(100);
  expect(
    statistics(getGoalsByUser(userId), getSavingsHistory(userId)).active,
  ).toBe(0);
  expect(() =>
    addSavings(userId, id, {
      amount: 100,
      transactionDate: localDate(),
      note: '',
    }),
  ).toThrow('Restore');
  restoreGoal(userId, id);
  expect(getGoalById(userId, id)!.status).toBe('active');
});
test('add, edit, and delete savings recalculate totals exactly', () => {
  const id = createGoal(userId, input, 0),
    sid = addSavings(userId, id, {
      amount: 1010,
      transactionDate: '2026-10-01',
      note: 'Allowance',
    });
  expect(getGoalById(userId, id)!.savedAmount).toBe(1010);
  updateSavings(userId, sid, {
    amount: 2025,
    transactionDate: '2026-09-30',
    note: 'Updated',
  });
  expect(getTotalSavings(userId)).toBe(2025);
  expect(getSavingsHistory(userId)[0].note).toBe('Updated');
  deleteSavings(userId, sid);
  expect(getGoalById(userId, id)!.savedAmount).toBe(0);
});
test('exceeding target caps progress but retains real savings', () => {
  const id = createGoal(userId, input, 0);
  addSavings(userId, id, {
    amount: 1600000,
    transactionDate: '2026-10-01',
    note: '',
  });
  const g = getGoalById(userId, id)!;
  expect(goalProgress(g.savedAmount, g.targetAmount)).toMatchObject({
    visual: 100,
    remaining: 0,
    exceeded: 100000,
  });
  completeGoal(userId, id);
  expect(getGoalById(userId, id)!.completedAt).toBeTruthy();
});
test('editing savings below target reopens a completed goal', () => {
  const id = createGoal(userId, input, 1500000),
    sid = getSavingsHistory(userId)[0].id;
  updateSavings(userId, sid, {
    amount: 100,
    transactionDate: '2026-10-01',
    note: '',
  });
  expect(getGoalById(userId, id)).toMatchObject({
    status: 'active',
    completedAt: null,
  });
});
test('deleting savings below target reopens a completed goal', () => {
  const id = createGoal(userId, input, 1500000);
  deleteSavings(userId, getSavingsHistory(userId)[0].id);
  expect(getGoalById(userId, id)!.status).toBe('active');
});
test('increasing target above balance reopens completed goals', () => {
  const id = createGoal(userId, input, 1500000);
  updateGoal(userId, id, { ...input, targetAmount: 2000000 });
  expect(getGoalById(userId, id)!.status).toBe('active');
});
test('a goal cannot be completed below target', () => {
  const id = createGoal(userId, input, 0);
  expect(() => completeGoal(userId, id)).toThrow('Reach your target');
});
test('multiple goals and users are isolated including mutations', () => {
  const id = createGoal(userId, input, 100),
    other = createGoal(otherId, input, 500);
  expect(getGoalById(otherId, id)).toBeUndefined();
  expect(getGoalsByUser(otherId)).toHaveLength(1);
  expect(getTotalSavings(userId)).toBe(100);
  expect(() => updateGoal(otherId, id, input)).toThrow('not found');
  expect(() => deleteGoal(otherId, id)).toThrow('not found');
  const sid = getSavingsHistory(userId)[0].id;
  expect(() => deleteSavings(otherId, sid)).toThrow('not found');
  expect(() =>
    addSavings(otherId, id, {
      amount: 100,
      transactionDate: '2026-10-01',
      note: '',
    }),
  ).toThrow();
  expect(getGoalById(otherId, other)!.savedAmount).toBe(500);
});
test('history filters combine goals with inclusive date bounds', () => {
  const a = createGoal(userId, input, 0),
    b = createGoal(userId, { ...input, name: 'School' }, 0);
  for (const [goalId, date] of [
    [a, '2026-09-30'],
    [a, '2026-10-01'],
    [b, '2026-10-01'],
  ]) {
    addSavings(userId, goalId, {
      amount: 100,
      transactionDate: date,
      note: '',
    });
  }
  expect(
    getSavingsHistory(userId, {
      goalId: a,
      from: '2026-10-01',
      to: '2026-10-31',
    }),
  ).toHaveLength(1);
  expect(
    getSavingsHistory(userId, { from: '2026-10-01', to: '2026-10-01' }),
  ).toHaveLength(2);
});
test('deterministic statistics use saving dates and include archived balances', () => {
  const id = createGoal(userId, input, 0);
  for (const [date, amount] of [
    ['2026-09-30', 100],
    ['2026-10-01', 200],
    ['2026-10-08', 300],
  ] as const) {
    addSavings(userId, id, { amount, transactionDate: date, note: '' });
  }
  const stats = statistics(
    getGoalsByUser(userId),
    getSavingsHistory(userId),
    new Date('2026-10-10T12:00:00'),
  );
  expect(stats).toMatchObject({
    total: 600,
    month: 500,
    week: 300,
    average: 200,
    count: 3,
    monthCount: 2,
    mostGoal: 'New Phone',
  });
  expect(stats.buckets).toEqual([200, 300, 0, 0, 0]);
});
test('profile updates preserve username', () => {
  updateProfile(userId, 'John Updated', 'Grade 11');
  expect(getUserById(userId)).toMatchObject({
    fullName: 'John Updated',
    username: 'john',
    gradeLevel: 'Grade 11',
  });
});
test('amount input rejects negatives, zero targets, extra decimals, nonnumeric and huge values', () => {
  for (const value of ['-1', 'abc', '1e5', '1.001', 'Infinity', '1000000001']) {
    expect(() => toCentavos(value)).toThrow();
  }
  expect(toCentavos('10.25')).toBe(1025);
  expect(toCentavos('0.10')).toBe(10);
  expect(toCentavos('1000000000')).toBe(MAX_CENTAVOS);
  expect(() => createGoal(userId, { ...input, targetAmount: 0 }, 0)).toThrow();
  expect(() => createGoal(userId, input, -1)).toThrow();
});
test('large balances enforce aggregate limit and rollback failed starting savings', () => {
  createGoal(userId, { ...input, targetAmount: MAX_CENTAVOS }, MAX_CENTAVOS);
  expect(() => createGoal(userId, input, 1)).toThrow('cannot exceed');
  expect(getGoalsByUser(userId)).toHaveLength(1);
});
test('date helpers handle leap years, local calendar dates, and Monday weeks', () => {
  expect(isValidDate('2024-02-29')).toBe(true);
  expect(isValidDate('2026-02-29')).toBe(false);
  expect(isValidDate('2026-13-01')).toBe(false);
  expect(periodBounds('week', new Date('2026-10-04T12:00:00'))).toEqual({
    from: '2026-09-28',
    to: '2026-10-04',
  });
  expect(formatCurrency(1025)).toContain('10.25');
});
test('SQLite foreign keys reject cross-user goal references', () => {
  const id = createGoal(userId, input, 0);
  expect(() =>
    execute('INSERT INTO savings VALUES (?,?,?,?,?,?,?,?)', [
      'bad',
      otherId,
      id,
      100,
      '',
      '2026-10-01',
      'now',
      'now',
    ]),
  ).toThrow();
});
test('missing records fail safely', () => {
  expect(() =>
    updateSavings(userId, 'missing', {
      amount: 10,
      transactionDate: '2026-10-01',
      note: '',
    }),
  ).toThrow('not found');
});
test('migration is transactional and constraints reject bad status and zero savings', () => {
  expect(
    rows<{ user_version: number }>('PRAGMA user_version')[0].user_version,
  ).toBe(migrations.length);
  const id = createGoal(userId, input, 0);
  expect(() =>
    execute('UPDATE goals SET status=? WHERE id=?', ['invalid', id]),
  ).toThrow();
  expect(() =>
    addSavings(userId, id, {
      amount: 0,
      transactionDate: '2026-10-01',
      note: '',
    }),
  ).toThrow();
});
test('profile photos persist per account, survive text edits, and can be removed', () => {
  const photo = 'data:image/png;base64,aGVsbG8=';
  updateProfile(userId, 'John Updated', 'Grade 11', photo);
  expect(getUserById(userId).profilePhoto).toBe(photo);
  expect(getUserById(otherId).profilePhoto).toBeNull();
  updateProfile(userId, 'John Updated Again', 'Grade 12');
  expect(getUserById(userId).profilePhoto).toBe(photo);
  expect(() =>
    updateProfile(userId, 'John', '', 'https://example.com/photo.png'),
  ).toThrow('Please choose');
  expect(getUserById(userId).profilePhoto).toBe(photo);
  updateProfile(userId, 'John', '', null);
  expect(getUserById(userId).profilePhoto).toBeNull();
});
test('goal cover photos persist, remain account-isolated, survive legacy edits, and clear explicitly', () => {
  const photo = 'data:image/png;base64,aGVsbG8=';
  const id = createGoal(userId, { ...input, coverPhoto: photo }, 100);
  expect(getGoalById(userId, id)?.coverPhoto).toBe(photo);
  expect(getGoalById(otherId, id)).toBeUndefined();
  updateGoal(userId, id, { ...input, name: 'Updated' });
  expect(getGoalById(userId, id)?.coverPhoto).toBe(photo);
  expect(() => updateGoal(otherId, id, { ...input, coverPhoto: null })).toThrow(
    'not found',
  );
  expect(() =>
    createGoal(
      userId,
      { ...input, coverPhoto: 'https://example.com/photo.png' },
      100,
    ),
  ).toThrow('Please choose');
  updateGoal(userId, id, { ...input, coverPhoto: null });
  expect(getGoalById(userId, id)?.coverPhoto).toBeNull();
  updateGoal(userId, id, { ...input, coverPhoto: photo });
  deleteGoal(userId, id);
  expect(getGoalById(userId, id)).toBeUndefined();
  expect(rows('SELECT * FROM savings WHERE goalId=?', [id])).toHaveLength(0);
});

test('completed, repeated, and interrupted learning games never change real savings data', () => {
  const snapshot = () => ({
    goals: rows('SELECT * FROM goals ORDER BY id'),
    savings: rows('SELECT * FROM savings ORDER BY id'),
    users: rows('SELECT * FROM users ORDER BY id'),
    settings: rows('SELECT * FROM app_settings ORDER BY key'),
    statistics: statistics(getGoalsByUser(userId), getSavingsHistory(userId)),
  });
  const before = snapshot();
  for (const level of LEVELS) {
    for (let repeat = 0; repeat < 2; repeat++) {
      const engine = new SavingsFlightEngine(level.id, 'assisted');
      engine.start();
      for (let decision = 0; decision < 5; decision++) {
        for (
          let frame = 0;
          frame < 3000 && engine.getSnapshot().gameStatus === 'playing';
          frame++
        ) {
          engine.advance(1 / 60);
        }
        engine.resolveDecision(
          engine
            .getSnapshot()
            .currentScenario!.options.findIndex(option => option.recommended),
        );
        engine.continueFlight();
      }
      expect(engine.getSnapshot().gameStatus).toBe('completed');
    }
    const interrupted = new SavingsFlightEngine(level.id, 'manual');
    interrupted.start();
    interrupted.advance(0.1);
    interrupted.pause();
  }
  for (let repeat = 0; repeat < 2; repeat++) {
    const scenarios = createNeedsOrWantsRound();
    let practice = needsOrWantsReducer(newNeedsOrWantsSession(scenarios), {
      type: 'start',
    });
    for (const scenario of scenarios) {
      practice = needsOrWantsReducer(practice, {
        type: 'answer',
        classification: scenario.classification,
      });
      practice = needsOrWantsReducer(practice, { type: 'continue' });
    }
    expect(practice.phase).toBe('completed');
  }
  const partial = needsOrWantsReducer(
    newNeedsOrWantsSession(createNeedsOrWantsRound()),
    { type: 'start' },
  );
  needsOrWantsReducer(partial, { type: 'answer', classification: 'want' });
  for (const count of [2, 5, 5]) {
    let budget = budgetReducer(newBudgetSession(), { type: 'start' });
    for (let index = 0; index < count; index++) {
      budget = budgetReducer(budget, { type: 'answer', optionIndex: 0 });
      budget = budgetReducer(budget, { type: 'continue' });
    }
    budgetReducer(budget, { type: 'restart' });
  }
  for (const count of [2, 5, 5]) {
    let practice = saveOrSpendReducer(newSaveOrSpendSession(), {
      type: 'start',
    });
    for (let index = 0; index < count; index++) {
      practice = saveOrSpendReducer(practice, {
        type: 'answer',
        optionIndex: index % 2,
      });
      practice = saveOrSpendReducer(practice, { type: 'continue' });
    }
    saveOrSpendReducer(practice, { type: 'restart' });
  }
  for (const count of [1, 3, 3]) {
    let practice = goalBuilderReducer(newGoalBuilderSession(), {
      type: 'start',
    });
    practice = goalBuilderReducer(practice, { type: 'goal', goalId: 'books' });
    practice = goalBuilderReducer(practice, { type: 'target', amount: 30000 });
    practice = goalBuilderReducer(practice, { type: 'begin' });
    for (let index = 0; index < count; index++) {
      practice = goalBuilderReducer(practice, {
        type: 'answer',
        optionIndex: index % 2,
      });
      practice = goalBuilderReducer(practice, { type: 'continue' });
    }
    goalBuilderReducer(practice, { type: 'restart' });
  }
  expect(snapshot()).toEqual(before);
});
test('empty database has sensible statistics and reset removes all device accounts', () => {
  expect(statistics([], []).total).toBe(0);
  expect(statistics([], []).average).toBe(0);
  resetDatabase();
  expect(getUserById(userId)).toBeUndefined();
  expect(getSavingsHistory(userId)).toEqual([]);
  expect(rememberedUserId()).toBeUndefined();
});
// The adapter executes the production SQL against SQLite, not an in-memory array mock.

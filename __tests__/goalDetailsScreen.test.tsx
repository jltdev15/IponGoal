import React from 'react';
import { Alert, Text } from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { GoalDetailsScreen } from '../src/screens/GoalDetailsScreen';
import { AppButton } from '../src/components/AppButton';
import { Goal, Saving } from '../src/types/models';

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('../src/components/Icon', () => ({ Icon: () => null }));
jest.mock('lucide-react-native', () =>
  Object.fromEntries(
    [
      'ArrowDownLeft',
      'ArrowRight',
      'CalendarDays',
      'CircleCheck',
      'Ellipsis',
      'Flag',
    ].map(name => [name, name + 'Icon']),
  ),
);
const mockArchive = jest.fn();
const mockRestore = jest.fn();
const mockComplete = jest.fn();
const mockDelete = jest.fn();
const mockRefresh = jest.fn();
jest.mock('../src/database/repositories/goalRepository', () => ({
  archiveGoal: (...args: unknown[]) => mockArchive(...args),
  restoreGoal: (...args: unknown[]) => mockRestore(...args),
  completeGoal: (...args: unknown[]) => mockComplete(...args),
  deleteGoal: (...args: unknown[]) => mockDelete(...args),
}));
jest.mock('../src/services/refresh', () => ({
  refreshData: (...args: unknown[]) => mockRefresh(...args),
}));
jest.mock('../src/stores/authStore', () => ({
  useAuthStore: (select: (state: unknown) => unknown) =>
    select({ user: { id: 'user' } }),
}));
let mockGoals: Goal[];
let mockEntries: Saving[];
jest.mock('../src/stores/goalStore', () => ({
  useGoalStore: (select: (state: unknown) => unknown) =>
    select({ goals: mockGoals }),
}));
jest.mock('../src/stores/savingsStore', () => ({
  useSavingsStore: (select: (state: unknown) => unknown) =>
    select({ savings: mockEntries }),
}));
let renderer: ReactTestRenderer;
const navigation = { navigate: jest.fn(), goBack: jest.fn() };
const alert = jest.spyOn(Alert, 'alert');
function action(label: string) {
  return renderer.root.findAll(
    node =>
      node.props.accessibilityRole === 'button' &&
      node.props.accessibilityLabel === label &&
      typeof node.props.onPress === 'function',
  )[0];
}
function textContent() {
  return renderer.root
    .findAllByType(Text)
    .map(node => React.Children.toArray(node.props.children).join(''))
    .join('\n')
    .replace(/\u200b/g, '');
}
async function render() {
  await act(async () => {
    renderer = create(
      <GoalDetailsScreen
        route={{
          key: 'details',
          name: 'GoalDetails',
          params: { goalId: 'goal' },
        }}
        navigation={navigation as never}
      />,
    );
  });
}
async function press(label: string) {
  await act(async () => action(label).props.onPress());
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  jest.clearAllMocks();
  for (const mock of [
    mockArchive,
    mockRestore,
    mockComplete,
    mockDelete,
    mockRefresh,
  ])
    mock.mockReset();
  mockGoals = [
    {
      id: 'goal',
      userId: 'user',
      name: 'School supplies',
      targetAmount: 100000,
      savedAmount: 25000,
      targetDate: '2026-12-01',
      category: 'Education',
      icon: 'book',
      note: 'Saving from my allowance.',
      coverPhoto: null,
      status: 'active',
      entryCount: 1,
      createdAt: '2026-10-01T04:30:00.000Z',
      updatedAt: '',
      completedAt: null,
    },
  ];
  mockEntries = [
    {
      id: 'entry',
      userId: 'user',
      goalId: 'goal',
      goalName: 'School supplies',
      amount: 25000,
      note: 'Weekly allowance',
      transactionDate: '2026-10-01',
      createdAt: '2026-10-01T04:30:00.000Z',
      updatedAt: '',
    },
    { id: 'other', goalId: 'another-goal', amount: 99900 } as Saving,
  ];
});
afterEach(async () => {
  if (renderer) await act(async () => renderer.unmount());
});

test('one icon-only options action exposes edit, archive, and explicit confirmed deletion', async () => {
  await render();
  expect(textContent()).not.toContain('Options');
  await press('Goal options');
  const buttons = alert.mock.calls.at(-1)![2]!;
  expect(buttons.map(button => button.text)).toEqual([
    'Edit Goal',
    'Archive Goal',
    'Delete Goal',
  ]);
  act(() => buttons[0].onPress!());
  expect(navigation.navigate).toHaveBeenCalledWith('EditGoal', {
    goalId: 'goal',
  });
  act(() => buttons[2].onPress!());
  expect(mockDelete).not.toHaveBeenCalled();
  expect(alert.mock.calls.at(-1)![1]).toContain('1 savings entries');
  await act(async () => alert.mock.calls.at(-1)![2]![1].onPress!());
  expect(mockDelete).toHaveBeenCalledWith('user', 'goal');
  expect(mockRefresh).toHaveBeenCalledWith('user');
  expect(navigation.goBack).toHaveBeenCalledTimes(1);
});

test('summary and recent savings keep goal-specific amounts and navigation', async () => {
  await render();
  expect(textContent()).toContain('₱250');
  expect(textContent()).toContain('₱1,000');
  expect(textContent()).toContain('₱750');
  expect(textContent()).toContain('25%');
  expect(textContent()).toContain('1 contribution');
  expect(textContent()).not.toContain('999');
  await press('Add Savings');
  await press('View all savings');
  const entry = renderer.root.findAll(
    node =>
      node.props.accessibilityRole === 'button' &&
      typeof node.props.accessibilityLabel === 'string' &&
      node.props.accessibilityLabel.includes('saved on') &&
      typeof node.props.onPress === 'function',
  )[0];
  await act(async () => entry.props.onPress());
  expect(navigation.navigate.mock.calls).toEqual([
    ['AddSavings', { goalId: 'goal' }],
    ['BottomTabs', { screen: 'History', params: { goalId: 'goal' } }],
    ['SavingsDetails', { savingId: 'entry' }],
  ]);
});

test('archived goals offer restoration and retain their savings history', async () => {
  mockGoals[0].status = 'archived';
  await render();
  expect(textContent()).toContain('Archived');
  expect(textContent()).toContain('Weekly allowance');
  expect(
    renderer.root.findAllByType(AppButton).map(node => node.props.title),
  ).toEqual(['Restore Goal']);
  await press('Restore Goal');
  expect(mockRestore).toHaveBeenCalledWith('user', 'goal');
  expect(mockRefresh).toHaveBeenCalledWith('user');
  expect(navigation.goBack).not.toHaveBeenCalled();
});

test('over-target active goals cap progress, show surplus, and allow completion', async () => {
  mockGoals[0].savedAmount = 120000;
  await render();
  expect(textContent()).toContain('100%+');
  expect(textContent()).toContain('Above target');
  expect(textContent()).toContain('₱200');
  expect(
    renderer.root.findAllByProps({ accessibilityRole: 'progressbar' })[0].props
      .accessibilityValue.now,
  ).toBe(100);
  await press('Mark as Completed');
  expect(mockComplete).toHaveBeenCalledWith('user', 'goal');
  expect(mockRefresh).toHaveBeenCalledWith('user');
});

test('completed goals retain the completion date and allow additional savings', async () => {
  mockGoals[0].status = 'completed';
  mockGoals[0].savedAmount = 100000;
  mockGoals[0].completedAt = '2026-10-10T04:30:00.000Z';
  await render();
  expect(textContent()).toContain('Completed on');
  expect(textContent()).toContain('October 10, 2026');
  expect(
    renderer.root.findAllByType(AppButton).map(node => node.props.title),
  ).toEqual(['Add Savings']);
});

test('failed mutation retains the goal and shows a recoverable error', async () => {
  mockArchive.mockImplementationOnce(() => {
    throw new Error('database unavailable');
  });
  await render();
  await press('Goal options');
  await act(async () => alert.mock.calls.at(-1)![2]![1].onPress!());
  expect(textContent()).toContain(
    'Unable to update this goal. Please try again.',
  );
  expect(textContent()).toContain('School supplies');
  expect(mockRefresh).not.toHaveBeenCalled();
  expect(navigation.goBack).not.toHaveBeenCalled();
});

test('empty and missing goals provide the relevant next action', async () => {
  mockEntries = [];
  await render();
  expect(textContent()).toContain('Your first saving starts here');
  expect(action('View all savings')).toBeUndefined();
  await act(async () => renderer.unmount());
  mockGoals = [];
  await render();
  expect(textContent()).toContain('Goal not found.');
  await press('Go to Goals');
  expect(navigation.navigate).toHaveBeenCalledWith('BottomTabs', {
    screen: 'Home',
  });
});

import React from 'react';
import { AccessibilityInfo, Alert, Text } from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { SavingsDetailsScreen } from '../src/screens/SavingsDetailsScreen';
import { AppButton } from '../src/components/AppButton';
import { Saving } from '../src/types/models';
import { formatCurrency } from '../src/utils/currency';
import { formatDate } from '../src/utils/dates';

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('../src/components/Icon', () => ({ Icon: () => null }));
const mockDelete = jest.fn();
const mockRefresh = jest.fn();
jest.mock('../src/database/repositories/savingsRepository', () => ({
  deleteSavings: (...args: unknown[]) => mockDelete(...args),
}));
jest.mock('../src/services/refresh', () => ({
  refreshData: (...args: unknown[]) => mockRefresh(...args),
}));
jest.mock('../src/stores/authStore', () => ({
  useAuthStore: (select: (state: unknown) => unknown) =>
    select({ user: { id: 'user' } }),
}));
let mockEntries: Saving[];
jest.mock('../src/stores/savingsStore', () => ({
  useSavingsStore: (select: (state: unknown) => unknown) =>
    select({ savings: mockEntries }),
}));

let renderer: ReactTestRenderer;
const navigation = { navigate: jest.fn(), goBack: jest.fn() };
const alert = jest.spyOn(Alert, 'alert');
const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
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
      <SavingsDetailsScreen
        route={{
          key: 'details',
          name: 'SavingsDetails',
          params: { savingId: 'entry' },
        }}
        navigation={navigation as never}
      />,
    );
  });
}
function confirmation() {
  return alert.mock.calls.at(-1)!;
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  jest.clearAllMocks();
  mockDelete.mockReset();
  mockRefresh.mockReset();
  mockEntries = [
    {
      id: 'entry',
      userId: 'user',
      goalId: 'goal',
      goalName: 'School books',
      amount: 12345,
      note: 'Saved from allowance',
      transactionDate: '2026-10-01',
      createdAt: '2026-10-07T04:30:00.000Z',
      updatedAt: '2026-10-07T04:30:00.000Z',
    },
  ];
});
afterEach(async () => {
  if (renderer) {
    await act(async () => renderer.unmount());
  }
});

test('labels exact amount, saved date, recorded date and note separately', async () => {
  await render();
  const text = textContent();
  for (const expected of [
    'Amount saved',
    formatCurrency(12345),
    'Savings goal',
    'School books',
    'Date saved',
    formatDate('2026-10-01'),
    'Note',
    'Saved from allowance',
    `Recorded on ${formatDate(mockEntries[0].createdAt)} at`,
    'When this entry was added to the app.',
  ]) {
    expect(text).toContain(expected);
  }
  expect(
    renderer.root.findAllByType(AppButton).map(node => node.props.title),
  ).toEqual(['Edit Entry']);
});

test.each(['', '   '])('empty note %j has a clear placeholder', async note => {
  mockEntries[0].note = note;
  await render();
  expect(textContent()).toContain('No note added');
});

test('long text and maximum amount remain complete without line limits', async () => {
  mockEntries[0].amount = 100_000_000_000;
  mockEntries[0].goalName =
    'A new computer and school supplies for the coming school year';
  mockEntries[0].note = 'Allowance savings. '.repeat(13);
  await render();
  expect(textContent()).toContain(formatCurrency(mockEntries[0].amount));
  expect(textContent()).toContain(mockEntries[0].goalName);
  expect(textContent()).toContain(mockEntries[0].note);
  expect(
    renderer.root.findAllByType(Text).every(node => !node.props.numberOfLines),
  ).toBe(true);
});

test('View Goal and Edit Entry navigate to the matching records', async () => {
  await render();
  act(() => action('View Goal').props.onPress());
  act(() => action('Edit Entry').props.onPress());
  expect(navigation.navigate.mock.calls).toEqual([
    ['GoalDetails', { goalId: 'goal' }],
    ['EditSavings', { savingId: 'entry' }],
  ]);
});

test('cancel and dismissal preserve the entry and permit another confirmation', async () => {
  await render();
  act(() => {
    action('Delete Entry').props.onPress();
    action('Delete Entry').props.onPress();
  });
  expect(alert).toHaveBeenCalledTimes(1);
  expect(confirmation()[1]).toContain('completed goal will reopen');
  expect(confirmation()[2]![1].style).toBe('destructive');
  act(() => confirmation()[2]![0].onPress!());
  act(() => action('Delete Entry').props.onPress());
  act(() => confirmation()[3]!.onDismiss!());
  act(() => action('Delete Entry').props.onPress());
  expect(alert).toHaveBeenCalledTimes(3);
  expect(mockDelete).not.toHaveBeenCalled();
  expect(navigation.goBack).not.toHaveBeenCalled();
});

test('confirmed deletion locks actions, rejects duplicates, refreshes and returns', async () => {
  await render();
  act(() => action('Delete Entry').props.onPress());
  const confirm = confirmation()[2]![1].onPress!;
  act(() => {
    confirm();
    confirm();
  });
  for (const label of ['Edit Entry', 'View Goal', 'Delete Entry']) {
    expect(action(label).props.disabled).toBe(true);
    act(() => action(label).props.onPress());
  }
  expect(textContent()).toContain('Deleting entry');
  await act(async () => {});
  expect(mockDelete).toHaveBeenCalledTimes(1);
  expect(mockDelete).toHaveBeenCalledWith('user', 'entry');
  expect(mockRefresh).toHaveBeenCalledWith('user');
  expect(navigation.goBack).toHaveBeenCalledTimes(1);
  expect(navigation.navigate).not.toHaveBeenCalled();
});

test('deletion failure announces the error, retains details and allows retry', async () => {
  mockDelete.mockImplementationOnce(() => {
    throw new Error('database unavailable');
  });
  await render();
  act(() => action('Delete Entry').props.onPress());
  await act(async () => confirmation()[2]![1].onPress!());
  expect(textContent()).toContain('Unable to delete this savings entry.');
  expect(textContent()).toContain('School books');
  expect(announce).toHaveBeenCalledWith('Unable to delete this savings entry.');
  expect(navigation.goBack).not.toHaveBeenCalled();
  expect(mockRefresh).not.toHaveBeenCalled();
  expect(action('Edit Entry').props.accessibilityState.disabled).toBe(false);
  act(() => action('Delete Entry').props.onPress());
  await act(async () => confirmation()[2]![1].onPress!());
  expect(mockDelete).toHaveBeenCalledTimes(2);
  expect(navigation.goBack).toHaveBeenCalledTimes(1);
});

test('missing entry offers the existing Go Back action', async () => {
  mockEntries = [];
  await render();
  expect(textContent()).toContain('Savings entry not found.');
  act(() => action('Go Back').props.onPress());
  expect(navigation.goBack).toHaveBeenCalledTimes(1);
  expect(renderer.root.findAllByType(AppButton)).toHaveLength(1);
});

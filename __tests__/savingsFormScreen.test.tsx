import React from 'react';
import { Text } from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { SavingsFormScreen } from '../src/screens/SavingsFormScreen';
import { AmountInput } from '../src/components/AmountInput';
import { AppButton } from '../src/components/AppButton';
import { Goal } from '../src/types/models';

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('../src/components/Icon', () => ({ Icon: () => null }));
const mockAddSavings = jest.fn();
jest.mock('../src/database/repositories/savingsRepository', () => ({
  addSavings: (...args: unknown[]) => mockAddSavings(...args),
  updateSavings: jest.fn(),
}));
jest.mock('../src/database/repositories/goalRepository', () => ({
  completeGoal: jest.fn(),
}));
jest.mock('../src/services/refresh', () => ({ refreshData: jest.fn() }));
jest.mock('../src/stores/authStore', () => ({
  useAuthStore: (select: (state: unknown) => unknown) =>
    select({ user: { id: 'user' } }),
}));
let mockGoal: Goal;
jest.mock('../src/stores/goalStore', () => ({
  useGoalStore: (select: (state: unknown) => unknown) =>
    select({ goals: [mockGoal] }),
}));
jest.mock('../src/stores/savingsStore', () => ({
  useSavingsStore: (select: (state: unknown) => unknown) =>
    select({ savings: [] }),
}));

test.each([false, true])(
  'saving success contains no raw text outside Text (target reached: %s)',
  async reached => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    mockGoal = {
      id: 'goal',
      userId: 'user',
      name: 'School books',
      targetAmount: 10000,
      savedAmount: 0,
      targetDate: null,
      category: 'Education',
      icon: 'book',
      note: '',
      coverPhoto: null,
      status: 'active',
      createdAt: '',
      updatedAt: '',
      completedAt: null,
      entryCount: 0,
    };
    mockAddSavings.mockImplementation(() => {
      mockGoal = { ...mockGoal, savedAmount: reached ? 10000 : 1000 };
    });
    let renderer!: ReactTestRenderer;
    await act(async () => {
      renderer = create(
        <SavingsFormScreen
          route={{ key: 'add', name: 'AddSavings', params: { goalId: 'goal' } }}
          navigation={{ goBack: jest.fn() } as never}
        />,
      );
    });
    try {
      await act(async () => {
        renderer.root.findByType(AmountInput).props.onChangeText('10');
      });
      await act(async () => {
        renderer.root
          .findAllByType(AppButton)
          .find(button => button.props.title === 'Add Savings')!
          .props.onPress();
      });
      expect(
        renderer.root
          .findAllByType(AppButton)
          .map(button => button.props.title),
      ).toEqual(reached ? ['Mark as Completed', 'Keep Saving'] : ['Done']);
      // The test renderer allows raw strings that Fabric rejects. Check native
      // children explicitly so even a whitespace string fails this regression.
      for (const node of renderer.root.findAll(
        candidate => typeof candidate.type === 'string',
      )) {
        if (String(node.type) === 'Text') {
          continue;
        }
        expect(
          node.children.filter(child => typeof child === 'string'),
        ).toEqual([]);
      }
      expect(
        renderer.root
          .findAllByType(Text)
          .some(
            node =>
              node.props.children ===
              (reached ? 'Goal Reached!' : 'Nice work!'),
          ),
      ).toBe(true);
    } finally {
      await act(async () => renderer.unmount());
    }
  },
);

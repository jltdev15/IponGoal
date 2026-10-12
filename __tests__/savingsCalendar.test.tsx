import React from 'react';
import { Platform, TextInput } from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { SavingsFormScreen } from '../src/screens/SavingsFormScreen';
import { CalendarDateField } from '../src/components/CalendarDateField';
import { AmountInput } from '../src/components/AmountInput';
import { AppButton } from '../src/components/AppButton';
import {
  addSavings,
  updateSavings,
} from '../src/database/repositories/savingsRepository';
import { Goal, Saving } from '../src/types/models';
import { localDate } from '../src/utils/dates';

jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: () => null,
  DateTimePickerAndroid: {
    open: jest.fn(),
    dismiss: jest.fn().mockResolvedValue(true),
  },
}));
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('lucide-react-native', () => ({ CalendarDays: () => null }));
jest.mock('../src/components/Icon', () => ({ Icon: () => null }));
jest.mock('../src/stores/authStore', () => ({
  useAuthStore: (select: (state: unknown) => unknown) =>
    select({ user: { id: 'user' } }),
}));
const mockGoal = {
  id: 'goal',
  name: 'School books',
  savedAmount: 0,
  targetAmount: 10000,
  status: 'active',
  entryCount: 0,
} as Goal;
jest.mock('../src/stores/goalStore', () => ({
  useGoalStore: (select: (state: unknown) => unknown) =>
    select({ goals: [mockGoal] }),
}));
let mockSavings: Saving[] = [];
jest.mock('../src/stores/savingsStore', () => ({
  useSavingsStore: (select: (state: unknown) => unknown) =>
    select({ savings: mockSavings }),
}));
jest.mock('../src/database/repositories/savingsRepository', () => ({
  addSavings: jest.fn(),
  updateSavings: jest.fn(),
}));
jest.mock('../src/database/repositories/goalRepository', () => ({
  completeGoal: jest.fn(),
}));
jest.mock('../src/services/refresh', () => ({ refreshData: jest.fn() }));

let renderer: ReactTestRenderer | undefined;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  jest.clearAllMocks();
  jest.replaceProperty(Platform, 'OS', 'android');
  mockSavings = [];
});
afterEach(async () => {
  if (renderer) {
    await act(async () => renderer!.unmount());
    renderer = undefined;
  }
  jest.restoreAllMocks();
});

test.each([
  [false, false],
  [false, true],
  [true, false],
  [true, true],
])(
  'savings calendar preserves or selects the local date before saving (edit: %s, select: %s)',
  async (edit, select) => {
    const original = edit ? '2026-10-01' : localDate();
    if (edit) {
      mockSavings = [
        {
          id: 'saving',
          goalId: 'goal',
          amount: 1000,
          transactionDate: original,
          note: 'Allowance',
        } as Saving,
      ];
    }
    const navigation = { goBack: jest.fn() };
    await act(async () => {
      renderer = create(
        <SavingsFormScreen
          route={
            edit
              ? {
                  key: 'edit',
                  name: 'EditSavings',
                  params: { savingId: 'saving' },
                }
              : { key: 'add', name: 'AddSavings', params: { goalId: 'goal' } }
          }
          navigation={navigation as never}
        />,
      );
    });
    const field = renderer!.root.findByType(CalendarDateField);
    expect(field.props.value).toBe(original);
    expect(
      renderer!.root
        .findAllByType(TextInput)
        .map(node => node.props.accessibilityLabel),
    ).not.toContain('Date');
    expect(JSON.stringify(renderer!.toJSON())).not.toMatch(
      /Clear date|deadline/,
    );
    await act(async () => {
      renderer!.root.findByType(AmountInput).props.onChangeText('10');
      renderer!.root
        .findAll(
          node =>
            node.props.accessibilityRole === 'button' &&
            node.props.accessibilityLabel === 'Date' &&
            typeof node.props.onPress === 'function',
        )[0]
        .props.onPress();
    });
    const picker = jest
      .mocked(DateTimePickerAndroid.open)
      .mock.calls.at(-1)![0];
    expect(picker).toMatchObject({ mode: 'date', display: 'calendar' });
    expect(localDate(picker.value)).toBe(original);
    await act(async () => {
      if (select) {
        // An early local hour catches accidental UTC conversions to the previous day.
        picker.onValueChange!(
          { nativeEvent: { timestamp: 0, utcOffset: 480 } },
          new Date(2026, 9, 9, 0, 5),
        );
      } else {
        picker.onDismiss!();
      }
    });
    const expectedDate = select ? '2026-10-09' : original;
    expect(renderer!.root.findByType(CalendarDateField).props.value).toBe(
      expectedDate,
    );
    await act(async () => {
      renderer!.root
        .findAllByType(AppButton)
        .find(
          button =>
            button.props.title === (edit ? 'Save Changes' : 'Add Savings'),
        )!
        .props.onPress();
    });
    const save = edit ? jest.mocked(updateSavings) : jest.mocked(addSavings);
    expect(save).toHaveBeenCalledWith('user', edit ? 'saving' : 'goal', {
      amount: 1000,
      transactionDate: expectedDate,
      note: edit ? 'Allowance' : '',
    });
    expect(navigation.goBack).toHaveBeenCalledTimes(edit ? 1 : 0);
  },
);

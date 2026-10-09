import React from 'react';
import { Keyboard, Platform, TextInput } from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import {
  DateTimePickerAndroid,
  AndroidNativeProps,
} from '@react-native-community/datetimepicker';
import { CalendarDateField } from '../src/components/CalendarDateField';
import { GoalFormScreen } from '../src/screens/GoalFormScreen';
import { AppInput } from '../src/components/AppInput';
import { AmountInput } from '../src/components/AmountInput';
import { AppButton } from '../src/components/AppButton';
import {
  createGoal,
  updateGoal,
} from '../src/database/repositories/goalRepository';
import { Goal } from '../src/types/models';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParams } from '../src/navigation/types';
jest.mock('@react-navigation/native', () => ({ usePreventRemove: () => {} }));
jest.mock('../src/services/goalPhoto', () => ({ chooseGoalPhoto: jest.fn() }));

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
    select({ user: { id: 'u' } }),
}));
let mockGoals: Goal[] = [];
jest.mock('../src/stores/goalStore', () => ({
  useGoalStore: (select: (state: unknown) => unknown) =>
    select({ goals: mockGoals }),
}));
jest.mock('../src/database/repositories/goalRepository', () => ({
  createGoal: jest.fn(() => 'created'),
  updateGoal: jest.fn(),
}));
jest.mock('../src/services/refresh', () => ({ refreshData: jest.fn() }));
let renderer: ReactTestRenderer;
const change = jest.fn();
const navigation = {
  replace: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
};
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  jest.clearAllMocks();
  jest.replaceProperty(Platform, 'OS', 'android');
  mockGoals = [];
});
afterEach(async () => {
  if (renderer) {
    await act(async () => renderer.unmount());
  }
  jest.restoreAllMocks();
});
async function mountField(value = '', disabled = false) {
  await act(async () => {
    renderer = create(
      <CalendarDateField
        label="Target Date (optional)"
        value={value}
        onChange={change}
        disabled={disabled}
      />,
    );
  });
}
async function press(label: string) {
  await act(async () =>
    renderer.root
      .findAll(
        node =>
          node.props.accessibilityRole === 'button' &&
          typeof node.props.onPress === 'function',
      )
      .find(node => node.props.accessibilityLabel === label)!
      .props.onPress(),
  );
}
function picker(): AndroidNativeProps {
  return jest.mocked(DateTimePickerAndroid.open).mock.calls.at(-1)![0];
}

test('date field opens the native calendar without editable text and commits the selected local day', async () => {
  const dismiss = jest.spyOn(Keyboard, 'dismiss');
  await mountField();
  expect(renderer.root.findAllByType(TextInput)).toHaveLength(0);
  await press('Target Date (optional)');
  expect(dismiss).toHaveBeenCalled();
  expect(picker()).toMatchObject({ mode: 'date', display: 'calendar' });
  expect(change).not.toHaveBeenCalled();
  await act(async () =>
    picker().onValueChange!(
      { nativeEvent: { timestamp: 0, utcOffset: 480 } },
      new Date(2028, 1, 29, 0, 5),
    ),
  );
  expect(change).toHaveBeenCalledWith('2028-02-29');
  dismiss.mockRestore();
});

test('existing date is preselected, cancel keeps it, and Clear date removes the deadline', async () => {
  await mountField('2026-12-31');
  await press('Target Date (optional)');
  expect(picker().value.getFullYear()).toBe(2026);
  expect(picker().value.getMonth()).toBe(11);
  expect(picker().value.getDate()).toBe(31);
  await act(async () => picker().onDismiss!());
  expect(change).not.toHaveBeenCalled();
  await press('Clear target date');
  expect(change).toHaveBeenCalledWith('');
});

test('repeated opening is locked; unmount dismisses the native dialog and ignores a late selection', async () => {
  await mountField();
  await press('Target Date (optional)');
  const options = picker();
  await press('Target Date (optional)');
  expect(DateTimePickerAndroid.open).toHaveBeenCalledTimes(1);
  await act(async () => renderer.unmount());
  expect(DateTimePickerAndroid.dismiss).toHaveBeenCalledWith('date');
  options.onValueChange!(
    { nativeEvent: { timestamp: 0, utcOffset: 480 } },
    new Date(2027, 0, 1),
  );
  expect(change).not.toHaveBeenCalled();
});

test('disabled field does not open the calendar', async () => {
  await mountField('', true);
  await press('Target Date (optional)');
  expect(DateTimePickerAndroid.open).not.toHaveBeenCalled();
});

test.each([
  [false, '2028-02-29'],
  [false, ''],
  [true, '2028-02-29'],
  [true, ''],
] as const)(
  'Create/Edit Goal persists calendar date (edit: %s, date: %s)',
  async (edit, selectedDate) => {
    if (edit) {
      mockGoals = [
        {
          id: 'g',
          name: 'Books',
          targetAmount: 10000,
          targetDate: '2026-12-31',
          category: 'Electronics',
          note: '',
        } as Goal,
      ];
    }
    const props = {
      navigation,
      route: {
        name: edit ? 'EditGoal' : 'CreateGoal',
        params: edit ? { goalId: 'g' } : undefined,
      },
    } as unknown as NativeStackScreenProps<
      MainStackParams,
      'CreateGoal' | 'EditGoal'
    >;
    await act(async () => {
      renderer = create(<GoalFormScreen {...props} />);
    });
    expect(
      renderer.root.findAllByType(AppInput).map(node => node.props.label),
    ).not.toContain('Target Date (optional)');
    await act(async () => {
      renderer.root
        .findAllByType(AppInput)
        .find(node => node.props.label === 'Goal Name')!
        .props.onChangeText('Books');
    });
    const pressAction = async (title: string) => {
      await act(async () =>
        renderer.root
          .findAllByType(AppButton)
          .find(button => button.props.title === title)!
          .props.onPress(),
      );
    };
    if (!edit) {
      await pressAction('Continue');
    }
    await act(async () => {
      renderer.root
        .findAllByType(AmountInput)
        .find(node => node.props.label === 'Target Amount')!
        .props.onChangeText('100');
    });
    const field = renderer.root.findByType(CalendarDateField);
    await act(async () => field.props.onChange(selectedDate));
    if (!edit) {
      await pressAction('Continue');
      await pressAction('Continue');
    }
    await pressAction(edit ? 'Save Changes' : 'Create Goal');
    const save = edit ? jest.mocked(updateGoal) : jest.mocked(createGoal);
    expect(save.mock.calls.at(-1)![edit ? 2 : 1]).toMatchObject({
      targetDate: selectedDate || null,
    });
  },
);

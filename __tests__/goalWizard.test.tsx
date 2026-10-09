import React from 'react';
import { Alert, Text } from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { GoalFormScreen } from '../src/screens/GoalFormScreen';
import { AppInput } from '../src/components/AppInput';
import { AmountInput } from '../src/components/AmountInput';
import { AppButton } from '../src/components/AppButton';
import { GoalPhoto } from '../src/components/GoalPhoto';
import { CalendarDateField } from '../src/components/CalendarDateField';
import { chooseGoalPhoto } from '../src/services/goalPhoto';
import {
  createGoal,
  updateGoal,
} from '../src/database/repositories/goalRepository';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParams } from '../src/navigation/types';
import { Goal } from '../src/types/models';
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('../src/components/Icon', () => ({ Icon: () => null }));
jest.mock('../src/components/CalendarDateField', () => ({
  CalendarDateField: () => null,
}));
jest.mock('../src/services/goalPhoto', () => ({ chooseGoalPhoto: jest.fn() }));
jest.mock('../src/services/refresh', () => ({ refreshData: jest.fn() }));
jest.mock('../src/database/repositories/goalRepository', () => ({
  createGoal: jest.fn(),
  updateGoal: jest.fn(),
}));
jest.mock('../src/stores/authStore', () => ({
  useAuthStore: (select: (state: unknown) => unknown) =>
    select({ user: { id: 'u' } }),
}));
let mockGoals: Goal[] = [];
jest.mock('../src/stores/goalStore', () => ({
  useGoalStore: (select: (state: unknown) => unknown) =>
    select({ goals: mockGoals }),
}));
let mockGuard: {
  enabled: boolean;
  callback: (event: { data: { action: { type: string } } }) => void;
};
jest.mock('@react-navigation/native', () => ({
  usePreventRemove: (enabled: boolean, callback: typeof mockGuard.callback) => {
    mockGuard = { enabled, callback };
  },
}));
let renderer: ReactTestRenderer;
const navigation = {
  goBack: jest.fn(),
  replace: jest.fn(),
  dispatch: jest.fn(),
};
const photo = 'data:image/png;base64,aGVsbG8=';
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  jest.clearAllMocks();
  mockGoals = [];
  jest.mocked(createGoal).mockReset().mockReturnValue('created');
  jest.mocked(updateGoal).mockReset();
  jest.mocked(chooseGoalPhoto).mockReset();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});
afterEach(async () => {
  if (renderer) {
    await act(async () => renderer.unmount());
  }
  jest.restoreAllMocks();
});
async function mount(edit = false) {
  await act(async () => {
    renderer = create(
      <GoalFormScreen
        {...({
          navigation,
          route: {
            name: edit ? 'EditGoal' : 'CreateGoal',
            params: edit ? { goalId: 'g' } : undefined,
          },
        } as unknown as NativeStackScreenProps<
          MainStackParams,
          'CreateGoal' | 'EditGoal'
        >)}
      />,
    );
  });
}
function button(title: string) {
  return renderer.root
    .findAllByType(AppButton)
    .find(b => b.props.title === title)!;
}
async function press(title: string) {
  await act(async () => button(title).props.onPress());
}
async function fillName(name = 'School books') {
  await act(async () =>
    renderer.root
      .findAllByType(AppInput)
      .find(i => i.props.label === 'Goal Name')!
      .props.onChangeText(name),
  );
}
async function amount(label: string, value: string) {
  await act(async () =>
    renderer.root
      .findAllByType(AmountInput)
      .find(i => i.props.label === label)!
      .props.onChangeText(value),
  );
}
const step = () =>
  renderer.root.findAllByProps({ accessibilityRole: 'progressbar' })[0].props
    .accessibilityValue.now;
const texts = () =>
  renderer.root
    .findAllByType(Text)
    .map(t => React.Children.toArray(t.props.children).join(''))
    .join('\n');
async function personalize() {
  await fillName();
  await press('Continue');
  await amount('Target Amount', '100');
  await press('Continue');
}

test('steps validate independently, cannot skip on double Continue, retain drafts on Back, and write only at review', async () => {
  await mount();
  await press('Continue');
  expect(step()).toBe(1);
  expect(texts()).toContain('Enter a goal name');
  expect(
    renderer.root
      .findByProps({ testID: 'screen-footer' })
      .findAllByProps({ accessibilityRole: 'alert' }, { deep: false }),
  ).toHaveLength(1);
  await fillName();
  await act(async () => {
    const next = button('Continue').props.onPress;
    next();
    next();
  });
  expect(step()).toBe(2);
  await amount('Target Amount', '0');
  await press('Continue');
  expect(step()).toBe(2);
  await amount('Target Amount', '100');
  await amount('Starting Amount', '-1');
  await press('Continue');
  expect(step()).toBe(2);
  await amount('Starting Amount', '10');
  await press('Continue');
  expect(step()).toBe(3);
  expect(createGoal).not.toHaveBeenCalled();
  await press('Back');
  expect(step()).toBe(2);
  expect(
    renderer.root
      .findAllByType(AmountInput)
      .find(i => i.props.label === 'Starting Amount')!.props.value,
  ).toBe('10');
  await press('Continue');
  await press('Continue');
  expect(step()).toBe(4);
  expect(texts()).toContain('No deadline');
  expect(texts()).toContain('No photo attached');
  await act(async () => {
    const save = button('Create Goal').props.onPress;
    save();
    save();
  });
  expect(createGoal).toHaveBeenCalledTimes(1);
  expect(createGoal).toHaveBeenCalledWith(
    'u',
    expect.objectContaining({
      name: 'School books',
      targetAmount: 10000,
      coverPhoto: null,
    }),
    1000,
  );
  expect(navigation.replace).toHaveBeenCalledWith('GoalDetails', {
    goalId: 'created',
  });
  expect(mockGuard.enabled).toBe(false);
});

test('photo operations lock actions synchronously; cancel retains photo and removal remains a draft', async () => {
  await mount();
  await personalize();
  let finish!: (value: string | undefined) => void;
  jest.mocked(chooseGoalPhoto).mockImplementation(
    () =>
      new Promise(resolve => {
        finish = resolve;
      }),
  );
  await act(async () => {
    button('Take photo').props.onPress();
    button('Take photo').props.onPress();
    button('Continue').props.onPress();
  });
  expect(chooseGoalPhoto).toHaveBeenCalledTimes(1);
  expect(step()).toBe(3);
  expect(button('Back').props.disabled).toBe(true);
  await act(async () =>
    mockGuard.callback({ data: { action: { type: 'GO_BACK' } } }),
  );
  expect(step()).toBe(3);
  await act(async () => finish(photo));
  expect(renderer.root.findByType(GoalPhoto).props.photo).toBe(photo);
  jest.mocked(chooseGoalPhoto).mockResolvedValue(undefined);
  await press('Choose from gallery');
  expect(renderer.root.findByType(GoalPhoto).props.photo).toBe(photo);
  await press('Remove photo');
  expect(renderer.root.findAllByType(GoalPhoto)).toHaveLength(0);
  expect(createGoal).not.toHaveBeenCalled();
});

test('photo failures are retryable, replacement is reviewed, and failed save keeps the complete draft', async () => {
  await mount();
  await personalize();
  jest
    .mocked(chooseGoalPhoto)
    .mockRejectedValueOnce(
      new Error(
        'Please use the gallery. A camera is not available on this device.',
      ),
    )
    .mockResolvedValue(photo);
  await press('Take photo');
  expect(texts()).toContain('camera is not available');
  await press('Choose from gallery');
  await press('Continue');
  jest.mocked(createGoal).mockImplementationOnce(() => {
    throw new Error('storage failure');
  });
  await press('Create Goal');
  expect(step()).toBe(4);
  expect(texts()).toContain('Unable to save your goal');
  expect(renderer.root.findByType(GoalPhoto).props.photo).toBe(photo);
  expect(navigation.replace).not.toHaveBeenCalled();
  await press('Create Goal');
  expect(createGoal).toHaveBeenLastCalledWith(
    'u',
    expect.objectContaining({ coverPhoto: photo }),
    0,
  );
});

test('navigation Back goes to the previous step; leaving step one offers Keep Editing or Discard', async () => {
  await mount();
  await fillName();
  await press('Continue');
  await act(async () =>
    mockGuard.callback({ data: { action: { type: 'GO_BACK' } } }),
  );
  expect(step()).toBe(1);
  await act(async () =>
    mockGuard.callback({ data: { action: { type: 'GO_BACK' } } }),
  );
  let actions = jest.mocked(Alert.alert).mock.calls.at(-1)![2]!;
  await act(async () =>
    actions.find(a => a.text === 'Keep Editing')!.onPress!(),
  );
  expect(navigation.dispatch).not.toHaveBeenCalled();
  expect(renderer.root.findByType(AppInput).props.value).toBe('School books');
  await act(async () =>
    mockGuard.callback({ data: { action: { type: 'GO_BACK' } } }),
  );
  actions = jest.mocked(Alert.alert).mock.calls.at(-1)![2]!;
  await act(async () => actions.find(a => a.text === 'Discard')!.onPress!());
  expect(navigation.dispatch).toHaveBeenCalledWith({ type: 'GO_BACK' });
  expect(mockGuard.enabled).toBe(false);
});

test('Edit Goal remains one form and changes/removes its photo only on Save Changes', async () => {
  mockGoals = [
    {
      id: 'g',
      name: 'Books',
      targetAmount: 10000,
      targetDate: null,
      category: 'Education',
      icon: 'book',
      note: '',
      coverPhoto: photo,
    } as Goal,
  ];
  await mount(true);
  expect(
    renderer.root.findAllByProps({ accessibilityRole: 'progressbar' }),
  ).toHaveLength(0);
  expect(renderer.root.findAllByType(AmountInput)).toHaveLength(1);
  expect(renderer.root.findByType(CalendarDateField).props.value).toBe('');
  await press('Remove photo');
  expect(updateGoal).not.toHaveBeenCalled();
  await press('Save Changes');
  expect(updateGoal).toHaveBeenCalledWith(
    'u',
    'g',
    expect.objectContaining({ coverPhoto: null }),
  );
  expect(navigation.goBack).toHaveBeenCalled();
});

test('starting savings at target retains the completion alert after final creation', async () => {
  await mount();
  await fillName();
  await press('Continue');
  await amount('Target Amount', '100');
  await amount('Starting Amount', '100');
  await press('Continue');
  await press('Continue');
  await press('Create Goal');
  expect(createGoal).toHaveBeenLastCalledWith('u', expect.anything(), 10000);
  expect(Alert.alert).toHaveBeenCalledWith('Goal Reached!', expect.any(String));
});

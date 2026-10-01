import React from 'react';
import { Alert, Image, Text, useWindowDimensions } from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParams } from '../src/navigation/types';
import { AppButton } from '../src/components/AppButton';
import { AppInput } from '../src/components/AppInput';
import { ProfileRow } from '../src/components/ProfileRow';
import { ProfileScreen } from '../src/screens/ProfileScreen';
import { EditProfileScreen } from '../src/screens/EditProfileScreen';
import { updateProfile } from '../src/database/repositories/userRepository';
import { chooseProfilePhoto } from '../src/services/profilePhoto';
import { User, Goal, Saving } from '../src/types/models';
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('lucide-react-native', () => ({
  ChevronRight: () => null,
  Archive: () => null,
  BadgeCheck: () => null,
  Info: () => null,
}));
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
};
let mockGuard: {
  enabled: boolean;
  callback: (event: { data: { action: { type: string } } }) => void;
};
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  usePreventRemove: (enabled: boolean, callback: typeof mockGuard.callback) => {
    mockGuard = { enabled, callback };
  },
}));
let mockAuth: {
  user: User;
  logout: jest.Mock;
  reset: jest.Mock;
  refreshUser: jest.Mock;
};
let mockGoals: Goal[];
let mockSavings: Saving[];
jest.mock('../src/stores/authStore', () => ({
  useAuthStore: (selector: (state: typeof mockAuth) => unknown) =>
    selector(mockAuth),
}));
jest.mock('../src/stores/goalStore', () => ({
  useGoalStore: (selector: (state: { goals: Goal[] }) => unknown) =>
    selector({ goals: mockGoals }),
}));
jest.mock('../src/stores/savingsStore', () => ({
  useSavingsStore: (selector: (state: { savings: Saving[] }) => unknown) =>
    selector({ savings: mockSavings }),
}));
jest.mock('../src/database/repositories/userRepository', () => ({
  updateProfile: jest.fn(),
}));
jest.mock('../src/services/profilePhoto', () => ({
  chooseProfilePhoto: jest.fn(),
}));
let renderer: ReactTestRenderer | undefined;
const props = {
  navigation: mockNavigation,
} as unknown as NativeStackScreenProps<MainStackParams, 'EditProfile'>;
async function render(edit = false) {
  await act(async () => {
    renderer = create(
      edit ? <EditProfileScreen {...props} /> : <ProfileScreen />,
    );
  });
}
function buttons() {
  return renderer!.root.findAllByType(AppButton);
}
async function press(title: string) {
  await act(async () => {
    buttons()
      .find(b => b.props.title === title)!
      .props.onPress();
  });
}
async function change(label: string, value: string) {
  await act(async () => {
    renderer!.root
      .findAllByType(AppInput)
      .find(i => i.props.label === label)!
      .props.onChangeText(value);
  });
}
function textContent() {
  return renderer!.root
    .findAllByType(Text)
    .map(t => React.Children.toArray(t.props.children).join(''))
    .join('\n');
}
function alertButtons() {
  return jest.mocked(Alert.alert).mock.calls.at(-1)![2]!;
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({
    width: 360,
    height: 640,
    scale: 3,
    fontScale: 1.5,
  } as ReturnType<typeof useWindowDimensions>);
  mockAuth = {
    user: {
      id: 'u1',
      fullName: 'Alexandra Marie Long Profile Name',
      username: 'alex',
      gradeLevel: '',
      profilePhoto: null,
      createdAt: '',
      updatedAt: '',
    },
    logout: jest.fn(),
    reset: jest.fn(),
    refreshUser: jest.fn(),
  };
  mockGoals = ['active', 'completed', 'archived'].map(
    (status, index) => ({ id: `g${index}`, status } as Goal),
  );
  mockSavings = [10000, 20000, 5000].map(
    (amount, index) => ({ amount, goalId: `g${index}` } as Saving),
  );
  jest.mocked(updateProfile).mockReset();
  jest.mocked(chooseProfilePhoto).mockReset();
});
afterEach(async () => {
  if (renderer) {
    await act(async () => renderer!.unmount());
    renderer = undefined;
  }
  jest.restoreAllMocks();
});
test('overview includes archived savings, labeled counts, long identity, read-only currency, and every navigation destination', async () => {
  await render();
  expect(textContent()).toContain('₱350');
  expect(textContent()).toContain('Total recorded savings');
  expect(textContent()).toContain('archived goals');
  expect(textContent()).toContain(mockAuth.user.fullName);
  expect(textContent()).toContain('Philippine Peso (PHP)');
  const rows = renderer!.root.findAllByType(ProfileRow);
  expect(rows.map(r => [r.props.title, r.props.count])).toEqual([
    ['Completed Goals', 1],
    ['Archived Goals', 1],
    ['About the App', undefined],
  ]);
  for (const row of rows) {
    await act(async () => row.props.onPress());
  }
  await press('Edit Profile');
  expect(mockNavigation.navigate.mock.calls.map(c => c[0])).toEqual([
    'CompletedGoals',
    'ArchivedGoals',
    'About',
    'EditProfile',
  ]);
  expect(renderer!.root.findAllByType(Image)).toHaveLength(0);
});
test('empty summary and missing grade work; failed photos fall back to initials', async () => {
  mockGoals = [];
  mockSavings = [];
  mockAuth.user.profilePhoto = 'data:image/png;base64,test';
  await render();
  expect(textContent()).toContain('₱0');
  await act(async () => renderer!.root.findByType(Image).props.onError());
  expect(renderer!.root.findAllByType(Image)).toHaveLength(0);
  expect(textContent()).toContain('AM');
});
test('reset never executes before two accepted confirmations; cancellation at either stage is safe; logout remains independent', async () => {
  await render();
  await press('Reset all device data');
  expect(mockAuth.reset).not.toHaveBeenCalled();
  expect(alertButtons().map(b => b.text)).toEqual(['Cancel', 'Continue']);
  // Cancelling has no callback/mutation, then start again and accept the first step.
  await press('Reset all device data');
  await act(async () => alertButtons()[1].onPress!());
  expect(alertButtons().map(b => b.text)).toEqual(['Cancel', 'Reset Data']);
  expect(mockAuth.reset).not.toHaveBeenCalled();
  await press('Reset all device data');
  await act(async () => alertButtons()[1].onPress!());
  await act(async () => alertButtons()[1].onPress!());
  expect(mockAuth.reset).toHaveBeenCalledTimes(1);
  await press('Log out');
  expect(mockAuth.logout).toHaveBeenCalledTimes(1);
});
test('editing, Keep Editing, and Discard Changes disable the guard before replaying the navigation action', async () => {
  await render(true);
  expect(mockGuard.enabled).toBe(false);
  await change('Full Name', 'Updated Name');
  expect(mockGuard.enabled).toBe(true);
  await act(async () =>
    mockGuard.callback({ data: { action: { type: 'GO_BACK' } } }),
  );
  expect(alertButtons().map(b => b.text)).toEqual([
    'Keep Editing',
    'Discard Changes',
  ]);
  await act(async () => alertButtons()[0].onPress!());
  expect(mockGuard.enabled).toBe(true);
  expect(mockNavigation.dispatch).not.toHaveBeenCalled();
  await act(async () =>
    mockGuard.callback({ data: { action: { type: 'GO_BACK' } } }),
  );
  await act(async () => alertButtons()[1].onPress!());
  expect(mockGuard.enabled).toBe(false);
  expect(mockNavigation.dispatch).toHaveBeenCalledWith({ type: 'GO_BACK' });
  expect(updateProfile).not.toHaveBeenCalled();
});
test('successful save persists once, refreshes, disables the guard and leaves without a warning', async () => {
  await render(true);
  await change('Full Name', 'Updated Name');
  await change('Grade Level (optional)', 'Grade 12');
  await act(async () => {
    const save = buttons().find(b => b.props.title === 'Save Profile')!;
    save.props.onPress();
    save.props.onPress();
  });
  expect(updateProfile).toHaveBeenCalledTimes(1);
  expect(updateProfile).toHaveBeenCalledWith(
    'u1',
    'Updated Name',
    'Grade 12',
    null,
  );
  expect(mockAuth.refreshUser).toHaveBeenCalledTimes(1);
  expect(mockGuard.enabled).toBe(false);
  expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  expect(Alert.alert).not.toHaveBeenCalled();
});
test('validation/database failures preserve the draft and navigation guard; retry works', async () => {
  await render(true);
  await change('Full Name', '');
  jest.mocked(updateProfile).mockImplementation(() => {
    throw new Error('Please enter your full name.');
  });
  await press('Save Profile');
  expect(textContent()).toContain('Please enter your full name.');
  expect(mockGuard.enabled).toBe(true);
  expect(mockNavigation.goBack).not.toHaveBeenCalled();
  await change('Full Name', 'Retry Name');
  jest.mocked(updateProfile).mockImplementation(() => {
    throw new Error('SQLITE_ERROR');
  });
  await press('Save Profile');
  expect(textContent()).toContain('Unable to update your profile.');
  expect(mockGuard.enabled).toBe(true);
  jest.mocked(updateProfile).mockImplementation(() => mockAuth.user);
  await press('Save Profile');
  expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
});
test('photo cancellation does not dirty the draft, selection/removal does, and pending photo work locks fields/actions against repeated presses', async () => {
  await render(true);
  jest.mocked(chooseProfilePhoto).mockResolvedValueOnce(undefined);
  await press('Choose Photo');
  expect(mockGuard.enabled).toBe(false);
  let finish!: (photo: string) => void;
  jest.mocked(chooseProfilePhoto).mockImplementation(
    () =>
      new Promise(resolve => {
        finish = resolve;
      }),
  );
  await act(async () => {
    const choose = buttons().find(b => b.props.title === 'Choose Photo')!;
    choose.props.onPress();
    choose.props.onPress();
  });
  expect(chooseProfilePhoto).toHaveBeenCalledTimes(2);
  expect(
    renderer!.root.findAllByType(AppInput).every(i => !i.props.editable),
  ).toBe(true);
  expect(buttons().every(b => b.props.disabled)).toBe(true);
  await act(async () => finish('data:image/png;base64,test'));
  expect(mockGuard.enabled).toBe(true);
  expect(buttons().some(b => b.props.title === 'Remove Photo')).toBe(true);
  await press('Remove Photo');
  expect(mockGuard.enabled).toBe(false);
  expect(updateProfile).not.toHaveBeenCalled();
});
test('removing an existing photo is an unsaved edit and persists null only on save', async () => {
  mockAuth.user.profilePhoto = 'data:image/png;base64,test';
  await render(true);
  await press('Remove Photo');
  expect(mockGuard.enabled).toBe(true);
  await press('Save Profile');
  expect(updateProfile).toHaveBeenCalledWith(
    'u1',
    mockAuth.user.fullName,
    '',
    null,
  );
});

import React from 'react';
import { AccessibilityInfo, Text } from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParams } from '../src/navigation/types';
import { LoginScreen } from '../src/screens/LoginScreen';
import { RegisterScreen } from '../src/screens/RegisterScreen';
import { WelcomeScreen } from '../src/screens/WelcomeScreen';
import { ScreenContainer } from '../src/components/ScreenContainer';
import { AppInput } from '../src/components/AppInput';
import { AppButton } from '../src/components/AppButton';
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('../src/components/BrandLogo', () => ({ BrandLogo: () => null }));
jest.mock('../src/components/Icon', () => ({ Icon: () => null }));
jest.mock('lucide-react-native', () => ({ ArrowRight: () => null }));
let mockGuard: { enabled: boolean; callback: () => void };
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => (() => void) | undefined) => {
    require('react').useEffect(callback, [callback]);
  },
  usePreventRemove: (enabled: boolean, callback: () => void) => {
    mockGuard = { enabled, callback };
  },
}));
const mockAuth = {
  register: jest.fn(),
  login: jest.fn(),
  user: null as null | { id: string },
};
jest.mock('../src/stores/authStore', () => ({
  useAuthStore: (select: (state: typeof mockAuth) => unknown) =>
    select(mockAuth),
}));
let renderer: ReactTestRenderer;
const registrationNavigation = { goBack: jest.fn() };
const registrationProps = {
  navigation: registrationNavigation,
} as unknown as NativeStackScreenProps<AuthStackParams, 'Register'>;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  jest.clearAllMocks();
  mockAuth.user = null;
});
afterEach(async () => {
  await act(async () => renderer.unmount());
});
async function mountRegistration() {
  await act(async () => {
    renderer = create(<RegisterScreen {...registrationProps} />);
  });
}
const input = (label: string) =>
  renderer.root.findAllByType(AppInput).find(i => i.props.label === label)!;
const button = (title: string) =>
  renderer.root.findAllByType(AppButton).find(b => b.props.title === title)!;
async function fill(label: string, value: string) {
  await act(async () => input(label).props.onChangeText(value));
}
async function press(title: string) {
  await act(async () => button(title).props.onPress());
}
async function edit(label: string) {
  await act(async () =>
    renderer.root
      .findAll(node => typeof node.props.onPress === 'function')
      .find(p => p.props.accessibilityLabel === `Edit ${label}`)!
      .props.onPress(),
  );
}
function texts() {
  return renderer.root
    .findAllByType(Text)
    .map(t => t.props.children)
    .flat()
    .join(' ')
    .replace(/\s+/g, ' ');
}
async function review() {
  await fill('Full Name', '  Alex Student  ');
  await press('Continue');
  await fill('Username', '  ALEX_123  ');
  await press('Continue');
  await fill('Password', 'test123');
  await fill('Confirm Password', 'test123');
  await press('Continue');
}

test('the first registration step can exit through the footer back button', async () => {
  await mountRegistration();
  await fill('Full Name', 'Alex');
  await press('Back');
  expect(registrationNavigation.goBack).toHaveBeenCalledTimes(1);
  expect(mockAuth.register).not.toHaveBeenCalled();
});

test('registration validates each step, announces errors, and preserves values on navigation back', async () => {
  const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
  await mountRegistration();
  expect(mockGuard.enabled).toBe(false);
  await press('Continue');
  expect(texts()).toContain('Please enter your full name.');
  expect(announce).toHaveBeenCalledWith('Please enter your full name.');
  await fill('Full Name', 'Alex');
  await press('Continue');
  await fill('Username', 'bad!');
  await press('Continue');
  expect(texts()).toContain('Username must be');
  await fill('Username', 'alex_123');
  await act(async () => mockGuard.callback());
  expect(input('Full Name').props.value).toBe('Alex');
  expect(mockGuard.enabled).toBe(false);
  await press('Continue');
  expect(input('Username').props.value).toBe('alex_123');
  await press('Continue');
  await fill('Password', 'short');
  await fill('Confirm Password', 'short');
  await press('Continue');
  expect(texts()).toContain('6–128');
  await fill('Password', 'test123');
  await fill('Confirm Password', 'different');
  await press('Continue');
  expect(texts()).toContain('Your passwords do not match.');
  await fill('Confirm Password', 'test123');
  await press('Continue');
  expect(texts()).toContain('Step 4 of 4');
  await press('Back');
  expect(input('Password').props.value).toBe('test123');
  expect(mockAuth.register).not.toHaveBeenCalled();
});

test('review normalizes details, hides passwords, and edits return directly to review', async () => {
  await mountRegistration();
  await review();
  expect(texts()).toContain('Alex Student');
  expect(texts()).toContain('alex_123');
  expect(texts()).toContain('Password set');
  expect(texts()).not.toContain('test123');
  expect(renderer.root.findAllByType(AppInput)).toHaveLength(0);
  expect(texts()).toContain(
    'Your account and savings are saved on this device.',
  );
  await edit('Full Name');
  await fill('Full Name', 'New Name');
  await press('Continue');
  expect(texts()).toContain('Step 4 of 4');
  expect(texts()).toContain('New Name');
  await edit('Username');
  await fill('Username', 'new_user');
  await press('Continue');
  expect(texts()).toContain('new_user');
  await edit('Password');
  expect(input('Password').props.secureTextEntry).toBe(true);
  expect(input('Confirm Password').props.secureTextEntry).toBe(true);
  await fill('Password', 'newpass');
  await fill('Confirm Password', 'newpass');
  await press('Continue');
  expect(texts()).not.toContain('newpass');
});

test('registration locks submission and edits, retains failures for retry, and clears passwords on success', async () => {
  let fail!: (error: Error) => void;
  mockAuth.register.mockImplementation(
    () =>
      new Promise((_resolve, reject) => {
        fail = reject;
      }),
  );
  await mountRegistration();
  await review();
  await act(async () => {
    button('Create Account').props.onPress();
    button('Create Account').props.onPress();
  });
  expect(mockAuth.register).toHaveBeenCalledTimes(1);
  expect(mockAuth.register).toHaveBeenCalledWith(
    'Alex Student',
    'alex_123',
    'test123',
    'test123',
    '',
  );
  expect(button('Back').props.disabled).toBe(true);
  expect(
    renderer.root
      .findAll(node => typeof node.props.onPress === 'function')
      .filter(p => p.props.accessibilityLabel?.startsWith('Edit '))
      .every(p => p.props.disabled),
  ).toBe(true);
  await act(async () => mockGuard.callback());
  expect(texts()).toContain('Step 4 of 4');
  await act(async () => fail(new Error('native failure')));
  expect(texts()).toContain('Unable to create your account.');
  await edit('Password');
  expect(input('Password').props.value).toBe('test123');
  await press('Continue');
  mockAuth.register.mockResolvedValue(undefined);
  await press('Create Account');
  expect(mockAuth.register).toHaveBeenCalledTimes(2);
  await edit('Password');
  expect(input('Password').props.value).toBe('');
  expect(input('Confirm Password').props.value).toBe('');
});

test('duplicate usernames return to the username step and preserve the rest of the draft', async () => {
  mockAuth.register.mockRejectedValue(
    new Error('This username is already used on this device.'),
  );
  await mountRegistration();
  await review();
  await press('Create Account');
  expect(texts()).toContain('Step 2 of 4');
  expect(texts()).toContain('This username is already used');
  await fill('Username', 'another_user');
  await press('Continue');
  expect(texts()).toContain('Step 4 of 4');
  expect(texts()).not.toContain('already used');
  mockAuth.register.mockResolvedValue(undefined);
  await press('Create Account');
  expect(mockAuth.register).toHaveBeenLastCalledWith(
    'Alex Student',
    'another_user',
    'test123',
    'test123',
    '',
  );
});

test('successful authentication allows removal of the registration route', async () => {
  await mountRegistration();
  await review();
  mockAuth.user = { id: 'new-user' };
  await act(async () =>
    renderer.update(<RegisterScreen {...registrationProps} />),
  );
  expect(mockGuard.enabled).toBe(false);
});

test('back from a review edit restores validated details, including from the name step', async () => {
  await mountRegistration();
  await review();
  await edit('Full Name');
  await fill('Full Name', '');
  expect(mockGuard.enabled).toBe(true);
  await act(async () => mockGuard.callback());
  expect(texts()).toContain('Step 4 of 4');
  expect(texts()).toContain('Alex Student');
  await edit('Password');
  await fill('Password', '');
  await press('Back');
  await edit('Password');
  expect(input('Password').props.value).toBe('test123');
});

test('login locks editing/navigation and repeated actions; failure retains the draft for retry', async () => {
  let fail!: (error: Error) => void;
  mockAuth.login.mockImplementation(
    () =>
      new Promise((_resolve, reject) => {
        fail = reject;
      }),
  );
  await act(async () => {
    renderer = create(
      <LoginScreen
        {...({
          navigation: { navigate: jest.fn() },
        } as unknown as NativeStackScreenProps<AuthStackParams, 'Login'>)}
      />,
    );
  });
  await fill('Password', 'test123');
  expect(renderer.root.findByType(ScreenContainer).props.actionColumns).toBe(
    false,
  );
  await act(async () => {
    button('Login').props.onPress();
    button('Login').props.onPress();
  });
  expect(mockAuth.login).toHaveBeenCalledTimes(1);
  expect(input('Password').props.editable).toBe(false);
  expect(mockGuard.enabled).toBe(true);
  const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
  mockGuard.callback();
  expect(announce).toHaveBeenCalled();
  await act(async () => fail(new Error('native failure')));
  expect(mockGuard.enabled).toBe(false);
  expect(input('Password').props.value).toBe('test123');
  mockAuth.login.mockResolvedValue(undefined);
  await press('Login');
  expect(input('Password').props.value).toBe('');
});

test('welcome footer preserves both authentication destinations', async () => {
  const navigate = jest.fn();
  await act(async () => {
    renderer = create(
      <WelcomeScreen
        {...({ navigation: { navigate } } as unknown as NativeStackScreenProps<
          AuthStackParams,
          'Welcome'
        >)}
      />,
    );
  });
  await act(async () => {
    renderer.root
      .findAll(
        node =>
          node.props.accessibilityLabel === 'Skip' &&
          typeof node.props.onPress === 'function',
      )[0]
      .props.onPress();
  });
  await press('Get Started');
  expect(navigate).toHaveBeenLastCalledWith('Register');
  await press('Login');
  expect(navigate).toHaveBeenLastCalledWith('Login');
});

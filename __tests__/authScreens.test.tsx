import React from 'react';
import {
  AccessibilityInfo,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParams } from '../src/navigation/types';
import { LoginScreen } from '../src/screens/LoginScreen';
import { LoginGradient } from '../src/screens/LoginDecor';
import { Rect } from 'react-native-svg';
import { RegisterScreen } from '../src/screens/RegisterScreen';
import { WelcomeScreen } from '../src/screens/WelcomeScreen';
import { ScreenContainer } from '../src/components/ScreenContainer';
import { AppInput } from '../src/components/AppInput';
import { colors } from '../src/theme/colors';
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('../src/components/BrandLogo', () => ({ BrandLogo: () => null }));
jest.mock('../src/components/Icon', () => ({ Icon: () => null }));
jest.mock('lucide-react-native', () => ({
  ArrowRight: () => null,
  Check: () => null,
  ChevronRight: () => null,
  Eye: () => null,
  EyeOff: () => null,
  Heart: () => null,
  LockKeyhole: () => null,
  UserRound: () => null,
}));
jest.mock('react-native/Libraries/AppState/AppState', () => ({
  __esModule: true,
  default: {
    currentState: 'active',
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));
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
  renderer.root
    .findAllByType(TextInput)
    .find(i => i.props.accessibilityLabel === label)!;
const button = (title: string) =>
  renderer.root
    .findAll(
      node =>
        node.props.accessibilityRole === 'button' &&
        typeof node.props.onPress === 'function',
    )
    .find(b => b.props.accessibilityLabel === title)!;
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

const privacyCheckbox = () =>
  renderer.root.findAll(
    node =>
      node.props.accessibilityRole === 'checkbox' &&
      typeof node.props.onPress === 'function' &&
      node.props.accessibilityLabel ===
        'I have read and agree to the Privacy Policy',
  )[0];
async function togglePrivacy() {
  await act(async () => privacyCheckbox().props.onPress());
}
async function openPrivacy() {
  await act(async () =>
    renderer.root
      .findAll(
        node =>
          node.props.accessibilityRole === 'link' &&
          typeof node.props.onPress === 'function' &&
          node.props.accessibilityLabel === 'Read Privacy Policy',
      )[0]
      .props.onPress(),
  );
}

test('registration requires an explicit privacy agreement and blocks submission when unchecked', async () => {
  await mountRegistration();
  await review();
  expect(privacyCheckbox().props.accessibilityState.checked).toBe(false);
  expect(button('Create Account').props.disabled).toBe(true);
  await press('Create Account');
  expect(mockAuth.register).not.toHaveBeenCalled();
  expect(texts()).toContain('Please read and agree to the Privacy Policy');
  await togglePrivacy();
  expect(button('Create Account').props.disabled).toBe(false);
  expect(texts()).not.toContain('Please read and agree');
  await togglePrivacy();
  expect(button('Create Account').props.disabled).toBe(true);
  await press('Create Account');
  expect(mockAuth.register).not.toHaveBeenCalled();
});

test('reading or dismissing the policy does not accept it or discard registration details', async () => {
  await mountRegistration();
  await review();
  await openPrivacy();
  expect(texts()).toContain('Storage and sharing');
  expect(texts()).toContain('Managing and removing your information');
  expect(texts()).toContain('does not upload these records');
  // Hardware back dismisses the policy without navigating away from the form.
  await act(async () => renderer.root.findByType(Modal).props.onRequestClose());
  expect(renderer.root.findAllByType(Modal)).toHaveLength(0);
  expect(privacyCheckbox().props.accessibilityState.checked).toBe(false);
  expect(texts()).toContain('Alex Student');
  await togglePrivacy();
  await edit('Username');
  await fill('Username', 'changed_user');
  await press('Continue');
  expect(privacyCheckbox().props.accessibilityState.checked).toBe(true);
  await openPrivacy();
  await press('Close Privacy Policy');
  expect(texts()).toContain('changed_user');
  expect(privacyCheckbox().props.accessibilityState.checked).toBe(true);
  expect(mockAuth.register).not.toHaveBeenCalled();
});

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
  await togglePrivacy();
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
  expect(privacyCheckbox().props.disabled).toBe(true);
  await togglePrivacy();
  expect(privacyCheckbox().props.accessibilityState.checked).toBe(true);
  await openPrivacy();
  expect(renderer.root.findAllByType(Modal)).toHaveLength(0);
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
  await togglePrivacy();
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
  expect(
    renderer.root.findAll(
      node => node.props.accessibilityLabel === 'Create a local account',
    )[0].props.disabled,
  ).toBe(true);
  expect(
    renderer.root.findAll(
      node => node.props.accessibilityRole === 'checkbox',
    )[0].props.disabled,
  ).toBe(true);
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

test('login keeps its actions in form order when the keyboard opens and closes', async () => {
  const listeners = new Map<string, Array<() => void>>();
  const keyboardListener = jest
    .spyOn(Keyboard, 'addListener')
    .mockImplementation((event, listener) => {
      listeners.set(event, [
        ...(listeners.get(event) || []),
        () => listener({} as Parameters<typeof listener>[0]),
      ]);
      return { remove: jest.fn() } as unknown as ReturnType<
        typeof Keyboard.addListener
      >;
    });
  const navigate = jest.fn();
  await act(async () => {
    renderer = create(
      <LoginScreen
        {...({ navigation: { navigate } } as unknown as NativeStackScreenProps<
          AuthStackParams,
          'Login'
        >)}
      />,
    );
  });
  const actionLabels = () =>
    Array.from(
      new Set(
        renderer.root
          .findAll(
            node =>
              node.props.accessibilityRole === 'button' &&
              typeof node.props.onPress === 'function',
          )
          .map(node => node.props.accessibilityLabel),
      ),
    );
  for (const event of [null, 'keyboardDidShow', 'keyboardDidHide']) {
    if (event) {
      await act(async () =>
        listeners.get(event)!.forEach(listener => listener()),
      );
    }
    expect(actionLabels()).toEqual([
      'Show password',
      'Login',
      'Create a local account',
    ]);
    expect(
      renderer.root.findAllByProps({ testID: 'login-hero' }, { deep: false }),
    ).toHaveLength(event === 'keyboardDidShow' ? 0 : 1);
    expect(
      renderer.root.findAllByProps({ testID: 'screen-footer' }),
    ).toHaveLength(0);
    expect(
      renderer.root
        .findByType(ScrollView)
        .findAllByProps({ testID: 'login-actions' }, { deep: false }),
    ).toHaveLength(1);
  }
  await act(async () =>
    renderer.root
      .findAll(
        node =>
          node.props.accessibilityLabel === 'Create a local account' &&
          typeof node.props.onPress === 'function',
      )[0]
      .props.onPress(),
  );
  expect(navigate).toHaveBeenCalledWith('Register');
  keyboardListener.mockRestore();
});

test('login preserves Remember Me, focused input styling, credential limits, and accessible errors', async () => {
  const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
  mockAuth.login.mockRejectedValue(
    new Error('Incorrect username or password.'),
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
  const checkbox = () =>
    renderer.root.findAll(
      node => node.props.accessibilityRole === 'checkbox',
    )[0];
  expect(checkbox().props.accessibilityState.checked).toBe(false);
  expect(checkbox().props.accessibilityHint).toContain('device you trust');
  await act(async () => checkbox().props.onPress());
  await fill('Username', 'alex');
  await fill('Password', 'secret123');
  const fields = renderer.root.findAllByType(TextInput);
  expect(fields[0].props.maxLength).toBe(32);
  expect(fields[1].props.maxLength).toBe(128);
  expect(fields[1].props.secureTextEntry).toBe(true);
  expect(fields[1].props.autoComplete).toBe('current-password');
  await act(async () => fields[0].props.onFocus({ nativeEvent: {} }));
  expect(
    StyleSheet.flatten(
      renderer.root.findByProps({ testID: 'login-field-username' }).props.style,
    ).borderColor,
  ).toBe(colors.primary);
  await press('Login');
  expect(mockAuth.login).toHaveBeenLastCalledWith('alex', 'secret123', true);
  expect(input('Password').props.value).toBe('secret123');
  expect(announce).toHaveBeenCalledWith('Incorrect username or password.');
  const actions = renderer.root.findByProps({ testID: 'login-actions' });
  expect(actions.findAllByType(Text)[0].props.children).toBe(
    'Incorrect username or password.',
  );
  expect(texts()).not.toContain('Your next goal is one small saving away.');
  mockAuth.login.mockResolvedValue(undefined);
  await press('Login');
  expect(input('Password').props.value).toBe('');
  announce.mockRestore();
});

test('password visibility preserves the draft and limit in both states and is locked during login', async () => {
  let finish!: () => void;
  mockAuth.login.mockImplementation(
    () =>
      new Promise<void>(resolve => {
        finish = resolve;
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
  await fill('Password', 'a'.repeat(128));
  expect(input('Password').props.secureTextEntry).toBe(true);
  await press('Show password');
  expect(input('Password').props.secureTextEntry).toBe(false);
  expect(input('Password').props.maxLength).toBe(128);
  expect(input('Password').props.value).toBe('a'.repeat(128));
  await press('Hide password');
  expect(input('Password').props.secureTextEntry).toBe(true);
  expect(input('Password').props.value).toBe('a'.repeat(128));
  await press('Show password');
  await press('Login');
  expect(button('Hide password').props.disabled).toBe(true);
  expect(button('Login').props.accessibilityState.busy).toBe(true);
  await act(async () => finish());
  expect(input('Password').props.value).toBe('');
  expect(input('Password').props.secureTextEntry).toBe(true);
});

test('Login gradient follows actual button size when responsive padding or text height changes', async () => {
  let finish!: () => void;
  mockAuth.login.mockImplementation(
    () =>
      new Promise<void>(resolve => {
        finish = resolve;
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
  for (const layout of [
    { width: 379, height: 56 },
    { width: 364, height: 56 },
    { width: 288, height: 68 },
  ]) {
    await act(async () =>
      button('Login').props.onLayout({ nativeEvent: { layout } }),
    );
    const gradient = renderer.root.findByType(LoginGradient);
    expect(gradient.props).toMatchObject(layout);
    expect(gradient.findByType(Rect).props).toMatchObject({
      ...layout,
      rx: 20,
      ry: 20,
    });
  }
  const buttonStyle = button('Login').props.style;
  expect(
    StyleSheet.flatten(
      typeof buttonStyle === 'function'
        ? buttonStyle({ pressed: false })
        : buttonStyle,
    ),
  ).toMatchObject({
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.primary,
  });
  await press('Login');
  const loadingStyle = button('Login').props.style;
  expect(
    StyleSheet.flatten(
      typeof loadingStyle === 'function'
        ? loadingStyle({ pressed: false })
        : loadingStyle,
    ).minHeight,
  ).toBe(68);
  await act(async () => finish());
});

test('welcome footer preserves both authentication destinations', async () => {
  const reducedMotion = jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(true);
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
  for (let tap = 0; tap < 3; tap++) {
    await act(async () => {
      renderer.root
        .findAll(
          node =>
            node.props.accessibilityLabel === 'PiggyPath logo' &&
            typeof node.props.onPress === 'function',
        )[0]
        .props.onPress();
    });
  }
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
  reducedMotion.mockRestore();
});

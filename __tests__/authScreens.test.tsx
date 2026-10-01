import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParams } from '../src/navigation/types';
import { LoginScreen } from '../src/screens/LoginScreen';
import { RegisterScreen } from '../src/screens/RegisterScreen';
import { AppInput } from '../src/components/AppInput';
import { AppButton } from '../src/components/AppButton';
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('../src/components/BrandLogo', () => ({ BrandLogo: () => null }));
jest.mock('../src/components/Icon', () => ({ Icon: () => null }));
let mockGuard: { enabled: boolean; callback: () => void };
jest.mock('@react-navigation/native', () => ({
  usePreventRemove: (enabled: boolean, callback: () => void) => {
    mockGuard = { enabled, callback };
  },
}));
const mockAuth = { register: jest.fn(), login: jest.fn() };
jest.mock('../src/stores/authStore', () => ({
  useAuthStore: (select: (state: typeof mockAuth) => unknown) =>
    select(mockAuth),
}));
let renderer: ReactTestRenderer;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  jest.clearAllMocks();
});
afterEach(async () => {
  await act(async () => renderer.unmount());
});
test.each(['register', 'login'] as const)(
  '%s locks editing/navigation and repeated actions; failure retains the draft for retry',
  async kind => {
    let fail!: (error: Error) => void;
    mockAuth[kind].mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          fail = reject;
        }),
    );
    await act(async () => {
      renderer = create(
        kind === 'register' ? (
          <RegisterScreen />
        ) : (
          <LoginScreen
            {...({
              navigation: { navigate: jest.fn() },
            } as unknown as NativeStackScreenProps<AuthStackParams, 'Login'>)}
          />
        ),
      );
    });
    const inputs = () => renderer.root.findAllByType(AppInput);
    await act(async () => {
      inputs()
        .find(i => i.props.label === 'Password')!
        .props.onChangeText('test123');
    });
    const submit = () =>
      renderer.root
        .findAllByType(AppButton)
        .find(
          b =>
            b.props.title ===
            (kind === 'register' ? 'Create Account' : 'Login'),
        )!;
    await act(async () => {
      submit().props.onPress();
      submit().props.onPress();
    });
    expect(mockAuth[kind]).toHaveBeenCalledTimes(1);
    expect(inputs().every(i => i.props.editable === false)).toBe(true);
    expect(mockGuard.enabled).toBe(true);
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    mockGuard.callback();
    expect(announce).toHaveBeenCalled();
    await act(async () => {
      fail(new Error('native failure'));
    });
    expect(mockGuard.enabled).toBe(false);
    expect(inputs().every(i => i.props.editable === true)).toBe(true);
    expect(inputs().find(i => i.props.label === 'Password')!.props.value).toBe(
      'test123',
    );
    mockAuth[kind].mockResolvedValue(undefined);
    await act(async () => {
      submit().props.onPress();
    });
    expect(inputs().find(i => i.props.label === 'Password')!.props.value).toBe(
      '',
    );
  },
);

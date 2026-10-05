import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  TextInput,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
export const ScreenInputFocusContext = createContext<
  ((input: TextInput | null) => void) | undefined
>(undefined);
export function ScreenContainer({
  children,
  scroll = true,
  responsive = false,
  footer,
  secondaryFooter,
  actionColumns = true,
  keepActionsInFooter = false,
}: {
  children: ReactNode | ((layout: { compact: boolean }) => ReactNode);
  scroll?: boolean;
  responsive?: boolean;
  footer?: ReactNode | ((layout: { columns: boolean }) => ReactNode);
  secondaryFooter?: ReactNode | ((layout: { columns: boolean }) => ReactNode);
  actionColumns?: boolean;
  keepActionsInFooter?: boolean;
}) {
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [availableHeight, setAvailableHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(() =>
    Keyboard.isVisible(),
  );
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const viewportRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  const footerHeight = useRef(0);
  const viewportTop = useRef(0);
  const focusedInput = useRef<TextInput | null>(null);
  const focusFrame = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (focusFrame.current !== null) {
        cancelAnimationFrame(focusFrame.current);
      }
    },
    [],
  );
  const revealInput = useCallback(
    (input?: TextInput | null) => {
      if (input !== undefined) {
        focusedInput.current = input;
      }
      if (!responsive) {
        return;
      }
      if (focusFrame.current !== null) {
        cancelAnimationFrame(focusFrame.current);
      }
      focusFrame.current = requestAnimationFrame(() => {
        focusFrame.current = null;
        if (!scrollRef.current) {
          return;
        }
        const focused = focusedInput.current;
        if (focused?.isFocused() && Keyboard.isVisible()) {
          scrollRef.current?.scrollResponderScrollNativeHandleToKeyboard(
            focused,
            viewportTop.current + footerHeight.current + 16,
            true,
          );
        }
      });
    },
    [responsive],
  );
  useEffect(() => {
    if (!responsive) {
      return;
    }
    const show = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      revealInput();
    });
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, [responsive, revealInput]);
  const compact =
    (availableHeight || height - 100) < 680 || width < 360 || fontScale > 1.2;
  const body =
    typeof children === 'function' ? children({ compact }) : children;
  const actionsInFooter =
    !responsive || !keyboardVisible || keepActionsInFooter;
  const columns =
    responsive &&
    actionColumns &&
    !!secondaryFooter &&
    actionsInFooter &&
    (fontScale <= 1.2 || (keyboardVisible && keepActionsInFooter));
  const primaryAction =
    typeof footer === 'function' ? footer({ columns }) : footer;
  const secondaryAction =
    typeof secondaryFooter === 'function'
      ? secondaryFooter({ columns })
      : secondaryFooter;
  return (
    <SafeAreaView
      ref={viewportRef}
      edges={['left', 'right', 'bottom']}
      style={styles.safe}
    >
      <KeyboardAvoidingView
        style={styles.fill}
        onLayout={
          responsive
            ? event => {
                setAvailableHeight(event.nativeEvent.layout.height);
                viewportRef.current?.measureInWindow((_x, y) => {
                  viewportTop.current =
                    y + (Platform.OS === 'android' ? insets.top : 0);
                  setKeyboardOffset(viewportTop.current);
                });
                revealInput();
              }
            : undefined
        }
        behavior={
          responsive ? (Platform.OS === 'ios' ? 'padding' : 'height') : 'height'
        }
        keyboardVerticalOffset={responsive ? keyboardOffset : 0}
      >
        <ScreenInputFocusContext.Provider
          value={responsive ? revealInput : undefined}
        >
          {scroll ? (
            <ScrollView
              ref={scrollRef}
              onLayout={responsive ? () => revealInput() : undefined}
              contentContainerStyle={[
                styles.content,
                responsive && styles.responsiveContent,
                responsive && compact && styles.compactContent,
              ]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              {body}
              {responsive &&
                keyboardVisible &&
                !keepActionsInFooter &&
                secondaryAction}
            </ScrollView>
          ) : (
            <View style={styles.fill}>{body}</View>
          )}
          {footer && (
            <View
              testID="screen-footer"
              onLayout={
                responsive
                  ? event => {
                      footerHeight.current = event.nativeEvent.layout.height;
                      revealInput();
                    }
                  : undefined
              }
              style={[
                styles.footer,
                responsive && compact && styles.compactFooter,
                columns && styles.footerColumns,
              ]}
            >
              {columns && secondaryAction}
              {primaryAction}
              {!columns && actionsInFooter && secondaryAction}
            </View>
          )}
        </ScreenInputFocusContext.Provider>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  fill: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingBottom: 32, gap: 24, flexGrow: 1 },
  responsiveContent: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingBottom: 16,
  },
  compactContent: { padding: 16, gap: 16 },
  footer: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
  },
  compactFooter: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  footerColumns: { flexDirection: 'row', alignItems: 'stretch' },
});

import React, { useContext, useEffect, useState } from 'react';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  BottomTabBarProps,
  BottomTabBarHeightCallbackContext,
} from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  House,
  Clock3,
  ChartSpline,
  CircleUserRound,
  Plus,
} from 'lucide-react-native';
import { MainStackParams } from './types';
import { colors } from '../theme/colors';

const icons = {
  Home: House,
  History: Clock3,
  Statistics: ChartSpline,
  Profile: CircleUserRound,
};

export function PiggyTabBar({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps) {
  const { fontScale } = useWindowDimensions();
  const reportHeight = useContext(BottomTabBarHeightCallbackContext);
  const largeText = fontScale > 1.3;
  const [keyboardVisible, setKeyboardVisible] = useState(() =>
    Keyboard.isVisible(),
  );
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  if (keyboardVisible) return null;

  const renderTab = (route: (typeof state.routes)[number], index: number) => {
    const focused = state.index === index;
    const options = descriptors[route.key].options;
    const label =
      typeof options.tabBarLabel === 'string'
        ? options.tabBarLabel
        : route.name;
    const Glyph = icons[route.name as keyof typeof icons];
    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityLabel={options.tabBarAccessibilityLabel || label}
        accessibilityState={{ selected: focused }}
        testID={options.tabBarButtonTestID}
        onPress={() => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented)
            navigation.navigate(route.name, route.params);
        }}
        onLongPress={() =>
          navigation.emit({ type: 'tabLongPress', target: route.key })
        }
        style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
      >
        <View
          style={styles.iconFrame}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Glyph
            size={24}
            strokeWidth={focused ? 2.2 : 1.8}
            color={focused ? colors.primary : colors.muted}
          />
        </View>
        <Text style={[styles.label, focused && styles.activeLabel]}>
          {label}
        </Text>
      </Pressable>
    );
  };
  return (
    <View
      pointerEvents="box-none"
      onLayout={event => reportHeight?.(event.nativeEvent.layout.height)}
      style={[
        styles.safe,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          paddingLeft: Math.max(insets.left, 12),
          paddingRight: Math.max(insets.right, 12),
        },
      ]}
    >
      <View style={[styles.bar, largeText && styles.largeBar]}>
        {largeText ? (
          <View style={styles.tabGroup}>
            {state.routes
              .slice(0, 2)
              .map((route, index) => renderTab(route, index))}
          </View>
        ) : (
          state.routes
            .slice(0, 2)
            .map((route, index) => renderTab(route, index))
        )}
        <View style={styles.createSlot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create new goal"
            accessibilityHint="Opens the form to create a savings goal."
            onPress={() =>
              navigation
                .getParent<NativeStackNavigationProp<MainStackParams>>()
                ?.navigate('CreateGoal')
            }
            style={({ pressed }) => [styles.create, pressed && styles.pressed]}
          >
            <View
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <Plus color={colors.white} size={28} strokeWidth={2.2} />
            </View>
          </Pressable>
        </View>
        {largeText ? (
          <View style={styles.tabGroup}>
            {state.routes
              .slice(2)
              .map((route, index) => renderTab(route, index + 2))}
          </View>
        ) : (
          state.routes
            .slice(2)
            .map((route, index) => renderTab(route, index + 2))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    paddingTop: 18,
  },
  bar: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 76,
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  largeBar: { minHeight: 156 },
  tabGroup: { flex: 1, minWidth: 0, gap: 8 },
  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 2,
  },
  iconFrame: {
    width: 40,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
  activeLabel: { color: colors.primary, fontWeight: '700' },
  createSlot: {
    width: 64,
    marginTop: -24,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  create: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'transparent',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  pressed: { opacity: 0.7 },
});

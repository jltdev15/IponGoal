import React, { ReactNode, useContext, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { ScreenInputFocusContext } from '../components/ScreenContainer';
import { colors } from '../theme/colors';

export function LoginField({
  label,
  leadingIcon,
  trailingControl,
  ...props
}: TextInputProps & {
  label: string;
  leadingIcon: ReactNode;
  trailingControl?: ReactNode;
}) {
  const inputRef = useRef<TextInput>(null);
  const revealInput = useContext(ScreenInputFocusContext);
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View
        testID={`login-field-${label.toLowerCase()}`}
        style={[styles.field, focused && styles.focused]}
      >
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.icon}
        >
          {leadingIcon}
        </View>
        <TextInput
          {...props}
          ref={inputRef}
          accessibilityLabel={label}
          placeholderTextColor="#7B879F"
          style={[styles.input, props.style]}
          onFocus={event => {
            setFocused(true);
            props.onFocus?.(event);
            revealInput?.(inputRef.current);
          }}
          onBlur={event => {
            setFocused(false);
            props.onBlur?.(event);
          }}
        />
        {trailingControl}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  group: { gap: 8 },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    paddingLeft: 2,
  },
  field: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FAD6E3',
    borderRadius: 20,
    backgroundColor: colors.surface,
    paddingLeft: 16,
    paddingRight: 4,
    shadowColor: colors.primary,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    boxShadow: '0px 5px 14px rgba(201, 24, 87, 0.05)',
  },
  focused: { borderColor: colors.primary },
  icon: { width: 24, marginRight: 12 },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 54,
    color: colors.text,
    fontSize: 16,
    paddingVertical: 14,
    paddingHorizontal: 0,
  },
});

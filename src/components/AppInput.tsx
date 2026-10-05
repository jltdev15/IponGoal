import React, { useContext, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { colors } from '../theme/colors';
import { theme } from '../theme/theme';
import { ScreenInputFocusContext } from './ScreenContainer';
export function AppInput({
  label,
  helper,
  ...props
}: TextInputProps & { label: string; helper?: string }) {
  const revealInput = useContext(ScreenInputFocusContext);
  const inputRef = useRef<TextInput>(null);
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={inputRef}
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={[styles.input, props.multiline && styles.multiline]}
        maxLength={props.secureTextEntry ? 128 : 240}
        {...props}
        onFocus={event => {
          props.onFocus?.(event);
          revealInput?.(inputRef.current);
        }}
      />
      {helper && <Text style={theme.muted}>{helper}</Text>}
    </View>
  );
}
const styles = StyleSheet.create({
  group: { gap: 8 },
  label: { fontSize: 15, fontWeight: '600', color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.text,
    backgroundColor: colors.surface,
    fontSize: 16,
  },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
});

import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { CalendarDays } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { theme } from '../theme/theme';
import { formatDate, isValidDate, localDate } from '../utils/dates';

export function CalendarDateField({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState(new Date());
  const [error, setError] = useState('');
  const nativeOpen = useRef(false);
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
      if (nativeOpen.current) {
        void DateTimePickerAndroid.dismiss('date').catch(() => {});
      }
    };
  }, []);
  const open = () => {
    if (disabled || nativeOpen.current) {
      return;
    }
    Keyboard.dismiss();
    setError('');
    const selected = isValidDate(value)
      ? new Date(`${value}T12:00:00`)
      : new Date();
    if (Platform.OS !== 'android') {
      setDraft(selected);
      setIosOpen(true);
      return;
    }
    nativeOpen.current = true;
    const fail = () => {
      nativeOpen.current = false;
      if (live.current) {
        setError('Unable to open the calendar. Please try again.');
      }
    };
    try {
      DateTimePickerAndroid.open({
        value: selected,
        mode: 'date',
        display: 'calendar',
        onValueChange: (_event, date) => {
          nativeOpen.current = false;
          if (live.current) {
            onChange(localDate(date));
          }
        },
        onDismiss: () => {
          nativeOpen.current = false;
        },
        onError: fail,
        positiveButton: { label: 'Select', textColor: colors.primary },
        negativeButton: { label: 'Cancel', textColor: colors.muted },
      });
    } catch {
      fail();
    }
  };
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Opens a calendar to choose a date."
        accessibilityValue={{
          text: value ? formatDate(value) : 'No date selected',
        }}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={open}
        style={({ pressed }) => [
          styles.field,
          (pressed || disabled) && styles.dimmed,
        ]}
      >
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value ? formatDate(value) : 'Choose a date'}
        </Text>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <CalendarDays size={22} color={colors.primary} />
        </View>
      </Pressable>
      <Text style={theme.muted}>Leave unset if you don't have a deadline.</Text>
      {!!value && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear target date"
          disabled={disabled}
          accessibilityState={{ disabled }}
          onPress={() => onChange('')}
          style={styles.clear}
        >
          <Text style={styles.clearText}>Clear date</Text>
        </Pressable>
      )}
      {!!error && (
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={theme.error}
        >
          {error}
        </Text>
      )}
      {Platform.OS !== 'android' && (
        <Modal
          visible={iosOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIosOpen(false)}
        >
          <View style={styles.overlay}>
            <View style={styles.dialog} accessibilityViewIsModal>
              <Text accessibilityRole="header" style={theme.heading}>
                Choose target date
              </Text>
              <DateTimePicker
                value={draft}
                mode="date"
                display="inline"
                onValueChange={(_event, date) => setDraft(date)}
              />
              <View style={styles.dialogActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cancel target date selection"
                  onPress={() => setIosOpen(false)}
                  style={styles.clear}
                >
                  <Text style={styles.clearText}>Cancel</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Confirm target date"
                  onPress={() => {
                    onChange(localDate(draft));
                    setIosOpen(false);
                  }}
                  style={styles.clear}
                >
                  <Text style={styles.clearText}>Select</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  group: { gap: 8 },
  label: { fontSize: 15, fontWeight: '600', color: colors.text },
  field: {
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  value: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  placeholder: { color: colors.muted },
  clear: { minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start' },
  clearText: {
    color: colors.primary,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
  },
  dimmed: { opacity: 0.65 },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(1, 48, 96, 0.35)',
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
});

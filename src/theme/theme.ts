import { StyleSheet } from 'react-native';
import { colors } from './colors';
export const theme = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.6,
  },
  heading: { fontSize: 20, fontWeight: '700', color: colors.text },
  body: { fontSize: 16, lineHeight: 24, color: colors.text },
  muted: { fontSize: 14, lineHeight: 22, color: colors.muted },
  amount: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -1,
  },
  card: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  error: { fontSize: 14, color: colors.danger, lineHeight: 21 },
});

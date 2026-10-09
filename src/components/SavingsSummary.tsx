import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PiggyBank } from 'lucide-react-native';
import { colors } from '../theme/colors';

export function SavingsSummary({
  label,
  amount,
  note,
  stacked,
  children,
}: {
  label: string;
  amount: string;
  note: string;
  stacked: boolean;
  children?: ReactNode;
}) {
  const stackAmount = stacked || amount.length > 8;
  return (
    <View style={summaryStyles.card}>
      <View style={[summaryStyles.top, stackAmount && summaryStyles.stacked]}>
        <View
          style={[
            summaryStyles.labelRow,
            summaryStyles.flex,
            stackAmount && summaryStyles.unflex,
          ]}
        >
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <PiggyBank size={20} color={colors.white} strokeWidth={1.8} />
          </View>
          <Text style={[summaryStyles.label, summaryStyles.flex]}>{label}</Text>
        </View>
        <Text style={summaryStyles.amount}>{amount}</Text>
      </View>
      {children}
      <Text style={summaryStyles.note}>{note}</Text>
    </View>
  );
}

export const summaryStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.text,
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1, minWidth: 0 },
  unflex: { flex: 0 },
  stacked: { flexDirection: 'column', alignItems: 'stretch' },
  label: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
  },
  amount: {
    flexShrink: 1,
    fontSize: 32,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: -1,
  },
  note: { color: '#D5E2EE', fontSize: 12, lineHeight: 18 },
  counts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  countChip: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF18',
  },
  actionChip: { borderWidth: 1, borderColor: '#FFFFFF50' },
  countText: { flex: 1, color: colors.white, fontSize: 13, lineHeight: 20 },
  countNumber: { fontWeight: '700', color: colors.white },
});

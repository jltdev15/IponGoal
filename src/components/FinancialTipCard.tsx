import React from 'react';
import { Text, View } from 'react-native';
import { financialTips } from '../data/financialTips';
import { Icon } from './Icon';
import { theme } from '../theme/theme';
import { colors } from '../theme/colors';
export function FinancialTipCard({
  index = new Date().getDate(),
}: {
  index?: number;
}) {
  return (
    <View
      style={[theme.card, { backgroundColor: colors.goldSoft, borderWidth: 0 }]}
    >
      <View style={theme.row}>
        <Text style={theme.heading}>A little saving wisdom</Text>
        <View
          style={{ padding: 8, borderRadius: 12, backgroundColor: colors.gold }}
        >
          <Icon name="tip" color={colors.text} />
        </View>
      </View>
      <Text style={theme.body}>
        {financialTips[index % financialTips.length]}
      </Text>
    </View>
  );
}

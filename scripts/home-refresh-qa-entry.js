// Synthetic data in com.ipongoal.homeqa only; never use as a distribution entry.
import 'react-native-get-random-values';
import React, { useState } from 'react';
import { AppRegistry, StatusBar, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initializeDatabase, execute } from '../src/database/database';
import { getUserById } from '../src/database/repositories/userRepository';
import { saveSession } from '../src/database/repositories/settingsRepository';
import { useAuthStore } from '../src/stores/authStore';
import { RootNavigator } from '../src/navigation/RootNavigator';
import { AppButton } from '../src/components/AppButton';
import { theme } from '../src/theme/theme';
import { colors } from '../src/theme/colors';

function seed(scenario) {
  initializeDatabase();
  const userId = 'home-refresh-synthetic-user';
  const now = new Date().toISOString();
  execute(
    'INSERT INTO users(id,fullName,username,passwordHash,gradeLevel,createdAt,updatedAt) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET fullName=excluded.fullName',
    [
      userId,
      scenario === 'Long content'
        ? 'AlexandraVeryLongFirstName Marie'
        : 'Alexandra Marie',
      'home-refresh-qa',
      'synthetic-not-for-authentication',
      'Grade 10',
      now,
      now,
    ],
  );
  execute('DELETE FROM goals WHERE userId=?', [userId]);
  const samples =
    scenario === 'Empty'
      ? []
      : scenario === 'Completed only'
      ? [['School supplies', 100000, 100000, 'completed', null, 'book']]
      : scenario === 'Long content'
      ? [
          [
            'A new computer and school supplies for the coming school year',
            100000000000,
            100000000000,
            'active',
            '2026-12-01',
            'phone',
          ],
          ...Array.from({ length: 29 }, (_, i) => [
            `Savings goal ${i + 2}`,
            100000,
            0,
            'active',
            null,
            'gift',
          ]),
        ]
      : [
          ['School supplies', 100000, 25000, 'active', '2026-12-01', 'book'],
          ['A new bicycle', 500000, 175000, 'active', null, 'target'],
          ['Birthday gift', 50000, 50000, 'completed', null, 'gift'],
          ['Last year’s trip', 100000, 10000, 'archived', null, 'travel'],
        ];
  samples.forEach(([name, target, saved, status, date, icon], index) => {
    const goalId = 'home-refresh-goal-' + index;
    const created = `2026-10-${String(30 - index).padStart(
      2,
      '0',
    )}T00:00:00.000Z`;
    execute(
      'INSERT INTO goals(id,userId,name,targetAmount,targetDate,category,icon,note,status,createdAt,updatedAt,completedAt) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
      [
        goalId,
        userId,
        name,
        target,
        date,
        'Other',
        icon,
        '',
        status,
        created,
        now,
        status === 'completed' ? now : null,
      ],
    );
    if (saved) {
      execute(
        'INSERT INTO savings(id,userId,goalId,amount,note,transactionDate,createdAt,updatedAt) VALUES(?,?,?,?,?,?,?,?)',
        [
          'home-refresh-saving-' + index,
          userId,
          goalId,
          saved,
          '',
          '2026-10-07',
          now,
          now,
        ],
      );
    }
  });
  saveSession(userId, true);
  useAuthStore.setState({
    user: getUserById(userId),
    ready: true,
    hasAccounts: true,
  });
}

function HomeRefreshQA() {
  const [ready, setReady] = useState(false);
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      {ready ? (
        <View key="preview" style={{ flex: 1 }}>
          <RootNavigator />
        </View>
      ) : (
        <View
          key="scenario-menu"
          style={{
            flex: 1,
            padding: 24,
            paddingTop: 64,
            gap: 16,
            backgroundColor: colors.background,
          }}
        >
          <Text style={theme.heading}>Home preview · synthetic data</Text>
          {['Populated', 'Empty', 'Completed only', 'Long content'].map(
            scenario => (
              <AppButton
                key={scenario}
                title={scenario}
                onPress={() => {
                  seed(scenario);
                  setReady(true);
                }}
              />
            ),
          )}
        </View>
      )}
    </SafeAreaProvider>
  );
}
AppRegistry.registerComponent('PiggyPath', () => HomeRefreshQA);

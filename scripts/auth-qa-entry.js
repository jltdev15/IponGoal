/* global performance */
/* Isolated com.ipongoal.authqa only: actual native hashing and real repository/store flows. */
import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { AppRegistry, StatusBar, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NativePasswordCrypto from '../specs/NativePasswordCrypto';
import vectors from './auth-qa-vectors.json';
import { initializeDatabase, execute, rows } from '../src/database/database';
import { useAuthStore } from '../src/stores/authStore';
import {
  authenticateUser,
  createUser,
} from '../src/database/repositories/userRepository';
import { RootNavigator } from '../src/navigation/RootNavigator';
const paint = () =>
  new Promise(resolve =>
    requestAnimationFrame(() => requestAnimationFrame(resolve)),
  );
const ms = start => Math.round((performance.now() - start) * 10) / 10;
async function expectFailure(action) {
  let rejected = false;
  try {
    await action();
  } catch {
    rejected = true;
  }
  if (!rejected) throw new Error('Expected rejection');
}
async function benchmark(report) {
  const metrics = {};
  report('Checking 21 native vectors');
  for (const v of vectors) {
    const vectorStart = performance.now();
    const actual = await NativePasswordCrypto.derive(
      v.passwordHex,
      v.saltHex,
      v.rounds,
    ).catch(error => {
      throw new Error(
        'Native rejection at vector ' +
          vectors.indexOf(v) +
          ' (' +
          error.code +
          ')',
      );
    });
    if (v.rounds === 210000 && metrics.firstFullDerivationMs === undefined) {
      metrics.firstFullDerivationMs = ms(vectorStart);
    }
    if (actual !== v.hash)
      throw new Error(
        'Native compatibility mismatch at vector ' + vectors.indexOf(v),
      );
  }
  await expectFailure(() =>
    NativePasswordCrypto.derive('zz', '2a'.repeat(16), 210000),
  );
  report('Measuring native derivation');
  const vector = vectors.find(v => v.rounds === 210000);
  const samples = [];
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    await NativePasswordCrypto.derive(
      vector.passwordHex,
      vector.saltHex,
      vector.rounds,
    );
    samples.push(ms(start));
  }
  metrics.derivationMs = samples;
  const stamp = Date.now().toString();
  const legacyName = 'legacy' + stamp;
  const startInsert = performance.now();
  execute(
    'INSERT INTO users (id,fullName,username,passwordHash,gradeLevel,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?)',
    [
      legacyName,
      'Legacy QA Account',
      legacyName,
      `pbkdf2-sha256$210000$${vector.saltHex}$${vector.hash}`,
      '',
      new Date().toISOString(),
      new Date().toISOString(),
    ],
  );
  metrics.fixtureSQLiteInsertMs = ms(startInsert);
  report('Verifying an existing hash');
  let start = performance.now();
  await authenticateUser(legacyName, 'test123');
  metrics.legacyLoginMs = ms(start);
  await expectFailure(() => authenticateUser(legacyName, 'wrongpass'));
  const username = 'new' + stamp;
  report('Creating a real QA account');
  start = performance.now();
  await useAuthStore
    .getState()
    .register('Native Auth QA', username, 'Piggy🐷pass', 'Piggy🐷pass', '');
  metrics.registrationMs = ms(start);
  start = performance.now();
  await paint();
  metrics.registrationPaintMs = ms(start);
  // Leave the real Home visible long enough for a native frame inspection.
  await new Promise(resolve => setTimeout(resolve, 500));
  useAuthStore.getState().logout();
  await paint();
  report('Logging into the new account');
  start = performance.now();
  await useAuthStore.getState().login(username, 'Piggy🐷pass', false);
  metrics.loginMs = ms(start);
  start = performance.now();
  await paint();
  metrics.loginPaintMs = ms(start);
  const count = rows('SELECT COUNT(*) AS count FROM users')[0].count;
  await expectFailure(() =>
    createUser('Duplicate QA', username, 'test123', 'test123', ''),
  );
  if (rows('SELECT COUNT(*) AS count FROM users')[0].count !== count)
    throw new Error('Duplicate registration mutated records');
  return metrics;
}
function AuthQA() {
  const [phase, setPhase] = useState('Preparing actual hashing QA');
  const [result, setResult] = useState(null);
  const [ticks, setTicks] = useState(0);
  useEffect(() => {
    initializeDatabase();
    let previous = performance.now();
    let maxGap = 0;
    let tickCount = 0;
    const timer = setInterval(() => {
      const now = performance.now();
      maxGap = Math.max(maxGap, now - previous);
      previous = now;
      setTicks(++tickCount);
    }, 50);
    const startup = setTimeout(() => {
      benchmark(setPhase)
        .then(metrics => {
          const final = {
            ...metrics,
            heartbeatTicks: tickCount,
            maxHeartbeatGapMs: Math.round(maxGap),
            vectorsPassed: vectors.length,
          };
          setResult(final);
          setPhase('AUTH QA PASSED');
          console.log('AUTH_QA_RESULT ' + JSON.stringify(final));
        })
        .catch(error => {
          const message =
            error instanceof Error ? error.message : 'Native rejection';
          setPhase('AUTH QA FAILED: ' + message);
          console.log('AUTH_QA_FAILED ' + message);
        })
        .finally(() => clearInterval(timer));
    }, 500);
    return () => {
      clearTimeout(startup);
      clearInterval(timer);
    };
  }, []);
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1 }}>
        <Text>
          {phase} · heartbeat {ticks}
        </Text>
        {!!result && <Text>{JSON.stringify(result)}</Text>}
        <View style={{ flex: 1 }}>
          <RootNavigator />
        </View>
      </View>
    </SafeAreaProvider>
  );
}
AppRegistry.registerComponent('PiggyPath', () => AuthQA);

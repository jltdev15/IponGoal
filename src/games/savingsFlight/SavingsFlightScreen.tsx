import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  AppState,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParams } from '../../navigation/types';
import { appConfig } from '../../config/appConfig';
import { AppButton } from '../../components/AppButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { colors } from '../../theme/colors';
import { theme } from '../../theme/theme';
import { FLIGHT, LEVELS } from './SavingsFlightConfig';
import { SavingsFlightEngine } from './SavingsFlightEngine';
import { SavingsFlightResult } from './SavingsFlightResult';
import { Player } from './components/Player';
import { Obstacle } from './components/Obstacle';
import { Coin } from './components/Coin';
import { DecisionGate } from './components/DecisionGate';
import { HUD } from './components/HUD';

type Props = NativeStackScreenProps<MainStackParams, 'SavingsFlight'>;
export function SavingsFlightScreen(props: Props) {
  const params = props.route.params;
  if (
    !appConfig.ENABLE_SAVINGS_FLIGHT ||
    !params ||
    !LEVELS.some(level => level.id === params.levelId) ||
    !['manual', 'assisted'].includes(params.mode)
  ) {
    return (
      <ScreenContainer>
        <Text style={theme.title}>Savings Flight is getting ready</Text>
        <Text style={theme.body}>This practice game is not available yet.</Text>
        <AppButton
          title="Back to Games"
          onPress={() => props.navigation.navigate('Games')}
        />
      </ScreenContainer>
    );
  }
  return <FlightSession key={`${params.levelId}-${params.mode}`} {...props} />;
}
function FlightSession({ navigation, route }: Props) {
  const { levelId, mode } = route.params;
  const [engine, setEngine] = useState(
    () => new SavingsFlightEngine(levelId, mode),
  );
  const [state, setState] = useState(() => engine.getSnapshot());
  const [scale, setScale] = useState(1);
  const layout = useRef<{ width: number; height: number } | null>(null);
  const values = useRef({
    playerY: new Animated.Value(182),
    obstacleX: new Animated.Value(380),
    coinX: new Animated.Value(480),
    gateX: new Animated.Value(260),
    coinOpacity: new Animated.Value(1),
    playerOpacity: new Animated.Value(1),
  }).current;
  const frame = engine.getFrame();
  const sync = () => setState(engine.getSnapshot());
  const restart = () => {
    const fresh = new SavingsFlightEngine(levelId, mode);
    setEngine(fresh);
    setState(fresh.getSnapshot());
  };
  const exit = () => navigation.navigate('Games');
  useEffect(() => {
    let animationFrame = 0;
    let last: number | null = null;
    let revision = -1;
    let disposed = false;
    const draw = (time: number) => {
      if (disposed) {
        return;
      }
      if (last !== null) {
        engine.advance((time - last) / 1000);
      }
      last = time;
      const next = engine.getFrame();
      values.playerY.setValue(next.playerY);
      values.obstacleX.setValue(next.obstacleX);
      values.coinX.setValue(next.coinX - 12);
      values.gateX.setValue(next.gateX);
      values.coinOpacity.setValue(next.coinVisible ? 1 : 0);
      values.playerOpacity.setValue(next.invulnerable ? 0.55 : 1);
      if (revision !== engine.revision) {
        revision = engine.revision;
        setState(engine.getSnapshot());
      }
      if (
        state.gameStatus === 'playing' ||
        (state.gameStatus === 'decision' && state.decisionPhase === 'choosing')
      ) {
        animationFrame = requestAnimationFrame(draw);
      }
    };
    animationFrame = requestAnimationFrame(draw);
    const subscription = AppState.addEventListener('change', status => {
      if (status !== 'active') {
        engine.pause();
        setState(engine.getSnapshot());
      }
    });
    const unsubscribe = navigation.addListener('blur', () => {
      engine.pause();
      setState(engine.getSnapshot());
    });
    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      subscription.remove();
      unsubscribe();
    };
  }, [engine, navigation, values, state.gameStatus, state.decisionPhase]);
  useEffect(() => {
    if (
      state.gameStatus === 'decision' &&
      state.decisionPhase === 'reading' &&
      state.currentScenario
    ) {
      AccessibilityInfo.announceForAccessibility(
        `Money situation ${state.decisionCount + 1} of 5. ${
          state.currentScenario.prompt
        }`,
      );
    } else if (
      state.gameStatus === 'decision' &&
      state.decisionPhase === 'feedback' &&
      state.feedback
    ) {
      AccessibilityInfo.announceForAccessibility(
        `${state.feedback.thoughtful ? 'Smart choice' : 'Think about it'}. ${
          state.feedback.explanation
        }`,
      );
    }
  }, [
    state.gameStatus,
    state.decisionPhase,
    state.currentScenario,
    state.feedback,
    state.decisionCount,
  ]);
  const viewportChanged = ({
    nativeEvent: { layout: next },
  }: LayoutChangeEvent) => {
    const old = layout.current;
    if (
      old &&
      (Math.abs(old.width - next.width) > 1 ||
        Math.abs(old.height - next.height) > 1)
    ) {
      engine.pause();
      sync();
    }
    layout.current = { width: next.width, height: next.height };
  };
  const measure = ({ nativeEvent: { layout: next } }: LayoutChangeEvent) => {
    setScale(
      Math.max(
        0.1,
        Math.min(next.width / FLIGHT.width, next.height / FLIGHT.height),
      ),
    );
  };
  if (state.gameStatus === 'completed' || state.gameStatus === 'gameOver') {
    return (
      <SavingsFlightResult
        result={engine.getResult()}
        onAgain={restart}
        onExit={exit}
      />
    );
  }
  if (state.gameStatus === 'idle') {
    return (
      <ScreenContainer>
        <Text style={theme.title}>{engine.level.title}</Text>
        <Text style={theme.heading}>
          Your Practice Goal: {engine.level.goalName}
        </Text>
        <HUD state={state} level={engine.level} mode={mode} />
        <Text style={theme.body}>
          {mode === 'manual'
            ? 'Tap the sky to rise. Glide through the gap between expense cards. Small gold coins are fictional windfalls, not real earnings. You have three hearts and checkpoints after each choice.'
            : 'Your piggy bank navigates automatically. Choose with untimed answer buttons. You do not need to tap or steer.'}
        </Text>
        <Text style={theme.body}>
          Five money situations await. Read at your own pace. Use answer buttons
          {mode === 'manual' ? ' or choose to fly through a labeled gate' : ''},
          then see the consequence.
        </Text>
        <Text style={theme.muted}>
          Practice money only. Nothing changes your real goals or savings.
        </Text>
        <AppButton
          title="Start Flight"
          onPress={() => {
            engine.start();
            sync();
          }}
        />
        <AppButton title="Back to Games" variant="secondary" onPress={exit} />
      </ScreenContainer>
    );
  }
  const choosing =
    state.gameStatus === 'decision' && state.decisionPhase === 'choosing';
  const overlay =
    state.gameStatus === 'paused' ||
    state.gameStatus === 'hit' ||
    (state.gameStatus === 'decision' && !choosing);
  const scenario = state.currentScenario;
  const answers =
    scenario &&
    scenario.options.map((option, index) => (
      <AppButton
        key={option.id}
        title={option.label}
        variant="secondary"
        onPress={() => {
          engine.resolveDecision(index);
          sync();
        }}
      />
    ));
  return (
    <ScreenContainer scroll={false}>
      <View
        testID="flight-viewport"
        style={{ flex: 1 }}
        onLayout={viewportChanged}
      >
        <View style={styles.hud}>
          <ScrollView style={{ maxHeight: 142 }}>
            <HUD state={state} level={engine.level} mode={mode} />
          </ScrollView>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Pause flight"
            onPress={() => {
              engine.pause();
              sync();
            }}
            style={styles.pause}
          >
            <Text style={theme.body}>Pause</Text>
          </Pressable>
        </View>
        <View testID="flight-scene" style={styles.scene} onLayout={measure}>
          {!overlay && (
            <View
              collapsable={false}
              style={[styles.stage, { transform: [{ scale }] }]}
              accessibilityElementsHidden={overlay}
              importantForAccessibility={
                mode === 'assisted' ? 'no-hide-descendants' : 'auto'
              }
            >
              <Pressable
                style={StyleSheet.absoluteFill}
                disabled={mode === 'assisted' || overlay}
                accessible={mode === 'manual' && !overlay}
                importantForAccessibility={
                  mode === 'manual' && !overlay ? 'yes' : 'no-hide-descendants'
                }
                accessibilityRole={
                  mode === 'manual' && !overlay ? 'button' : undefined
                }
                accessibilityLabel={
                  mode === 'manual' && !overlay
                    ? 'Flight area. Tap to fly upward.'
                    : undefined
                }
                onPress={() => engine.tap()}
              >
                <View style={styles.cloudOne} />
                <View style={styles.cloudTwo} />
                {!choosing && (
                  <>
                    <Animated.View
                      style={[
                        styles.object,
                        { transform: [{ translateX: values.obstacleX }] },
                      ]}
                    >
                      <Obstacle
                        gapTop={frame.gapTop}
                        gapBottom={frame.gapBottom}
                      />
                    </Animated.View>
                    <Animated.View
                      style={[
                        styles.object,
                        {
                          top: frame.coinY - 12,
                          opacity: values.coinOpacity,
                          transform: [{ translateX: values.coinX }],
                        },
                      ]}
                    >
                      <Coin value={frame.coinValue} />
                    </Animated.View>
                  </>
                )}
                {choosing && scenario && (
                  <Animated.View
                    style={[
                      styles.object,
                      { transform: [{ translateX: values.gateX }] },
                    ]}
                  >
                    <DecisionGate scenario={scenario} />
                  </Animated.View>
                )}
                <Animated.View
                  style={[
                    styles.object,
                    {
                      left: FLIGHT.playerX,
                      opacity: values.playerOpacity,
                      transform: [{ translateY: values.playerY }],
                    },
                  ]}
                >
                  <Player />
                </Animated.View>
              </Pressable>
            </View>
          )}
          {overlay && (
            <ScrollView
              key={
                state.gameStatus === 'decision'
                  ? state.decisionPhase
                  : state.gameStatus
              }
              style={styles.overlay}
              contentContainerStyle={styles.panel}
            >
              {state.gameStatus === 'paused' ? (
                <>
                  <Text style={theme.title}>Flight Paused</Text>
                  <AppButton
                    title="Resume"
                    onPress={() => {
                      engine.resume();
                      sync();
                    }}
                  />
                  <AppButton
                    title="Restart"
                    variant="secondary"
                    onPress={restart}
                  />
                  <AppButton
                    title="Exit Game"
                    variant="secondary"
                    onPress={exit}
                  />
                </>
              ) : state.gameStatus === 'hit' ? (
                <>
                  <Text style={theme.heading}>
                    Let’s try that stretch again
                  </Text>
                  <Text style={theme.body}>
                    Your answered decisions are safe. Resume from your latest
                    checkpoint with {state.lives} hearts.
                  </Text>
                  <AppButton
                    title="Continue Flight"
                    onPress={() => {
                      engine.continueFlight();
                      sync();
                    }}
                  />
                </>
              ) : state.decisionPhase === 'feedback' ? (
                <>
                  <Text style={theme.heading} accessibilityLiveRegion="polite">
                    {state.feedback?.thoughtful
                      ? 'Smart Choice'
                      : 'Think About It'}
                  </Text>
                  <Text style={theme.body}>{state.feedback?.explanation}</Text>
                  <Text style={theme.muted}>Practice money only</Text>
                  <AppButton
                    title="Continue"
                    onPress={() => {
                      engine.continueFlight();
                      sync();
                    }}
                  />
                </>
              ) : (
                <>
                  <Text style={theme.heading}>
                    Money Situation {state.decisionCount + 1} / 5
                  </Text>
                  <Text style={theme.body}>{scenario?.prompt}</Text>
                  {answers}
                  {mode === 'manual' && (
                    <AppButton
                      title="Fly to choose"
                      onPress={() => {
                        engine.flyToChoose();
                        sync();
                      }}
                    />
                  )}
                  <Text style={theme.muted}>
                    {mode === 'manual'
                      ? 'Take your time. Both buttons and gates make the same choice.'
                      : 'Take your time. There is no answer timer.'}
                  </Text>
                </>
              )}
            </ScrollView>
          )}
        </View>
        {choosing && (
          <ScrollView
            style={{ maxHeight: 220 }}
            contentContainerStyle={styles.panel}
          >
            <Text style={theme.body}>{scenario?.prompt}</Text>
            <Text style={theme.muted}>
              Upper gate: first choice · Lower gate: second choice. Buttons are
              available too.
            </Text>
            {answers}
          </ScrollView>
        )}
        <Text style={styles.footer}>
          {mode === 'assisted'
            ? 'Assisted flight'
            : choosing
            ? 'Fly into a gate'
            : 'Tap to fly'}{' '}
          · Practice money only
        </Text>
      </View>
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  hud: { padding: 12, gap: 8 },
  pause: {
    minHeight: 46,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
  },
  scene: {
    flex: 1,
    minHeight: 120,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldSoft,
  },
  stage: {
    width: FLIGHT.width,
    height: FLIGHT.height,
    flexShrink: 0,
    overflow: 'hidden',
    backgroundColor: colors.goldSoft,
  },
  object: { position: 'absolute', left: 0, top: 0 },
  cloudOne: {
    position: 'absolute',
    top: 40,
    left: 35,
    width: 110,
    height: 50,
    borderRadius: 30,
    backgroundColor: colors.white,
  },
  cloudTwo: {
    position: 'absolute',
    top: 270,
    left: 180,
    width: 135,
    height: 55,
    borderRadius: 30,
    backgroundColor: colors.white,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
  },
  panel: { padding: 20, gap: 14 },
  footer: {
    padding: 10,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
  },
});

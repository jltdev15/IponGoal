import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import {
  CoinBurst,
  CollisionNotice,
  FlightClouds,
  FlightHero,
  MotionEntrance,
} from './components/FlightPresentation';
import { useFlightMotion } from './useFlightMotion';
import { GameReview } from '../GameReview';
import { Pause } from 'lucide-react-native';
import { flightSound } from '../../services/flightSound';
import { useFlightAudio } from './useFlightAudio';
import { SoundControl } from './components/SoundControl';
import { FlightGuide } from './components/FlightGuide';

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
      </ScreenContainer>
    );
  }
  return <FlightSession key={`${params.levelId}-${params.mode}`} {...props} />;
}
function FlightSession({ navigation, route }: Props) {
  const { levelId, mode } = route.params;
  const motion = useFlightMotion(navigation);
  const motionRef = useRef(motion);
  useEffect(() => {
    motionRef.current = motion;
  }, [motion]);
  const [engine, setEngine] = useState(
    () => new SavingsFlightEngine(levelId, mode),
  );
  const [state, setState] = useState(() => engine.getSnapshot());
  const [scale, setScale] = useState(1);
  const [playHeight, setPlayHeight] = useState(480);
  const [hudHeight, setHudHeight] = useState(140);
  const [collection, setCollection] = useState({ event: 0, amount: 0, y: 182 });
  const layout = useRef<{ width: number; height: number } | null>(null);
  const values = useRef({
    playerY: new Animated.Value(182),
    obstacleX: new Animated.Value(380),
    coinX: new Animated.Value(480),
    gateX: new Animated.Value(260),
    coinOpacity: new Animated.Value(1),
    playerOpacity: new Animated.Value(1),
    playerTilt: new Animated.Value(0),
  }).current;
  const frame = engine.getFrame();
  const consumeEvents = useCallback(() => {
    for (const event of engine.drainEvents()) {
      flightSound.effect(event.type === 'collision' ? 'bump' : 'coin');
      if (event.type === 'coin')
        setCollection(current => ({
          event: current.event + 1,
          amount: event.amount,
          y: event.y,
        }));
    }
  }, [engine]);
  const sync = () => {
    consumeEvents();
    setState(engine.getSnapshot());
  };
  const sound = useFlightAudio(engine, state, () => {
    engine.pause();
    engine.drainEvents();
    setState(engine.getSnapshot());
  });
  const restart = () => {
    flightSound.stop();
    engine.drainEvents();
    const fresh = new SavingsFlightEngine(levelId, mode);
    setEngine(fresh);
    setState(fresh.getSnapshot());
    setCollection({ event: 0, amount: 0, y: 182 });
  };
  const exit = () => {
    flightSound.stop();
    engine.drainEvents();
    navigation.popTo('Games');
  };
  useEffect(() => {
    let animationFrame = 0;
    let last: number | null = null;
    let revision = -1;
    let disposed = false;
    let previousY = engine.getFrame().playerY;
    const draw = (time: number) => {
      if (disposed) {
        return;
      }
      const elapsed = last === null ? 0 : (time - last) / 1000;
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
      values.playerTilt.setValue(
        motionRef.current && elapsed > 0
          ? Math.max(-8, Math.min(8, (next.playerY - previousY) / elapsed / 24))
          : 0,
      );
      previousY = next.playerY;
      if (revision !== engine.revision) {
        revision = engine.revision;
        const snapshot = engine.getSnapshot();
        consumeEvents();
        setState(snapshot);
      }
      if (engine.isAdvancing()) {
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
      flightSound.stop();
      engine.drainEvents();
      engine.pause();
      setState(engine.getSnapshot());
    });
    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      subscription.remove();
      unsubscribe();
    };
  }, [
    engine,
    navigation,
    values,
    state.gameStatus,
    state.decisionPhase,
    consumeEvents,
  ]);
  useEffect(() => {
    if (!motion || !engine.isAdvancing()) values.playerTilt.setValue(0);
  }, [motion, engine, state.gameStatus, state.decisionPhase, values]);
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
    } else if (state.gameStatus === 'hit') {
      AccessibilityInfo.announceForAccessibility(
        `1 heart lost. ${state.lives} ${
          state.lives === 1 ? 'heart' : 'hearts'
        } remaining. Continue from your checkpoint.`,
      );
    }
  }, [
    state.gameStatus,
    state.decisionPhase,
    state.currentScenario,
    state.feedback,
    state.decisionCount,
    state.lives,
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
        motion={motion}
      />
    );
  }
  if (state.gameStatus === 'idle') {
    return (
      <ScreenContainer responsive>
        <FlightHero enabled={motion} />
        <Text
          accessibilityRole="header"
          style={[theme.title, { fontSize: 24, textAlign: 'center' }]}
        >
          {engine.level.title}
        </Text>
        <HUD state={state} level={engine.level} mode={mode} />
        <SoundControl enabled={sound.enabled} onPress={sound.toggle} />
        <FlightGuide
          mode={mode}
          hasCoins={mode === 'manual' && levelId !== 'budget'}
        />
        <Text style={theme.muted}>
          Practice money only. Nothing changes your real goals or savings.
        </Text>
        <AppButton
          title="Start Flight"
          onPress={() => {
            flightSound.activate();
            engine.start();
            sync();
          }}
        />
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
      <View style={{ flex: 1 }}>
        <View
          testID="flight-viewport"
          style={{ flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' }}
          onLayout={viewportChanged}
        >
          <View style={styles.toolbar}>
            <Text style={styles.mode}>
              {mode === 'assisted' ? 'Automatic flight' : 'Tap to fly'}
            </Text>
            <SoundControl
              compact
              enabled={sound.enabled}
              onPress={sound.toggle}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pause flight"
              accessibilityState={{ disabled: state.gameStatus === 'paused' }}
              disabled={state.gameStatus === 'paused'}
              onPress={() => {
                engine.pause();
                sync();
              }}
              style={styles.pause}
            >
              <Pause size={22} color={colors.text} accessible={false} />
            </Pressable>
          </View>
          <View style={{ flex: 1 }}>
            <View
              testID="flight-underlay"
              collapsable={false}
              style={{ flex: 1, display: overlay ? 'none' : 'flex' }}
              accessibilityElementsHidden={overlay}
              importantForAccessibility={
                overlay ? 'no-hide-descendants' : 'auto'
              }
            >
              <ScrollView
                style={{ flex: 1 }}
                onLayout={event =>
                  setPlayHeight(event.nativeEvent.layout.height)
                }
                contentContainerStyle={styles.playContent}
                accessibilityElementsHidden={overlay}
                importantForAccessibility={
                  overlay ? 'no-hide-descendants' : 'auto'
                }
                scrollEnabled={!overlay}
                onScrollBeginDrag={() => {
                  engine.pause();
                  sync();
                }}
              >
                <View
                  onLayout={event =>
                    setHudHeight(event.nativeEvent.layout.height)
                  }
                >
                  <HUD state={state} level={engine.level} mode={mode} />
                </View>
                <View
                  testID="flight-scene"
                  style={[
                    styles.scene,
                    { height: Math.max(180, playHeight - hudHeight - 24) },
                  ]}
                  onLayout={measure}
                >
                  <View
                    testID="flight-stage"
                    collapsable={false}
                    pointerEvents={overlay ? 'none' : 'auto'}
                    style={[
                      styles.stage,
                      { opacity: overlay ? 0.25 : 1, transform: [{ scale }] },
                    ]}
                    accessibilityElementsHidden={overlay}
                    importantForAccessibility={
                      overlay || mode === 'assisted'
                        ? 'no-hide-descendants'
                        : 'auto'
                    }
                  >
                    <Pressable
                      style={StyleSheet.absoluteFill}
                      disabled={mode === 'assisted' || overlay}
                      accessible={mode === 'manual' && !overlay}
                      importantForAccessibility={
                        mode === 'manual' && !overlay
                          ? 'yes'
                          : 'no-hide-descendants'
                      }
                      accessibilityRole={
                        mode === 'manual' && !overlay ? 'button' : undefined
                      }
                      accessibilityLabel={
                        mode === 'manual' && !overlay
                          ? 'Flight area. Tap to fly upward.'
                          : ''
                      }
                      onPress={() => engine.tap()}
                    >
                      <FlightClouds moving={motion && engine.isAdvancing()} />
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
                        <Player tilt={values.playerTilt} />
                      </Animated.View>
                      <CoinBurst
                        {...collection}
                        enabled={motion && engine.isAdvancing()}
                      />
                    </Pressable>
                  </View>
                </View>
              </ScrollView>
            </View>
            {overlay && (
              <ScrollView
                key={
                  state.gameStatus === 'decision'
                    ? state.decisionPhase
                    : state.gameStatus
                }
                testID="flight-reading-panel"
                accessibilityViewIsModal
                style={styles.overlay}
                contentContainerStyle={styles.panel}
              >
                <MotionEntrance enabled={motion} style={{ gap: 14 }}>
                  {state.gameStatus === 'paused' ? (
                    <>
                      <Text accessibilityRole="header" style={styles.heading}>
                        Flight paused
                      </Text>
                      <SoundControl
                        enabled={sound.enabled}
                        onPress={sound.toggle}
                      />
                      <AppButton
                        title="Resume"
                        onPress={() => {
                          flightSound.activate();
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
                      <CollisionNotice enabled={motion} />
                      <Text accessibilityRole="header" style={styles.heading}>
                        Ready to try again?
                      </Text>
                      <Text style={theme.body}>
                        Your answers are saved. Continue from your checkpoint
                        with {state.lives}{' '}
                        {state.lives === 1 ? 'heart' : 'hearts'}.
                      </Text>
                      <AppButton
                        title="Continue Flight"
                        onPress={() => {
                          flightSound.activate();
                          engine.continueFlight();
                          sync();
                        }}
                      />
                    </>
                  ) : state.decisionPhase === 'feedback' ? (
                    <>
                      <Text
                        accessibilityRole="header"
                        style={styles.heading}
                        accessibilityLiveRegion="polite"
                      >
                        {state.feedback?.thoughtful
                          ? 'Smart Choice'
                          : 'Think About It'}
                      </Text>
                      <Text style={theme.body}>
                        {state.feedback?.explanation}
                      </Text>
                      <Text style={theme.muted}>Practice money only</Text>
                      <AppButton
                        title="Continue"
                        onPress={() => {
                          flightSound.activate();
                          engine.continueFlight();
                          sync();
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <Text accessibilityRole="header" style={styles.heading}>
                        Money Situation {state.decisionCount + 1} / 5
                      </Text>
                      <Text style={theme.body}>{scenario?.prompt}</Text>
                      {answers}
                      {mode === 'manual' && (
                        <GameReview
                          key={state.decisionCount}
                          title="More controls"
                        >
                          <Text style={theme.body}>
                            Optional: steer through the upper gate for the first
                            answer or the lower gate for the second. Answer
                            buttons stay available.
                          </Text>
                          <AppButton
                            title="Fly to choose"
                            variant="secondary"
                            onPress={() => {
                              engine.flyToChoose();
                              sync();
                            }}
                          />
                        </GameReview>
                      )}
                      <Text style={theme.muted}>
                        {mode === 'manual'
                          ? 'Flight is paused. Take your time and choose an answer.'
                          : 'Take your time. There is no answer timer.'}
                      </Text>
                    </>
                  )}
                </MotionEntrance>
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
                Upper gate: first choice · Lower gate: second choice. Buttons
                are available too.
              </Text>
              {answers}
            </ScrollView>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  toolbar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mode: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  heading: { fontSize: 22, fontWeight: '700', color: colors.text },
  playContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 12,
  },
  pause: {
    minHeight: 48,
    minWidth: 48,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
  },
  scene: {
    minHeight: 180,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,

    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stage: {
    width: FLIGHT.width,
    height: FLIGHT.height,
    flexShrink: 0,
    overflow: 'hidden',
    backgroundColor: colors.primarySoft,
  },
  object: { position: 'absolute', left: 0, top: 0 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
  },
  panel: {
    padding: 20,
    flexGrow: 1,
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 20,
  },
});

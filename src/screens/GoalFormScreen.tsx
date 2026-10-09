import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  Keyboard,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { NavigationAction, usePreventRemove } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParams } from '../navigation/types';
import { useAuthStore } from '../stores/authStore';
import { useGoalStore } from '../stores/goalStore';
import {
  createGoal,
  updateGoal,
} from '../database/repositories/goalRepository';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppInput } from '../components/AppInput';
import { CalendarDateField } from '../components/CalendarDateField';
import { AmountInput } from '../components/AmountInput';
import { AppButton } from '../components/AppButton';
import { EmptyState } from '../components/EmptyState';
import { FilterChip } from '../components/FilterChip';
import { GoalPhoto } from '../components/GoalPhoto';
import { Icon } from '../components/Icon';
import { theme } from '../theme/theme';
import { colors } from '../theme/colors';
import { categories } from '../data/categories';
import {
  amountInputValue,
  formatCurrency,
  toCentavos,
  validAmount,
} from '../utils/currency';
import { formatDate, validateDate } from '../utils/dates';
import { validateGoal, validateGoalName } from '../utils/validation';
import { useFormAction } from '../services/useFormAction';
import { chooseGoalPhoto } from '../services/goalPhoto';
import { refreshData } from '../services/refresh';

type Props = NativeStackScreenProps<MainStackParams, 'CreateGoal' | 'EditGoal'>;
const stepTitles = [
  'Your goal',
  'Savings plan',
  'Personalize',
  'Review your goal',
];
export function GoalFormScreen({ route, navigation }: Props) {
  const id =
    route.params && 'goalId' in route.params ? route.params.goalId : undefined;
  const goal = useGoalStore(s => s.goals.find(g => g.id === id));
  const user = useAuthStore(s => s.user)!;
  const [initial] = useState(() => ({
    name: goal?.name || '',
    target: goal ? amountInputValue(goal.targetAmount) : '',
    starting: '0',
    date: goal?.targetDate || '',
    category: goal?.category || 'Electronics',
    note: goal?.note || '',
    photo: goal?.coverPhoto ?? null,
  }));
  const [name, setName] = useState(initial.name);
  const [target, setTarget] = useState(initial.target);
  const [starting, setStarting] = useState(initial.starting);
  const [date, setDate] = useState(initial.date);
  const [category, setCategory] = useState(initial.category);
  const [note, setNote] = useState(initial.note);
  const [photo, setPhoto] = useState(initial.photo);
  const [step, setStep] = useState(0);
  const [validationError, setValidationError] = useState('');
  const [operation, setOperation] = useState<'photo' | 'save' | null>(null);
  const [exitAction, setExitAction] = useState<NavigationAction | null>(null);
  const [saved, setSaved] = useState<{
    goalId?: string;
    reached: boolean;
  } | null>(null);
  const { busy, error, run, clearError } = useFormAction();
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 360 || fontScale > 1.2;
  const promptOpen = useRef(false);
  const left = useRef(false);
  const live = useRef(true);
  const operationLock = useRef(false);
  const dirty =
    name !== initial.name ||
    target !== initial.target ||
    starting !== initial.starting ||
    date !== initial.date ||
    category !== initial.category ||
    note !== initial.note ||
    photo !== initial.photo;
  const locked = busy || exitAction !== null || saved !== null;
  const icon =
    categories.find(c => c.name === category)?.icon || goal?.icon || 'target';
  const clearErrors = () => {
    setValidationError('');
    clearError();
  };
  const previous = () => {
    clearErrors();
    Keyboard.dismiss();
    setStep(Math.max(0, step - 1));
  };
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  useEffect(() => {
    if (validationError || error) {
      AccessibilityInfo.announceForAccessibility(validationError || error);
    }
  }, [validationError, error]);
  usePreventRemove(
    (busy || dirty || (!id && step > 0)) && !exitAction && !saved,
    ({ data }) => {
      if (busy || operationLock.current) {
        AccessibilityInfo.announceForAccessibility(
          'Please wait for the current goal action to finish.',
        );
        return;
      }
      if (!id && step > 0) {
        previous();
        return;
      }
      if (promptOpen.current) {
        return;
      }
      promptOpen.current = true;
      Alert.alert(
        'Discard unsaved changes?',
        'Your goal details and photo have not been saved.',
        [
          {
            text: 'Keep Editing',
            style: 'cancel',
            onPress: () => {
              promptOpen.current = false;
            },
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              promptOpen.current = false;
              setExitAction(data.action);
            },
          },
        ],
        {
          cancelable: true,
          onDismiss: () => {
            promptOpen.current = false;
          },
        },
      );
    },
  );
  useEffect(() => {
    if (left.current || (!exitAction && !saved)) {
      return;
    }
    left.current = true;
    if (exitAction) {
      navigation.dispatch(exitAction);
    } else if (id) {
      navigation.goBack();
    } else if (saved?.goalId) {
      navigation.replace('GoalDetails', { goalId: saved.goalId });
      if (saved.reached) {
        Alert.alert(
          'Goal Reached!',
          'Your starting savings already meet this target. Your goal has been marked as completed.',
        );
      }
    }
  }, [exitAction, saved, id, navigation]);
  const advance = () => {
    if (locked || operationLock.current) {
      return;
    }
    clearErrors();
    Keyboard.dismiss();
    try {
      if (step === 0) {
        validateGoalName(name);
      }
      if (step === 1) {
        validAmount(toCentavos(target));
        validAmount(toCentavos(starting || '0'), true);
        if (date) {
          validateDate(date);
        }
      }
      setStep(Math.min(3, step + 1));
    } catch (problem) {
      setValidationError(
        problem instanceof Error
          ? problem.message
          : 'Please check your goal details.',
      );
    }
  };
  const selectPhoto = (source: 'camera' | 'gallery') => {
    if (locked || operationLock.current) {
      return;
    }
    clearErrors();
    operationLock.current = true;
    void run(async () => {
      setOperation('photo');
      Keyboard.dismiss();
      try {
        const selected = await chooseGoalPhoto(source);
        if (live.current && selected !== undefined) {
          setPhoto(selected);
        }
      } finally {
        if (live.current) {
          setOperation(null);
        }
      }
    }, 'Unable to select your goal photo. Please try again.').finally(() => {
      operationLock.current = false;
    });
  };
  const submit = () => {
    if (locked || operationLock.current) {
      return;
    }
    setValidationError('');
    operationLock.current = true;
    void run(() => {
      setOperation('save');
      try {
        const input = {
          name,
          targetAmount: toCentavos(target),
          targetDate: date || null,
          category,
          icon,
          note,
          coverPhoto: photo,
        };
        validateGoal(input);
        if (id) {
          updateGoal(user.id, id, input);
          refreshData(user.id);
          setSaved({ reached: false });
        } else {
          const startingAmount = toCentavos(starting || '0');
          validAmount(startingAmount, true);
          const goalId = createGoal(user.id, input, startingAmount);
          refreshData(user.id);
          setSaved({ goalId, reached: startingAmount >= input.targetAmount });
        }
      } finally {
        setOperation(null);
      }
    }, 'Unable to save your goal. Please try again.').finally(() => {
      operationLock.current = false;
    });
  };
  if (id && !goal) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Goal not found."
          body="This goal may have been removed."
          action="Go Back"
          onPress={() => navigation.goBack()}
        />
      </ScreenContainer>
    );
  }
  const showIdentity = !!id || step === 0;
  const showPlan = !!id || step === 1;
  const showPersonal = !!id || step === 2;
  return (
    <ScreenContainer
      responsive
      actionColumns={false}
      footer={
        <View style={styles.footer}>
          {!!(validationError || error) && (
            <Text accessibilityRole="alert" style={theme.error}>
              {validationError || error}
            </Text>
          )}
          <View style={[styles.controls, stacked && styles.stacked]}>
            <AppButton
              title="Back"
              variant="secondary"
              disabled={locked}
              style={!stacked ? styles.action : undefined}
              onPress={() => {
                if (locked || operationLock.current) {
                  return;
                }
                if (!id && step > 0) {
                  previous();
                } else {
                  navigation.goBack();
                }
              }}
            />
            <AppButton
              title={
                id ? 'Save Changes' : step === 3 ? 'Create Goal' : 'Continue'
              }
              loading={busy && operation === 'save'}
              disabled={locked}
              style={!stacked ? styles.action : undefined}
              onPress={id || step === 3 ? submit : advance}
            />
          </View>
        </View>
      }
    >
      {!id && (
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={`Step ${step + 1} of 4`}
          accessibilityValue={{ min: 1, max: 4, now: step + 1 }}
          accessibilityLiveRegion="polite"
          style={styles.progress}
        >
          <Text style={theme.muted}>Step {step + 1} of 4</Text>
          <View style={styles.dots}>
            {stepTitles.map((title, index) => (
              <View
                key={title}
                style={[styles.dot, index <= step && styles.activeDot]}
              />
            ))}
          </View>
        </View>
      )}
      <Text accessibilityRole="header" style={theme.title}>
        {id ? 'Edit your goal' : stepTitles[step]}
      </Text>
      {showIdentity && (
        <View style={styles.section}>
          <AppInput
            label="Goal Name"
            value={name}
            onChangeText={setName}
            editable={!locked}
            placeholder="e.g. New Phone"
            maxLength={80}
          />
          <Text style={theme.body}>Category & icon</Text>
          <View style={styles.categories}>
            {categories.map(c => (
              <View key={c.name} style={styles.category}>
                <Icon name={c.icon} size={18} />
                <FilterChip
                  label={c.name}
                  selected={category === c.name}
                  disabled={locked}
                  onPress={() => setCategory(c.name)}
                />
              </View>
            ))}
          </View>
        </View>
      )}
      {showPlan && (
        <View style={styles.section}>
          <AmountInput
            label="Target Amount"
            value={target}
            onChangeText={setTarget}
            editable={!locked}
            helper="The total amount you want to save."
          />
          {!id && (
            <AmountInput
              label="Starting Amount"
              value={starting}
              onChangeText={setStarting}
              editable={!locked}
              helper="Already saved something? Start with that amount."
            />
          )}
          <CalendarDateField
            label="Target Date (optional)"
            value={date}
            onChange={setDate}
            disabled={locked}
          />
        </View>
      )}
      {showPersonal && (
        <View style={styles.section}>
          <Text style={theme.heading}>Goal photo (optional)</Text>
          {!!photo && (
            <GoalPhoto
              photo={photo}
              name={name || 'your goal'}
              icon={icon}
              large
            />
          )}
          <AppButton
            title="Take photo"
            variant="secondary"
            disabled={locked}
            onPress={() => selectPhoto('camera')}
          />
          <AppButton
            title="Choose from gallery"
            variant="secondary"
            disabled={locked}
            onPress={() => selectPhoto('gallery')}
          />
          {!!photo && (
            <AppButton
              title="Remove photo"
              variant="secondary"
              disabled={locked}
              onPress={() => {
                if (!locked && !operationLock.current) {
                  setPhoto(null);
                }
              }}
            />
          )}
          <Text style={theme.muted}>
            Your photo stays on this device. You can continue without one.
          </Text>
          <AppInput
            label="Note (optional)"
            value={note}
            onChangeText={setNote}
            editable={!locked}
            multiline
            placeholder="Why is this goal meaningful to you?"
          />
        </View>
      )}
      {!id && step === 3 && (
        <View style={styles.section}>
          {!!photo && <GoalPhoto photo={photo} name={name} icon={icon} large />}
          <Text style={theme.heading}>{name}</Text>
          <Text style={theme.body}>Category: {category}</Text>
          <Text style={theme.body}>
            Target: {formatCurrency(toCentavos(target))}
          </Text>
          <Text style={theme.body}>
            Starting savings: {formatCurrency(toCentavos(starting || '0'))}
          </Text>
          <Text style={theme.body}>
            Target date: {date ? formatDate(date) : 'No deadline'}
          </Text>
          <Text style={theme.muted}>
            {photo ? 'Goal photo attached' : 'No photo attached'}
          </Text>
          <Text style={theme.body}>Note: {note.trim() || 'No note'}</Text>
          <Text style={theme.muted}>
            Check your details, then create your goal. Back returns to
            Personalize.
          </Text>
        </View>
      )}
      {busy && operation === 'photo' && (
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={theme.muted}
        >
          Opening your photo. Please wait.
        </Text>
      )}
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  footer: { gap: 8 },
  section: { gap: 16 },
  controls: { flexDirection: 'row', gap: 12 },
  stacked: { flexDirection: 'column' },
  action: { flex: 1 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  category: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  progress: { gap: 8 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.border },
  activeDot: { backgroundColor: colors.primary },
});

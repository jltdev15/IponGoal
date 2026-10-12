import React from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
} from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { HomeScreen } from '../src/screens/HomeScreen';
import { HistoryScreen } from '../src/screens/HistoryScreen';
import { StatisticsScreen } from '../src/screens/StatisticsScreen';
import { ProfileScreen } from '../src/screens/ProfileScreen';
import { SavingsSummary } from '../src/components/SavingsSummary';
import { SavingsListItem } from '../src/components/SavingsListItem';
import { FilterChip } from '../src/components/FilterChip';
import { AppInput } from '../src/components/AppInput';
import { AppButton } from '../src/components/AppButton';
import { StatCard } from '../src/components/StatCard';
import { WeeklyChart } from '../src/components/WeeklyChart';
import { Goal, Saving, User } from '../src/types/models';

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('../src/components/Icon', () => ({ Icon: () => null }));
jest.mock('lucide-react-native', () =>
  Object.fromEntries(
    [
      'PiggyBank',
      'Flag',
      'CircleCheck',
      'ArrowRight',
      'Lightbulb',
      'Gamepad2',
      'CalendarDays',
      'Plus',
      'Archive',
      'BadgeCheck',
      'Info',
      'ChevronRight',
    ].map(name => [name, name + 'Icon']),
  ),
);
const mockNavigate = jest.fn();
let mockParams: { goalId?: string } | undefined;
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ params: mockParams }),
}));
let mockGoals: Goal[];
let mockSavings: Saving[];
const mockUser = {
  fullName: 'Alexandra Marie Long Profile Name',
  username: 'alex',
  gradeLevel: '',
  profilePhoto: null,
} as User;
jest.mock('../src/stores/authStore', () => ({
  useAuthStore: (
    selector: (state: {
      user: User;
      logout: () => void;
      reset: () => void;
    }) => unknown,
  ) => selector({ user: mockUser, logout: jest.fn(), reset: jest.fn() }),
}));
jest.mock('../src/stores/goalStore', () => ({
  useGoalStore: (selector: (state: { goals: Goal[] }) => unknown) =>
    selector({ goals: mockGoals }),
}));
jest.mock('../src/stores/savingsStore', () => ({
  useSavingsStore: (selector: (state: { savings: Saving[] }) => unknown) =>
    selector({ savings: mockSavings }),
}));
let renderer: ReactTestRenderer;
function saving(
  id: string,
  goalId: string,
  amount: number,
  date: string,
): Saving {
  return {
    id,
    goalId,
    amount,
    transactionDate: date,
    userId: 'u',
    goalName: goalId === 'a' ? 'School supplies' : 'Archived trip',
    note: '',
    createdAt: date + 'T12:00:00Z',
    updatedAt: '',
  };
}
async function mount(element = <HistoryScreen />) {
  await act(async () => {
    renderer = create(element);
  });
}
async function chip(label: string) {
  await act(async () =>
    renderer.root
      .findAllByType(FilterChip)
      .find(n => n.props.label === label)!
      .props.onPress(),
  );
}
async function change(label: string, value: string) {
  await act(async () =>
    renderer.root
      .findAllByType(AppInput)
      .find(n => n.props.label === label)!
      .props.onChangeText(value),
  );
}
async function button(title: string) {
  await act(async () =>
    renderer.root
      .findAllByType(AppButton)
      .find(n => n.props.title === title)!
      .props.onPress(),
  );
}
function ids() {
  return renderer.root.findByType(FlatList).props.data.map((s: Saving) => s.id);
}
function textContent() {
  function read(children: React.ReactNode): string {
    return React.Children.toArray(children)
      .map(child =>
        typeof child === 'string' || typeof child === 'number'
          ? String(child)
          : React.isValidElement<{ children?: React.ReactNode }>(child)
          ? read(child.props.children)
          : '',
      )
      .join('');
  }
  return renderer.root
    .findAllByType(Text)
    .map(n => read(n.props.children))
    .join('\n');
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  jest.useFakeTimers({ now: new Date('2026-10-07T12:00:00') });
  mockNavigate.mockClear();
  mockParams = undefined;
  mockGoals = [
    { id: 'a', name: 'School supplies', status: 'completed' },
    { id: 'b', name: 'Archived trip', status: 'archived' },
  ] as Goal[];
  mockSavings = [
    saving('today', 'a', 10000, '2026-10-07'),
    saving('month', 'b', 20000, '2026-10-01'),
    saving('past', 'a', 30000, '2026-09-30'),
  ];
  jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({
    width: 390,
    height: 844,
    scale: 3,
    fontScale: 1,
  } as ReturnType<typeof useWindowDimensions>);
  jest
    .spyOn(require('react-native-safe-area-context'), 'useSafeAreaInsets')
    .mockReturnValue({ top: 24, right: 0, bottom: 0, left: 0 });
});
afterEach(async () => {
  if (renderer) await act(async () => renderer.unmount());
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('History filters preserve entry order, totals, monthly headings, and detail navigation', async () => {
  await mount();
  expect(ids()).toEqual(['today', 'month', 'past']);
  expect(renderer.root.findByType(SavingsSummary).props.amount).toBe('₱600');
  expect(textContent()).toContain('October 2026');
  expect(textContent()).toContain('September 2026');
  await chip('This Week');
  expect(ids()).toEqual(['today']);
  expect(renderer.root.findByType(SavingsSummary).props.amount).toBe('₱100');
  await chip('This Month');
  expect(ids()).toEqual(['today', 'month']);
  await act(async () =>
    renderer.root.findAllByType(SavingsListItem)[1].props.onPress(),
  );
  expect(mockNavigate).toHaveBeenLastCalledWith('SavingsDetails', {
    savingId: 'month',
  });
  await chip('All');
  await chip('By Goal');
  await chip('Archived trip');
  expect(ids()).toEqual(['month']);
  expect(renderer.root.findByType(SavingsSummary).props.note).toContain(
    'Archived trip · 1 savings entries',
  );
  await chip('All Goals');
  expect(ids()).toEqual(['today', 'month', 'past']);
});

test('History responds to route-supplied goal changes and clearing the goal', async () => {
  mockParams = { goalId: 'b' };
  await mount();
  expect(ids()).toEqual(['month']);
  mockParams = { goalId: 'a' };
  await act(async () => renderer.update(<HistoryScreen />));
  expect(ids()).toEqual(['today', 'past']);
  mockParams = undefined;
  await act(async () => renderer.update(<HistoryScreen />));
  expect(ids()).toEqual(['today', 'month', 'past']);
});

test('History keeps large histories virtualized and cards opt in without changing secondary rows', async () => {
  mockSavings = Array.from({ length: 100 }, (_, index) =>
    saving(String(index), 'a', 100, '2026-10-07'),
  );
  await mount();
  expect(renderer.root.findByType(FlatList).props.data).toHaveLength(100);
  expect(renderer.root.findAllByType(SavingsListItem).length).toBeLessThan(100);
  expect(
    renderer.root
      .findAllByType(SavingsListItem)
      .every(n => n.props.variant === 'card'),
  ).toBe(true);
  await act(async () =>
    renderer.update(
      <SavingsListItem saving={mockSavings[0]} onPress={jest.fn()} />,
    ),
  );
  const row = renderer.root.findAll(
    n =>
      typeof n.props.style === 'function' &&
      n.props.accessibilityRole === 'button',
  )[0];
  expect(
    StyleSheet.flatten(row.props.style({ pressed: false })).backgroundColor,
  ).toBeUndefined();
});

test('History validates dates, includes both boundaries, and handles empty results', async () => {
  await mount();
  await chip('Date Range');
  await change('From', '2026-02-30');
  await change('To', '2026-10-07');
  await button('Apply Date Range');
  expect(textContent()).toContain('Enter valid dates');
  expect(ids()).toHaveLength(3);
  await change('From', '2026-10-08');
  await button('Apply Date Range');
  expect(textContent()).toContain('Enter valid dates');
  await change('From', '2026-10-01');
  await button('Apply Date Range');
  expect(ids()).toEqual(['today', 'month']);
  expect(textContent()).not.toContain('Enter valid dates');
  await change('From', '2026-10-08');
  await change('To', '2026-10-09');
  await button('Apply Date Range');
  expect(ids()).toEqual([]);
  expect(renderer.root.findByType(SavingsSummary).props.amount).toBe('₱0');
  expect(textContent()).toContain('No savings entries here yet.');
  await button('Go to Goals');
  expect(mockNavigate).toHaveBeenLastCalledWith('BottomTabs', {
    screen: 'Home',
  });
});

test('Statistics retains all metrics, archived totals, chart buckets, and habits', async () => {
  await mount(<StatisticsScreen />);
  expect(renderer.root.findByType(SavingsSummary).props.amount).toBe('₱600');
  expect(
    renderer.root
      .findAllByType(StatCard)
      .map(n => [n.props.label, n.props.value]),
  ).toEqual([
    ['This month', '₱300'],
    ['This week', '₱100'],
    ['Average entry', '₱200.00'],
    ['Savings entries', 3],
    ['Active goals', 0],
    ['Completed goals', 1],
  ]);
  expect(renderer.root.findByType(WeeklyChart).props.buckets).toEqual([
    30000, 0, 0, 0, 0,
  ]);
  expect(textContent()).toContain(
    'You have saved the most toward School supplies.',
  );
});

test('empty Statistics keeps its heading, zero summary, and navigation', async () => {
  mockSavings = [];
  await mount(<StatisticsScreen />);
  expect(textContent()).toContain('Statistics');
  expect(textContent()).toContain('See your habits grow');
  expect(renderer.root.findByType(SavingsSummary).props.amount).toBe('₱0');
  expect(renderer.root.findAllByType(StatCard)).toHaveLength(0);
  await button('Go to Goals');
  expect(mockNavigate).toHaveBeenLastCalledWith('BottomTabs', {
    screen: 'Home',
  });
});

test.each([HistoryScreen, StatisticsScreen])(
  '%p exposes the profile shortcut',
  async Screen => {
    await mount(<Screen />);
    await act(async () =>
      renderer.root
        .findAll(
          n =>
            n.props.accessibilityRole === 'button' &&
            typeof n.props.onPress === 'function',
        )
        .find(n => n.props.accessibilityLabel === 'Open your profile')!
        .props.onPress(),
    );
    expect(mockNavigate).toHaveBeenLastCalledWith('BottomTabs', {
      screen: 'Profile',
    });
  },
);

test.each([
  [320, 1],
  [390, 1],
  [412, 1],
  [320, 1.8],
  [390, 1.8],
  [412, 1.8],
])(
  'all primary screens share safe spacing and readable long content at %s / %s',
  async (width, fontScale) => {
    jest
      .mocked(useWindowDimensions)
      .mockReturnValue({ width, height: 844, scale: 3, fontScale });
    mockSavings[0].amount = 100000000000;
    mockSavings[0].goalName =
      'A very long school supplies and new computer goal name';
    for (const Screen of [
      HomeScreen,
      HistoryScreen,
      StatisticsScreen,
      ProfileScreen,
    ]) {
      await mount(<Screen />);
      const viewport =
        renderer.root.findAllByType(FlatList)[0] ||
        renderer.root.findAllByType(ScrollView)[0];
      expect(
        StyleSheet.flatten(viewport.props.contentContainerStyle),
      ).toMatchObject({
        maxWidth: 480,
        paddingHorizontal: width < 380 ? 16 : 20,
        paddingTop: 40,
        paddingBottom: fontScale > 1.3 ? 206 : 126,
      });
      for (const text of renderer.root.findAllByType(Text)) {
        expect(text.props.numberOfLines).toBeUndefined();
        expect(text.props.adjustsFontSizeToFit).not.toBe(true);
      }
      expect(renderer.root.findByType(SavingsSummary).props.amount).toContain(
        '1,000,000',
      );
      if (Screen === HomeScreen) {
        const heading = renderer.root
          .findAllByType(Text)
          .find(n => n.props.children === 'Your savings goals')!;
        expect(StyleSheet.flatten(heading.props.style).flex).toBe(
          fontScale > 1.2 ? 0 : 1,
        );
      }
      if (Screen === StatisticsScreen)
        expect(
          renderer.root
            .findAllByType(StatCard)
            .every(n => n.props.stacked === (width < 380 || fontScale > 1.2)),
        ).toBe(true);
      await act(async () => renderer.unmount());
    }
  },
);

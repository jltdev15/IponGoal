import React from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
} from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { HomeScreen } from '../src/screens/HomeScreen';
import { GoalCollectionScreen } from '../src/screens/GoalCollectionScreen';
import { HomeGoalRow } from '../src/components/HomeGoalRow';
import { ProgressBar } from '../src/components/ProgressBar';
import { ScreenContainer } from '../src/components/ScreenContainer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Goal, Saving, User } from '../src/types/models';

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('../src/components/Icon', () => ({ Icon: () => null }));
jest.mock('lucide-react-native', () => ({
  ArrowRight: 'ArrowRightIcon',
  CalendarDays: 'CalendarDaysIcon',
  CircleCheck: 'CircleCheckIcon',
  Flag: 'FlagIcon',
  Gamepad2: 'GamepadIcon',
  Lightbulb: 'LightbulbIcon',
  PiggyBank: 'PiggyBankIcon',
  Plus: 'PlusIcon',
}));
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));
jest.mock('@react-navigation/bottom-tabs', () => ({
  useBottomTabBarHeight: () => 100,
}));
jest.mock('@react-navigation/elements', () => ({
  useHeaderHeight: () => 0,
}));
let mockGoals: Goal[] = [];
let mockSavings: Saving[] = [];
const mockUser = { fullName: 'Alexandra Marie', profilePhoto: null } as User;
jest.mock('../src/stores/authStore', () => ({
  useAuthStore: (selector: (state: { user: User }) => unknown) =>
    selector({ user: mockUser }),
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
function goal(id: string, overrides: Partial<Goal> = {}): Goal {
  return {
    id,
    userId: 'u',
    name: `School supplies ${id}`,
    targetAmount: 100000,
    savedAmount: 25000,
    targetDate: null,
    category: 'Education',
    icon: 'book',
    note: '',
    coverPhoto: null,
    status: 'active',
    createdAt: '',
    updatedAt: '',
    completedAt: null,
    entryCount: 1,
    ...overrides,
  };
}
async function mount(element = <HomeScreen />) {
  await act(async () => {
    renderer = create(element);
  });
}
async function press(label: string) {
  const button = renderer.root
    .findAll(
      node =>
        node.props.accessibilityRole === 'button' &&
        typeof node.props.onPress === 'function',
    )
    .find(node => node.props.accessibilityLabel === label)!;
  expect(button).toBeDefined();
  await act(async () => button.props.onPress());
}
function textContent() {
  function readText(children: React.ReactNode): string {
    return React.Children.toArray(children)
      .map(child => {
        if (typeof child === 'string' || typeof child === 'number') {
          return String(child);
        }
        return React.isValidElement<{ children?: React.ReactNode }>(child)
          ? readText(child.props.children)
          : '';
      })
      .join('');
  }
  return renderer.root
    .findAllByType(Text)
    .map(node => readText(node.props.children))
    .join('\n');
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  mockNavigate.mockClear();
  mockGoals = [];
  mockSavings = [];
  mockUser.fullName = 'Alexandra Marie';
  jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({
    width: 412,
    height: 850,
    scale: 3,
    fontScale: 1,
  } as ReturnType<typeof useWindowDimensions>);
});
afterEach(async () => {
  if (renderer) {
    await act(async () => renderer.unmount());
  }
  jest.restoreAllMocks();
});

test.each([false, true])(
  'empty Home leaves goal creation to bottom navigation (earlier goals: %s)',
  async earlier => {
    if (earlier) {
      mockGoals = [
        goal('old', { status: 'completed' }),
        goal('archived', { status: 'archived' }),
      ];
    }
    await mount();
    expect(textContent()).toContain(
      earlier ? 'Ready for another goal?' : 'Start your first savings goal',
    );
    expect(textContent()).toContain(
      earlier
        ? 'Tap + below to start something new.'
        : 'Tap + below to choose what you’re saving for.',
    );
    expect(
      new Set(
        renderer.root
          .findAll(
            node =>
              node.props.accessibilityRole === 'button' &&
              typeof node.props.onPress === 'function',
          )
          .filter(node => /Create/i.test(node.props.accessibilityLabel || ''))
          .map(node => node.props.accessibilityLabel),
      ).size,
    ).toBe(0);
    expect(
      renderer.root
        .findByType(FlatList)
        .findAllByProps({ testID: 'home-create-goal-fab' }),
    ).toHaveLength(0);
    expect(mockNavigate).not.toHaveBeenCalled();
  },
);

test('Home lets the tab bar own the bottom safe area; other screens keep it', async () => {
  jest
    .spyOn(require('react-native-safe-area-context'), 'useSafeAreaInsets')
    .mockReturnValue({ top: 24, right: 0, bottom: 0, left: 0 });
  await mount();
  expect(renderer.root.findByType(SafeAreaView).props.edges).toEqual([
    'left',
    'right',
  ]);
  expect(
    StyleSheet.flatten(
      renderer.root.findByType(FlatList).props.contentContainerStyle,
    ).paddingTop,
  ).toBe(24 + 16);
  expect(
    StyleSheet.flatten(renderer.root.findByType(FlatList).props.style)
      .maxHeight,
  ).toBeUndefined();
  await act(async () => {
    renderer.update(
      <ScreenContainer>
        <Text>Stack screen</Text>
      </ScreenContainer>,
    );
  });
  expect(renderer.root.findByType(SafeAreaView).props.edges).toEqual([
    'left',
    'right',
    'bottom',
  ]);
});

test('Home preserves totals and active order and routes every action', async () => {
  mockGoals = [
    goal('b'),
    goal('done', { status: 'completed' }),
    goal('a'),
    goal('old', { status: 'archived' }),
  ];
  mockSavings = [10000, 20000, 5000].map(amount => ({ amount } as Saving));
  await mount();
  expect(textContent()).toContain('₱350');
  expect(textContent()).toContain(
    'Recorded across all your goals, including completed and archived ones.',
  );
  expect(textContent()).toContain('Saved so far');
  expect(textContent()).toContain('2 in progress');
  expect(textContent()).toContain('1 completed');
  expect(textContent()).toContain('saved of');
  expect(
    renderer.root.findByType(FlatList).props.data.map((item: Goal) => item.id),
  ).toEqual(['b', 'a']);
  expect(textContent()).not.toContain('Start your first savings goal');
  expect(renderer.root.findAllByType(HomeGoalRow)).toHaveLength(2);
  await press('View School supplies b');
  await press('Record savings for School supplies b');
  await press('View completed goals, 1 completed');
  await press('Open your profile');
  await press('Explore learning games');
  expect(mockNavigate.mock.calls).toEqual([
    ['GoalDetails', { goalId: 'b' }],
    ['AddSavings', { goalId: 'b' }],
    ['CompletedGoals'],
    ['BottomTabs', { screen: 'Profile' }],
    ['Games'],
  ]);
  // A deposit button must never be a descendant of the details button.
  const details = renderer.root
    .findAll(
      node =>
        node.props.accessibilityRole === 'button' &&
        typeof node.props.onPress === 'function',
    )
    .find(node => node.props.accessibilityLabel === 'View School supplies b')!;
  expect(
    details.findAll(
      node =>
        node.props.accessibilityLabel ===
        'Record savings for School supplies b',
    ),
  ).toHaveLength(0);
});

test.each([0, 25000, 100000, 125000])(
  'goal progress stays readable and clamped for %s centavos',
  async savedAmount => {
    await mount(
      <HomeGoalRow
        goal={goal('a', { savedAmount, targetDate: '2026-12-01' })}
        onOpen={jest.fn()}
        onAdd={jest.fn()}
      />,
    );
    expect(renderer.root.findByType(ProgressBar).props.percent).toBe(
      Math.min(savedAmount / 1000, 100),
    );
    expect(textContent()).toContain(
      savedAmount > 100000 ? '100%+ saved' : `${savedAmount / 1000}% saved`,
    );
    expect(textContent()).toContain('Aim for ');
  },
);

test('many goals remain virtualized; narrow enlarged text stacks actions and hides art', async () => {
  jest
    .mocked(useWindowDimensions)
    .mockReturnValue({ width: 320, height: 568, scale: 2, fontScale: 1.8 });
  mockUser.fullName = 'AlexandraVeryLongFirstName Marie';
  mockGoals = Array.from({ length: 30 }, (_, index) =>
    goal(`${index}`, {
      name: 'A very long goal name for school materials and a new computer',
      targetAmount: 100000000000,
      savedAmount: 0,
    }),
  );
  await mount();
  const list = renderer.root.findByType(FlatList);
  expect(list.props.data).toHaveLength(30);
  expect(StyleSheet.flatten(list.props.contentContainerStyle)).toMatchObject({
    paddingHorizontal: 16,
    maxWidth: 480,
    // Leave room to scroll the final goal above the enlarged floating tab bar.
    paddingBottom: 206,
  });
  expect(
    renderer.root.findAllByProps({ testID: 'home-create-goal-fab' }),
  ).toHaveLength(0);
  expect(renderer.root.findAllByType(Image)).toHaveLength(0);
  const row = renderer.root.findAllByType(HomeGoalRow)[0];
  const add = row
    .findAll(
      node =>
        node.props.accessibilityRole === 'button' &&
        typeof node.props.onPress === 'function',
    )
    .find(node => node.props.accessibilityLabel.startsWith('Record savings'))!;
  expect(StyleSheet.flatten(add.parent!.props.style)).toMatchObject({
    flexDirection: 'column',
    alignItems: 'stretch',
  });
  expect(textContent()).not.toContain('Aim for ');
  expect(textContent().indexOf('Learning games')).toBeLessThan(
    textContent().indexOf('Your savings goals'),
  );
  expect(textContent().indexOf('Your savings goals')).toBeLessThan(
    textContent().indexOf(mockGoals[0].name),
  );
  await press('Explore learning games');
  expect(mockNavigate).toHaveBeenLastCalledWith('Games');
});

test('completed goals remain reachable with no completed goals or active goals', async () => {
  await mount();
  await press('View completed goals, 0 completed');
  expect(mockNavigate).toHaveBeenLastCalledWith('CompletedGoals');
  const list = renderer.root.findByType(FlatList);
  const header = list.props.ListHeaderComponent as React.ReactElement;
  const footer = list.props.ListFooterComponent as React.ReactElement;
  await act(async () => renderer.update(header));
  expect(textContent()).toContain('Learning games');
  expect(textContent()).not.toContain('Saving tip');
  await act(async () => renderer.update(footer));
  expect(textContent()).toContain('Saving tip');
  expect(textContent()).not.toContain('Learning games');
});

test.each([
  [320, 1],
  [390, 1],
  [412, 1],
  [320, 1.8],
  [390, 1.8],
  [412, 1.8],
])(
  'Home supports width %s and font scale %s without truncation',
  async (width, fontScale) => {
    jest.mocked(useWindowDimensions).mockReturnValue({
      width,
      height: 844,
      scale: 3,
      fontScale,
    });
    mockUser.fullName = 'AlexandraVeryLongFirstName Marie';
    mockGoals = [
      goal('long', {
        name: 'A new computer and school supplies for the coming school year',
        targetAmount: 100000000000,
        savedAmount: 125000,
        targetDate: '2026-12-01',
      }),
    ];
    mockSavings = [{ amount: 100000000000 } as Saving];
    await mount();
    expect(textContent()).toContain('₱1,000,000,000');
    expect(textContent()).toContain(mockGoals[0].name);
    expect(textContent()).toContain('Aim for ');
    for (const text of renderer.root.findAllByType(Text)) {
      expect(text.props.numberOfLines).toBeUndefined();
      expect(text.props.adjustsFontSizeToFit).not.toBe(true);
    }
    for (const control of renderer.root.findAll(
      node =>
        node.props.accessibilityRole === 'button' &&
        typeof node.props.style === 'function',
    )) {
      const style = StyleSheet.flatten(control.props.style({ pressed: false }));
      expect(style.minHeight).toBeGreaterThanOrEqual(48);
      expect(style.height).toBeUndefined();
    }
    const icons = renderer.root.findAll(
      node => typeof node.type === 'string' && node.type.endsWith('Icon'),
    );
    expect(icons.length).toBeGreaterThan(0);
    for (const icon of icons) {
      expect(icon.parent!.props.accessibilityElementsHidden).toBe(true);
      expect(icon.parent!.props.importantForAccessibility).toBe(
        'no-hide-descendants',
      );
    }
  },
);

test('Home opens the all-goals collection', async () => {
  await mount();
  await press('View all goals');
  expect(mockNavigate).toHaveBeenLastCalledWith('AllGoals');
});

test.each([
  ['AllGoals', ['active', 'completed', 'archived']],
  ['CompletedGoals', ['completed']],
  ['ArchivedGoals', ['archived']],
] as const)(
  '%s includes the appropriate goal statuses',
  async (name, statuses) => {
    mockGoals = [
      goal('active'),
      goal('completed', { status: 'completed' }),
      goal('archived', { status: 'archived' }),
    ];
    await mount(
      <GoalCollectionScreen
        {...({
          route: { name },
          navigation: { navigate: mockNavigate },
        } as unknown as Parameters<typeof GoalCollectionScreen>[0])}
      />,
    );
    expect(
      renderer.root
        .findByType(FlatList)
        .props.data.map((item: Goal) => item.status),
    ).toEqual(statuses);
    await press('View School supplies ' + statuses[0]);
    expect(mockNavigate).toHaveBeenLastCalledWith('GoalDetails', {
      goalId: statuses[0],
    });
  },
);

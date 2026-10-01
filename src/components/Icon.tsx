import React from 'react';
import {
  BookOpen,
  Gift,
  GraduationCap,
  History,
  House,
  ChartNoAxesColumn,
  UserRound,
  Smartphone,
  Plane,
  ShieldCheck,
  Wallet,
  Target,
  PiggyBank,
  Check,
  Archive,
  Lightbulb,
  Plus,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
const icons = {
  book: BookOpen,
  gift: Gift,
  school: GraduationCap,
  history: History,
  home: House,
  statistics: ChartNoAxesColumn,
  profile: UserRound,
  phone: Smartphone,
  travel: Plane,
  shield: ShieldCheck,
  wallet: Wallet,
  target: Target,
  piggy: PiggyBank,
  check: Check,
  archive: Archive,
  tip: Lightbulb,
  plus: Plus,
};
export function Icon({
  name,
  size = 24,
  color = colors.primary,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const Component = icons[name as keyof typeof icons] || Target;
  return <Component size={size} color={color} strokeWidth={1.8} />;
}

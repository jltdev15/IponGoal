import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Match the floating bar, including its raised button and bottom safe area.
export function useTabBarClearance() {
  const { fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return 18 + (fontScale > 1.3 ? 156 : 76) + Math.max(insets.bottom, 8);
}

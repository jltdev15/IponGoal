import { Alert } from 'react-native';
export function confirmAction(
  title: string,
  message: string,
  label: string,
  action: () => void,
  destructive = true,
) {
  Alert.alert(
    title,
    message,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: label,
        style: destructive ? 'destructive' : 'default',
        onPress: action,
      },
    ],
    { cancelable: true },
  );
}

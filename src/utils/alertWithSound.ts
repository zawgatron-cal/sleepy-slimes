import { Alert, type AlertButton } from 'react-native';
import { playUiError } from '@/src/services/soundEffects';

export function alertError(title: string, message?: string, buttons?: AlertButton[]): void {
  playUiError();
  Alert.alert(title, message, buttons);
}

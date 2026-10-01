import { Platform } from 'react-native';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import NativePasswordCrypto from '../../specs/NativePasswordCrypto';
import { derivePasswordJS } from './passwordDerivationJS';

export async function derivePassword(
  password: Uint8Array,
  salt: Uint8Array,
  rounds: number,
) {
  if (Platform.OS !== 'android') {
    return derivePasswordJS(password, salt, rounds);
  }
  if (!NativePasswordCrypto) {
    throw new Error(
      'Please update or restart the app. Password security is unavailable.',
    );
  }
  const result = await NativePasswordCrypto.derive(
    bytesToHex(password),
    bytesToHex(salt),
    rounds,
  );
  if (!/^[0-9a-f]{64}$/.test(result)) {
    throw new Error('Password security returned an invalid result.');
  }
  return hexToBytes(result);
}

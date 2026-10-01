import { derivePassword } from './passwordDerivation';
import {
  bytesToHex,
  hexToBytes,
  randomBytes,
  utf8ToBytes,
} from '@noble/hashes/utils';
const iterations = 210_000;
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await derivePassword(utf8ToBytes(password), salt, iterations);
  return `pbkdf2-sha256$${iterations}$${bytesToHex(salt)}$${bytesToHex(hash)}`;
}
export async function verifyPassword(password: string, stored: string) {
  const [algorithm, rounds, salt, expected] = stored.split('$');
  if (
    algorithm !== 'pbkdf2-sha256' ||
    Number(rounds) !== iterations ||
    !/^[0-9a-f]{32}$/.test(salt) ||
    !/^[0-9a-f]{64}$/.test(expected)
  ) {
    return false;
  }
  const actual = await derivePassword(
    utf8ToBytes(password),
    hexToBytes(salt),
    iterations,
  );
  const bytes = hexToBytes(expected);
  let difference = 0;
  // Fixed-length XOR comparison avoids an early return on mismatched bytes.
  for (let i = 0; i < actual.length; i++) {
    // eslint-disable-next-line no-bitwise
    difference |= actual[i] ^ bytes[i];
  }
  return difference === 0;
}

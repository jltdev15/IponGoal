import { Platform } from 'react-native';
import { derivePassword } from '../src/services/passwordDerivation';
import { hashPassword, verifyPassword } from '../src/services/password';
const { Buffer } = require('node:buffer');
const { pbkdf2Sync } = require('node:crypto');
let mockCrypto: { derive: jest.Mock } | null;
jest.mock('../specs/NativePasswordCrypto', () => ({
  __esModule: true,
  get default() {
    return mockCrypto;
  },
}));
const originalOS = Platform.OS;
beforeEach(() => {
  Platform.OS = 'android';
  mockCrypto = {
    derive: jest.fn(async (password, salt, rounds) =>
      pbkdf2Sync(
        Buffer.from(password, 'hex'),
        Buffer.from(salt, 'hex'),
        rounds,
        32,
        'sha256',
      ).toString('hex'),
    ),
  };
});
afterEach(() => {
  Platform.OS = originalOS;
});
test('Android uses the native provider with exact bytes and existing hash format', async () => {
  const password = 'Piggy🐷épass';
  const hash = await hashPassword(password);
  expect(hash).toMatch(/^pbkdf2-sha256\$210000\$[a-f0-9]{32}\$[a-f0-9]{64}$/);
  expect(await verifyPassword(password, hash)).toBe(true);
  expect(await verifyPassword('wrongpass', hash)).toBe(false);
  expect(mockCrypto!.derive).toHaveBeenCalledTimes(3);
  expect(mockCrypto!.derive.mock.calls[0][0]).toBe(
    Buffer.from(password).toString('hex'),
  );
});
test('missing or failing native modules reject without slow Android fallback', async () => {
  mockCrypto = null;
  await expect(
    derivePassword(new Uint8Array([1]), new Uint8Array(16), 210000),
  ).rejects.toThrow('unavailable');
  mockCrypto = {
    derive: jest.fn().mockRejectedValue(new Error('native failure')),
  };
  await expect(
    derivePassword(new Uint8Array([1]), new Uint8Array(16), 210000),
  ).rejects.toThrow('native failure');
  mockCrypto.derive.mockResolvedValue('invalid');
  await expect(
    derivePassword(new Uint8Array([1]), new Uint8Array(16), 210000),
  ).rejects.toThrow('invalid result');
});
test('non-Android retains the byte-compatible JavaScript provider', async () => {
  Platform.OS = 'ios';
  const result = await derivePassword(
    new Uint8Array([1]),
    new Uint8Array(16),
    2,
  );
  expect(Array.from(result)).toEqual(
    Array.from(pbkdf2Sync(Buffer.from([1]), Buffer.alloc(16), 2, 32, 'sha256')),
  );
  expect(mockCrypto!.derive).not.toHaveBeenCalled();
});

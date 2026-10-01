const { pbkdf2Sync } = require('node:crypto');
import { derivePassword } from '../src/services/passwordDerivation';

test.each([1, 2, 210000])(
  'matches PBKDF2 at %i rounds, including existing accounts',
  async rounds => {
    const password = new Uint8Array([
      80, 105, 103, 103, 121, 240, 159, 144, 183, 112, 97, 115, 115,
    ]);
    const salt = new Uint8Array(16).fill(42);
    const actual = await derivePassword(password, salt, rounds);
    const expected = pbkdf2Sync(password, salt, rounds, 32, 'sha256');
    expect(Array.from(actual)).toEqual(Array.from(expected));
  },
);

test('allows native event-loop work while deriving the password', async () => {
  let ticks = 0;
  const timer = setInterval(() => ticks++, 0);
  try {
    await derivePassword(new Uint8Array([1]), new Uint8Array(16), 3000);
    expect(ticks).toBeGreaterThan(1);
  } finally {
    clearInterval(timer);
  }
});

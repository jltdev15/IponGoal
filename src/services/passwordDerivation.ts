import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';

// PBKDF2-HMAC-SHA256 with one 32-byte output block. Yield to the native
// event loop between batches so Hermes can paint and handle interactions.
export async function derivePassword(
  password: Uint8Array,
  salt: Uint8Array,
  rounds: number,
) {
  const key = hmac.create(sha256, password);
  const working = key.clone();
  const block = new Uint8Array(salt.length + 4);
  block.set(salt);
  block[block.length - 1] = 1;
  const digest = new Uint8Array(32);
  const result = new Uint8Array(32);
  try {
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    working.update(block).digestInto(digest);
    result.set(digest);
    for (let i = 1; i < rounds; i++) {
      // Reuse the working HMAC, as noble's PBKDF2 implementation does,
      // to avoid allocating a new hash object for every round.
      key._cloneInto(working).update(digest).digestInto(digest);
      for (let j = 0; j < result.length; j++) {
        // eslint-disable-next-line no-bitwise
        result[j] ^= digest[j];
      }
      if (i % 1000 === 0) {
        await new Promise<void>(resolve => setTimeout(resolve, 0));
      }
    }
    return result;
  } finally {
    key.destroy();
    working.destroy();
    digest.fill(0);
    block.fill(0);
  }
}

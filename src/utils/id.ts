import { randomBytes, bytesToHex } from '@noble/hashes/utils';
export const newId = (prefix: string) =>
  `${prefix}_${bytesToHex(randomBytes(16))}`;

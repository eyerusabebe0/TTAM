import { randomBytes } from 'crypto';

// No 0/O or 1/I/L, because people read these codes aloud and copy them by hand
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // exactly 32 characters

export function randomCode(length: number): string {
  return Array.from(randomBytes(length), (byte) => ALPHABET[byte % ALPHABET.length]).join('');
}
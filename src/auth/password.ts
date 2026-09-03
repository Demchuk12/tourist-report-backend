import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const SALT_BYTES = 16;
const KEY_BYTES = 64;

/**
 * Passwords are hashed with node's built-in scrypt rather than bcrypt: it is a
 * memory-hard KDF from the standard library, so the project gains password
 * storage without a native dependency to rebuild on every Node upgrade.
 *
 * The stored form is `scrypt:<salt hex>:<key hex>` — the salt travels with the
 * hash so old rows stay verifiable if the parameters ever change.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await scrypt(password, salt, KEY_BYTES);

  return `scrypt:${salt.toString('hex')}:${key.toString('hex')}`;
}

/**
 * Compares in constant time, and returns false rather than throwing on a
 * malformed hash so a corrupted row cannot turn a failed login into a 500.
 */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [scheme, saltHex, keyHex] = stored.split(':');
  if (scheme !== 'scrypt' || !saltHex || !keyHex) return false;

  const expected = Buffer.from(keyHex, 'hex');
  if (expected.length !== KEY_BYTES) return false;

  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), KEY_BYTES);

  return timingSafeEqual(actual, expected);
}

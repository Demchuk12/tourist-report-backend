import { hashPassword, verifyPassword } from './password.js';

describe('password hashing', () => {
  it('verifies a password against its own hash', async () => {
    const stored = await hashPassword('leader12345');

    await expect(verifyPassword('leader12345', stored)).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const stored = await hashPassword('leader12345');

    await expect(verifyPassword('leader1234', stored)).resolves.toBe(false);
  });

  it('salts every hash, so equal passwords do not collide', async () => {
    const [first, second] = await Promise.all([
      hashPassword('same-password'),
      hashPassword('same-password'),
    ]);

    expect(first).not.toEqual(second);
  });

  it('returns false instead of throwing on a malformed stored hash', async () => {
    for (const stored of ['', 'not-a-hash', 'bcrypt:abc:def', 'scrypt::']) {
      await expect(verifyPassword('leader12345', stored)).resolves.toBe(false);
    }
  });
});

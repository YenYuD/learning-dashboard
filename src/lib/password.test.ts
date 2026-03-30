import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('password utilities', () => {
  it('hashPassword returns a bcrypt hash (not plaintext)', async () => {
    const hash = await hashPassword('mypassword');
    expect(hash).not.toBe('mypassword');
    expect(hash).toMatch(/^\$2[aby]\$.{56}$/); // bcrypt hash format
  });

  it('verifyPassword returns true for correct password', async () => {
    const hash = await hashPassword('correcthorse');
    const result = await verifyPassword('correcthorse', hash);
    expect(result).toBe(true);
  });

  it('verifyPassword returns false for wrong password', async () => {
    const hash = await hashPassword('correcthorse');
    const result = await verifyPassword('wrongpassword', hash);
    expect(result).toBe(false);
  });

  it('hashPassword produces different hashes for same input (salt)', async () => {
    const hash1 = await hashPassword('samepassword');
    const hash2 = await hashPassword('samepassword');
    expect(hash1).not.toBe(hash2);
  });
});

import { BcryptPasswordHasher } from './bcrypt-password.hasher';

describe('BcryptPasswordHasher', () => {
  const hasher = new BcryptPasswordHasher();

  it('hashes and verifies a password', async () => {
    const hash = await hasher.hash('Secret123!');
    expect(hash).not.toEqual('Secret123!');
    await expect(hasher.verify('Secret123!', hash)).resolves.toBe(true);
    await expect(hasher.verify('wrong', hash)).resolves.toBe(false);
  });
});

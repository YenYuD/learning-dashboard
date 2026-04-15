import { beforeEach, describe, expect, it, vi } from 'vitest';

const findUnique = vi.fn();
const create = vi.fn();
const hashPassword = vi.fn();

vi.mock('~/server/prisma', () => ({
  prisma: {
    user: {
      findUnique,
      create,
    },
  },
}));

vi.mock('~/lib/password', () => ({
  hashPassword,
}));

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a user with normalized name and email', async () => {
    findUnique.mockResolvedValue(null);
    hashPassword.mockResolvedValue('<hashed>');
    create.mockResolvedValue({
      id: 'user-new',
      name: 'Emily Diao',
      email: 'diaoemily0830@gmail.com',
    });

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: '  Emily Diao  ',
          email: '  DiaoEmily@GMAIL.com  ',
          password: 'Secret123!',
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(findUnique).toHaveBeenCalledWith({
      where: { email: 'diaoemily@gmail.com' },
    });
    expect(hashPassword).toHaveBeenCalledWith('Secret123!');
    expect(create).toHaveBeenCalledWith({
      data: {
        name: 'Emily Diao',
        email: 'diaoemily@gmail.com',
        password: '<hashed>',
      },
    });
  });

  it('rejects invalid payloads before touching the database', async () => {
    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: '   ',
          email: 'not-an-email',
          password: '123',
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(findUnique).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });
});

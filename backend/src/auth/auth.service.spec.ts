import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const jwt = { signAsync: jest.fn().mockResolvedValue('token') };
  const prisma = { user: { findUnique: jest.fn() } };
  const service = new AuthService(prisma as never, jwt as never);

  it('retorna token con credenciales válidas', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'a@b.cl', name: 'A', passwordHash: await bcrypt.hash('secret1', 4) });
    await expect(service.login({ email: 'a@b.cl', password: 'secret1' })).resolves.toEqual({
      accessToken: 'token',
      user: { id: 1, email: 'a@b.cl', name: 'A' },
    });
    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: 1, email: 'a@b.cl' });
  });

  it('rechaza password incorrecta', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, passwordHash: await bcrypt.hash('secret1', 4) });
    await expect(service.login({ email: 'a@b.cl', password: 'otra123' })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza usuario inexistente', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.login({ email: 'x@b.cl', password: 'otra123' })).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

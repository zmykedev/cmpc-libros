import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

describe('AuthController', () => {
  it('delega login', async () => {
    const auth = { login: jest.fn().mockResolvedValue({ accessToken: 't' }) };
    const controller = new AuthController(auth as never);
    await expect(controller.login({ email: 'a@b.cl', password: '123456' })).resolves.toEqual({ accessToken: 't' });
  });
});

describe('JwtStrategy', () => {
  it('mapea el payload al usuario', () => {
    const strategy = new JwtStrategy({ getOrThrow: () => 'secret' } as never);
    expect(strategy.validate({ sub: 3, email: 'a@b.cl' })).toEqual({ id: 3, email: 'a@b.cl' });
  });
});

import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  it('conecta y desconecta en el ciclo de vida', async () => {
    const s = new PrismaService();
    const connect = jest.spyOn(s, '$connect').mockResolvedValue();
    const disconnect = jest.spyOn(s, '$disconnect').mockResolvedValue();
    await s.onModuleInit();
    await s.onModuleDestroy();
    expect(connect).toHaveBeenCalled();
    expect(disconnect).toHaveBeenCalled();
  });
});

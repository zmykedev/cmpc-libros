import { AuditService } from './audit.service';

describe('AuditService', () => {
  it('inserta el registro usando el cliente de la transacción', async () => {
    const tx = { auditLog: { create: jest.fn() } };
    await new AuditService().log(tx as never, { action: 'DELETE', entity: 'Book', entityId: 4, userId: 1 });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: { action: 'DELETE', entity: 'Book', entityId: 4, userId: 1, changes: undefined },
    });
  });
});

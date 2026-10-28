import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'UPLOAD_IMAGE';

export interface AuditEntry {
  action: AuditAction;
  entity: string;
  entityId: number;
  userId?: number;
  changes?: unknown;
}

/**
 * Registra operaciones de escritura en la tabla audit_logs.
 * Recibe el cliente de la transacción para que el log se guarde
 * de forma atómica junto con la operación auditada.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger('Audit');

  async log(tx: Prisma.TransactionClient, entry: AuditEntry): Promise<void> {
    await tx.auditLog.create({
      data: {
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        userId: entry.userId,
        changes: (entry.changes ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
    this.logger.log(`${entry.action} ${entry.entity}#${entry.entityId} by user ${entry.userId ?? '-'}`);
  }
}

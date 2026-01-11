import { prisma } from './db';

export async function logAuditEvent(actor_dui: string, action: string, payload: Record<string, unknown>) {
  await prisma.auditEvent.create({
    data: {
      actor_dui,
      action,
      payload_json: payload
    }
  });
}

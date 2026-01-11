import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: Request) {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const { classroomId } = (await request.json()) as { classroomId: string };

  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId }
  });

  if (!classroom) {
    return NextResponse.json({ message: 'Salón no encontrado' }, { status: 404 });
  }

  if (user.role !== 'ADMIN' && user.centro_codigo !== classroom.centro_codigo) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  const updated = await prisma.classroom.update({
    where: { id: classroomId },
    data: {
      status: 'FINALIZED',
      finalized_at: new Date()
    }
  });

  await logAuditEvent(user.dui, 'FINALIZE', {
    classroom_id: classroomId,
    centro_codigo: classroom.centro_codigo
  });

  return NextResponse.json({ classroom: updated });
}

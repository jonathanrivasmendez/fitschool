import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: Request) {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const { studentId, talla_camisa, talla_pantalon_falda, talla_zapatos } = (await request.json()) as {
    studentId: string;
    talla_camisa: string;
    talla_pantalon_falda: string;
    talla_zapatos: string;
  };

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { classroom: true }
  });

  if (!student) {
    return NextResponse.json({ message: 'Alumno no encontrado' }, { status: 404 });
  }

  if (user.role !== 'ADMIN' && user.centro_codigo !== student.classroom.centro_codigo) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  if (student.classroom.status === 'FINALIZED') {
    return NextResponse.json({ message: 'Salón finalizado' }, { status: 400 });
  }

  const entry = await prisma.uniformEntry.upsert({
    where: { student_id: studentId },
    create: {
      student_id: studentId,
      talla_camisa,
      talla_pantalon_falda,
      talla_zapatos
    },
    update: {
      talla_camisa,
      talla_pantalon_falda,
      talla_zapatos
    }
  });

  await logAuditEvent(user.dui, 'SAVE', {
    student_id: studentId,
    classroom_id: student.classroom_id
  });

  return NextResponse.json({ entry });
}

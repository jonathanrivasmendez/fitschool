import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

function countBySize(entries: Array<{ talla_camisa: string; talla_pantalon_falda: string; talla_zapatos: string }>) {
  const camisa: Record<string, number> = {};
  const pantalon: Record<string, number> = {};
  const zapatos: Record<string, number> = {};

  for (const entry of entries) {
    camisa[entry.talla_camisa] = (camisa[entry.talla_camisa] ?? 0) + 1;
    pantalon[entry.talla_pantalon_falda] = (pantalon[entry.talla_pantalon_falda] ?? 0) + 1;
    zapatos[entry.talla_zapatos] = (zapatos[entry.talla_zapatos] ?? 0) + 1;
  }

  return { camisa, pantalon, zapatos };
}

export async function GET(request: Request) {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const anio = Number(searchParams.get('anio') ?? 2026);
  const grado = searchParams.get('grado');
  const centro_codigo = searchParams.get('centro_codigo');

  const resolvedCentro = user.role === 'ADMIN' ? centro_codigo : user.centro_codigo;

  const whereClassroom = {
    anio,
    ...(grado ? { grado } : {}),
    ...(resolvedCentro ? { centro_codigo: resolvedCentro } : {})
  };

  const classrooms = await prisma.classroom.findMany({
    where: whereClassroom,
    include: {
      students: {
        include: { uniformEntry: true }
      }
    }
  });

  const entries = classrooms.flatMap((classroom) =>
    classroom.students.flatMap((student) => (student.uniformEntry ? [student.uniformEntry] : []))
  );

  const summary = countBySize(entries);

  const progress = classrooms.map((classroom) => {
    const total = classroom.students.length;
    const completed = classroom.students.filter((student) => student.uniformEntry).length;
    return {
      classroom_id: classroom.id,
      grado: classroom.grado,
      centro_codigo: classroom.centro_codigo,
      completed,
      total
    };
  });

  return NextResponse.json({ summary, progress });
}

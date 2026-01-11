import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { fetchRoster, fetchSchoolByCode } from '@/lib/minedClient';

export async function POST(request: Request) {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const { anio, grado, centro_codigo } = (await request.json()) as {
    anio: number;
    grado: string;
    centro_codigo?: string;
  };

  const resolvedCentro = user.role === 'ADMIN' ? centro_codigo : user.centro_codigo;
  if (!resolvedCentro) {
    return NextResponse.json({ message: 'Centro requerido' }, { status: 400 });
  }

  const school = await fetchSchoolByCode(resolvedCentro);
  if (!school) {
    return NextResponse.json({ message: 'Centro no encontrado' }, { status: 404 });
  }

  const classroom = await prisma.classroom.upsert({
    where: {
      centro_codigo_grado_anio: {
        centro_codigo: resolvedCentro,
        grado,
        anio
      }
    },
    create: {
      centro_codigo: resolvedCentro,
      grado,
      anio,
      status: 'DRAFT'
    },
    update: {}
  });

  const roster = await fetchRoster(resolvedCentro, grado, anio);

  for (const student of roster) {
    if (student.mined_student_id) {
      await prisma.student.upsert({
        where: {
          mined_student_id: student.mined_student_id
        },
        create: {
          classroom_id: classroom.id,
          mined_student_id: student.mined_student_id,
          nombre: student.nombre,
          genero: student.genero,
          edad: student.edad,
          fecha_nacimiento: student.fecha_nacimiento
        },
        update: {
          classroom_id: classroom.id,
          nombre: student.nombre,
          genero: student.genero,
          edad: student.edad,
          fecha_nacimiento: student.fecha_nacimiento
        }
      });
    } else {
      await prisma.student.create({
        data: {
          classroom_id: classroom.id,
          mined_student_id: null,
          nombre: student.nombre,
          genero: student.genero,
          edad: student.edad,
          fecha_nacimiento: student.fecha_nacimiento
        }
      });
    }
  }

  const students = await prisma.student.findMany({
    where: { classroom_id: classroom.id },
    include: { uniformEntry: true },
    orderBy: { nombre: 'asc' }
  });

  return NextResponse.json({
    classroom,
    school,
    students
  });
}

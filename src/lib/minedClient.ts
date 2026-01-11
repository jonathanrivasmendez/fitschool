import { prisma } from './db';

const MINED_API_BASE_URL = process.env.MINED_API_BASE_URL;
const MINED_API_TOKEN = process.env.MINED_API_TOKEN;

export async function fetchUserByDui(dui: string) {
  if (MINED_API_BASE_URL && MINED_API_TOKEN) {
    return null;
  }
  return prisma.user.findUnique({
    where: { dui },
    select: {
      dui: true,
      nombre: true,
      role: true,
      centro_codigo: true
    }
  });
}

export async function fetchSchoolByCode(centro_codigo: string) {
  if (MINED_API_BASE_URL && MINED_API_TOKEN) {
    return null;
  }
  return prisma.school.findUnique({
    where: { centro_codigo }
  });
}

export async function fetchRoster(centro_codigo: string, grado: string, anio: number) {
  if (MINED_API_BASE_URL && MINED_API_TOKEN) {
    return [] as Array<{
      mined_student_id: string | null;
      nombre: string;
      genero: 'MASCULINO' | 'FEMENINO';
      edad: number | null;
      fecha_nacimiento: Date | null;
    }>;
  }

  const classroom = await prisma.classroom.findUnique({
    where: {
      centro_codigo_grado_anio: { centro_codigo, grado, anio }
    },
    include: {
      students: true
    }
  });

  return (
    classroom?.students.map((student) => ({
      mined_student_id: student.mined_student_id,
      nombre: student.nombre,
      genero: student.genero,
      edad: student.edad ?? null,
      fecha_nacimiento: student.fecha_nacimiento ?? null
    })) ?? []
  );
}

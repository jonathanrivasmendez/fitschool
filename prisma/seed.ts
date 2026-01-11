import { PrismaClient, UserRole, ClassroomStatus, Gender } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('demo123', 10);

  await prisma.auditEvent.deleteMany();
  await prisma.uniformEntry.deleteMany();
  await prisma.student.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.user.deleteMany();
  await prisma.school.deleteMany();

  const school = await prisma.school.create({
    data: {
      centro_codigo: '12345',
      nombre: 'Escuela Primaria San José'
    }
  });

  await prisma.user.createMany({
    data: [
      {
        id: crypto.randomUUID(),
        dui: '07710815-0',
        password_hash: passwordHash,
        nombre: 'Jaime Rodríguez',
        role: UserRole.TEACHER,
        centro_codigo: school.centro_codigo
      },
      {
        id: crypto.randomUUID(),
        dui: '01234567-8',
        password_hash: passwordHash,
        nombre: 'Director Centro',
        role: UserRole.CENTER_MANAGER,
        centro_codigo: school.centro_codigo
      },
      {
        id: crypto.randomUUID(),
        dui: '99999999-9',
        password_hash: passwordHash,
        nombre: 'Admin MINED',
        role: UserRole.ADMIN,
        centro_codigo: null
      }
    ]
  });

  const classroom = await prisma.classroom.create({
    data: {
      centro_codigo: school.centro_codigo,
      grado: '3',
      anio: 2026,
      status: ClassroomStatus.DRAFT
    }
  });

  await prisma.student.createMany({
    data: [
      {
        id: crypto.randomUUID(),
        classroom_id: classroom.id,
        mined_student_id: 'MINED-001',
        nombre: 'Ana Martínez',
        genero: Gender.FEMENINO,
        edad: 8,
        fecha_nacimiento: new Date('2017-02-10')
      },
      {
        id: crypto.randomUUID(),
        classroom_id: classroom.id,
        mined_student_id: 'MINED-002',
        nombre: 'Carlos Pérez',
        genero: Gender.MASCULINO,
        edad: 9,
        fecha_nacimiento: new Date('2016-11-05')
      },
      {
        id: crypto.randomUUID(),
        classroom_id: classroom.id,
        mined_student_id: 'MINED-003',
        nombre: 'Diana Gómez',
        genero: Gender.FEMENINO,
        edad: 8,
        fecha_nacimiento: new Date('2017-05-22')
      },
      {
        id: crypto.randomUUID(),
        classroom_id: classroom.id,
        mined_student_id: 'MINED-004',
        nombre: 'Luis Hernández',
        genero: Gender.MASCULINO,
        edad: 9,
        fecha_nacimiento: new Date('2016-08-14')
      },
      {
        id: crypto.randomUUID(),
        classroom_id: classroom.id,
        mined_student_id: 'MINED-005',
        nombre: 'María López',
        genero: Gender.FEMENINO,
        edad: 8,
        fecha_nacimiento: new Date('2017-01-30')
      }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

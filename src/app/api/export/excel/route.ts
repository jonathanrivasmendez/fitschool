import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { requireApiUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';

export async function GET(request: Request) {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const anio = Number(searchParams.get('anio') ?? 2026);
  const grado = searchParams.get('grado');
  const type = searchParams.get('type') ?? 'detalle';
  const centro_codigo = searchParams.get('centro_codigo');

  const resolvedCentro = user.role === 'ADMIN' ? centro_codigo : user.centro_codigo;

  const classrooms = await prisma.classroom.findMany({
    where: {
      anio,
      ...(grado ? { grado } : {}),
      ...(resolvedCentro ? { centro_codigo: resolvedCentro } : {})
    },
    include: {
      students: {
        include: { uniformEntry: true }
      }
    }
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Uniformes');

  if (type === 'resumen') {
    sheet.addRow(['Centro', 'Grado', 'Alumno', 'Camisa', 'Pantalón/Falda', 'Zapatos']);
    classrooms.forEach((classroom) => {
      classroom.students.forEach((student) => {
        sheet.addRow([
          classroom.centro_codigo,
          classroom.grado,
          student.nombre,
          student.uniformEntry?.talla_camisa ?? '',
          student.uniformEntry?.talla_pantalon_falda ?? '',
          student.uniformEntry?.talla_zapatos ?? ''
        ]);
      });
    });
  } else {
    sheet.addRow(['Centro', 'Grado', 'Alumno', 'Camisa', 'Pantalón/Falda', 'Zapatos']);
    classrooms.forEach((classroom) => {
      classroom.students.forEach((student) => {
        sheet.addRow([
          classroom.centro_codigo,
          classroom.grado,
          student.nombre,
          student.uniformEntry?.talla_camisa ?? '',
          student.uniformEntry?.talla_pantalon_falda ?? '',
          student.uniformEntry?.talla_zapatos ?? ''
        ]);
      });
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  await logAuditEvent(user.dui, 'EXPORT_EXCEL', {
    anio,
    grado,
    centro_codigo: resolvedCentro
  });

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="uniformes-${anio}.xlsx"`
    }
  });
}

import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
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
  const type = searchParams.get('type') ?? 'reporte';
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

  const rows = classrooms
    .map((classroom) =>
      classroom.students
        .map(
          (student) => `
        <tr>
          <td>${classroom.centro_codigo}</td>
          <td>${classroom.grado}</td>
          <td>${student.nombre}</td>
          <td>${student.uniformEntry?.talla_camisa ?? ''}</td>
          <td>${student.uniformEntry?.talla_pantalon_falda ?? ''}</td>
          <td>${student.uniformEntry?.talla_zapatos ?? ''}</td>
        </tr>`
        )
        .join('')
    )
    .join('');

  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          h1 { font-size: 20px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 8px; font-size: 12px; }
          th { background: #f3f4f6; text-align: left; }
        </style>
      </head>
      <body>
        <h1>UNIFORME ESCOLAR 2026 - ${type.toUpperCase()}</h1>
        <table>
          <thead>
            <tr>
              <th>Centro</th>
              <th>Grado</th>
              <th>Alumno</th>
              <th>Camisa</th>
              <th>Pantalón/Falda</th>
              <th>Zapatos</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({ format: 'A4' });
  await browser.close();

  await logAuditEvent(user.dui, 'EXPORT_PDF', {
    anio,
    grado,
    centro_codigo: resolvedCentro
  });

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="uniformes-${anio}.pdf"`
    }
  });
}

import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  if (user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  const schools = await prisma.school.findMany({
    orderBy: { nombre: 'asc' }
  });

  return NextResponse.json({ schools });
}

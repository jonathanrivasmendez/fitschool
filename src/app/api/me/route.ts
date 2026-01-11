import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const school = session.user.centro_codigo
    ? await prisma.school.findUnique({ where: { centro_codigo: session.user.centro_codigo } })
    : null;

  return NextResponse.json({ user: session.user, school });
}

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: Request) {
  const body = await request.json();
  const { dui, password } = body as { dui?: string; password?: string };

  if (!dui || !password) {
    return NextResponse.json({ message: 'DUI y contraseña requeridos' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { dui }
  });

  if (!user) {
    return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
  }

  const session = await getSession();
  session.user = {
    id: user.id,
    dui: user.dui,
    nombre: user.nombre,
    role: user.role,
    centro_codigo: user.centro_codigo
  };
  await session.save();

  await logAuditEvent(user.dui, 'LOGIN_SUCCESS', { role: user.role });

  return NextResponse.json({ ok: true });
}

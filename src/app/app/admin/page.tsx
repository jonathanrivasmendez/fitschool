import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export default async function AdminPage() {
  const session = await getSession();
  if (!session.user) {
    redirect('/login');
  }
  if (session.user.role !== 'ADMIN') {
    redirect('/app');
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      nombre: true,
      dui: true,
      role: true,
      centro_codigo: true
    },
    orderBy: { nombre: 'asc' }
  });

  return (
    <main className="space-y-6 px-4 py-6 md:px-8">
      <header className="rounded-lg bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold">Administración</h1>
        <p className="text-sm text-slate-500">Solo lectura de usuarios existentes</p>
      </header>

      <section className="rounded-lg bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          {users.map((user) => (
            <div key={user.id} className="rounded border border-slate-200 bg-slate-50 p-3">
              <p className="font-medium">{user.nombre}</p>
              <p className="text-sm text-slate-500">DUI: {user.dui}</p>
              <p className="text-sm text-slate-500">Rol: {user.role}</p>
              <p className="text-sm text-slate-500">Centro: {user.centro_codigo ?? 'N/A'}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

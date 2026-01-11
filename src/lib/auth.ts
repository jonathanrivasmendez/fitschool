import { getIronSession, IronSessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export type SessionUser = {
  id: string;
  dui: string;
  nombre: string;
  role: 'TEACHER' | 'CENTER_MANAGER' | 'ADMIN';
  centro_codigo: string | null;
};

type SessionData = {
  user?: SessionUser;
};

const sessionOptions: IronSessionOptions = {
  cookieName: 'uniforme_session',
  password: process.env.SESSION_PASSWORD ?? 'dev_password_please_change',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
};

export async function getSession() {
  return getIronSession<SessionData>(cookies(), sessionOptions);
}

export async function requireUser() {
  const session = await getSession();
  if (!session.user) {
    redirect('/login');
  }
  return session.user;
}

export async function requireApiUser() {
  const session = await getSession();
  if (!session.user) {
    return null;
  }
  return session.user;
}

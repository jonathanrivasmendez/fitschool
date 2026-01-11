'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const [dui, setDui] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dui, password })
    });
    setLoading(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.message ?? 'Credenciales inválidas');
      return;
    }

    window.location.href = '/app';
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow">
        <div>
          <h1 className="text-2xl font-semibold">UNIFORME ESCOLAR 2026</h1>
          <p className="text-sm text-slate-500">Ingreso con DUI (EDWI)</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">DUI</label>
          <Input value={dui} onChange={(event) => setDui(event.target.value)} placeholder="00000000-0" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Contraseña</label>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </Button>
      </form>
    </main>
  );
}

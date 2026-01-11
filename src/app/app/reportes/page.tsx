'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Summary = {
  camisa: Record<string, number>;
  pantalon: Record<string, number>;
  zapatos: Record<string, number>;
};

type Progress = {
  classroom_id: string;
  grado: string;
  centro_codigo: string;
  completed: number;
  total: number;
};

type School = {
  centro_codigo: string;
  nombre: string;
};

export default function ReportesPage() {
  const [anio, setAnio] = useState(2026);
  const [grado, setGrado] = useState('');
  const [centroCodigo, setCentroCodigo] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/me');
      if (response.ok) {
        const data = await response.json();
        if (data.user?.role === 'ADMIN') {
          setIsAdmin(true);
          const schoolsResponse = await fetch('/api/schools');
          if (schoolsResponse.ok) {
            const schoolsData = await schoolsResponse.json();
            setSchools(schoolsData.schools ?? []);
          }
        }
      }
    };
    load();
  }, []);

  const fetchReport = async () => {
    const params = new URLSearchParams({
      anio: String(anio)
    });
    if (grado) params.set('grado', grado);
    if (isAdmin && centroCodigo) params.set('centro_codigo', centroCodigo);

    const response = await fetch(`/api/reports/summary?${params.toString()}`);
    if (response.ok) {
      const data = await response.json();
      setSummary(data.summary);
      setProgress(data.progress);
    }
  };

  const renderCountRows = (label: string, data?: Record<string, number>) => {
    if (!data) return null;
    return Object.entries(data).map(([size, count]) => (
      <TableRow key={`${label}-${size}`}>
        <TableCell>{label}</TableCell>
        <TableCell>{size}</TableCell>
        <TableCell>{count}</TableCell>
      </TableRow>
    ));
  };

  return (
    <main className="space-y-6 px-4 py-6 md:px-8">
      <header className="rounded-lg bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold">Reportes</h1>
        <p className="text-sm text-slate-500">Resumen de tallas y avance por grado</p>
      </header>

      <section className="grid gap-4 rounded-lg bg-white p-4 shadow-sm md:grid-cols-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Año</label>
          <Select value={String(anio)} onChange={(event) => setAnio(Number(event.target.value))}>
            {[2026, 2027].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Grado</label>
          <Select value={grado} onChange={(event) => setGrado(event.target.value)}>
            <option value="">Todos</option>
            {['1', '2', '3', '4', '5', '6'].map((grade) => (
              <option key={grade} value={grade}>
                {grade}°
              </option>
            ))}
          </Select>
        </div>
        {isAdmin ? (
          <div className="space-y-2">
            <label className="text-sm font-medium">Centro</label>
            <Select value={centroCodigo} onChange={(event) => setCentroCodigo(event.target.value)}>
              <option value="">Todos</option>
              {schools.map((school) => (
                <option key={school.centro_codigo} value={school.centro_codigo}>
                  {school.centro_codigo} - {school.nombre}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
        <div className="flex items-end">
          <Button className="w-full" onClick={fetchReport}>
            Generar reporte
          </Button>
        </div>
      </section>

      {summary ? (
        <section className="space-y-4">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">Conteos por talla</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Talla</TableHead>
                  <TableHead>Cantidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renderCountRows('Camisa', summary.camisa)}
                {renderCountRows('Pantalón/Falda', summary.pantalon)}
                {renderCountRows('Zapatos', summary.zapatos)}
              </TableBody>
            </Table>
          </div>

          <div className="rounded-lg bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">Avance por grado</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Centro</TableHead>
                  <TableHead>Grado</TableHead>
                  <TableHead>Completado</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {progress.map((item) => (
                  <TableRow key={item.classroom_id}>
                    <TableCell>{item.centro_codigo}</TableCell>
                    <TableCell>{item.grado}</TableCell>
                    <TableCell>{item.completed}</TableCell>
                    <TableCell>{item.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      ) : null}
    </main>
  );
}

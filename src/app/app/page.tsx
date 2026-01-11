'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const shirtSizes = ['6', '8', '10', '12', '14'];
const pantsSizes = ['6', '8', '10', '12', '14'];
const shoeSizes = Array.from({ length: 7 }, (_, index) => String(28 + index));

type User = {
  id: string;
  dui: string;
  nombre: string;
  role: 'TEACHER' | 'CENTER_MANAGER' | 'ADMIN';
  centro_codigo: string | null;
};

type School = {
  centro_codigo: string;
  nombre: string;
};

type Student = {
  id: string;
  nombre: string;
  genero: 'MASCULINO' | 'FEMENINO';
  edad: number | null;
  fecha_nacimiento: string | null;
  uniformEntry?: {
    talla_camisa: string;
    talla_pantalon_falda: string;
    talla_zapatos: string;
    updated_at: string;
  } | null;
};

type Classroom = {
  id: string;
  centro_codigo: string;
  grado: string;
  anio: number;
  status: 'DRAFT' | 'FINALIZED';
};

type EntryState = {
  talla_camisa: string;
  talla_pantalon_falda: string;
  talla_zapatos: string;
};

type SaveState = 'pending' | 'complete' | 'saved';

function calculateAge(fechaNacimiento: string | null, edad: number | null) {
  if (edad) return edad;
  if (!fechaNacimiento) return null;
  const birth = new Date(fechaNacimiento);
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    years -= 1;
  }
  return years;
}

export default function AppPage() {
  const [user, setUser] = useState<User | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [anio, setAnio] = useState(2026);
  const [grado, setGrado] = useState('3');
  const [centroCodigo, setCentroCodigo] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [entries, setEntries] = useState<Record<string, EntryState>>({});
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});
  const [loading, setLoading] = useState(false);
  const timeouts = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setSchool(data.school ?? null);
        if (data.user?.role === 'ADMIN') {
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

  const completion = useMemo(() => {
    const total = students.length;
    const completed = students.filter((student) => {
      const entry = entries[student.id];
      return entry?.talla_camisa && entry?.talla_pantalon_falda && entry?.talla_zapatos;
    }).length;
    return { total, completed };
  }, [entries, students]);

  const progressValue = completion.total ? (completion.completed / completion.total) * 100 : 0;

  const handleEntryChange = (studentId: string, value: Partial<EntryState>) => {
    setEntries((prev) => {
      const next = { ...prev, [studentId]: { ...prev[studentId], ...value } };
      const entry = next[studentId];
      const complete = entry.talla_camisa && entry.talla_pantalon_falda && entry.talla_zapatos;
      setSaveStates((prevStates) => ({
        ...prevStates,
        [studentId]: complete ? 'complete' : 'pending'
      }));
      return next;
    });
  };

  const saveStudent = async (studentId: string) => {
    const entry = entries[studentId];
    if (!entry || !entry.talla_camisa || !entry.talla_pantalon_falda || !entry.talla_zapatos) {
      return;
    }

    const response = await fetch('/api/students/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        ...entry
      })
    });

    if (response.ok) {
      setSaveStates((prevStates) => ({
        ...prevStates,
        [studentId]: 'saved'
      }));
    }
  };

  const scheduleSave = (studentId: string) => {
    if (timeouts.current[studentId]) {
      clearTimeout(timeouts.current[studentId]);
    }
    timeouts.current[studentId] = setTimeout(() => {
      void saveStudent(studentId);
    }, 800);
  };

  const handleAutoSave = (studentId: string) => {
    const entry = entries[studentId];
    if (entry?.talla_camisa && entry?.talla_pantalon_falda && entry?.talla_zapatos) {
      scheduleSave(studentId);
    }
  };

  const loadRoster = async () => {
    setLoading(true);
    const response = await fetch('/api/classrooms/load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        anio,
        grado,
        centro_codigo: user?.role === 'ADMIN' ? centroCodigo : undefined
      })
    });
    setLoading(false);

    if (!response.ok) {
      return;
    }

    const data = await response.json();
    setClassroom(data.classroom);
    setSchool(data.school);
    setStudents(data.students);
    const initialEntries: Record<string, EntryState> = {};
    const initialStates: Record<string, SaveState> = {};
    data.students.forEach((student: Student) => {
      initialEntries[student.id] = {
        talla_camisa: student.uniformEntry?.talla_camisa ?? '',
        talla_pantalon_falda: student.uniformEntry?.talla_pantalon_falda ?? '',
        talla_zapatos: student.uniformEntry?.talla_zapatos ?? ''
      };
      const complete =
        initialEntries[student.id].talla_camisa &&
        initialEntries[student.id].talla_pantalon_falda &&
        initialEntries[student.id].talla_zapatos;
      initialStates[student.id] = student.uniformEntry ? 'saved' : complete ? 'complete' : 'pending';
    });
    setEntries(initialEntries);
    setSaveStates(initialStates);
  };

  const finalizeClassroom = async () => {
    if (!classroom) return;
    const response = await fetch('/api/classrooms/finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classroomId: classroom.id })
    });
    if (response.ok) {
      const data = await response.json();
      setClassroom(data.classroom);
    }
  };

  const saveAll = async () => {
    for (const student of students) {
      await saveStudent(student.id);
    }
  };

  const isFinalized = classroom?.status === 'FINALIZED';

  return (
    <main className="space-y-6 px-4 py-6 md:px-8">
      <header className="space-y-2 rounded-lg bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">UNIFORME ESCOLAR 2026</h1>
            {user ? (
              <p className="text-sm text-slate-600">
                Usuario: {user.nombre} | DUI: {user.dui} | Rol: {user.role}
              </p>
            ) : null}
            {user && user.role !== 'ADMIN' && school ? (
              <p className="text-sm text-slate-500">
                Centro: {school.centro_codigo} - {school.nombre}
              </p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => fetch('/api/logout', { method: 'POST' }).then(() => (window.location.href = '/login'))}
            >
              Salir
            </Button>
          </div>
        </div>
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
            {['1', '2', '3', '4', '5', '6'].map((grade) => (
              <option key={grade} value={grade}>
                {grade}°
              </option>
            ))}
          </Select>
        </div>
        {user?.role === 'ADMIN' ? (
          <div className="space-y-2">
            <label className="text-sm font-medium">Centro</label>
            <Select value={centroCodigo} onChange={(event) => setCentroCodigo(event.target.value)}>
              <option value="">Seleccionar centro</option>
              {schools.map((schoolOption) => (
                <option key={schoolOption.centro_codigo} value={schoolOption.centro_codigo}>
                  {schoolOption.centro_codigo} - {schoolOption.nombre}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
        <div className="flex items-end">
          <Button className="w-full" onClick={loadRoster} disabled={loading || (user?.role === 'ADMIN' && !centroCodigo)}>
            {loading ? 'Cargando...' : 'Cargar lista'}
          </Button>
        </div>
      </section>

      {students.length ? (
        <section className="space-y-4">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Completado: {completion.completed} / {completion.total} alumnos
                </p>
                <Progress value={progressValue} className="mt-2" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={saveAll} disabled={isFinalized}>
                  Guardar
                </Button>
                <Button onClick={finalizeClassroom} disabled={isFinalized}>
                  Enviar salón
                </Button>
                {isFinalized ? <Badge variant="saved">FINALIZADO</Badge> : null}
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alumno</TableHead>
                  <TableHead>Edad</TableHead>
                  <TableHead>Género</TableHead>
                  <TableHead>Talla Camisa</TableHead>
                  <TableHead>Talla Pantalón/Falda</TableHead>
                  <TableHead>Talla Zapatos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student, index) => {
                  const entry = entries[student.id] ?? { talla_camisa: '', talla_pantalon_falda: '', talla_zapatos: '' };
                  const status = saveStates[student.id] ?? 'pending';
                  return (
                    <TableRow key={student.id} id={`student-row-${student.id}`}>
                      <TableCell className="font-medium">{student.nombre}</TableCell>
                      <TableCell>{calculateAge(student.fecha_nacimiento, student.edad) ?? '-'}</TableCell>
                      <TableCell>{student.genero}</TableCell>
                      <TableCell>
                        <Select
                          value={entry.talla_camisa}
                          onChange={(event) => {
                            handleEntryChange(student.id, { talla_camisa: event.target.value });
                            handleAutoSave(student.id);
                          }}
                          disabled={isFinalized}
                        >
                          <option value="">Seleccionar</option>
                          {shirtSizes.map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell>
                        <span className="mb-1 block text-xs text-slate-500">
                          {student.genero === 'FEMENINO' ? 'Falda' : 'Pantalón'}
                        </span>
                        <Select
                          value={entry.talla_pantalon_falda}
                          onChange={(event) => {
                            handleEntryChange(student.id, { talla_pantalon_falda: event.target.value });
                            handleAutoSave(student.id);
                          }}
                          disabled={isFinalized}
                        >
                          <option value="">Seleccionar</option>
                          {pantsSizes.map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={entry.talla_zapatos}
                          onChange={(event) => {
                            handleEntryChange(student.id, { talla_zapatos: event.target.value });
                            handleAutoSave(student.id);
                          }}
                          disabled={isFinalized}
                        >
                          <option value="">Seleccionar</option>
                          {shoeSizes.map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status}>{status === 'saved' ? 'Guardado' : status === 'complete' ? 'Completo' : 'Pendiente'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="secondary"
                          className="min-h-[44px]"
                          onClick={async () => {
                            await saveStudent(student.id);
                            const next = students[index + 1];
                            if (next) {
                              document.getElementById(`student-row-${next.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                          }}
                          disabled={isFinalized}
                        >
                          Guardar y siguiente
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-4 md:hidden">
            {students.map((student, index) => {
              const entry = entries[student.id] ?? { talla_camisa: '', talla_pantalon_falda: '', talla_zapatos: '' };
              const status = saveStates[student.id] ?? 'pending';
              return (
                <Card key={student.id} id={`student-card-${student.id}`}>
                  <CardHeader className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold">{student.nombre}</h3>
                      <Badge variant={status}>{status === 'saved' ? 'Guardado' : status === 'complete' ? 'Completo' : 'Pendiente'}</Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      Edad: {calculateAge(student.fecha_nacimiento, student.edad) ?? '-'} | Género: {student.genero}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Talla Camisa</label>
                      <Select
                        value={entry.talla_camisa}
                        onChange={(event) => {
                          handleEntryChange(student.id, { talla_camisa: event.target.value });
                          handleAutoSave(student.id);
                        }}
                        disabled={isFinalized}
                      >
                        <option value="">Seleccionar</option>
                        {shirtSizes.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Talla {student.genero === 'FEMENINO' ? 'Falda' : 'Pantalón'}
                      </label>
                      <Select
                        value={entry.talla_pantalon_falda}
                        onChange={(event) => {
                          handleEntryChange(student.id, { talla_pantalon_falda: event.target.value });
                          handleAutoSave(student.id);
                        }}
                        disabled={isFinalized}
                      >
                        <option value="">Seleccionar</option>
                        {pantsSizes.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Talla Zapatos</label>
                      <Select
                        value={entry.talla_zapatos}
                        onChange={(event) => {
                          handleEntryChange(student.id, { talla_zapatos: event.target.value });
                          handleAutoSave(student.id);
                        }}
                        disabled={isFinalized}
                      >
                        <option value="">Seleccionar</option>
                        {shoeSizes.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <Button
                      variant="secondary"
                      className="w-full min-h-[44px]"
                      onClick={async () => {
                        await saveStudent(student.id);
                        const next = students[index + 1];
                        if (next) {
                          document.getElementById(`student-card-${next.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }}
                      disabled={isFinalized}
                    >
                      Guardar y siguiente
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}
    </main>
  );
}

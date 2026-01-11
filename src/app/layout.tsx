import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UNIFORME ESCOLAR 2026',
  description: 'Plataforma de gestión de uniformes escolares'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}

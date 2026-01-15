import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lista de Casa Nova',
  description: 'Lista de presentes para a casa nova',
};

export default function ListaCasamentoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

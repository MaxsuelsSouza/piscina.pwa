import { redirect } from 'next/navigation';

/** Endereço antigo do login (atalhos e app instalado): agora é /login. */
export default function LoginAdminAntigo() {
  redirect('/login');
}

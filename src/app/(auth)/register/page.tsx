import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registro",
  description: "Crie sua conta",
};

export default function RegisterPage() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
      <h1 className="text-2xl font-bold text-center mb-6">Criar Conta</h1>
      {/* RegisterForm component will be added here */}
      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Register form será implementado em src/features/auth/components
      </p>
    </div>
  );
}

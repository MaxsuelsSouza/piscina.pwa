import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recuperar Senha",
  description: "Recupere sua senha",
};

export default function ForgotPasswordPage() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
      <h1 className="text-2xl font-bold text-center mb-6">Recuperar Senha</h1>
      {/* ForgotPasswordForm component will be added here */}
      <p className="text-center text-sm text-gray-600 dark:text-gray-300">
        Forgot password form será implementado em src/features/auth/components
      </p>
    </div>
  );
}

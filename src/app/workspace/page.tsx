"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface WorkspaceModule {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

const modules: WorkspaceModule[] = [
  {
    id: "lista-casa-nova",
    title: "Lista de Casa Nova",
    description: "Gerenciar presentes, convidados e pagamentos",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
        />
      </svg>
    ),
    href: "/presentes",
    color: "bg-rose-500",
  },
  {
    id: "treino",
    title: "Treino",
    description: "Gerenciar treinos e exercicios",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 10h2v4H4v-4zm14 0h2v4h-2v-4zm-12 1h2v2H6v-2zm10 0h2v2h-2v-2zM8 11h8v2H8v-2z"
        />
      </svg>
    ),
    href: "/treino",
    color: "bg-blue-500",
  },
  {
    id: "lista-de-compras",
    title: "Lista de compras",
    description: "Gerenciar Compras",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>{" "}
      </svg>
    ),
    href: "/treino",
    color: "bg-blue-500",
  },
];

export default function WorkspacePage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const userName = user?.email || "Admin";

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login/admin");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-serif text-stone-800">Workspace</h1>
              <p className="text-sm text-stone-400">Ola, {userName}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-lg font-medium text-stone-700 mb-6">Modulos</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modules.map((module) => (
            <Link
              key={module.id}
              href={module.href}
              className="bg-white rounded-xl border border-stone-200 p-6 hover:shadow-lg hover:border-stone-300 transition group"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`${module.color} text-white p-3 rounded-xl group-hover:scale-110 transition`}
                >
                  {module.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-stone-800 group-hover:text-rose-600 transition">
                    {module.title}
                  </h3>
                  <p className="text-sm text-stone-500 mt-1">
                    {module.description}
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-stone-300 group-hover:text-stone-500 group-hover:translate-x-1 transition"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

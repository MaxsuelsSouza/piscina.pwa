/**
 * Site Configuration
 * Metadata, URLs, and global constants
 */

export const siteConfig = {
  name: "Minhas Notas",
  description: "Aplicativo de notas pessoais",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ogImage: "/og-image.png",
  links: {
    github: "",
    twitter: "",
  },
  routes: {
    public: ["/login"],
    protected: ["/workspace", "/jiu-jitsu", "/lista-compras"],
    afterLoginRedirect: "/workspace",
    afterLogoutRedirect: "/login",
  },
} as const;

export type SiteConfig = typeof siteConfig;

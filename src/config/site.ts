/**
 * Site Configuration
 * Metadata, URLs, and global constants
 */

export const siteConfig = {
  name: "Agendamentos Muca",
  description: "Sistema de agendamento de piscina",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ogImage: "/og-image.png",
  links: {
    github: "",
    twitter: "",
  },
  routes: {
    public: ["/login", "/register", "/forgot-password"],
    protected: ["/dashboard"],
    afterLoginRedirect: "/dashboard",
    afterLogoutRedirect: "/login",
  },
} as const;

export type SiteConfig = typeof siteConfig;

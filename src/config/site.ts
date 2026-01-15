/**
 * Site Configuration
 * Metadata, URLs, and global constants
 */

export const siteConfig = {
  name: "Lista de Casa Nova",
  description: "Lista de presentes para a casa nova",
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

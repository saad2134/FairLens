export const siteConfig = {
  name: "FairLens",
  version: "v1.0.0",
  url: "http://localhost:3000",
  getStartedUrl: "/",
  ogImage: "",
  tagline: "Enterprise AI Fairness Auditing Platform",
  description:
    "A full-stack SaaS platform for comprehensive, interactive fairness audit reports. Upload datasets and models to detect bias and ensure fair AI.",
  links: {
    twitter: "",
    github: "https://github.com/fairlens/fairlens",
    email: "",
    phone: "",
  },
};

export type SiteConfig = typeof siteConfig;

export const CORE_CONFIG = {
  appName: siteConfig.name,
  appDescription: siteConfig.description,
};

export const SOCIAL_LINKS = siteConfig.links;
// Types partagés avec l'API Spring Boot.

export interface Profile {
  fullName: string;
  headline: string;
  tagline: string | null;
  summary: string | null;
  location: string | null;
  email: string | null;
  phone: string | null;
  showPhone?: boolean;
  linkedinUrl: string | null;
  githubUrl: string | null;
  cvUrl: string | null;
  avatarUrl: string | null;
  availability: string | null;
  qualities: string[];
  extras: string[];
}

export interface PublicSettings {
  siteTitle: string;
  metaDescription: string | null;
  defaultTheme: 'dark' | 'light';
  sections: SectionKey[];
  assistantEnabled: boolean;
  assistantGreeting: string | null;
  assistantSuggestions: string[];
  contactFormEnabled: boolean;
}

export type SectionKey = 'about' | 'skills' | 'experience' | 'projects' | 'education' | 'contact';

export interface SiteSettings {
  siteTitle: string;
  metaDescription: string | null;
  defaultTheme: 'dark' | 'light';
  sectionOrder: SectionKey[];
  hiddenSections: SectionKey[];
  assistantEnabled: boolean;
  assistantGreeting: string | null;
  assistantSuggestions: string[];
  contactFormEnabled: boolean;
  availableSections?: SectionKey[];
}

interface SectionItem {
  id: number | null;
  sortOrder: number | null;
  visible: boolean | null;
}

export interface SkillGroup extends SectionItem {
  name: string;
  icon: string | null;
  items: string[];
}

export interface Experience extends SectionItem {
  role: string;
  company: string;
  location: string | null;
  period: string;
  kind: string | null;
  summary: string | null;
  highlights: string[];
  stack: string[];
}

export interface Project extends SectionItem {
  slug: string;
  title: string;
  tagline: string | null;
  context: string | null;
  period: string | null;
  status: 'DONE' | 'IN_PROGRESS';
  summary: string | null;
  description: string | null;
  role: string | null;
  highlights: string[];
  stack: string[];
  architecture: string[];
  repoUrl: string | null;
  demoUrl: string | null;
  confidential: boolean;
  confidentialNote: string | null;
  featured: boolean;
  images?: ProjectImage[];
}

export interface ProjectImage {
  id: number;
  url: string;
  caption: string | null;
}

export interface Education extends SectionItem {
  degree: string;
  field: string | null;
  school: string;
  location: string | null;
  period: string | null;
  mention: string | null;
  description: string | null;
}

export interface Certification extends SectionItem {
  name: string;
  issuer: string;
  issuedOn: string | null;
  credentialUrl: string | null;
}

export interface SpokenLanguage extends SectionItem {
  name: string;
  level: string;
}

export interface Portfolio {
  profile: Profile;
  settings: PublicSettings;
  skills: SkillGroup[];
  experiences: Experience[];
  projects: Project[];
  education: Education[];
  certifications: Certification[];
  languages: SpokenLanguage[];
}

export interface CvInfo {
  fileName: string;
  sizeBytes: number;
  updatedAt: string;
  url: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  createdAt: string;
  readAt: string | null;
}

export interface AssistantStatus {
  apiKeyConfigured: boolean;
  model: string;
  chunks: number;
  semanticSearch: boolean;
  embeddings: string;
  indexedAt: string;
}

export interface SearchHit {
  title: string;
  section: string;
  score: number;
  text: string;
}

export interface ChatSource {
  title: string;
  section: string;
  link: string;
}

/** Erreur au format Problem Details renvoyée par l'API. */
export interface ApiProblem {
  status: number;
  detail?: string;
  errors?: Record<string, string>;
}

export interface AnalyticsTotals {
  pageViews: number;
  visitors: number;
  projectViews: number;
  cvDownloads: number;
  assistantQuestions: number;
  contactMessages: number;
}

export interface AnalyticsCount {
  label: string;
  total: number;
}

export interface AnalyticsReport {
  days: number;
  totals: AnalyticsTotals;
  previous: AnalyticsTotals;
  daily: { day: string; views: number; visitors: number }[];
  topProjects: AnalyticsCount[];
  referrers: AnalyticsCount[];
  devices: AnalyticsCount[];
  topPages: AnalyticsCount[];
}

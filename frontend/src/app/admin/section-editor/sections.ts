/**
 * Description déclarative des sections éditables : chaque section est un endpoint CRUD
 * et une liste de champs. L'écran d'édition générique se construit à partir de ces définitions.
 */

/** tags = liste courte en étiquettes ; lines = liste de phrases, une ligne par élément. */
export type FieldType = 'text' | 'textarea' | 'tags' | 'lines' | 'url' | 'email' | 'checkbox' | 'select';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  options?: { value: string; label: string }[];
  /** Champ sur toute la largeur du formulaire. */
  wide?: boolean;
}

export interface SectionDef {
  key: string;
  route: string;
  endpoint: string;
  title: string;
  singular: string;
  icon: string;
  description: string;
  /** Champ affiché comme titre dans la liste. */
  titleField: string;
  /** Champs concaténés en sous-titre dans la liste. */
  subtitleFields: string[];
  fields: FieldDef[];
}

export const ICON_OPTIONS = ['server', 'layout', 'database', 'brain', 'cloud', 'checklist', 'network', 'code']
  .map((value) => ({ value, label: value }));

export const SECTIONS: SectionDef[] = [
  {
    key: 'skills',
    route: 'competences',
    endpoint: 'skills',
    title: 'Compétences',
    singular: 'un groupe de compétences',
    icon: 'brain',
    description: 'Groupes de compétences affichés en cartes (ex. Back-end, IA appliquée).',
    titleField: 'name',
    subtitleFields: ['items'],
    fields: [
      { key: 'name', label: 'Nom du groupe', type: 'text', required: true, maxLength: 120 },
      { key: 'icon', label: 'Icône', type: 'select', options: ICON_OPTIONS },
      { key: 'items', label: 'Compétences', type: 'tags', hint: 'Entrée ou virgule pour ajouter, glisser pour réordonner', rows: 7, wide: true },
    ],
  },
  {
    key: 'experiences',
    route: 'experiences',
    endpoint: 'experiences',
    title: 'Expériences',
    singular: 'une expérience',
    icon: 'briefcase',
    description: 'Frise du parcours professionnel (stages, emplois).',
    titleField: 'role',
    subtitleFields: ['company', 'period'],
    fields: [
      { key: 'role', label: 'Poste', type: 'text', required: true, maxLength: 160 },
      { key: 'company', label: 'Entreprise', type: 'text', required: true, maxLength: 160 },
      { key: 'period', label: 'Période', type: 'text', required: true, placeholder: 'Févr. 2026 – Août 2026', maxLength: 80 },
      { key: 'location', label: 'Lieu', type: 'text', maxLength: 120 },
      { key: 'kind', label: 'Type', type: 'text', placeholder: 'Stage PFE, CDI…', maxLength: 60 },
      { key: 'summary', label: 'Résumé', type: 'textarea', rows: 2, wide: true },
      { key: 'highlights', label: 'Réalisations', type: 'lines', hint: 'Entrée crée une nouvelle ligne ; glisser la poignée pour réordonner', rows: 5, wide: true },
      { key: 'stack', label: 'Technologies', type: 'tags', hint: 'Entrée ou virgule pour ajouter', wide: true },
    ],
  },
  {
    key: 'projects',
    route: 'projets',
    endpoint: 'projects',
    title: 'Projets',
    singular: 'un projet',
    icon: 'folder',
    description: 'Cartes projets de la vitrine + page détaillée /projects/{slug}.',
    titleField: 'title',
    subtitleFields: ['context', 'period'],
    fields: [
      { key: 'title', label: 'Titre', type: 'text', required: true, maxLength: 120 },
      { key: 'slug', label: 'Slug (URL)', type: 'text', required: true, hint: 'Minuscules et tirets : mon-projet', maxLength: 80 },
      { key: 'tagline', label: 'Accroche', type: 'text', wide: true, maxLength: 300 },
      { key: 'context', label: 'Contexte', type: 'text', placeholder: 'Stage PFE · Teamwill', maxLength: 200 },
      { key: 'period', label: 'Période', type: 'text', maxLength: 80 },
      {
        key: 'status', label: 'Statut', type: 'select', required: true,
        options: [{ value: 'DONE', label: 'Terminé' }, { value: 'IN_PROGRESS', label: 'En cours' }],
      },
      { key: 'featured', label: 'Mis en avant (grande carte)', type: 'checkbox' },
      { key: 'summary', label: 'Résumé (carte)', type: 'textarea', rows: 2, wide: true },
      { key: 'description', label: 'Description (page détail)', type: 'textarea', rows: 5, wide: true },
      { key: 'role', label: 'Mon rôle', type: 'textarea', rows: 3, wide: true },
      { key: 'highlights', label: 'Réalisations clés', type: 'lines', hint: 'Entrée crée une nouvelle ligne', wide: true },
      { key: 'stack', label: 'Stack', type: 'tags', hint: 'Entrée ou virgule pour ajouter', wide: true },
      {
        key: 'architecture', label: "Schéma d'architecture", type: 'lines', rows: 6, wide: true,
        hint: 'Une couche par ligne, du front vers les données : « Nom | description »',
      },
      { key: 'repoUrl', label: 'Lien du code', type: 'url', hint: 'Ignoré si le projet est confidentiel' },
      { key: 'demoUrl', label: 'Lien de démo', type: 'url' },
      { key: 'confidential', label: 'Projet confidentiel (aucun lien vers le code)', type: 'checkbox', wide: true },
      { key: 'confidentialNote', label: 'Note de confidentialité', type: 'text', wide: true, maxLength: 300 },
    ],
  },
  {
    key: 'education',
    route: 'formation',
    endpoint: 'education',
    title: 'Formation',
    singular: 'une formation',
    icon: 'school',
    description: 'Diplômes et parcours académique.',
    titleField: 'degree',
    subtitleFields: ['school', 'period'],
    fields: [
      { key: 'degree', label: 'Diplôme', type: 'text', required: true, wide: true, maxLength: 200 },
      { key: 'field', label: 'Spécialité', type: 'text', maxLength: 200 },
      { key: 'school', label: 'Établissement', type: 'text', required: true, maxLength: 160 },
      { key: 'location', label: 'Lieu', type: 'text', maxLength: 120 },
      { key: 'period', label: 'Période', type: 'text', maxLength: 80 },
      { key: 'mention', label: 'Mention', type: 'text', maxLength: 80 },
      { key: 'description', label: 'Description', type: 'textarea', rows: 3, wide: true },
    ],
  },
  {
    key: 'certifications',
    route: 'certifications',
    endpoint: 'certifications',
    title: 'Certifications',
    singular: 'une certification',
    icon: 'award',
    description: 'Certifications avec lien de vérification (Credly…).',
    titleField: 'name',
    subtitleFields: ['issuer', 'issuedOn'],
    fields: [
      { key: 'name', label: 'Intitulé', type: 'text', required: true, wide: true, maxLength: 200 },
      { key: 'issuer', label: 'Organisme', type: 'text', required: true, maxLength: 120 },
      { key: 'issuedOn', label: 'Date', type: 'text', placeholder: 'Nov. 2025', maxLength: 40 },
      { key: 'credentialUrl', label: 'Lien de vérification', type: 'url', wide: true },
    ],
  },
  {
    key: 'languages',
    route: 'langues',
    endpoint: 'languages',
    title: 'Langues',
    singular: 'une langue',
    icon: 'language',
    description: 'Langues parlées et niveaux.',
    titleField: 'name',
    subtitleFields: ['level'],
    fields: [
      { key: 'name', label: 'Langue', type: 'text', required: true, maxLength: 60 },
      { key: 'level', label: 'Niveau', type: 'text', required: true, placeholder: 'B2, courant…', maxLength: 80 },
    ],
  },
  {
    key: 'testimonials',
    route: 'temoignages',
    endpoint: 'testimonials',
    title: 'Recommandations',
    singular: 'une recommandation',
    icon: 'message',
    description: "Recommandations réelles (tuteur de PFE, encadrant, collègue). N'ajoutez que des citations dont l'auteur a donné son accord.",
    titleField: 'author',
    subtitleFields: ['role', 'company'],
    fields: [
      { key: 'author', label: 'Auteur', type: 'text', required: true, maxLength: 120 },
      { key: 'role', label: 'Poste', type: 'text', placeholder: 'Tech lead, encadrant PFE…', maxLength: 160 },
      { key: 'company', label: 'Entreprise / école', type: 'text', maxLength: 160 },
      { key: 'relationship', label: 'Relation', type: 'text', placeholder: 'Encadrant de mon PFE', maxLength: 160 },
      { key: 'quote', label: 'Citation', type: 'textarea', required: true, rows: 5, wide: true },
      { key: 'linkedinUrl', label: "Profil LinkedIn de l'auteur", type: 'url', wide: true, hint: 'Permet au recruteur de vérifier' },
    ],
  },
  {
    key: 'knowledge',
    route: 'connaissances',
    endpoint: 'knowledge',
    title: 'Fiches assistant',
    singular: 'une fiche',
    icon: 'book',
    description: "Informations lues uniquement par l'assistant IA (non affichées sur le site) : disponibilité, mobilité, précisions…",
    titleField: 'title',
    subtitleFields: ['content'],
    fields: [
      { key: 'title', label: 'Titre', type: 'text', required: true, wide: true, maxLength: 160 },
      { key: 'content', label: 'Contenu', type: 'textarea', required: true, rows: 6, wide: true, hint: "Écrivez des faits vérifiés : l'assistant s'appuie dessus." },
    ],
  },
];

export const PROFILE_FIELDS: FieldDef[] = [
  { key: 'fullName', label: 'Nom complet', type: 'text', required: true, maxLength: 120 },
  { key: 'headline', label: 'Titre', type: 'text', required: true, maxLength: 200 },
  { key: 'tagline', label: 'Accroche (héros)', type: 'text', wide: true, maxLength: 300 },
  { key: 'summary', label: 'Présentation (section Profil)', type: 'textarea', rows: 5, wide: true },
  { key: 'location', label: 'Localisation', type: 'text', maxLength: 120 },
  { key: 'availability', label: 'Disponibilité', type: 'text', placeholder: 'Disponible immédiatement', maxLength: 160 },
  { key: 'email', label: 'E-mail', type: 'email' },
  { key: 'phone', label: 'Téléphone', type: 'text', maxLength: 40 },
  { key: 'showPhone', label: 'Afficher le téléphone sur le site public', type: 'checkbox', wide: true },
  { key: 'linkedinUrl', label: 'LinkedIn', type: 'url' },
  { key: 'githubUrl', label: 'GitHub', type: 'url' },
  { key: 'cvUrl', label: 'Lien du CV (PDF)', type: 'text', hint: 'URL ou fichier du dossier public, ex. /cv.pdf', maxLength: 300 },
  { key: 'qualities', label: 'Qualités', type: 'tags', hint: 'Entrée ou virgule pour ajouter' },
  { key: 'extras', label: 'Divers', type: 'lines', hint: 'Une ligne par élément (vie associative, permis…)', rows: 5 },
];

export function sectionByKey(key: string): SectionDef {
  const section = SECTIONS.find((s) => s.key === key);
  if (!section) {
    throw new Error(`Section inconnue : ${key}`);
  }
  return section;
}

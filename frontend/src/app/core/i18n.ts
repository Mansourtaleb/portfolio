import { DOCUMENT } from '@angular/common';
import { Injectable, Pipe, PipeTransform, inject, signal } from '@angular/core';

export type Lang = 'fr' | 'en';
const STORAGE_KEY = 'portfolio.lang';

/** Textes de l'interface publique (le contenu, lui, vient de l'API déjà traduit). */
const DICTIONARY = {
  'nav.about': ['Profil', 'About'],
  'nav.skills': ['Compétences', 'Skills'],
  'nav.experience': ['Parcours', 'Experience'],
  'nav.projects': ['Projets', 'Projects'],
  'nav.education': ['Formation', 'Education'],
  'nav.contact': ['Contact', 'Contact'],
  'header.search': ['Rechercher', 'Search'],
  'header.searchAria': ['Rechercher (Ctrl+K)', 'Search (Ctrl+K)'],
  'header.themeLight': ['Passer en thème clair', 'Switch to light theme'],
  'header.themeDark': ['Passer en thème sombre', 'Switch to dark theme'],
  'header.lang': ['Read in English', 'Lire en français'],
  'header.menu': ['Menu', 'Menu'],
  'skip': ['Aller au contenu principal', 'Skip to main content'],
  'hero.projects': ['Voir les projets', 'View projects'],
  'hero.cv': ['Télécharger le CV', 'Download résumé'],
  'hero.cvPage': ['Voir le CV', 'View résumé'],
  'hero.contact': ['Me contacter', 'Contact me'],
  'about.title': ['Qui suis-je ?', 'About me'],
  'skills.title': ['Ce que je maîtrise', 'What I work with'],
  'skills.stats': ['En chiffres', 'At a glance'],
  'skills.experiences': ['expériences', 'experiences'],
  'skills.projects': ['projets publiés', 'projects'],
  'skills.technologies': ['technologies', 'technologies'],
  'skills.certifications': ['certifications', 'certifications'],
  'experience.title': ['Expériences', 'Experience'],
  'projects.title': ['Projets', 'Projects'],
  'projects.all': ['Tous', 'All'],
  'projects.filterAria': ['Filtrer par technologie', 'Filter by technology'],
  'projects.inProgress': ['En cours', 'In progress'],
  'projects.done': ['Terminé', 'Completed'],
  'projects.confidential': ['Confidentiel', 'Confidential'],
  'projects.details': ['Voir le détail', 'View details'],
  'projects.code': ['Code', 'Code'],
  'projects.demo': ['Démo', 'Demo'],
  'projects.none': ['Aucun projet avec cette technologie.', 'No project uses this technology.'],
  'education.title': ['Formation & certifications', 'Education & certifications'],
  'education.mention': ['Mention', 'Honours:'],
  'education.certifications': ['Certifications', 'Certifications'],
  'education.verify': ['Vérifier', 'Verify'],
  'education.languages': ['Langues', 'Languages'],
  'education.misc': ['Divers', 'Other'],
  'contact.title': ['Travaillons ensemble', "Let's work together"],
  'contact.lead': ['Un poste, un projet ou une question ? Écrivez-moi, je réponds rapidement.', 'A role, a project or a question? Drop me a line, I reply quickly.'],
  'contact.name': ['Nom', 'Name'],
  'contact.email': ['E-mail', 'Email'],
  'contact.subject': ['Objet', 'Subject'],
  'contact.optional': ['(facultatif)', '(optional)'],
  'contact.message': ['Message', 'Message'],
  'contact.send': ['Envoyer', 'Send'],
  'contact.sending': ['Envoi…', 'Sending…'],
  'contact.sent': ['Merci, votre message est bien envoyé !', 'Thanks, your message has been sent!'],
  'contact.error': ["Le message n'a pas pu être envoyé. Réessayez plus tard.", 'Your message could not be sent. Please try again later.'],
  'loading': ['Chargement…', 'Loading…'],
  'loadError': ["Le contenu n'a pas pu être chargé.", 'The content could not be loaded.'],
  'project.back': ['Tous les projets', 'All projects'],
  'project.about': ['Le projet', 'The project'],
  'project.role': ['Mon rôle', 'My role'],
  'project.architecture': ['Architecture', 'Architecture'],
  'project.highlights': ['Réalisations clés', 'Key achievements'],
  'project.stack': ['Stack technique', 'Tech stack'],
  'project.confidential': ['Projet confidentiel : le code source n’est pas public.', 'Confidential project: the source code is not public.'],
  'project.source': ['Code source', 'Source code'],
  'project.notFound': ["Ce projet n'existe pas ou n'est plus publié.", 'This project does not exist or is no longer published.'],
  'gallery.zoom': ['Agrandir', 'Enlarge'],
  'notFound.title': ["Cette page n'existe pas (ou plus).", 'This page does not exist (anymore).'],
  'notFound.text': ['Le lien est peut-être erroné, ou le contenu a été retiré de la vitrine.', 'The link may be wrong, or the content has been removed.'],
  'notFound.home': ["Retour à l'accueil", 'Back to home'],
  'cv.back': ['Retour au portfolio', 'Back to portfolio'],
  'cv.generated': ['CV généré automatiquement depuis le contenu du site', 'Résumé generated from the site content'],
  'cv.print': ['Imprimer / PDF', 'Print / PDF'],
  'cv.profile': ['Profil', 'Profile'],
  'cv.skills': ['Compétences', 'Skills'],
  'cv.experience': ['Expérience professionnelle', 'Professional experience'],
  'cv.projects': ['Projets', 'Projects'],
  'cv.education': ['Formation', 'Education'],
  'cv.certifications': ['Certifications', 'Certifications'],
  'cv.languages': ['Langues', 'Languages'],
  'ai.title': ['Assistant IA', 'AI assistant'],
  'ai.subtitle': ['Répond à partir du parcours de', 'Answers from the background of'],
  'ai.open': ['Demandez à mon IA', 'Ask my AI'],
  'ai.close': ['Fermer', 'Close'],
  'ai.placeholder': ['Posez votre question…', 'Ask your question…'],
  'ai.sources': ['Sources :', 'Sources:'],
  'ai.useful': ['Utile ?', 'Helpful?'],
  'ai.thanks': ['Merci pour votre avis !', 'Thanks for your feedback!'],
  'ai.disclaimer': ['Réponses générées par IA à partir du CV ; elles peuvent contenir des imprécisions.', 'AI-generated answers based on the résumé; they may contain inaccuracies.'],
  'ai.unavailable': ["L'assistant n'est pas disponible pour le moment.", 'The assistant is not available right now.'],
  'palette.placeholder': ['Rechercher un projet, une compétence, une section…', 'Search a project, a skill, a section…'],
  'palette.none': ['Aucun résultat pour', 'No results for'],
  'palette.navigate': ['naviguer', 'navigate'],
  'palette.open': ['ouvrir', 'open'],
  'palette.sections': ['Sections', 'Sections'],
  'palette.projects': ['Projets', 'Projects'],
  'palette.experiences': ['Expériences', 'Experience'],
  'palette.skills': ['Compétences', 'Skills'],
  'palette.actions': ['Actions', 'Actions'],
  'palette.cvPage': ['Voir le CV imprimable', 'View printable résumé'],
  'palette.theme': ['Changer de thème (clair / sombre)', 'Toggle theme (light / dark)'],
  'palette.lang': ['Read in English', 'Lire en français'],
  'preview.banner': ['Aperçu du brouillon : ces modifications ne sont pas encore publiées.', 'Draft preview: these changes are not published yet.'],
} as const satisfies Record<string, readonly [string, string]>;

export type I18nKey = keyof typeof DICTIONARY;

/** Langue de la vitrine (FR par défaut, EN) : mémorisée, appliquée à <html lang>. */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  readonly lang = signal<Lang>(this.initial());

  constructor() {
    this.document.documentElement.lang = this.lang();
  }

  set(lang: Lang): void {
    this.lang.set(lang);
    this.document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* stockage indisponible */
    }
  }

  toggle(): void {
    this.set(this.lang() === 'fr' ? 'en' : 'fr');
  }

  t(key: I18nKey): string {
    return DICTIONARY[key][this.lang() === 'fr' ? 0 : 1];
  }

  private initial(): Lang {
    try {
      const fromUrl = new URLSearchParams(this.document.location.search).get('lang');
      if (fromUrl === 'fr' || fromUrl === 'en') {
        return fromUrl;
      }
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'fr' || stored === 'en') {
        return stored;
      }
    } catch {
      /* ignore */
    }
    return navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en';
  }
}

/** {{ 'nav.about' | t }} — se met à jour quand la langue change. */
@Pipe({ name: 't', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: I18nKey): string {
    return this.i18n.t(key);
  }
}

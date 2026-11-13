import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { Portfolio, Project } from './models';

export interface PageSeo {
  title: string;
  description?: string | null;
  path: string;
  image?: string | null;
  type?: 'website' | 'profile' | 'article';
}

/**
 * Référencement : titre, description, URL canonique, aperçus de partage (Open Graph / Twitter)
 * et données structurées schema.org (JSON-LD) pour que Google comprenne le profil.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  update(page: PageSeo): void {
    const url = this.absolute(page.path);
    const description = (page.description ?? '').slice(0, 300);
    this.title.setTitle(page.title);
    this.tag('name', 'description', description);
    this.tag('property', 'og:title', page.title);
    this.tag('property', 'og:description', description);
    this.tag('property', 'og:type', page.type ?? 'website');
    this.tag('property', 'og:url', url);
    this.tag('property', 'og:locale', 'fr_FR');
    this.tag('name', 'twitter:card', 'summary_large_image');
    this.tag('name', 'twitter:title', page.title);
    this.tag('name', 'twitter:description', description);
    const image = page.image ?? `/api/public/og.png?lang=${this.document.documentElement.lang === 'en' ? 'en' : 'fr'}`;
    if (image) {
      this.tag('property', 'og:image', this.absolute(image));
      this.tag('name', 'twitter:image', this.absolute(image));
    } else {
      this.meta.removeTag("property='og:image'");
      this.meta.removeTag("name='twitter:image'");
    }
    this.canonical(url);
  }

  /** Données structurées de la page d'accueil : une Person avec ses compétences et ses profils. */
  personSchema(d: Portfolio): void {
    const p = d.profile;
    this.jsonLd('person', {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: p.fullName,
      jobTitle: p.headline,
      description: p.summary,
      url: this.absolute('/'),
      image: p.avatarUrl ? this.absolute(p.avatarUrl) : undefined,
      email: p.email ? `mailto:${p.email}` : undefined,
      address: p.location ? { '@type': 'PostalAddress', addressLocality: p.location } : undefined,
      sameAs: [p.linkedinUrl, p.githubUrl].filter(Boolean),
      knowsAbout: d.skills.flatMap((s) => s.items).slice(0, 30),
      alumniOf: d.education.map((e) => ({ '@type': 'EducationalOrganization', name: e.school })),
      knowsLanguage: d.languages.map((l) => l.name),
    });
  }

  /** Données structurées d'une page projet. */
  projectSchema(project: Project, author: string): void {
    this.jsonLd('person', {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: project.title,
      description: project.summary ?? project.tagline,
      url: this.absolute(`/projects/${project.slug}`),
      author: { '@type': 'Person', name: author },
      keywords: project.stack.join(', '),
      image: project.images?.[0] ? this.absolute(project.images[0].url) : undefined,
    });
  }

  private tag(attr: 'name' | 'property', key: string, content: string): void {
    this.meta.updateTag({ [attr]: key, content });
  }

  private canonical(url: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }
    link.href = url;
  }

  private jsonLd(id: string, data: object): void {
    let script = this.document.getElementById(`ld-${id}`) as HTMLScriptElement | null;
    if (!script) {
      script = this.document.createElement('script');
      script.type = 'application/ld+json';
      script.id = `ld-${id}`;
      this.document.head.appendChild(script);
    }
    // JSON.stringify échappe le contenu ; on neutralise aussi « </ » pour ne jamais fermer la balise script.
    script.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
  }

  private absolute(path: string): string {
    return new URL(path, this.document.location.origin).toString();
  }
}

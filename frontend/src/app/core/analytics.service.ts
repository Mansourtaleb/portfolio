import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

type EventType = 'PAGE_VIEW' | 'PROJECT_VIEW';

/**
 * Mesure d'audience anonyme : envoie « page vue » et « projet consulté » à l'API.
 * Aucun cookie ni stockage local ; rien n'est envoyé depuis l'admin ni si le visiteur
 * a activé « Do Not Track » / « Global Privacy Control ».
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly router = inject(Router);
  private firstView = true;
  private started = false;

  start(): void {
    if (this.started || !this.allowed()) {
      return;
    }
    this.started = true;
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      const path = e.urlAfterRedirects.split(/[?#]/)[0] || '/';
      if (!path.startsWith('/admin')) {
        this.send('PAGE_VIEW', path);
      }
    });
  }

  projectView(slug: string): void {
    if (this.allowed()) {
      this.send('PROJECT_VIEW', `/projects/${slug}`, slug);
    }
  }

  private send(type: EventType, path: string, projectSlug?: string): void {
    // Le site d'origine (LinkedIn, Google…) n'a de sens que pour la première page de la visite.
    const referrer = this.firstView ? document.referrer || null : null;
    this.firstView = false;
    fetch('/api/public/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, path, projectSlug, referrer }),
      keepalive: true,
    }).catch(() => undefined);
  }

  private allowed(): boolean {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    return nav.doNotTrack !== '1' && nav.globalPrivacyControl !== true;
  }
}

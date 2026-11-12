import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';

import { AuthService } from './auth.service';
import { Lang } from './i18n';
import { Portfolio, Project } from './models';

export interface ContactRequest {
  name: string;
  email: string;
  subject?: string;
  message: string;
  website?: string;
}

@Injectable({ providedIn: 'root' })
export class PublicApiService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly cache = new Map<Lang, Observable<Portfolio>>();

  /** Aperçu du brouillon (?preview=1) : réservé à l'admin connecté. */
  readonly preview =
    new URLSearchParams(location.search).get('preview') === '1' && this.auth.isLoggedIn();

  /** Contenu de la vitrine dans une langue, chargé une fois par visite et partagé entre les pages. */
  portfolio(lang: Lang): Observable<Portfolio> {
    let request = this.cache.get(lang);
    if (!request) {
      const url = this.preview ? '/api/admin/preview/portfolio' : '/api/public/portfolio';
      request = this.http.get<Portfolio>(url, { params: { lang } }).pipe(shareReplay(1));
      this.cache.set(lang, request);
    }
    return request;
  }

  project(slug: string, lang: Lang): Observable<Project> {
    const base = this.preview ? '/api/admin/preview/projects/' : '/api/public/projects/';
    return this.http.get<Project>(base + encodeURIComponent(slug), { params: { lang } });
  }

  contact(request: ContactRequest): Observable<void> {
    return this.http.post<void>('/api/public/contact', request);
  }
}

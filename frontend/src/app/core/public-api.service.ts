import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';

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

  /** Contenu de la vitrine, chargé une fois par visite et partagé entre les pages. */
  private readonly portfolio$ = this.http.get<Portfolio>('/api/public/portfolio').pipe(shareReplay(1));

  portfolio(): Observable<Portfolio> {
    return this.portfolio$;
  }

  project(slug: string): Observable<Project> {
    return this.http.get<Project>(`/api/public/projects/${encodeURIComponent(slug)}`);
  }

  contact(request: ContactRequest): Observable<void> {
    return this.http.post<void>('/api/public/contact', request);
  }
}

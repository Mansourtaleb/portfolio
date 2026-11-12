import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

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

  portfolio(): Observable<Portfolio> {
    return this.http.get<Portfolio>('/api/public/portfolio');
  }

  project(slug: string): Observable<Project> {
    return this.http.get<Project>(`/api/public/projects/${encodeURIComponent(slug)}`);
  }

  contact(request: ContactRequest): Observable<void> {
    return this.http.post<void>('/api/public/contact', request);
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { AssistantStatus, ContactMessage, CvInfo, Profile, SearchHit, SiteSettings } from './models';

type Item = { id: number | null } & Record<string, unknown>;

/** Accès à l'API d'administration : CRUD générique par section + écrans spécifiques. */
@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);

  list<T = Item>(section: string): Observable<T[]> {
    return this.http.get<T[]>(`/api/admin/${section}`);
  }

  create<T = Item>(section: string, item: Partial<T>): Observable<T> {
    return this.http.post<T>(`/api/admin/${section}`, item);
  }

  update<T = Item>(section: string, id: number, item: Partial<T>): Observable<T> {
    return this.http.put<T>(`/api/admin/${section}/${id}`, item);
  }

  delete(section: string, id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/${section}/${id}`);
  }

  reorder<T = Item>(section: string, ids: number[]): Observable<T[]> {
    return this.http.put<T[]>(`/api/admin/${section}/order`, ids);
  }

  profile(): Observable<Profile> {
    return this.http.get<Profile>('/api/admin/profile');
  }

  saveProfile(profile: Partial<Profile>): Observable<Profile> {
    return this.http.put<Profile>('/api/admin/profile', profile);
  }

  settings(): Observable<SiteSettings> {
    return this.http.get<SiteSettings>('/api/admin/settings');
  }

  saveSettings(settings: SiteSettings): Observable<SiteSettings> {
    return this.http.put<SiteSettings>('/api/admin/settings', settings);
  }

  cvInfo(): Observable<CvInfo | null> {
    return this.http.get<CvInfo | null>('/api/admin/cv');
  }

  uploadCv(file: File): Observable<CvInfo> {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<CvInfo>('/api/admin/cv', body);
  }

  deleteCv(): Observable<void> {
    return this.http.delete<void>('/api/admin/cv');
  }

  messages(): Observable<ContactMessage[]> {
    return this.http.get<ContactMessage[]>('/api/admin/messages');
  }

  unreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>('/api/admin/messages/unread-count');
  }

  markRead(id: number, value: boolean): Observable<ContactMessage> {
    return this.http.put<ContactMessage>(`/api/admin/messages/${id}/read?value=${value}`, null);
  }

  deleteMessage(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/messages/${id}`);
  }

  assistantStatus(): Observable<AssistantStatus> {
    return this.http.get<AssistantStatus>('/api/admin/assistant/status');
  }

  reindex(): Observable<AssistantStatus> {
    return this.http.post<AssistantStatus>('/api/admin/assistant/reindex', null);
  }

  search(q: string): Observable<SearchHit[]> {
    return this.http.get<SearchHit[]>('/api/admin/assistant/search', { params: { q } });
  }
}

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AdminApiService } from '../../core/admin-api.service';
import { AssistantStatus } from '../../core/models';
import { Icon } from '../../shared/icon';
import { SECTIONS } from '../section-editor/sections';

interface Tile {
  route: string;
  title: string;
  icon: string;
  total: number;
  visible: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, Icon],
  template: `
    <h1 class="text-2xl font-bold mb-1">Tableau de bord</h1>
    <p class="text-muted mb-8">Tout le contenu de la vitrine se règle ici. Les changements sont visibles immédiatement.</p>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      @for (t of tiles(); track t.route) {
        <a class="card card-hover no-underline text-fg block" [routerLink]="'/admin/' + t.route">
          <div class="flex items-center justify-between mb-3">
            <span class="grid place-items-center w-9 h-9 rounded-lg bg-accent-soft text-accent"><app-icon [name]="t.icon" [size]="18" /></span>
            <span class="text-xs text-faint mono">{{ t.visible }}/{{ t.total }} publiés</span>
          </div>
          <p class="text-3xl font-semibold mono">{{ t.total }}</p>
          <p class="text-sm text-muted">{{ t.title }}</p>
        </a>
      }
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <section class="card">
        <h2 class="font-semibold mb-3 flex items-center gap-2"><app-icon name="sparkles" [size]="18" /> Assistant IA</h2>
        @if (assistant(); as a) {
          <ul class="text-sm space-y-2">
            <li class="flex justify-between"><span class="text-muted">Clé API Claude</span>
              <span [class]="a.apiKeyConfigured ? 'text-ok' : 'text-warn'">{{ a.apiKeyConfigured ? 'configurée' : 'absente (assistant masqué)' }}</span></li>
            <li class="flex justify-between"><span class="text-muted">Modèle</span><span class="mono">{{ a.model }}</span></li>
            <li class="flex justify-between"><span class="text-muted">Fiches indexées</span><span class="mono">{{ a.chunks }}</span></li>
            <li class="flex justify-between"><span class="text-muted">Recherche</span><span>{{ a.semanticSearch ? 'hybride (embeddings + BM25)' : 'mots-clés' }}</span></li>
          </ul>
          <a class="btn btn-sm mt-4" routerLink="/admin/assistant">Gérer l'assistant</a>
        }
      </section>
      <section class="card">
        <h2 class="font-semibold mb-3 flex items-center gap-2"><app-icon name="mail" [size]="18" /> Messages</h2>
        <p class="text-sm text-muted mb-4">{{ unread() }} message(s) non lu(s) reçus via le formulaire de contact.</p>
        <a class="btn btn-sm" routerLink="/admin/messages">Voir les messages</a>
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly api = inject(AdminApiService);
  protected readonly tiles = signal<Tile[]>([]);
  protected readonly assistant = signal<AssistantStatus | null>(null);
  protected readonly unread = signal(0);

  constructor() {
    const sections = SECTIONS.filter((s) => s.key !== 'knowledge');
    forkJoin(sections.map((s) => this.api.list<{ visible: boolean }>(s.endpoint))).subscribe((lists) =>
      this.tiles.set(
        sections.map((s, i) => ({
          route: s.route,
          title: s.title,
          icon: s.icon,
          total: lists[i].length,
          visible: lists[i].filter((x) => x.visible).length,
        })),
      ),
    );
    this.api.assistantStatus().subscribe((a) => this.assistant.set(a));
    this.api.unreadCount().subscribe((r) => this.unread.set(r.count));
  }
}

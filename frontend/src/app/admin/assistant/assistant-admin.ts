import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminApiService } from '../../core/admin-api.service';
import { AssistantStatus, SearchHit } from '../../core/models';
import { Icon } from '../../shared/icon';

/** Supervision du RAG : état de l'index, ré-indexation des embeddings et aperçu de la recherche. */
@Component({
  selector: 'app-assistant-admin',
  imports: [FormsModule, DatePipe, Icon],
  template: `
    <h1 class="text-2xl font-bold flex items-center gap-2 mb-1"><app-icon name="sparkles" [size]="22" /> Assistant IA — RAG</h1>
    <p class="text-muted text-sm mb-6">L'index est reconstruit automatiquement à chaque modification du contenu. Le bouton force un recalcul complet des embeddings ONNX.</p>

    @if (status(); as s) {
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div class="card"><p class="text-xs text-faint mono mb-1">Clé API Claude</p>
          <p class="font-semibold" [class]="s.apiKeyConfigured ? 'text-ok' : 'text-warn'">{{ s.apiKeyConfigured ? 'Configurée' : 'Absente' }}</p></div>
        <div class="card"><p class="text-xs text-faint mono mb-1">Modèle</p><p class="font-semibold mono text-sm">{{ s.model }}</p></div>
        <div class="card"><p class="text-xs text-faint mono mb-1">Fiches indexées</p><p class="font-semibold mono text-2xl">{{ s.chunks }}</p></div>
        <div class="card"><p class="text-xs text-faint mono mb-1">Embeddings ONNX</p>
          <p class="font-semibold">{{ s.semanticSearch ? 'Actifs (recherche hybride)' : s.embeddings }}</p></div>
      </div>
      @if (!s.apiKeyConfigured) {
        <p class="alert alert-info mb-6">Ajoutez <code class="mono">ANTHROPIC_API_KEY</code> dans le fichier <code class="mono">.env</code> puis redémarrez l'API pour activer les réponses. La recherche ci-dessous fonctionne déjà.</p>
      }
      <div class="flex items-center gap-3 mb-8">
        <button class="btn btn-primary" type="button" (click)="reindex()" [disabled]="reindexing()">
          <app-icon name="refresh" [size]="16" /> {{ reindexing() ? 'Ré-indexation…' : 'Ré-indexer le RAG' }}
        </button>
        <span class="text-sm text-faint">Dernière indexation : {{ s.indexedAt | date: 'dd/MM/yyyy HH:mm:ss' }}</span>
      </div>
    }

    <section class="card">
      <h2 class="font-semibold mb-1">Tester la recherche</h2>
      <p class="text-sm text-muted mb-4">Affiche les fiches que l'assistant enverrait à Claude pour cette question (sans appeler le LLM).</p>
      <form class="flex gap-2 mb-4" (ngSubmit)="search()">
        <input class="input" name="q" [(ngModel)]="query" placeholder="Ex. Quelle expérience en cloud ?" />
        <button class="btn" type="submit" [disabled]="!query.trim()"><app-icon name="search" [size]="16" /> Chercher</button>
      </form>
      <ol class="space-y-2">
        @for (h of hits(); track $index) {
          <li class="rounded-lg border border-line p-3">
            <div class="flex items-center gap-2">
              <span class="chip chip-cyan mono text-xs!">{{ h.score.toFixed(3) }}</span>
              <strong class="text-sm">{{ h.title }}</strong>
              <span class="text-xs text-faint ml-auto">{{ h.section }}</span>
            </div>
            <p class="text-xs text-muted mt-2 whitespace-pre-line line-clamp-4">{{ h.text }}</p>
          </li>
        }
      </ol>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssistantAdmin {
  private readonly api = inject(AdminApiService);
  protected readonly status = signal<AssistantStatus | null>(null);
  protected readonly hits = signal<SearchHit[]>([]);
  protected readonly reindexing = signal(false);
  protected query = '';

  constructor() {
    this.api.assistantStatus().subscribe((s) => this.status.set(s));
  }

  protected reindex(): void {
    this.reindexing.set(true);
    this.api.reindex().subscribe({
      next: (s) => {
        this.status.set(s);
        this.reindexing.set(false);
      },
      error: () => this.reindexing.set(false),
    });
  }

  protected search(): void {
    this.api.search(this.query.trim()).subscribe((hits) => this.hits.set(hits));
  }
}

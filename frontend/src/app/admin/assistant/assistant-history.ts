import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';

import { AdminApiService } from '../../core/admin-api.service';
import { AssistantExchange, AssistantExchangePage } from '../../core/models';
import { Icon } from '../../shared/icon';
import { RichTextPipe } from '../../shared/rich-text.pipe';
import { ToastService } from '../../shared/toast';

type Filter = '' | 'up' | 'down' | 'errors';

/** Historique des questions posées à l'assistant, avec les sources utilisées et l'avis des visiteurs. */
@Component({
  selector: 'app-assistant-history',
  imports: [DatePipe, Icon, RichTextPipe],
  template: `
    <section class="card mt-6">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 class="font-semibold flex items-center gap-2"><app-icon name="message" [size]="18" /> Questions des visiteurs</h2>
          <p class="text-sm text-muted">Ce qui intéresse les recruteurs, et la qualité des réponses.</p>
        </div>
        <div class="tabs" role="tablist" aria-label="Filtrer">
          @for (f of filters; track f.value) {
            <button type="button" role="tab" [class.active]="filter() === f.value" [attr.aria-selected]="filter() === f.value"
              (click)="setFilter(f.value)">{{ f.label }}</button>
          }
        </div>
      </div>

      @if (data(); as d) {
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5 text-center">
          <div class="stat"><strong class="mono">{{ d.stats.total }}</strong><span>questions</span></div>
          <div class="stat"><strong class="mono text-ok">{{ d.stats.up }}</strong><span>👍 utiles</span></div>
          <div class="stat"><strong class="mono text-danger">{{ d.stats.down }}</strong><span>👎 pas utiles</span></div>
          <div class="stat"><strong class="mono">{{ satisfaction() }}</strong><span>satisfaction</span></div>
          <div class="stat"><strong class="mono">{{ (d.stats.avgDurationMs / 1000).toFixed(1) }} s</strong><span>temps moyen</span></div>
        </div>

        <ul class="space-y-2">
          @for (x of d.items; track x.id) {
            <li class="item" [class.open]="openId() === x.id">
              <button type="button" class="head" (click)="toggle(x)" [attr.aria-expanded]="openId() === x.id">
                <span class="w-6 text-center shrink-0">{{ x.feedback === 1 ? '👍' : x.feedback === -1 ? '👎' : '·' }}</span>
                <span class="flex-1 min-w-0 truncate font-medium">{{ x.question }}</span>
                @if (x.status !== 'ANSWERED') {
                  <span class="chip text-xs!" [class.chip-warning]="x.status === 'REFUSED'">{{ x.status === 'ERROR' ? 'erreur' : 'refusée' }}</span>
                }
                <span class="text-xs text-faint mono shrink-0">{{ x.createdAt | date: 'dd/MM HH:mm' }}</span>
                <app-icon name="chevron-down" [size]="16" class="chev" />
              </button>
              @if (openId() === x.id) {
                <div class="body">
                  @if (x.answer) {
                    <div class="answer" [innerHTML]="x.answer | richText"></div>
                  } @else {
                    <p class="text-sm text-muted">Aucune réponse (erreur ou interruption).</p>
                  }
                  @if (x.sources.length) {
                    <p class="text-xs text-faint mt-3">Fiches utilisées : {{ x.sources.join(' · ') }}</p>
                  }
                  <div class="flex items-center gap-3 mt-3 text-xs text-faint mono">
                    @if (x.model) { <span>{{ x.model }}</span> }
                    @if (x.durationMs) { <span>{{ (x.durationMs / 1000).toFixed(1) }} s</span> }
                    <button class="btn btn-sm btn-danger ml-auto" type="button" (click)="remove(x)"><app-icon name="trash" [size]="13" /> Supprimer</button>
                  </div>
                </div>
              }
            </li>
          } @empty {
            <li class="text-sm text-muted py-6 text-center">
              {{ filter() ? 'Aucune question pour ce filtre.' : "Aucune question pour l'instant : elles apparaîtront ici dès que l'assistant sera utilisé." }}
            </li>
          }
        </ul>

        @if (pages() > 1) {
          <div class="flex items-center justify-center gap-3 mt-4 text-sm">
            <button class="btn btn-sm" type="button" [disabled]="page() === 0" (click)="page.set(page() - 1)">Précédent</button>
            <span class="mono text-faint">{{ page() + 1 }} / {{ pages() }}</span>
            <button class="btn btn-sm" type="button" [disabled]="page() + 1 >= pages()" (click)="page.set(page() + 1)">Suivant</button>
          </div>
        }
      } @else {
        <div class="skeleton h-40"></div>
      }
    </section>
  `,
  styles: `
    .tabs { display: inline-flex; padding: 3px; gap: 2px; border-radius: 10px; background: var(--bg-soft); border: 1px solid var(--border); }
    .tabs button { border: 0; background: transparent; color: var(--text-muted); font: 500 13px var(--font); padding: 5px 11px; border-radius: 8px; cursor: pointer; }
    .tabs button.active { background: var(--accent-strong); color: #fff; }
    .stat { display: flex; flex-direction: column; padding: 10px; border-radius: 10px; background: var(--bg-soft); }
    .stat strong { font-size: 20px; }
    .stat span { font-size: 12px; color: var(--text-faint); }
    .item { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
    .head { all: unset; box-sizing: border-box; display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; cursor: pointer; font-size: 14px; }
    .head:hover { background: var(--bg-soft); }
    .head:focus-visible { outline: 2px solid var(--cyan); outline-offset: -2px; }
    .chev { color: var(--text-faint); transition: transform 0.2s ease; }
    .open .chev { transform: rotate(180deg); }
    .body { padding: 4px 14px 14px 46px; border-top: 1px dashed var(--border); }
    .answer { font-size: 14px; color: var(--text-muted); line-height: 1.6; margin-top: 10px; }
    .answer :is(p, ul) { margin: 0 0 6px; }
    .answer ul { padding-left: 18px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssistantHistory {
  private readonly api = inject(AdminApiService);
  private readonly toast = inject(ToastService);
  protected readonly filters: { value: Filter; label: string }[] = [
    { value: '', label: 'Toutes' },
    { value: 'up', label: '👍' },
    { value: 'down', label: '👎' },
    { value: 'errors', label: 'Erreurs' },
  ];
  protected readonly filter = signal<Filter>('');
  protected readonly page = signal(0);
  protected readonly data = signal<AssistantExchangePage | null>(null);
  protected readonly openId = signal<number | null>(null);
  protected readonly pages = computed(() => {
    const d = this.data();
    return d ? Math.ceil(d.totalItems / d.size) : 0;
  });
  protected readonly satisfaction = computed(() => {
    const s = this.data()?.stats;
    const votes = (s?.up ?? 0) + (s?.down ?? 0);
    return votes ? `${Math.round(((s?.up ?? 0) / votes) * 100)} %` : '—';
  });

  constructor() {
    effect(() => this.load(this.page(), this.filter()));
  }

  protected setFilter(value: Filter): void {
    this.filter.set(value);
    this.page.set(0);
  }

  protected toggle(x: AssistantExchange): void {
    this.openId.set(this.openId() === x.id ? null : x.id);
  }

  protected remove(x: AssistantExchange): void {
    if (confirm('Supprimer cet échange de l’historique ?')) {
      this.api.deleteExchange(x.id).subscribe(() => {
        this.toast.success('Échange supprimé.');
        this.load(this.page(), this.filter());
      });
    }
  }

  private load(page: number, filter: Filter): void {
    this.api.exchanges(page, filter).subscribe((d) => this.data.set(d));
  }
}

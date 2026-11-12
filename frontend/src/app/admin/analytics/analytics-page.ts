import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';

import { AdminApiService } from '../../core/admin-api.service';
import { AnalyticsCount, AnalyticsReport, AnalyticsTotals } from '../../core/models';
import { Icon } from '../../shared/icon';

interface Kpi {
  key: keyof AnalyticsTotals;
  label: string;
  icon: string;
}

const KPIS: Kpi[] = [
  { key: 'visitors', label: 'Visiteurs uniques', icon: 'user' },
  { key: 'pageViews', label: 'Pages vues', icon: 'eye' },
  { key: 'projectViews', label: 'Projets consultés', icon: 'folder' },
  { key: 'cvDownloads', label: 'CV téléchargés', icon: 'download' },
  { key: 'assistantQuestions', label: "Questions à l'IA", icon: 'sparkles' },
  { key: 'contactMessages', label: 'Messages reçus', icon: 'mail' },
];

const DEVICE_LABELS: Record<string, string> = { desktop: 'Ordinateur', mobile: 'Mobile', tablet: 'Tablette' };

/** Tableau de bord d'audience : chiffres clés avec tendance, courbe journalière, sources, projets, appareils. */
@Component({
  selector: 'app-analytics-page',
  imports: [Icon, DatePipe, DecimalPipe],
  template: `
    <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold flex items-center gap-2"><app-icon name="chart" [size]="22" /> Statistiques</h1>
        <p class="text-muted text-sm mt-1">Mesure d'audience anonyme : sans cookie, sans adresse IP stockée, robots et « Do Not Track » ignorés.</p>
      </div>
      <div class="periods" role="tablist" aria-label="Période">
        @for (d of periods; track d) {
          <button type="button" role="tab" [class.active]="days() === d" [attr.aria-selected]="days() === d" (click)="days.set(d)">{{ d }} j</button>
        }
      </div>
    </div>

    @if (report(); as r) {
      <div class="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
        @for (k of kpis; track k.key) {
          <div class="card p-4!">
            <div class="flex items-center gap-2 text-faint text-xs mb-2"><app-icon [name]="k.icon" [size]="14" /> {{ k.label }}</div>
            <p class="text-2xl font-semibold mono">{{ r.totals[k.key] | number }}</p>
            <p class="text-xs mt-1 mono" [class]="trendClass(k.key)">{{ trend(k.key) }}</p>
          </div>
        }
      </div>

      <section class="card mb-6">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 class="font-semibold">Fréquentation par jour</h2>
          <div class="flex gap-4 text-xs text-muted">
            <span class="flex items-center gap-1.5"><i class="legend bg-accent-strong"></i> Pages vues</span>
            <span class="flex items-center gap-1.5"><i class="legend bg-cyan"></i> Visiteurs</span>
          </div>
        </div>
        @if (hasData()) {
          <svg class="chart" [attr.viewBox]="'0 0 ' + width + ' ' + height" preserveAspectRatio="none" role="img"
            [attr.aria-label]="'Pages vues et visiteurs sur ' + r.days + ' jours'">
            @for (g of gridLines(); track g.y) {
              <line [attr.x1]="0" [attr.x2]="width" [attr.y1]="g.y" [attr.y2]="g.y" class="grid-line" />
            }
            @for (bar of bars(); track bar.x) {
              <rect [attr.x]="bar.x" [attr.y]="bar.y" [attr.width]="bar.w" [attr.height]="bar.h" rx="2" class="bar">
                <title>{{ bar.day | date: 'EEE d MMM' }} : {{ bar.views }} pages vues, {{ bar.visitors }} visiteurs</title>
              </rect>
            }
            <polyline [attr.points]="visitorLine()" class="line" />
          </svg>
          <div class="flex justify-between text-xs text-faint mono mt-2">
            <span>{{ r.daily[0].day | date: 'd MMM' }}</span>
            <span>max {{ maxViews() }} / jour</span>
            <span>{{ r.daily[r.daily.length - 1].day | date: 'd MMM' }}</span>
          </div>
        } @else {
          <p class="text-sm text-muted py-10 text-center">Pas encore de visite sur cette période. Les données apparaîtront dès les premières visites de la vitrine.</p>
        }
      </section>

      <div class="grid gap-4 lg:grid-cols-2">
        @for (block of blocks(); track block.title) {
          <section class="card">
            <h2 class="font-semibold mb-3 flex items-center gap-2"><app-icon [name]="block.icon" [size]="17" /> {{ block.title }}</h2>
            @for (row of block.rows; track row.label) {
              <div class="row">
                <div class="fill" [style.width.%]="percent(row, block.rows)"></div>
                <span class="truncate">{{ block.format ? block.format(row.label) : row.label }}</span>
                <span class="mono text-sm">{{ row.total }}</span>
              </div>
            } @empty {
              <p class="text-sm text-faint">Aucune donnée.</p>
            }
          </section>
        }
      </div>
    } @else {
      <div class="grid gap-3 grid-cols-2 lg:grid-cols-6 mb-6">@for (n of [1, 2, 3, 4, 5, 6]; track n) { <div class="skeleton h-24"></div> }</div>
      <div class="skeleton h-64"></div>
    }
  `,
  styles: `
    .periods { display: inline-flex; padding: 3px; gap: 2px; border-radius: 10px; background: var(--bg-soft); border: 1px solid var(--border); }
    .periods button { border: 0; background: transparent; color: var(--text-muted); font: 500 13px var(--font); padding: 6px 12px;
      border-radius: 8px; cursor: pointer; }
    .periods button.active { background: var(--accent-strong); color: #fff; }
    .chart { width: 100%; height: 220px; display: block; overflow: visible; }
    .grid-line { stroke: var(--border); stroke-dasharray: 3 4; }
    .bar { fill: var(--accent-strong); opacity: 0.85; transition: opacity 0.15s ease; }
    .bar:hover { opacity: 1; fill: var(--accent); }
    .line { fill: none; stroke: var(--cyan); stroke-width: 2; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
    .legend { display: inline-block; width: 10px; height: 10px; border-radius: 3px; }
    .row { position: relative; display: flex; justify-content: space-between; gap: 12px; padding: 7px 10px; margin-bottom: 4px;
      border-radius: 8px; font-size: 14px; overflow: hidden; }
    .row > span { position: relative; }
    .fill { position: absolute; inset: 0 auto 0 0; background: var(--accent-soft); border-radius: 8px; transition: width 0.6s ease; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsPage {
  private readonly api = inject(AdminApiService);
  protected readonly periods = [7, 30, 90];
  protected readonly kpis = KPIS;
  protected readonly days = signal(30);
  protected readonly report = signal<AnalyticsReport | null>(null);
  protected readonly width = 600;
  protected readonly height = 200;

  protected readonly maxViews = computed(() => Math.max(1, ...(this.report()?.daily.map((d) => d.views) ?? [1])));
  protected readonly hasData = computed(() => (this.report()?.daily ?? []).some((d) => d.views > 0 || d.visitors > 0));

  protected readonly bars = computed(() => {
    const daily = this.report()?.daily ?? [];
    const slot = this.width / Math.max(1, daily.length);
    const max = this.maxViews();
    return daily.map((d, i) => {
      const h = (d.views / max) * (this.height - 10);
      return { x: i * slot + slot * 0.15, w: slot * 0.7, y: this.height - h, h, day: d.day, views: d.views, visitors: d.visitors };
    });
  });

  protected readonly visitorLine = computed(() => {
    const daily = this.report()?.daily ?? [];
    const slot = this.width / Math.max(1, daily.length);
    const max = this.maxViews();
    return daily.map((d, i) => `${i * slot + slot / 2},${this.height - (d.visitors / max) * (this.height - 10)}`).join(' ');
  });

  protected readonly gridLines = computed(() => [0.25, 0.5, 0.75].map((f) => ({ y: this.height - f * (this.height - 10) })));

  protected readonly blocks = computed(() => {
    const r = this.report();
    if (!r) {
      return [];
    }
    return [
      { title: 'Sources de trafic', icon: 'external', rows: r.referrers, format: null },
      { title: 'Projets les plus consultés', icon: 'folder', rows: r.topProjects, format: null },
      { title: 'Pages les plus vues', icon: 'layout', rows: r.topPages, format: null },
      { title: 'Appareils', icon: 'phone', rows: r.devices, format: (l: string) => DEVICE_LABELS[l] ?? l },
    ];
  });

  constructor() {
    effect(() => {
      const days = this.days();
      this.report.set(null);
      this.api.analytics(days).subscribe((r) => this.report.set(r));
    });
  }

  /** Évolution par rapport à la période précédente de même durée. */
  protected trend(key: keyof AnalyticsTotals): string {
    const r = this.report()!;
    const now = r.totals[key];
    const before = r.previous[key];
    if (before === 0) {
      return now > 0 ? 'nouveau' : '—';
    }
    const pct = Math.round(((now - before) / before) * 100);
    return `${pct >= 0 ? '+' : ''}${pct} % vs période préc.`;
  }

  protected trendClass(key: keyof AnalyticsTotals): string {
    const r = this.report()!;
    const diff = r.totals[key] - r.previous[key];
    return diff > 0 ? 'text-ok' : diff < 0 ? 'text-danger' : 'text-faint';
  }

  protected percent(row: AnalyticsCount, rows: AnalyticsCount[]): number {
    const max = Math.max(1, ...rows.map((r) => r.total));
    return (row.total / max) * 100;
  }
}

import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AdminApiService } from '../../core/admin-api.service';
import { AssistantStatus, Certification, ContactMessage, CvInfo, Profile, Project } from '../../core/models';
import { Avatar } from '../../shared/avatar';
import { Icon } from '../../shared/icon';
import { SECTIONS } from '../section-editor/sections';

interface Tile {
  route: string;
  title: string;
  icon: string;
  total: number;
  visible: number;
}

interface Check {
  label: string;
  done: boolean;
  link: string;
  hint: string;
}

interface Snapshot {
  profile: Profile;
  avatar: { url: string } | null;
  cv: CvInfo | null;
  lists: Record<string, { visible: boolean }[]>;
  messages: ContactMessage[];
  assistant: AssistantStatus;
}

const RING = 2 * Math.PI * 52;

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, Icon, Avatar, DatePipe],
  template: `
    @if (data(); as d) {
      <div class="flex flex-wrap items-center gap-4 mb-8">
        <app-avatar [src]="d.avatar?.url" [name]="d.profile.fullName" [size]="56" [halo]="true" />
        <div>
          <h1 class="text-2xl font-bold">Bonjour {{ firstName() }} 👋</h1>
          <p class="text-muted text-sm">Tout le contenu de la vitrine se règle ici ; les changements sont en ligne immédiatement.</p>
        </div>
        <a class="btn btn-sm ml-auto" href="/" target="_blank" rel="noopener"><app-icon name="external" [size]="15" /> Voir la vitrine</a>
      </div>

      <div class="grid gap-4 lg:grid-cols-3 mb-6">
        <!-- Score de complétude -->
        <section class="card lg:col-span-1 flex flex-col items-center text-center">
          <h2 class="font-semibold self-start mb-3">Complétude du portfolio</h2>
          <svg viewBox="0 0 120 120" class="w-36 h-36 -rotate-90" aria-hidden="true">
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" stroke-width="10" />
            <circle cx="60" cy="60" r="52" fill="none" stroke="url(#g)" stroke-width="10" stroke-linecap="round"
              [attr.stroke-dasharray]="ring" [attr.stroke-dashoffset]="ring * (1 - score() / 100)" class="ring" />
            <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#6366f1" /><stop offset="1" stop-color="#38bdf8" /></linearGradient></defs>
          </svg>
          <p class="-mt-24 mb-14 text-3xl font-semibold mono">{{ score() }}<span class="text-base text-faint">%</span></p>
          <p class="text-sm text-muted">{{ doneCount() }} / {{ checks().length }} points validés</p>
        </section>

        <!-- Points à compléter -->
        <section class="card lg:col-span-2">
          <h2 class="font-semibold mb-3">{{ todo().length ? 'À compléter' : 'Tout est prêt' }}</h2>
          <ul class="divide-y divide-line">
            @for (c of todo(); track c.label) {
              <li class="flex items-center gap-3 py-2.5">
                <span class="grid place-items-center w-6 h-6 rounded-full border border-line-strong shrink-0"></span>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium">{{ c.label }}</p>
                  <p class="text-xs text-faint">{{ c.hint }}</p>
                </div>
                <a class="btn btn-sm" [routerLink]="c.link">Compléter</a>
              </li>
            }
            @for (c of doneChecks(); track c.label) {
              <li class="flex items-center gap-3 py-2 opacity-70">
                <span class="grid place-items-center w-6 h-6 rounded-full bg-ok-soft text-ok shrink-0"><app-icon name="check" [size]="14" /></span>
                <p class="text-sm text-muted flex-1">{{ c.label }}</p>
              </li>
            }
          </ul>
        </section>
      </div>

      <!-- Contenu par section -->
      <div class="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        @for (t of tiles(); track t.route) {
          <a class="card card-hover no-underline text-fg block p-4!" [routerLink]="'/admin/' + t.route">
            <div class="flex items-center justify-between mb-2">
              <span class="grid place-items-center w-8 h-8 rounded-lg bg-accent-soft text-accent"><app-icon [name]="t.icon" [size]="16" /></span>
              <span class="text-xs text-faint mono">{{ t.visible }}/{{ t.total }} publiés</span>
            </div>
            <p class="text-2xl font-semibold mono">{{ t.total }}</p>
            <p class="text-sm text-muted">{{ t.title }}</p>
          </a>
        }
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <section class="card">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-semibold flex items-center gap-2"><app-icon name="mail" [size]="18" /> Derniers messages</h2>
            @if (unread() > 0) { <span class="chip chip-accent text-xs!">{{ unread() }} non lu(s)</span> }
          </div>
          <ul class="space-y-2">
            @for (m of d.messages.slice(0, 3); track m.id) {
              <li>
                <a routerLink="/admin/messages" class="flex gap-3 rounded-lg p-2 -mx-2 no-underline text-fg hover:bg-soft">
                  <span class="w-2 h-2 mt-2 rounded-full shrink-0" [class.bg-cyan]="!m.readAt"></span>
                  <span class="min-w-0 flex-1">
                    <span class="block text-sm font-medium truncate">{{ m.name }} — {{ m.subject || '(sans objet)' }}</span>
                    <span class="block text-xs text-muted truncate">{{ m.message }}</span>
                  </span>
                  <span class="text-xs text-faint mono shrink-0">{{ m.createdAt | date: 'dd/MM' }}</span>
                </a>
              </li>
            } @empty {
              <li class="text-sm text-muted">Aucun message pour l'instant.</li>
            }
          </ul>
        </section>

        <section class="card">
          <h2 class="font-semibold mb-3 flex items-center gap-2"><app-icon name="sparkles" [size]="18" /> Assistant IA</h2>
          <ul class="text-sm space-y-2 mb-4">
            <li class="flex justify-between gap-4"><span class="text-muted">Clé API Claude</span>
              <span [class]="d.assistant.apiKeyConfigured ? 'text-ok' : 'text-warn'">{{ d.assistant.apiKeyConfigured ? 'configurée' : 'absente — bulle masquée' }}</span></li>
            <li class="flex justify-between gap-4"><span class="text-muted">Modèle</span><span class="mono">{{ d.assistant.model }}</span></li>
            <li class="flex justify-between gap-4"><span class="text-muted">Fiches indexées</span><span class="mono">{{ d.assistant.chunks }}</span></li>
            <li class="flex justify-between gap-4"><span class="text-muted">Recherche</span><span>{{ d.assistant.semanticSearch ? 'hybride (embeddings + BM25)' : 'mots-clés' }}</span></li>
          </ul>
          <a class="btn btn-sm" routerLink="/admin/assistant">Gérer l'assistant</a>
        </section>
      </div>
    } @else {
      <div class="space-y-4" aria-busy="true">
        <div class="skeleton h-14 w-80"></div>
        <div class="grid gap-4 lg:grid-cols-3"><div class="skeleton h-64"></div><div class="skeleton h-64 lg:col-span-2"></div></div>
        <div class="grid gap-4 grid-cols-2 lg:grid-cols-4">@for (n of [1, 2, 3, 4]; track n) { <div class="skeleton h-28"></div> }</div>
      </div>
    }
  `,
  styles: `.ring { transition: stroke-dashoffset 0.9s cubic-bezier(0.2, 0.8, 0.2, 1); }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly api = inject(AdminApiService);
  protected readonly ring = RING;
  protected readonly data = signal<Snapshot | null>(null);

  protected readonly firstName = computed(() => this.data()?.profile.fullName.split(' ')[0] ?? '');
  protected readonly unread = computed(() => this.data()?.messages.filter((m) => !m.readAt).length ?? 0);

  protected readonly tiles = computed<Tile[]>(() => {
    const d = this.data();
    if (!d) {
      return [];
    }
    return SECTIONS.filter((s) => s.key !== 'knowledge').map((s) => ({
      route: s.route,
      title: s.title,
      icon: s.icon,
      total: d.lists[s.key].length,
      visible: d.lists[s.key].filter((x) => x.visible).length,
    }));
  });

  /** Points de qualité vérifiés automatiquement sur le contenu réel. */
  protected readonly checks = computed<Check[]>(() => {
    const d = this.data();
    if (!d) {
      return [];
    }
    const p = d.profile;
    const projects = (d.lists['projects'] as unknown as Project[]).filter((x) => x.visible);
    const certs = (d.lists['certifications'] as unknown as Certification[]).filter((x) => x.visible);
    return [
      { label: 'Photo de profil', done: !!d.avatar, link: '/admin/profil', hint: 'Une photo augmente fortement la confiance du recruteur.' },
      { label: 'CV PDF téléchargeable', done: !!d.cv || !!p.cvUrl, link: '/admin/profil', hint: 'Active le bouton « Télécharger le CV ».' },
      { label: 'Accroche et présentation', done: !!p.tagline && (p.summary?.length ?? 0) > 120, link: '/admin/profil', hint: 'Accroche du hero + présentation d\'au moins 120 caractères.' },
      { label: 'LinkedIn et GitHub', done: !!p.linkedinUrl && !!p.githubUrl, link: '/admin/profil', hint: 'Les deux liens sont attendus par les recruteurs tech.' },
      { label: 'Au moins 3 projets publiés', done: projects.length >= 3, link: '/admin/projets', hint: `${projects.length} publié(s) actuellement.` },
      { label: "Schéma d'architecture sur chaque projet", done: projects.length > 0 && projects.every((x) => x.architecture.length >= 2), link: '/admin/projets', hint: 'Montre votre vision d\'ingénieur sur la page détail.' },
      { label: 'Au moins 4 groupes de compétences', done: d.lists['skills'].filter((x) => x.visible).length >= 4, link: '/admin/competences', hint: 'Alimente la grille Bento.' },
      { label: 'Certification avec lien de vérification', done: certs.some((c) => !!c.credentialUrl), link: '/admin/certifications', hint: 'Un lien Credly rend la certification vérifiable.' },
      { label: 'Clé API de l\'assistant IA', done: d.assistant.apiKeyConfigured, link: '/admin/assistant', hint: 'Sans clé, la bulle de l\'assistant est masquée.' },
      { label: 'Fiches pour l\'assistant', done: d.lists['knowledge'].filter((x) => x.visible).length >= 2, link: '/admin/connaissances', hint: 'Disponibilité, mobilité, précisions utiles aux recruteurs.' },
    ];
  });
  protected readonly todo = computed(() => this.checks().filter((c) => !c.done));
  protected readonly doneChecks = computed(() => this.checks().filter((c) => c.done));
  protected readonly doneCount = computed(() => this.doneChecks().length);
  protected readonly score = computed(() =>
    this.checks().length ? Math.round((this.doneCount() / this.checks().length) * 100) : 0,
  );

  constructor() {
    const lists = Object.fromEntries(SECTIONS.map((s) => [s.key, this.api.list<{ visible: boolean }>(s.endpoint)]));
    forkJoin({
      profile: this.api.profile(),
      avatar: this.api.avatar(),
      cv: this.api.cvInfo(),
      lists: forkJoin(lists),
      messages: this.api.messages(),
      assistant: this.api.assistantStatus(),
    }).subscribe((snapshot) => this.data.set(snapshot));
  }
}

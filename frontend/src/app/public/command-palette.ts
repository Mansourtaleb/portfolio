import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Injectable,
  computed,
  effect,
  inject,
  untracked,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';

import { Portfolio } from '../core/models';
import { PublicApiService } from '../core/public-api.service';
import { ThemeService } from '../core/theme.service';
import { Icon } from '../shared/icon';
import { SECTION_LABELS } from './home/home';

interface Command {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: string;
  keywords: string;
  run: () => void;
}

/** Ouverture de la palette depuis n'importe quel composant (bouton de l'en-tête, raccourci). */
@Injectable({ providedIn: 'root' })
export class CommandPaletteService {
  readonly open = signal(false);
}

const normalize = (s: string) =>
  s.normalize('NFD').replace(/\p{M}+/gu, '').toLowerCase();

/**
 * Palette de commandes (Ctrl+K / ⌘K ou « / ») : recherche instantanée dans les sections,
 * projets, compétences et expériences, plus quelques actions (CV, contact, thème, assistant).
 */
@Component({
  selector: 'app-command-palette',
  imports: [Icon],
  template: `
    @if (service.open()) {
      <div class="backdrop" (click)="close()">
        <div class="palette" role="dialog" aria-modal="true" aria-label="Recherche rapide" (click)="$event.stopPropagation()">
          <div class="search">
            <app-icon name="search" [size]="18" />
            <input #field type="text" [value]="query()" (input)="query.set(field.value); active.set(0)"
              (keydown)="onKey($event)" placeholder="Rechercher un projet, une compétence, une section…"
              role="combobox" aria-expanded="true" aria-controls="palette-list"
              [attr.aria-activedescendant]="results()[active()] ? 'cmd-' + results()[active()].id : null" />
            <kbd>Échap</kbd>
          </div>
          <ul id="palette-list" role="listbox" class="list">
            @for (cmd of results(); track cmd.id; let i = $index) {
              @if (i === 0 || results()[i - 1].group !== cmd.group) {
                <li class="group" role="presentation">{{ cmd.group }}</li>
              }
              <li [id]="'cmd-' + cmd.id" role="option" class="item" [class.active]="i === active()" [attr.aria-selected]="i === active()"
                (mousemove)="active.set(i)" (click)="execute(cmd)">
                <span class="icon"><app-icon [name]="cmd.icon" [size]="16" /></span>
                <span class="label">{{ cmd.label }}</span>
                @if (cmd.hint) { <span class="hint">{{ cmd.hint }}</span> }
              </li>
            } @empty {
              <li class="empty">Aucun résultat pour « {{ query() }} »</li>
            }
          </ul>
          <div class="footer"><span><kbd>↑</kbd><kbd>↓</kbd> naviguer</span><span><kbd>Entrée</kbd> ouvrir</span></div>
        </div>
      </div>
    }
  `,
  styles: `
    .backdrop { position: fixed; inset: 0; z-index: 150; background: rgba(5, 8, 15, 0.6); backdrop-filter: blur(4px);
      display: flex; justify-content: center; align-items: flex-start; padding: 12vh 16px 16px; animation: fade 0.15s ease; }
    .palette { width: min(620px, 100%); background: var(--bg-solid); border: 1px solid var(--border-strong); border-radius: 16px;
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45); overflow: hidden; animation: pop 0.18s cubic-bezier(0.2, 0.8, 0.2, 1); }
    .search { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid var(--border); color: var(--text-faint); }
    .search input { flex: 1; border: 0; outline: 0; background: transparent; color: var(--text); font: 400 16px var(--font); }
    kbd { font: 500 11px var(--mono); padding: 2px 6px; border-radius: 6px; border: 1px solid var(--border-strong); color: var(--text-faint); background: var(--bg-soft); }
    .list { list-style: none; margin: 0; padding: 6px; max-height: min(420px, 55vh); overflow-y: auto; }
    .group { font: 500 11px var(--mono); text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-faint); padding: 10px 10px 4px; }
    .item { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 10px; cursor: pointer; font-size: 14px; }
    .item.active { background: var(--accent-soft); }
    .item.active .icon { color: var(--accent); }
    .icon { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 8px; background: var(--bg-soft); color: var(--text-muted); flex-shrink: 0; }
    .label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .hint { font-size: 12px; color: var(--text-faint); white-space: nowrap; }
    .empty { padding: 28px; text-align: center; color: var(--text-muted); font-size: 14px; }
    .footer { display: flex; gap: 16px; padding: 8px 14px; border-top: 1px solid var(--border); font-size: 12px; color: var(--text-faint); }
    .footer kbd { margin-right: 2px; }
    @keyframes fade { from { opacity: 0; } }
    @keyframes pop { from { opacity: 0; transform: translateY(-8px) scale(0.98); } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandPalette {
  protected readonly service = inject(CommandPaletteService);
  private readonly router = inject(Router);
  private readonly theme = inject(ThemeService);
  private readonly api = inject(PublicApiService);
  private readonly field = viewChild<ElementRef<HTMLInputElement>>('field');
  private readonly data = signal<Portfolio | null>(null);
  protected readonly query = signal('');
  protected readonly active = signal(0);
  private opener: HTMLElement | null = null;

  private readonly commands = computed<Command[]>(() => {
    const d = this.data();
    if (!d) {
      return [];
    }
    const go = (fragment: string) => () => this.router.navigate(['/'], { fragment });
    const list: Command[] = d.settings.sections.map((key) => ({
      id: `section-${key}`, group: 'Sections', label: SECTION_LABELS[key], icon: 'arrow-right',
      keywords: key, run: go(key),
    }));
    for (const p of d.projects) {
      list.push({
        id: `project-${p.slug}`, group: 'Projets', label: p.title, hint: p.context ?? undefined, icon: 'folder',
        keywords: [p.tagline, p.summary, ...p.stack].join(' '), run: () => this.router.navigate(['/projects', p.slug]),
      });
    }
    for (const e of d.experiences) {
      list.push({
        id: `exp-${e.id}`, group: 'Expériences', label: e.role, hint: e.company, icon: 'briefcase',
        keywords: [e.company, e.period, e.kind, ...e.stack].join(' '), run: go('experience'),
      });
    }
    for (const g of d.skills) {
      for (const item of g.items) {
        list.push({
          id: `skill-${g.id}-${item}`, group: 'Compétences', label: item, hint: g.name, icon: g.icon || 'code',
          keywords: g.name, run: go('skills'),
        });
      }
    }
    if (d.profile.cvUrl) {
      list.push({ id: 'cv', group: 'Actions', label: 'Télécharger le CV', icon: 'download', keywords: 'pdf resume',
        run: () => window.open(d.profile.cvUrl!, '_blank', 'noopener') });
    }
    list.push(
      { id: 'cv-page', group: 'Actions', label: 'Voir le CV imprimable', icon: 'file-code', keywords: 'imprimer print pdf', run: () => this.router.navigate(['/cv']) },
      { id: 'contact', group: 'Actions', label: 'Me contacter', icon: 'mail', keywords: 'email message', run: go('contact') },
      { id: 'theme', group: 'Actions', label: 'Changer de thème (clair / sombre)', icon: 'sun', keywords: 'dark light mode', run: () => this.theme.toggle() },
    );
    return list;
  });

  protected readonly results = computed(() => {
    const q = normalize(this.query().trim());
    const all = this.commands();
    if (!q) {
      return all.filter((c) => c.group !== 'Compétences' && c.group !== 'Expériences');
    }
    const words = q.split(/\s+/);
    return all
      .map((c) => {
        const label = normalize(c.label);
        const hay = `${label} ${normalize(c.hint ?? '')} ${normalize(c.keywords)}`;
        if (!words.every((w) => hay.includes(w))) {
          return null;
        }
        const score = label.startsWith(q) ? 3 : label.includes(q) ? 2 : 1;
        return { c, score };
      })
      .filter((x): x is { c: Command; score: number } => !!x)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30)
      .map((x) => x.c)
      .sort((a, b) => groupOrder(a.group) - groupOrder(b.group));
  });

  @HostListener('document:keydown', ['$event'])
  protected onGlobalKey(event: KeyboardEvent): void {
    const target = event.target;
    const typing = target instanceof Element && !!target.closest('input, textarea, select, [contenteditable]');
    if ((event.key === 'k' || event.key === 'K') && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.service.open() ? this.close() : this.openPalette();
    } else if (event.key === '/' && !typing && !this.service.open()) {
      event.preventDefault();
      this.openPalette();
    }
  }

  constructor() {
    // L'ouverture peut venir du raccourci ou du bouton de l'en-tête : on prépare la palette à chaque ouverture.
    effect(() => {
      if (this.service.open()) {
        untracked(() => this.prepare());
      }
    });
  }

  openPalette(): void {
    this.service.open.set(true);
  }

  private prepare(): void {
    this.opener = document.activeElement as HTMLElement | null;
    this.query.set('');
    this.active.set(0);
    if (!this.data()) {
      this.api.portfolio().subscribe((d) => this.data.set(d));
    }
    setTimeout(() => this.field()?.nativeElement.focus());
  }

  protected close(): void {
    this.service.open.set(false);
    this.opener?.focus();
  }

  protected onKey(event: KeyboardEvent): void {
    const n = this.results().length;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.active.set(n ? (this.active() + 1) % n : 0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.active.set(n ? (this.active() - 1 + n) % n : 0);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const cmd = this.results()[this.active()];
      if (cmd) {
        this.execute(cmd);
      }
    } else if (event.key === 'Escape') {
      this.close();
    }
  }

  protected execute(cmd: Command): void {
    this.service.open.set(false);
    cmd.run();
  }
}

function groupOrder(group: string): number {
  return ['Projets', 'Sections', 'Compétences', 'Expériences', 'Actions'].indexOf(group);
}

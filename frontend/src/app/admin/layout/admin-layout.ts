import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { AdminApiService } from '../../core/admin-api.service';
import { AuthService } from '../../core/auth.service';
import { ThemeService } from '../../core/theme.service';
import { Icon } from '../../shared/icon';
import { Toasts } from '../../shared/toast';
import { SECTIONS } from '../section-editor/sections';

interface NavLink {
  path: string;
  label: string;
  icon: string;
  exact?: boolean;
}

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, Toasts],
  template: `
    <div class="min-h-screen md:grid md:grid-cols-[250px_1fr]">
      <aside class="sidebar" [class.open]="menuOpen()">
        <a routerLink="/admin" class="flex items-center gap-2 px-3 py-4 font-extrabold text-lg no-underline text-fg">
          MT<span class="text-cyan">.</span> <span class="text-xs font-medium text-faint mono">admin</span>
        </a>
        <nav class="flex flex-col gap-0.5">
          @for (group of groups; track group.title) {
            <p class="nav-title mono">{{ group.title }}</p>
            @for (link of group.links; track link.path) {
              <a class="nav-link" [routerLink]="link.path" routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: !!link.exact }">
                <app-icon [name]="link.icon" [size]="17" /> {{ link.label }}
                @if (link.path === '/admin/messages' && unread() > 0) {
                  <span class="ml-auto text-xs rounded-full px-2 bg-accent-strong text-white">{{ unread() }}</span>
                }
              </a>
            }
          }
        </nav>
        <a class="nav-link mt-4" href="/swagger-ui.html" target="_blank" rel="noopener">
          <app-icon name="file-code" [size]="17" /> Documentation API <app-icon class="ml-auto" name="external" [size]="13" />
        </a>
      </aside>

      <div class="flex flex-col min-w-0">
        <header class="topbar">
          <button class="btn btn-ghost btn-icon md:hidden" type="button" (click)="menuOpen.set(!menuOpen())" aria-label="Menu">
            <app-icon [name]="menuOpen() ? 'x' : 'menu'" [size]="18" />
          </button>
          <span class="text-sm text-muted hidden sm:inline">Connecté : <strong class="text-fg">{{ auth.username() }}</strong></span>
          <div class="ml-auto flex items-center gap-1">
            <a class="btn btn-sm btn-ghost" href="/" target="_blank" rel="noopener"><app-icon name="external" [size]="15" /> Voir le site</a>
            <button class="btn btn-ghost btn-icon" type="button" (click)="theme.toggle()" aria-label="Changer de thème">
              <app-icon [name]="theme.theme() === 'dark' ? 'sun' : 'moon'" [size]="17" />
            </button>
            <button class="btn btn-sm btn-ghost" type="button" (click)="auth.logout()"><app-icon name="logout" [size]="15" /> Déconnexion</button>
          </div>
        </header>
        <main class="p-4 sm:p-8 max-w-6xl w-full">
          <router-outlet />
        </main>
      </div>
    </div>
    <app-toasts />
  `,
  styles: `
    .sidebar { border-right: 1px solid var(--border); background: var(--bg-solid); padding: 0 12px 24px;
      position: sticky; top: 0; height: 100vh; overflow-y: auto; }
    .nav-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-faint); margin: 16px 12px 6px; }
    .nav-link { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 8px; font-size: 14px;
      color: var(--text-muted); text-decoration: none; transition: background 0.15s ease, color 0.15s ease; }
    .nav-link:hover { background: var(--bg-soft); color: var(--text); text-decoration: none; }
    .nav-link.active { background: var(--accent-soft); color: var(--accent); font-weight: 600; }
    .topbar { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; gap: 12px; height: 60px;
      padding: 0 16px; border-bottom: 1px solid var(--border); background: color-mix(in srgb, var(--bg) 85%, transparent);
      backdrop-filter: blur(10px); }
    @media (max-width: 767px) {
      .sidebar { display: none; position: fixed; inset: 60px 0 0 0; z-index: 30; height: auto; }
      .sidebar.open { display: block; }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayout {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  private readonly api = inject(AdminApiService);
  protected readonly menuOpen = signal(false);
  protected readonly unread = signal(0);

  protected readonly groups: { title: string; links: NavLink[] }[] = [
    {
      title: 'Général',
      links: [
        { path: '/admin', label: 'Tableau de bord', icon: 'home', exact: true },
        { path: '/admin/statistiques', label: 'Statistiques', icon: 'chart' },
      ],
    },
    {
      title: 'Vitrine',
      links: [
        { path: '/admin/profil', label: 'Profil, hero & CV', icon: 'user' },
        ...SECTIONS.filter((s) => s.key !== 'knowledge').map((s) => ({ path: `/admin/${s.route}`, label: s.title, icon: s.icon })),
        { path: '/admin/reglages', label: 'Sections & réglages', icon: 'settings' },
      ],
    },
    {
      title: 'Assistant IA',
      links: [
        { path: '/admin/assistant', label: 'RAG & index', icon: 'sparkles' },
        { path: '/admin/connaissances', label: 'Fiches assistant', icon: 'book' },
      ],
    },
    {
      title: 'Divers',
      links: [
        { path: '/admin/messages', label: 'Messages', icon: 'mail' },
        { path: '/admin/compte', label: 'Mon compte', icon: 'lock' },
      ],
    },
  ];

  constructor() {
    this.refreshUnread();
    inject(Router)
      .events.pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        this.menuOpen.set(false);
        this.refreshUnread();
      });
  }

  private refreshUnread(): void {
    this.api.unreadCount().subscribe({ next: (r) => this.unread.set(r.count), error: () => undefined });
  }
}

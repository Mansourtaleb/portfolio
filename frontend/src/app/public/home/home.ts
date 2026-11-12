import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { ApiProblem, Portfolio, SectionKey } from '../../core/models';
import { PublicApiService } from '../../core/public-api.service';
import { ThemeService } from '../../core/theme.service';
import { Avatar } from '../../shared/avatar';
import { Icon } from '../../shared/icon';
import { RevealDirective } from '../../shared/reveal.directive';
import { AssistantWidget } from '../assistant/assistant-widget';
import { SiteHeader } from '../site-header';

export const SECTION_LABELS: Record<SectionKey, string> = {
  about: 'Profil',
  skills: 'Compétences',
  experience: 'Parcours',
  projects: 'Projets',
  education: 'Formation',
  contact: 'Contact',
};

@Component({
  selector: 'app-home',
  imports: [RouterLink, FormsModule, Icon, AssistantWidget, SiteHeader, RevealDirective, Avatar],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly api = inject(PublicApiService);
  private readonly theme = inject(ThemeService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  protected readonly labels = SECTION_LABELS;
  protected readonly data = signal<Portfolio | null>(null);
  protected readonly loadError = signal(false);

  protected readonly sections = computed(() => this.data()?.settings.sections ?? []);
  protected readonly navItems = computed(() =>
    this.sections().map((key) => ({ key, label: SECTION_LABELS[key] })),
  );
  protected readonly firstName = computed(() => {
    const name = this.data()?.profile.fullName ?? '';
    const parts = name.split(' ').filter((p) => p !== p.toUpperCase());
    return parts.join(' ') || name;
  });
  protected readonly lastName = computed(() => {
    const name = this.data()?.profile.fullName ?? '';
    return name.split(' ').filter((p) => p === p.toUpperCase()).join(' ');
  });
  /** Technologies mises en avant dans la carte « code » du héros. */
  protected readonly heroStack = computed(() => {
    const skills = this.data()?.skills ?? [];
    return skills.flatMap((s) => s.items).slice(0, 4).map((s) => s.replace(/\s*\(.*\)$/, ''));
  });

  /** Nombre de technologies distinctes (carte « En chiffres »). */
  protected readonly skillCount = computed(
    () => new Set((this.data()?.skills ?? []).flatMap((s) => s.items)).size,
  );

  // Filtre des projets par technologie
  protected readonly techFilter = signal<string | null>(null);
  protected readonly techs = computed(() => {
    const counts = new Map<string, number>();
    for (const p of this.data()?.projects ?? []) {
      for (const t of p.stack) {
        counts.set(t, (counts.get(t) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t);
  });
  protected readonly filteredProjects = computed(() => {
    const filter = this.techFilter();
    const projects = this.data()?.projects ?? [];
    return filter ? projects.filter((p) => p.stack.includes(filter)) : projects;
  });

  // Frise interactive : la première expérience est dépliée par défaut
  private readonly openExps = signal<Set<number>>(new Set([0]));
  protected isOpen(index: number): boolean {
    return this.openExps().has(index);
  }
  protected toggleExp(index: number): void {
    this.openExps.update((set) => {
      const next = new Set(set);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }

  // Formulaire de contact
  protected contact = { name: '', email: '', subject: '', message: '', website: '' };
  protected readonly sending = signal(false);
  protected readonly contactSent = signal(false);
  protected readonly contactError = signal<string | null>(null);
  protected readonly contactErrors = signal<Record<string, string>>({});

  constructor() {
    this.api.portfolio().subscribe({
      next: (portfolio) => {
        this.data.set(portfolio);
        this.theme.useDefault(portfolio.settings.defaultTheme);
        this.title.setTitle(portfolio.settings.siteTitle);
        if (portfolio.settings.metaDescription) {
          this.meta.updateTag({ name: 'description', content: portfolio.settings.metaDescription });
        }
      },
      error: () => this.loadError.set(true),
    });
  }

  protected sendContact(): void {
    if (this.sending()) {
      return;
    }
    this.sending.set(true);
    this.contactError.set(null);
    this.contactErrors.set({});
    this.api.contact(this.contact).subscribe({
      next: () => {
        this.sending.set(false);
        this.contactSent.set(true);
        this.contact = { name: '', email: '', subject: '', message: '', website: '' };
      },
      error: (error: HttpErrorResponse) => {
        this.sending.set(false);
        const problem = error.error as ApiProblem | null;
        this.contactErrors.set(problem?.errors ?? {});
        this.contactError.set(problem?.detail ?? "Le message n'a pas pu être envoyé. Réessayez plus tard.");
      },
    });
  }

  protected skillIcon(icon: string | null): string {
    return icon || 'code';
  }

  protected year = new Date().getFullYear();
}

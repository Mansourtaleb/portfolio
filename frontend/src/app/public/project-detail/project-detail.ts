import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AnalyticsService } from '../../core/analytics.service';
import { Project } from '../../core/models';
import { SeoService } from '../../core/seo.service';
import { I18nService, TranslatePipe } from '../../core/i18n';
import { PublicApiService } from '../../core/public-api.service';
import { Icon } from '../../shared/icon';
import { Gallery } from '../gallery';
import { SiteHeader } from '../site-header';

@Component({
  selector: 'app-project-detail',
  imports: [RouterLink, Icon, SiteHeader, Gallery, TranslatePipe],
  template: `
    <app-site-header [avatarUrl]="avatarUrl()" [name]="ownerName()" />
    @if (api.preview) { <div class="preview-banner">{{ 'preview.banner' | t }}</div> }
    <main id="main" class="container page">
      <a class="back" routerLink="/" fragment="projects"><app-icon name="arrow-left" [size]="16" /> {{ 'project.back' | t }}</a>
      @if (project(); as p) {
        <header class="head">
          <div class="chips">
            @if (p.context) { <span class="chip chip-accent">{{ p.context }}</span> }
            @if (p.period) { <span class="chip mono">{{ p.period }}</span> }
            <span class="chip" [class.chip-warning]="p.status === 'IN_PROGRESS'" [class.chip-success]="p.status === 'DONE'">
              {{ (p.status === 'IN_PROGRESS' ? 'projects.inProgress' : 'projects.done') | t }}
            </span>
          </div>
          <h1>{{ p.title }}</h1>
          @if (p.tagline) { <p class="tagline">{{ p.tagline }}</p> }
        </header>

        <div class="layout">
          <article class="content">
            @if (p.images?.length) { <app-gallery class="gallery" [images]="p.images!" /> }
            @if (p.summary) { <p class="lead">{{ p.summary }}</p> }
            @if (p.description) {
              <h2>{{ 'project.about' | t }}</h2>
              @for (para of paragraphs(p.description); track $index) { <p class="para">{{ para }}</p> }
            }
            @if (p.role) {
              <h2>{{ 'project.role' | t }}</h2>
              <p class="para">{{ p.role }}</p>
            }
            @if (p.architecture.length) {
              <h2>{{ 'project.architecture' | t }}</h2>
              <ol class="arch" aria-label="Schéma d'architecture">
                @for (layer of layers(p.architecture); track $index; let last = $last) {
                  <li class="arch-node card">
                    <span class="arch-index mono">{{ ($index + 1).toString().padStart(2, '0') }}</span>
                    <div>
                      <strong>{{ layer.name }}</strong>
                      @if (layer.detail) { <p>{{ layer.detail }}</p> }
                    </div>
                  </li>
                  @if (!last) { <li class="arch-link" aria-hidden="true"><span></span></li> }
                }
              </ol>
            }
            @if (p.highlights.length) {
              <h2>{{ 'project.highlights' | t }}</h2>
              <ul class="highlights">
                @for (h of p.highlights; track h) { <li>{{ h }}</li> }
              </ul>
            }
          </article>

          <aside class="card side">
            <h3>{{ 'project.stack' | t }}</h3>
            <div class="chips">
              @for (t of p.stack; track t) { <span class="chip">{{ t }}</span> }
            </div>
            @if (p.confidential) {
              <div class="confidential">
                <app-icon name="lock" [size]="18" />
                <p>{{ p.confidentialNote || ('project.confidential' | t) }}</p>
              </div>
            }
            @if (p.repoUrl || p.demoUrl) {
              <div class="links">
                @if (p.repoUrl) {
                  <a class="btn" [href]="p.repoUrl" target="_blank" rel="noopener"><app-icon name="github" [size]="16" /> {{ 'project.source' | t }}</a>
                }
                @if (p.demoUrl) {
                  <a class="btn btn-primary" [href]="p.demoUrl" target="_blank" rel="noopener"><app-icon name="external" [size]="16" /> {{ 'projects.demo' | t }}</a>
                }
              </div>
            }
          </aside>
        </div>
      } @else if (notFound()) {
        <div class="state-404">
          <p class="mono gradient-text big">404</p>
          <h1>{{ 'project.notFound' | t }}</h1>
          <a class="btn btn-primary" routerLink="/" fragment="projects">{{ 'project.back' | t }}</a>
        </div>
      } @else {
        <div class="skel" aria-busy="true" aria-label="Chargement du projet">
          <div class="skeleton h-6 w-64 rounded-full"></div>
          <div class="skeleton h-12 w-80"></div>
          <div class="skeleton h-5 w-full max-w-2xl"></div>
          <div class="layout"><div class="skeleton h-64"></div><div class="skeleton h-48"></div></div>
        </div>
      }
    </main>
  `,
  styles: `
    .page { padding-top: 32px; padding-bottom: 96px; }
    .back { display: inline-flex; align-items: center; gap: 6px; color: var(--text-muted); font-size: 14px; }
    .head { margin: 28px 0 36px; }
    h1 { font-size: clamp(32px, 5vw, 48px); font-weight: 800; letter-spacing: -0.02em; margin-top: 16px; }
    .tagline { font-size: 19px; color: var(--text-muted); margin-top: 10px; max-width: 760px; }
    .layout { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr); gap: 32px; align-items: start; }
    .lead { font-size: 18px; line-height: 1.7; }
    .gallery { margin-bottom: 28px; }
    h2 { font-size: 20px; margin: 32px 0 12px; }
    .para { color: var(--text-muted); line-height: 1.75; margin-bottom: 10px; }
    .highlights { padding-left: 20px; color: var(--text-muted); }
    .highlights li { margin: 8px 0; }
    .highlights li::marker { color: var(--cyan); }
    .side { position: sticky; top: calc(var(--header-h) + 20px); display: flex; flex-direction: column; gap: 16px; }
    .side h3 { font-size: 15px; }
    .confidential { display: flex; gap: 10px; padding: 12px; border-radius: var(--radius); background: var(--warning-soft); color: var(--warning); font-size: 14px; }
    .links { display: flex; gap: 8px; flex-wrap: wrap; }
    .preview-banner { position: sticky; top: var(--header-h); z-index: 30; padding: 8px 16px; text-align: center; font-size: 13px;
      font-weight: 600; background: var(--warning-soft); color: var(--warning); border-bottom: 1px solid var(--warning); }
    .skel { display: flex; flex-direction: column; gap: 16px; margin-top: 28px; }
    .skel .layout { margin-top: 24px; }
    .state-404 { display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center; padding: 80px 0; }
    .state-404 .big { font-size: 96px; font-weight: 600; line-height: 1; }
    .state-404 h1 { font-size: 24px; margin: 0; }
    .arch { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; align-items: stretch; }
    .arch-node { display: flex; gap: 14px; align-items: flex-start; padding: 14px 16px; }
    .arch-node strong { font-size: 15px; }
    .arch-node p { font-size: 13.5px; color: var(--text-muted); margin-top: 2px; }
    .arch-index { font-size: 12px; color: var(--cyan); background: var(--cyan-soft); border-radius: 6px; padding: 2px 6px; }
    .arch-link { height: 22px; display: flex; justify-content: center; }
    .arch-link span { width: 2px; background: linear-gradient(var(--accent-strong), var(--cyan)); position: relative; }
    .arch-link span::after { content: ''; position: absolute; bottom: -2px; left: -4px; border: 5px solid transparent; border-top-color: var(--cyan); }
    @media (max-width: 860px) { .layout { grid-template-columns: minmax(0, 1fr); } .side { position: static; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetail {
  private readonly seo = inject(SeoService);
  private readonly analytics = inject(AnalyticsService);
  private readonly i18n = inject(I18nService);
  protected readonly api = inject(PublicApiService);
  readonly slug = input.required<string>();

  protected readonly project = signal<Project | null>(null);
  protected readonly notFound = signal(false);
  protected readonly avatarUrl = signal<string | null>(null);
  protected readonly ownerName = signal('');

  constructor() {
    effect(() => this.api.portfolio(this.i18n.lang()).subscribe((d) => {
      this.avatarUrl.set(d.profile.avatarUrl);
      this.ownerName.set(d.profile.fullName);
    }));
    effect(() => {
      const slug = this.slug();
      const lang = this.i18n.lang();
      this.project.set(null);
      this.notFound.set(false);
      this.api.project(slug, lang).subscribe({
        next: (p) => {
          this.project.set(p);
          this.seo.update({
            title: `${p.title} — ${this.ownerName() || 'Projet'}`,
            description: p.summary ?? p.tagline,
            path: `/projects/${p.slug}`,
            image: p.images?.[0]?.url,
            type: 'article',
          });
          this.seo.projectSchema(p, this.ownerName());
          this.analytics.projectView(p.slug);
        },
        error: () => this.notFound.set(true),
      });
    });
  }

  /** « Nom | description » → couche du schéma. */
  protected layers(lines: string[]): { name: string; detail: string }[] {
    return lines.map((line) => {
      const [name, ...rest] = line.split('|');
      return { name: name.trim(), detail: rest.join('|').trim() };
    });
  }

  protected paragraphs(text: string): string[] {
    return text.split(/\n\s*\n|\n/).map((p) => p.trim()).filter(Boolean);
  }
}

import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { Portfolio } from '../core/models';
import { PublicApiService } from '../core/public-api.service';
import { I18nService, TranslatePipe } from '../core/i18n';
import { Avatar } from '../shared/avatar';
import { Icon } from '../shared/icon';

/**
 * CV d'une page généré à partir du contenu du portfolio (toujours à jour),
 * mis en page au format A4 et imprimable / exportable en PDF par le navigateur.
 */
@Component({
  selector: 'app-cv-page',
  imports: [RouterLink, Icon, Avatar, TranslatePipe],
  template: `
    <div class="toolbar no-print">
      <a routerLink="/" class="btn btn-ghost btn-sm"><app-icon name="arrow-left" [size]="15" /> {{ 'cv.back' | t }}</a>
      <span class="text-sm text-faint">{{ 'cv.generated' | t }}</span>
      <button class="btn btn-primary btn-sm" type="button" (click)="print()"><app-icon name="download" [size]="15" /> {{ 'cv.print' | t }}</button>
    </div>

    @if (data(); as d) {
      <article id="main" class="sheet" aria-label="Curriculum vitae">
        <header class="head">
          <app-avatar [src]="d.profile.avatarUrl" [name]="d.profile.fullName" [size]="76" />
          <div class="min-w-0">
            <h1>{{ d.profile.fullName }}</h1>
            <p class="title">{{ d.profile.headline }}</p>
            <p class="contact">
              @if (d.profile.location) { <span>{{ d.profile.location }}</span> }
              @if (d.profile.email) { <span><a [href]="'mailto:' + d.profile.email">{{ d.profile.email }}</a></span> }
              @if (d.profile.phone) { <span>{{ d.profile.phone }}</span> }
              @if (d.profile.linkedinUrl) { <span><a [href]="d.profile.linkedinUrl">LinkedIn</a></span> }
              @if (d.profile.githubUrl) { <span><a [href]="d.profile.githubUrl">GitHub</a></span> }
            </p>
          </div>
        </header>

        @if (d.profile.summary) {
          <section><h2>{{ 'cv.profile' | t }}</h2><p>{{ d.profile.summary }}</p></section>
        }

        @if (d.skills.length) {
          <section>
            <h2>{{ 'cv.skills' | t }}</h2>
            <table class="skills">
              @for (g of d.skills; track g.id) {
                <tr><th>{{ g.name }}</th><td>{{ g.items.join(' · ') }}</td></tr>
              }
            </table>
          </section>
        }

        @if (d.experiences.length) {
          <section>
            <h2>{{ 'cv.experience' | t }}</h2>
            @for (e of d.experiences; track e.id) {
              <div class="entry">
                <div class="row">
                  <span><strong>{{ e.role }}</strong> · <span class="org">{{ e.company }}</span>@if (e.location) {, {{ e.location }}}</span>
                  <span class="date">{{ e.period }}</span>
                </div>
                @if (e.highlights.length) {
                  <ul>@for (h of e.highlights; track h) { <li>{{ h }}</li> }</ul>
                }
              </div>
            }
          </section>
        }

        @if (d.projects.length) {
          <section>
            <h2>{{ 'cv.projects' | t }}</h2>
            <ul class="projects">
              @for (p of d.projects; track p.id) {
                <li><strong>{{ p.title }}</strong>@if (p.context) { <span class="muted"> ({{ p.context }})</span> } — {{ p.tagline || p.summary }}
                  @if (p.stack.length) { <span class="stack">{{ p.stack.join(', ') }}</span> }
                </li>
              }
            </ul>
          </section>
        }

        <div class="cols">
          @if (d.education.length) {
            <section>
              <h2>{{ 'cv.education' | t }}</h2>
              @for (e of d.education; track e.id) {
                <div class="entry">
                  <div class="row"><strong>{{ e.degree }}</strong><span class="date">{{ e.period }}</span></div>
                  <p class="muted">{{ e.school }}@if (e.field) { · {{ e.field }}}@if (e.mention) { · {{ 'education.mention' | t }} {{ e.mention }}}</p>
                </div>
              }
            </section>
          }
          <section>
            @if (d.certifications.length) {
              <h2>{{ 'cv.certifications' | t }}</h2>
              @for (c of d.certifications; track c.id) { <p><strong>{{ c.issuer }}</strong> — {{ c.name }}</p> }
            }
            @if (d.languages.length) {
              <h2 class="mt">{{ 'cv.languages' | t }}</h2>
              <p>@for (l of d.languages; track l.id; let last = $last) {{{ l.name }} ({{ l.level }})@if (!last) { · }}</p>
            }
          </section>
        </div>
      </article>
    } @else {
      <div class="sheet"><div class="skeleton h-16 mb-4"></div><div class="skeleton h-96"></div></div>
    }
  `,
  styles: `
    :host { display: block; padding: 24px 16px 64px; }
    .toolbar { max-width: 210mm; margin: 0 auto 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .sheet { --ink: #1d1d1f; --navy: #1f3a68; --muted: #5b616b; --rule: #c3ccda;
      max-width: 210mm; min-height: 297mm; margin: 0 auto; padding: 14mm 15mm; background: #fff; color: var(--ink);
      font: 10pt/1.42 'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif; border-radius: 6px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35); }
    .sheet a { color: var(--navy); text-decoration: none; }
    .head { display: flex; gap: 16px; align-items: center; padding-bottom: 10px; border-bottom: 2px solid var(--navy); }
    h1 { font-size: 21pt; color: var(--navy); font-weight: 800; letter-spacing: -0.01em; }
    .title { font-weight: 600; font-size: 11pt; }
    .contact { color: var(--muted); font-size: 9pt; margin-top: 2px; }
    .contact span + span::before { content: '·'; margin: 0 6px; color: var(--rule); }
    section { margin-top: 9px; break-inside: avoid; }
    h2 { font-size: 10.5pt; text-transform: uppercase; letter-spacing: 0.08em; color: var(--navy); border-bottom: 1px solid var(--rule);
      padding-bottom: 1px; margin-bottom: 4px; }
    h2.mt { margin-top: 9px; }
    .skills { width: 100%; border-collapse: collapse; }
    .skills th { width: 26%; text-align: left; vertical-align: top; color: var(--navy); font-weight: 700; padding: 1px 8px 1px 0; }
    .skills td { padding: 1px 0; }
    .entry { margin-top: 5px; break-inside: avoid; }
    .row { display: flex; justify-content: space-between; gap: 12px; }
    .org { color: var(--navy); font-weight: 600; }
    .date { font-style: italic; color: var(--muted); white-space: nowrap; font-size: 9pt; }
    ul { margin: 2px 0 0; padding-left: 16px; }
    li { margin: 1px 0; }
    .projects li { margin-bottom: 3px; }
    .stack { display: block; color: var(--muted); font-size: 8.8pt; }
    .muted { color: var(--muted); }
    .cols { display: grid; grid-template-columns: 1.3fr 1fr; gap: 20px; }
    @media (max-width: 640px) { .sheet { padding: 20px; min-height: 0; } .cols { grid-template-columns: 1fr; } .head { flex-direction: column; align-items: flex-start; } }
    @media print {
      :host { padding: 0; }
      .no-print { display: none !important; }
      .sheet { box-shadow: none; border-radius: 0; padding: 0; min-height: 0; max-width: none; }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CvPage {
  protected readonly data = signal<Portfolio | null>(null);

  constructor() {
    const title = inject(Title);
    const api = inject(PublicApiService);
    const i18n = inject(I18nService);
    effect(() => api.portfolio(i18n.lang()).subscribe((d) => {
      this.data.set(d);
      title.setTitle(`CV — ${d.profile.fullName}`);
    }));
  }

  protected print(): void {
    window.print();
  }
}

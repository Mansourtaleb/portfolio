import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TranslatePipe } from '../core/i18n';
import { Icon } from '../shared/icon';
import { SiteHeader } from './site-header';

/** Page 404 : utilisée pour les adresses inconnues et les projets introuvables. */
@Component({
  selector: 'app-not-found',
  imports: [RouterLink, Icon, SiteHeader, TranslatePipe],
  template: `
    <app-site-header />
    <main id="main" class="container wrap">
      <p class="code mono gradient-text">404</p>
      <p class="mono prompt">&gt; page.introuvable()</p>
      <h1>{{ 'notFound.title' | t }}</h1>
      <p class="muted">{{ 'notFound.text' | t }}</p>
      <div class="actions">
        <a class="btn btn-primary" routerLink="/"><app-icon name="home" [size]="16" /> {{ 'notFound.home' | t }}</a>
        <a class="btn" routerLink="/" fragment="projects">{{ 'hero.projects' | t }}</a>
      </div>
    </main>
  `,
  styles: `
    .wrap { min-height: calc(100vh - var(--header-h)); display: flex; flex-direction: column; align-items: center;
      justify-content: center; text-align: center; gap: 12px; padding-bottom: 80px; }
    .code { font-size: clamp(96px, 18vw, 160px); font-weight: 600; line-height: 1; letter-spacing: -0.04em; }
    .prompt { color: var(--cyan); font-size: 14px; }
    h1 { font-size: clamp(22px, 3vw, 30px); font-weight: 700; }
    .actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 12px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFound {}

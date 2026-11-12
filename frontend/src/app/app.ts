import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { CommandPalette } from './public/command-palette';

import { AnalyticsService } from './core/analytics.service';
import { ThemeService } from './core/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommandPalette],
  template: `<a class="skip-link" href="#main" (click)="skip($event)">Aller au contenu principal</a>
    <router-outlet /><app-command-palette />`,
})
export class App {
  // Instancié dès le démarrage pour appliquer le thème avant le premier rendu.
  protected readonly theme = inject(ThemeService);

  constructor() {
    inject(AnalyticsService).start();
  }

  /** Lien d'évitement : place le focus sur le contenu principal (navigation au clavier / lecteur d'écran). */
  protected skip(event: Event): void {
    const main = document.getElementById('main');
    if (main) {
      event.preventDefault();
      main.setAttribute('tabindex', '-1');
      main.focus();
    }
  }
}

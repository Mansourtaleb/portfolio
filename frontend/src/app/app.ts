import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AnalyticsService } from './core/analytics.service';
import { ThemeService } from './core/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {
  // Instancié dès le démarrage pour appliquer le thème avant le premier rendu.
  protected readonly theme = inject(ThemeService);

  constructor() {
    inject(AnalyticsService).start();
  }
}

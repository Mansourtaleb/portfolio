import { CanDeactivateFn } from '@angular/router';

/** Écran d'édition qui peut contenir des modifications non enregistrées. */
export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const UNSAVED_MESSAGE = 'Des modifications ne sont pas enregistrées. Quitter quand même ?';

/** Demande confirmation avant de quitter un écran avec des modifications non enregistrées. */
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) =>
  !component?.hasUnsavedChanges?.() || confirm(UNSAVED_MESSAGE);

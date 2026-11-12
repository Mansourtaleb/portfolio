import { Routes } from '@angular/router';

import { adminGuard } from './core/auth';
import { unsavedChangesGuard } from './shared/unsaved-changes';
import { SECTIONS } from './admin/section-editor/sections';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./public/home/home').then((m) => m.Home) },
  {
    path: 'projects/:slug',
    loadComponent: () => import('./public/project-detail/project-detail').then((m) => m.ProjectDetail),
  },
  { path: 'admin/login', loadComponent: () => import('./admin/login/login').then((m) => m.Login), title: 'Connexion' },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      { path: '', loadComponent: () => import('./admin/dashboard/dashboard').then((m) => m.Dashboard), title: 'Admin' },
      {
        path: 'profil',
        loadComponent: () => import('./admin/section-editor/profile-editor').then((m) => m.ProfileEditor),
        canDeactivate: [unsavedChangesGuard],
        title: 'Profil',
      },
      ...SECTIONS.map((section) => ({
        path: section.route,
        loadComponent: () => import('./admin/section-editor/section-editor').then((m) => m.SectionEditor),
        data: { section: section.key },
        canDeactivate: [unsavedChangesGuard],
        title: section.title,
      })),
      {
        path: 'reglages',
        loadComponent: () => import('./admin/settings/settings-editor').then((m) => m.SettingsEditor),
        canDeactivate: [unsavedChangesGuard],
        title: 'Réglages',
      },
      {
        path: 'statistiques',
        loadComponent: () => import('./admin/analytics/analytics-page').then((m) => m.AnalyticsPage),
        title: 'Statistiques',
      },
      {
        path: 'messages',
        loadComponent: () => import('./admin/messages/messages').then((m) => m.Messages),
        title: 'Messages',
      },
      {
        path: 'assistant',
        loadComponent: () => import('./admin/assistant/assistant-admin').then((m) => m.AssistantAdmin),
        title: 'Assistant IA',
      },
      {
        path: 'compte',
        loadComponent: () => import('./admin/account/account').then((m) => m.Account),
        title: 'Mon compte',
      },
    ],
  },
  { path: '**', loadComponent: () => import('./public/not-found').then((m) => m.NotFound), title: 'Page introuvable' },
];

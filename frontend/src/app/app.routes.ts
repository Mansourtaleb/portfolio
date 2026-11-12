import { Routes } from '@angular/router';

import { adminGuard } from './core/auth';
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
        title: 'Profil',
      },
      ...SECTIONS.map((section) => ({
        path: section.route,
        loadComponent: () => import('./admin/section-editor/section-editor').then((m) => m.SectionEditor),
        data: { section: section.key },
        title: section.title,
      })),
      {
        path: 'reglages',
        loadComponent: () => import('./admin/settings/settings-editor').then((m) => m.SettingsEditor),
        title: 'Réglages',
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
  { path: '**', redirectTo: '' },
];

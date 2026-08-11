import { Routes } from '@angular/router'
import { authGuard } from './core/auth/auth.guard'
import { adminGuard } from './core/auth/admin.guard'
import { PortalShellComponent } from './layouts/portal-shell/portal-shell.component'

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then(module => module.LoginComponent),
  },
  {
    path: '',
    component: PortalShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/home/home.component').then(module => module.HomeComponent),
      },
      {
        path: 'available-financing',
        data: {
          title: 'Available Financing',
          description: 'Review approved facilities and available amounts.',
        },
        loadComponent: () =>
          import('./features/placeholder/placeholder-page.component')
            .then(module => module.PlaceholderPageComponent),
      },
      {
        path: 'financing-activity',
        data: {
          title: 'Financing Activity',
          description: 'Track active, completed and overdue financing records.',
        },
        loadComponent: () =>
          import('./features/placeholder/placeholder-page.component')
            .then(module => module.PlaceholderPageComponent),
      },
      {
        path: 'invoices',
        data: {
          title: 'Invoices & Documents',
          description: 'Review invoices and documents linked to the account.',
        },
        loadComponent: () =>
          import('./features/placeholder/placeholder-page.component')
            .then(module => module.PlaceholderPageComponent),
      },
      {
        path: 'manage-users',
        canActivate: [adminGuard],
        data: {
          title: 'Manage Users',
          description: 'Invite and manage people who can access this portal.',
        },
        loadComponent: () =>
          import('./features/placeholder/placeholder-page.component')
            .then(module => module.PlaceholderPageComponent),
      },
      {
        path: 'support',
        data: {
          title: 'Support',
          description: 'Get help with the account, financing or documents.',
        },
        loadComponent: () =>
          import('./features/placeholder/placeholder-page.component')
            .then(module => module.PlaceholderPageComponent),
      },
      {
        path: 'profile',
        data: {
          title: 'Profile',
          description: 'View account details and linked business information.',
        },
        loadComponent: () =>
          import('./features/placeholder/placeholder-page.component')
            .then(module => module.PlaceholderPageComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
]

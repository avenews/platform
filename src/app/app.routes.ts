import { Routes } from '@angular/router'
import { adminGuard } from './core/auth/admin.guard'
import { authGuard } from './core/auth/auth.guard'
import { ExperienceShellComponent } from './layouts/experience-shell/experience-shell.component'
import { PortalShellComponent } from './layouts/portal-shell/portal-shell.component'

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then(module => module.LoginComponent),
  },
  {
    path: 'access',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/access-chooser/access-chooser.component')
        .then(module => module.AccessChooserComponent),
  },
  {
    path: 'experience/:experienceId',
    component: ExperienceShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      {
        path: 'home',
        loadComponent: () =>
          import('./features/contextual-home/contextual-home.component')
            .then(module => module.ContextualHomeComponent),
      },
      {
        path: 'financing/period/:periodId',
        loadComponent: () =>
          import('./features/invoice-period/invoice-period.component')
            .then(module => module.InvoicePeriodComponent),
      },
      {
        path: 'financing',
        loadComponent: () =>
          import('./features/contextual-financing/contextual-financing.component')
            .then(module => module.ContextualFinancingComponent),
      },
      {
        path: 'invoice-uploads',
        data: { section: 'invoice-uploads' },
        loadComponent: () =>
          import('./features/partner-workspace/partner-workspace.component')
            .then(module => module.PartnerWorkspaceComponent),
      },
      {
        path: 'obligations',
        data: { section: 'obligations' },
        loadComponent: () =>
          import('./features/partner-workspace/partner-workspace.component')
            .then(module => module.PartnerWorkspaceComponent),
      },
      {
        path: 'suppliers',
        data: { section: 'suppliers' },
        loadComponent: () =>
          import('./features/partner-workspace/partner-workspace.component')
            .then(module => module.PartnerWorkspaceComponent),
      },
      {
        path: 'support',
        loadComponent: () =>
          import('./features/support/support.component').then(module => module.SupportComponent),
      },
      {
        path: 'manage-users',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/manage-users/manage-users.component')
            .then(module => module.ManageUsersComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then(module => module.ProfileComponent),
      },
    ],
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
        loadComponent: () =>
          import('./features/available-financing/available-financing.component')
            .then(module => module.AvailableFinancingComponent),
      },
      {
        path: 'available-financing/:id',
        loadComponent: () =>
          import('./features/available-financing/available-financing-detail.component')
            .then(module => module.AvailableFinancingDetailComponent),
      },
      {
        path: 'financing-activity',
        loadComponent: () =>
          import('./features/financing-activity/financing-activity.component')
            .then(module => module.FinancingActivityComponent),
      },
      {
        path: 'invoices',
        loadComponent: () =>
          import('./features/invoices/invoices.component').then(module => module.InvoicesComponent),
      },
      {
        path: 'manage-users',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/manage-users/manage-users.component')
            .then(module => module.ManageUsersComponent),
      },
      {
        path: 'design-lab',
        loadComponent: () =>
          import('./features/design-lab/design-lab.component')
            .then(module => module.DesignLabComponent),
      },
      {
        path: 'changelog',
        loadComponent: () =>
          import('./features/changelog/changelog.component')
            .then(module => module.ChangelogComponent),
      },
      {
        path: 'support',
        loadComponent: () =>
          import('./features/support/support.component').then(module => module.SupportComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then(module => module.ProfileComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
]

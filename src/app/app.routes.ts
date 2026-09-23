import { Routes } from '@angular/router'
import { adminGuard } from './core/auth/admin.guard'
import { authGuard } from './core/auth/auth.guard'
import { ExperienceShellComponent } from './layouts/experience-shell/experience-shell.component'
import { PortalShellComponent } from './layouts/portal-shell/portal-shell.component'

// The entry component opts in only Invoice Financing and Partner Buyer screens.
// All other experiences render their original, unchanged page components.
const experienceReviewPage = () => import('./features/invoice-review/experience-review-entry.component')
  .then(module => module.ExperienceReviewEntryComponent)

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
      { path: 'home', data: { reviewSection: 'home' }, loadComponent: experienceReviewPage },
      { path: 'request-funds', data: { reviewSection: 'request-funds' }, loadComponent: experienceReviewPage },
      { path: 'invoices', data: { reviewSection: 'invoices' }, loadComponent: experienceReviewPage },
      { path: 'financing/period/:periodId', data: { reviewSection: 'period' }, loadComponent: experienceReviewPage },
      { path: 'financing', data: { reviewSection: 'financing' }, loadComponent: experienceReviewPage },
      { path: 'invoice-uploads', data: { section: 'invoice-uploads', reviewSection: 'invoice-uploads' }, loadComponent: experienceReviewPage },
      { path: 'obligations', data: { section: 'obligations', reviewSection: 'obligations' }, loadComponent: experienceReviewPage },
      { path: 'suppliers', data: { section: 'suppliers', reviewSection: 'suppliers' }, loadComponent: experienceReviewPage },
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
  // Stefan's review environment enters through the contextual product chooser.
  // Signed-out users are redirected from /access to /login by authGuard.
  { path: '', pathMatch: 'full', redirectTo: 'access' },
  {
    path: '',
    component: PortalShellComponent,
    canActivate: [authGuard],
    children: [
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
          import('./features/manage-users/manage-users.component').then(module => module.ManageUsersComponent),
      },
      {
        path: 'design-lab',
        loadComponent: () =>
          import('./features/design-lab/design-lab.component').then(module => module.DesignLabComponent),
      },
      {
        path: 'changelog',
        loadComponent: () =>
          import('./features/changelog/changelog.component').then(module => module.ChangelogComponent),
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

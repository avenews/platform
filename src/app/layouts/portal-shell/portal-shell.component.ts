import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router'
import { AuthService } from '../../core/auth/auth.service'

interface NavItem {
  path: string
  label: string
  icon: string
  exact: boolean
  adminOnly?: boolean
}

@Component({
  selector: 'app-portal-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './portal-shell.component.html',
  styleUrl: './portal-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalShellComponent {
  private readonly auth = inject(AuthService)
  private readonly router = inject(Router)

  readonly session = this.auth.getSession()
  menuOpen = false

  readonly navItems: NavItem[] = [
    { path: '/', label: 'Home', icon: '⌂', exact: true },
    { path: '/available-financing', label: 'Available Financing', icon: '◫', exact: false },
    { path: '/financing-activity', label: 'Financing Activity', icon: '↗', exact: false },
    { path: '/invoices', label: 'Invoices & Documents', icon: '▤', exact: false },
    { path: '/manage-users', label: 'Manage Users', icon: '◎', exact: false, adminOnly: true },
    { path: '/support', label: 'Support', icon: '?', exact: false },
  ]

  get visibleNavItems(): NavItem[] {
    return this.navItems.filter(item => !item.adminOnly || this.session?.role === 'admin')
  }

  get initials(): string {
    if (!this.session) return 'AV'
    return `${this.session.contactFirstName[0]}${this.session.contactLastName[0]}`
  }

  get fullName(): string {
    if (!this.session) return ''
    return `${this.session.contactFirstName} ${this.session.contactLastName}`
  }

  logout(): void {
    this.auth.logout()
    void this.router.navigate(['/login'])
  }
}

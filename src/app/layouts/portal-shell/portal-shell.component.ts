import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core'
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router'
import { AvAvatarComponent, AvIconComponent } from '@avenews/design-system/angular'
import { AuthService } from '../../core/auth/auth.service'
import { PortalNavIconComponent, type PortalNavIconName } from './portal-nav-icon.component'

interface NavItem {
  path: string
  label: string
  icon: PortalNavIconName
  exact: boolean
}

/**
 * Customer navigation is a baseline contract, not a place for approximate
 * icon substitutions. It mirrors apps/customer-portal/src/components/PortalShell.tsx.
 */
const CUSTOMER_DESKTOP_NAV_ITEMS: ReadonlyArray<NavItem> = [
  { path: '/', label: 'Home', icon: 'home', exact: true },
  { path: '/available-financing', label: 'Available Financing', icon: 'wallet', exact: false },
  { path: '/financing-activity', label: 'Financing Activity', icon: 'bar-chart', exact: false },
  { path: '/invoices', label: 'Invoices & Documents', icon: 'receipt', exact: false },
  { path: '/support', label: 'Support', icon: 'help-circle', exact: false },
]

const CUSTOMER_MOBILE_NAV_ITEMS: ReadonlyArray<NavItem> = [
  { path: '/', label: 'Home', icon: 'home', exact: true },
  { path: '/available-financing', label: 'Available Financing', icon: 'wallet', exact: false },
  { path: '/financing-activity', label: 'Financing Activity', icon: 'bar-chart', exact: false },
  { path: '/invoices', label: 'Invoices & Documents', icon: 'receipt', exact: false },
]

const CUSTOMER_ADMIN_NAV_ITEM: NavItem = {
  path: '/manage-users',
  label: 'Manage Users',
  icon: 'person',
  exact: false,
}

@Component({
  selector: 'app-portal-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AvAvatarComponent, AvIconComponent, PortalNavIconComponent],
  templateUrl: './portal-shell.component.html',
  styleUrl: './portal-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalShellComponent {
  private readonly auth = inject(AuthService)
  private readonly router = inject(Router)

  readonly session = this.auth.getSession()
  readonly primaryNavItems = CUSTOMER_DESKTOP_NAV_ITEMS
  readonly mobileNavItems = CUSTOMER_MOBILE_NAV_ITEMS
  readonly adminNavItem = CUSTOMER_ADMIN_NAV_ITEM
  menuOpen = false

  get initials(): string {
    if (!this.session) return 'AV'
    return `${this.session.contactFirstName[0]}${this.session.contactLastName[0]}`
  }

  get fullName(): string {
    if (!this.session) return ''
    return `${this.session.contactFirstName} ${this.session.contactLastName}`
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen
  }

  closeMenu(): void {
    this.menuOpen = false
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu()
  }

  logout(): void {
    this.auth.logout()
    this.closeMenu()
    void this.router.navigate(['/login'])
  }
}

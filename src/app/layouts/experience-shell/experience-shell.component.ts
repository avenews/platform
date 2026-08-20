import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  inject,
} from '@angular/core'
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router'
import { AvAvatarComponent, AvIconComponent } from '@avenews/design-system/angular'
import { Subject, takeUntil } from 'rxjs'
import { AuthService } from '../../core/auth/auth.service'
import {
  EXPERIENCES,
  experienceById,
  isExperienceScenario,
  type ExperienceId,
  type PortalExperience,
} from '../../core/experience/contextual-experience.data'
import { ACL_FUNDS_REQUEST_DEMO_URL } from '../../core/experience/experience-links'
import { PortalExperienceService } from '../../core/experience/portal-experience.service'
import { PrototypeExplainerComponent } from '../../shared/prototype-explainer.component'
import { PrototypeExplainerService } from '../../shared/prototype-explainer.service'
import {
  PortalNavIconComponent,
  type PortalNavIconName,
} from '../portal-shell/portal-nav-icon.component'

interface ExperienceNavItem {
  segment: string
  label: string
  icon: PortalNavIconName
  exact: boolean
  externalUrl?: string
}

const AGRI_CREDIT_LINE_NAV: readonly ExperienceNavItem[] = [
  { segment: 'home', label: 'Home', icon: 'home', exact: true },
  {
    segment: 'request-funds',
    label: 'Request Funds',
    icon: 'wallet',
    exact: false,
    externalUrl: ACL_FUNDS_REQUEST_DEMO_URL,
  },
]

const ABF_NAV: readonly ExperienceNavItem[] = [
  { segment: 'home', label: 'Home', icon: 'home', exact: true },
  { segment: 'financing', label: 'Suppliers', icon: 'building', exact: false },
]

const STF_NAV: readonly ExperienceNavItem[] = [
  { segment: 'home', label: 'Home', icon: 'home', exact: true },
  { segment: 'financing', label: 'Partner Suppliers', icon: 'building', exact: false },
]

const INVOICE_FINANCING_NAV: readonly ExperienceNavItem[] = [
  { segment: 'home', label: 'Home', icon: 'home', exact: true },
  { segment: 'financing', label: 'Buyers', icon: 'building', exact: false },
]

const INFX_NAV: readonly ExperienceNavItem[] = [
  { segment: 'home', label: 'Home', icon: 'home', exact: true },
  { segment: 'financing', label: 'Buyers', icon: 'building', exact: false },
]

const PARTNER_NAV: readonly ExperienceNavItem[] = [
  { segment: 'home', label: 'Home', icon: 'home', exact: true },
  { segment: 'invoice-uploads', label: 'Invoice Uploads', icon: 'receipt', exact: false },
  { segment: 'obligations', label: 'Payments', icon: 'wallet', exact: false },
  { segment: 'suppliers', label: 'Suppliers', icon: 'building', exact: false },
]

const MANAGE_USERS_NAV: ExperienceNavItem = {
  segment: 'manage-users',
  label: 'Manage Users',
  icon: 'person',
  exact: false,
}

@Component({
  selector: 'app-experience-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    AvAvatarComponent,
    AvIconComponent,
    PortalNavIconComponent,
    PrototypeExplainerComponent,
  ],
  templateUrl: './experience-shell.component.html',
  styleUrl: './experience-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceShellComponent implements OnDestroy {
  private readonly auth = inject(AuthService)
  private readonly experienceService = inject(PortalExperienceService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly cdr = inject(ChangeDetectorRef)
  private readonly destroyed$ = new Subject<void>()

  readonly explainers = inject(PrototypeExplainerService)
  readonly session = this.auth.getSession()
  readonly allExperiences = EXPERIENCES
  currentExperience: PortalExperience
  profileOpen = false
  contextOpen = false
  developerOpen = false

  constructor() {
    const requestedScenario = this.route.snapshot.queryParamMap.get('scenario')
    if (isExperienceScenario(requestedScenario)) this.experienceService.setScenario(requestedScenario)

    const available = this.experienceService.availableExperiences()
    const requested = experienceById(this.route.snapshot.paramMap.get('experienceId'))
    const fallback = available[0] ?? EXPERIENCES[0]
    this.currentExperience = requested && available.some(item => item.id === requested.id)
      ? requested
      : fallback

    if (!requested || !available.some(item => item.id === requested.id)) {
      void this.router.navigate(['/access'])
    } else {
      this.experienceService.selectExperience(requested.id)
    }

    this.route.paramMap
      .pipe(takeUntil(this.destroyed$))
      .subscribe(params => {
        const experience = experienceById(params.get('experienceId'))
        const allowed = experience && this.experienceService.availableExperiences().some(item => item.id === experience.id)
        if (!experience || !allowed) {
          void this.router.navigate(['/access'])
          return
        }
        this.currentExperience = experience
        this.experienceService.selectExperience(experience.id)
        this.closeOverlays()
        this.cdr.markForCheck()
      })
  }

  get availableExperiences(): readonly PortalExperience[] {
    return this.experienceService.availableExperiences()
  }

  get primaryNavItems(): readonly ExperienceNavItem[] {
    let base: readonly ExperienceNavItem[]
    if (this.currentExperience.kind === 'partner') {
      base = PARTNER_NAV
    } else {
      switch (this.currentExperience.id) {
        case 'acl':
          base = AGRI_CREDIT_LINE_NAV
          break
        case 'abf':
          base = ABF_NAV
          break
        case 'stf':
          base = STF_NAV
          break
        case 'invoice-financing':
          base = INVOICE_FINANCING_NAV
          break
        case 'infx':
          base = INFX_NAV
          break
        default:
          base = [{ segment: 'home', label: 'Home', icon: 'home', exact: true }]
      }
    }

    return this.session?.role === 'admin' ? [...base, MANAGE_USERS_NAV] : base
  }

  get mobileNavItems(): readonly ExperienceNavItem[] {
    return this.primaryNavItems
  }

  get initials(): string {
    if (!this.session) return 'AV'
    return `${this.session.contactFirstName[0]}${this.session.contactLastName[0]}`
  }

  get fullName(): string {
    if (!this.session) return ''
    return `${this.session.contactFirstName} ${this.session.contactLastName}`
  }

  displayProductName(experience: PortalExperience): string {
    const labels: Partial<Record<ExperienceId, string>> = {
      acl: 'Agri Credit Line',
      abf: 'Agri Buyer Financing',
      stf: 'Stockist Financing',
      infx: 'Invoice Financing Express',
    }
    return labels[experience.id] ?? experience.switcherLabel
  }

  routeFor(segment: string, experienceId = this.currentExperience.id): string[] {
    return ['/experience', experienceId, segment]
  }

  switchExperience(id: ExperienceId): void {
    const experience = this.experienceService.selectExperience(id)
    if (!experience) return
    this.closeOverlays()
    void this.router.navigate(this.routeFor('home', id))
  }

  openDeveloperExperience(id: ExperienceId): void {
    this.experienceService.setScenario('multiple')
    this.experienceService.selectExperience(id)
    this.closeOverlays()
    void this.router.navigate(this.routeFor('home', id))
  }

  openChooser(): void {
    this.closeOverlays()
    void this.router.navigate(['/access'], { queryParams: { scenario: 'multiple' } })
  }

  toggleProfile(): void {
    this.contextOpen = false
    this.developerOpen = false
    this.profileOpen = !this.profileOpen
  }

  toggleContext(): void {
    if (this.availableExperiences.length <= 1) return
    this.profileOpen = false
    this.developerOpen = false
    this.contextOpen = !this.contextOpen
  }

  toggleDeveloper(): void {
    this.profileOpen = false
    this.contextOpen = false
    this.developerOpen = !this.developerOpen
  }

  toggleExplainers(): void {
    this.explainers.toggle()
  }

  closeOverlays(): void {
    this.profileOpen = false
    this.contextOpen = false
    this.developerOpen = false
  }

  openExternal(url: string, event: Event): void {
    event.preventDefault()
    const opened = window.open(url, '_blank', 'noopener,noreferrer')
    if (opened) opened.opener = null
  }

  logout(): void {
    this.experienceService.clear()
    this.auth.logout()
    this.closeOverlays()
    void this.router.navigate(['/login'])
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeOverlays()
  }

  ngOnDestroy(): void {
    this.destroyed$.next()
    this.destroyed$.complete()
  }
}
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnInit,
  inject,
} from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { AvIconComponent } from '@avenews/design-system/angular'
import { AuthService } from '../../core/auth/auth.service'
import { customerWorkspaceById } from '../../core/experience/customer-product-workspace.data'
import {
  isExperienceScenario,
  type ExperienceId,
  type PortalExperience,
} from '../../core/experience/contextual-experience.data'
import { PortalExperienceService } from '../../core/experience/portal-experience.service'
import { formatKes } from '../../shared/customer-portal.data'
import { PrototypeExplainerComponent } from '../../shared/prototype-explainer.component'
import { PrototypeExplainerService } from '../../shared/prototype-explainer.service'

interface AccessSummary {
  label: string
  value: string
}

const ACCESS_VISITED_KEY = 'av_customer_portal_access_visited'

@Component({
  selector: 'app-access-chooser',
  standalone: true,
  imports: [PrototypeExplainerComponent, AvIconComponent],
  templateUrl: './access-chooser.component.html',
  styleUrl: './access-chooser.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessChooserComponent implements OnInit {
  private readonly auth = inject(AuthService)
  private readonly experiences = inject(PortalExperienceService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly cdr = inject(ChangeDetectorRef)

  readonly explainers = inject(PrototypeExplainerService)
  welcomeMessage = ''
  destinations: readonly PortalExperience[] = []
  developerOpen = false

  get customerDestinations(): readonly PortalExperience[] {
    return this.destinations.filter(item => item.kind === 'customer')
  }

  get partnerDestinations(): readonly PortalExperience[] {
    return this.destinations.filter(item => item.kind === 'partner')
  }

  ngOnInit(): void {
    const requestedScenario = this.route.snapshot.queryParamMap.get('scenario')
    if (isExperienceScenario(requestedScenario)) this.experiences.setScenario(requestedScenario)

    this.welcomeMessage = this.buildWelcomeMessage()

    // The product selection screen is the prototype landing surface after login,
    // even when the current review scenario contains only one destination.
    this.destinations = this.experiences.availableExperiences()
    this.cdr.markForCheck()
  }

  displayProductName(destination: PortalExperience): string {
    const labels: Partial<Record<ExperienceId, string>> = {
      acl: 'Agri Credit Line',
      abf: 'Agri Buyer Financing',
      stf: 'Stockist Financing',
      infx: 'Invoice Financing Express',
    }
    return labels[destination.id] ?? destination.productName
  }

  availabilitySummary(destination: PortalExperience): AccessSummary | null {
    const workspace = customerWorkspaceById(destination.id)
    if (!workspace) return null
    return {
      label: 'Available Financing',
      value: formatKes(workspace.availableMetricValue),
    }
  }

  outstandingSummary(destination: PortalExperience): AccessSummary | null {
    const workspace = customerWorkspaceById(destination.id)
    if (!workspace) return null
    return {
      label: 'Outstanding Amount',
      value: formatKes(workspace.outstandingMetricValue),
    }
  }

  openDestination(id: ExperienceId): void {
    const destination = this.experiences.selectExperience(id)
    if (!destination) return
    this.developerOpen = false
    void this.router.navigate(this.experiences.routeFor(id, 'home'))
  }

  toggleDeveloper(): void {
    this.developerOpen = !this.developerOpen
  }

  toggleExplainers(): void {
    this.explainers.toggle()
  }

  logout(): void {
    this.developerOpen = false
    this.experiences.clear()
    this.auth.logout()
    void this.router.navigate(['/login'])
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.developerOpen = false
  }

  private buildWelcomeMessage(): string {
    const firstName = this.auth.getSession()?.contactFirstName?.trim()
    const hasVisited = typeof window !== 'undefined' && localStorage.getItem(ACCESS_VISITED_KEY) === '1'
    if (typeof window !== 'undefined') localStorage.setItem(ACCESS_VISITED_KEY, '1')
    const greeting = hasVisited ? 'Welcome back' : 'Welcome'
    return firstName ? `${greeting}, ${firstName}.` : `${greeting}.`
  }
}

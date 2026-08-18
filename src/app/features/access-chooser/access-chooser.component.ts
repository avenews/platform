import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnInit,
  inject,
} from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { AuthService } from '../../core/auth/auth.service'
import {
  isExperienceScenario,
  type ExperienceId,
  type PortalExperience,
} from '../../core/experience/contextual-experience.data'
import { PortalExperienceService } from '../../core/experience/portal-experience.service'
import { PrototypeExplainerComponent } from '../../shared/prototype-explainer.component'
import { PrototypeExplainerService } from '../../shared/prototype-explainer.service'

interface AccessSummary {
  label: string
  value: string
}

const WELCOME_MESSAGES = [
  'Welcome back',
  'Good to see you again',
  'Ready when you are',
  'Welcome to Avenews',
  "Let's get started",
] as const

@Component({
  selector: 'app-access-chooser',
  standalone: true,
  imports: [PrototypeExplainerComponent],
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
  readonly welcomeMessage = WELCOME_MESSAGES[new Date().getMinutes() % WELCOME_MESSAGES.length]
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

    this.destinations = this.experiences.availableExperiences()

    // The selector is only useful when there is a real choice. If exactly one
    // product or workspace is available, continue directly into that experience.
    if (this.destinations.length === 1) {
      this.openDestination(this.destinations[0].id)
      return
    }

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
    const metric = destination.metrics.find(item => /available/i.test(item.label))
    return metric ? { label: metric.label, value: metric.value } : null
  }

  outstandingSummary(destination: PortalExperience): AccessSummary | null {
    const metric = destination.metrics.find(item => /outstanding/i.test(item.label))
    if (metric) {
      return {
        label: destination.id === 'acl' ? 'Outstanding Amount' : metric.label,
        value: metric.value,
      }
    }

    const record = destination.records.find(item => item.amountLabel.toLowerCase() === 'outstanding')
    return record ? { label: 'Outstanding Amount', value: record.amount } : null
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
}

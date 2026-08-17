import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { AuthService } from '../../core/auth/auth.service'
import {
  isExperienceScenario,
  type ExperienceId,
  type PortalExperience,
} from '../../core/experience/contextual-experience.data'
import { PortalExperienceService } from '../../core/experience/portal-experience.service'

@Component({
  selector: 'app-access-chooser',
  standalone: true,
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

  readonly session = this.auth.getSession()
  destinations: readonly PortalExperience[] = []

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
    if (this.destinations.length === 1) {
      this.openDestination(this.destinations[0].id)
      return
    }
    this.cdr.markForCheck()
  }

  openDestination(id: ExperienceId): void {
    const destination = this.experiences.selectExperience(id)
    if (!destination) return
    void this.router.navigate(this.experiences.routeFor(id, 'home'))
  }

  logout(): void {
    this.experiences.clear()
    this.auth.logout()
    void this.router.navigate(['/login'])
  }
}

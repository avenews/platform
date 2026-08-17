import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  inject,
} from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { Subject, takeUntil } from 'rxjs'
import {
  experienceById,
  type ExperienceActionKind,
  type PortalExperience,
} from '../../core/experience/contextual-experience.data'
import { PortalExperienceService } from '../../core/experience/portal-experience.service'

@Component({
  selector: 'app-contextual-home',
  standalone: true,
  templateUrl: './contextual-home.component.html',
  styleUrl: './contextual-home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContextualHomeComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly experienceService = inject(PortalExperienceService)
  private readonly cdr = inject(ChangeDetectorRef)
  private readonly destroyed$ = new Subject<void>()

  experience: PortalExperience = this.resolveExperience()

  constructor() {
    this.route.parent?.paramMap
      .pipe(takeUntil(this.destroyed$))
      .subscribe(params => {
        this.experience = experienceById(params.get('experienceId')) ?? experienceById('acl')!
        this.cdr.markForCheck()
      })
  }

  private resolveExperience(): PortalExperience {
    const id = this.route.parent?.snapshot.paramMap.get('experienceId')
    return experienceById(id) ?? experienceById('acl')!
  }

  takeAction(kind: ExperienceActionKind): void {
    if (kind === 'upload-invoices' || kind === 'view-invoice-uploads') {
      void this.router.navigate(this.experienceService.routeFor(this.experience.id, 'invoice-uploads'))
      return
    }
    if (kind === 'view-obligations') {
      void this.router.navigate(this.experienceService.routeFor(this.experience.id, 'obligations'))
      return
    }
    if (this.experience.kind === 'partner') {
      void this.router.navigate(this.experienceService.routeFor(this.experience.id, 'invoice-uploads'))
      return
    }
    void this.router.navigate(this.experienceService.routeFor(this.experience.id, 'financing'))
  }

  ngOnDestroy(): void {
    this.destroyed$.next()
    this.destroyed$.complete()
  }
}

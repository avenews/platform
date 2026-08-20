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
  customerWorkspaceById,
  periodsForRelationship,
  type CustomerFinancingPeriod,
  type CustomerRelationship,
  type CustomerWorkspace,
} from '../../core/experience/customer-product-workspace.data'
import {
  experienceById,
  type PortalExperience,
} from '../../core/experience/contextual-experience.data'
import { CustomerFinancingPeriodModalComponent } from '../../shared/customer-financing-period-modal.component'
import { formatDate, formatKes } from '../../shared/customer-portal.data'
import { PrototypeExplainerComponent } from '../../shared/prototype-explainer.component'

@Component({
  selector: 'app-contextual-financing',
  standalone: true,
  imports: [PrototypeExplainerComponent, CustomerFinancingPeriodModalComponent],
  templateUrl: './contextual-financing.component.html',
  styleUrl: './contextual-financing.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContextualFinancingComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly cdr = inject(ChangeDetectorRef)
  private readonly destroyed$ = new Subject<void>()

  experience: PortalExperience = this.resolveExperience()
  workspace: CustomerWorkspace | undefined = customerWorkspaceById(this.experience.id)
  selectedRelationship: CustomerRelationship | null = null
  selectedPeriod: CustomerFinancingPeriod | null = null
  returnRelationship: CustomerRelationship | null = null
  toast = ''

  readonly formatDate = formatDate
  readonly formatKes = formatKes

  constructor() {
    this.route.parent?.paramMap
      .pipe(takeUntil(this.destroyed$))
      .subscribe(params => {
        this.experience = experienceById(params.get('experienceId')) ?? experienceById('acl')!
        this.workspace = customerWorkspaceById(this.experience.id)
        this.closeOverlays()
        if (this.experience.id === 'acl') {
          void this.router.navigate(['/experience', 'acl', 'home'], { replaceUrl: true })
          return
        }
        this.cdr.markForCheck()
      })
  }

  private resolveExperience(): PortalExperience {
    const id = this.route.parent?.snapshot.paramMap.get('experienceId')
    return experienceById(id) ?? experienceById('acl')!
  }

  relationshipAvailabilityLabel(relationship: CustomerRelationship): string {
    return relationship.available > 0 ? 'Available' : 'Unavailable'
  }

  relationshipAvailabilityTone(relationship: CustomerRelationship): string {
    return relationship.available > 0 ? 'status-success' : 'status-neutral'
  }

  openRelationship(relationship: CustomerRelationship): void {
    this.selectedRelationship = relationship
    this.selectedPeriod = null
    this.returnRelationship = null
  }

  closeRelationship(): void {
    this.selectedRelationship = null
  }

  relationshipPeriods(relationship: CustomerRelationship): readonly CustomerFinancingPeriod[] {
    return this.workspace ? periodsForRelationship(this.workspace, relationship) : []
  }

  openPeriod(period: CustomerFinancingPeriod): void {
    this.returnRelationship = this.selectedRelationship
    this.selectedRelationship = null
    this.selectedPeriod = period
  }

  closePeriod(): void {
    this.selectedPeriod = null
    if (this.returnRelationship) {
      this.selectedRelationship = this.returnRelationship
      this.returnRelationship = null
    }
  }

  startFundsRequest(relationship: CustomerRelationship, event?: Event): void {
    event?.stopPropagation()
    if (!relationship.fundsRequestEnabled || relationship.available <= 0) return

    if (relationship.fundsRequestUrl) {
      const opened = window.open(relationship.fundsRequestUrl, '_blank', 'noopener,noreferrer')
      if (opened) {
        opened.opener = null
        return
      }
      this.toast = 'Your browser blocked the Funds Request tab. Allow pop-ups and try again.'
      this.cdr.markForCheck()
      return
    }

    this.toast = `Funds Request started for ${relationship.name}. This review prototype keeps the request scoped to the selected ${relationship.relationshipType}.`
    this.cdr.markForCheck()
  }

  requestFundsForPeriod(period: CustomerFinancingPeriod, event?: Event): void {
    event?.stopPropagation()
    this.toast = `Funds Request starts from ${period.reference} and remains limited by that Dynamic Period's Available to Withdraw.`
    this.cdr.markForCheck()
  }

  closeOverlays(): void {
    this.selectedRelationship = null
    this.selectedPeriod = null
    this.returnRelationship = null
  }

  ngOnDestroy(): void {
    this.destroyed$.next()
    this.destroyed$.complete()
  }
}

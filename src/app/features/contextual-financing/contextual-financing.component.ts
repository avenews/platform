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
  invoiceUploadRelationship: CustomerRelationship | null = null
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

  invoiceUploadSourceLabel(relationship: CustomerRelationship): string {
    return relationship.invoiceUploadOwner === 'client' ? 'You upload' : 'Buyer uploads'
  }

  canUploadInvoices(relationship: CustomerRelationship): boolean {
    return this.workspace?.id === 'invoice-financing' && relationship.invoiceUploadOwner === 'client'
  }

  openRelationship(relationship: CustomerRelationship): void {
    this.selectedRelationship = relationship
    this.selectedPeriod = null
    this.invoiceUploadRelationship = null
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
    this.restoreRelationship()
  }

  canRequestFromPeriod(period: CustomerFinancingPeriod): boolean {
    return this.workspace?.id === 'invoice-financing'
      && (period.availableToWithdraw ?? 0) > 0
      && (period.statusKey === 'live' || period.statusKey === 'requested')
  }

  periodRequestLabel(period: CustomerFinancingPeriod): string {
    return period.amountFinanced > 0 || period.statusKey === 'requested' ? 'Request more' : 'Request funds'
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

    this.toast = `Funds Request started for ${relationship.name}.`
    this.cdr.markForCheck()
  }

  requestFundsForPeriod(period: CustomerFinancingPeriod, event?: Event): void {
    event?.stopPropagation()
    if (!this.canRequestFromPeriod(period)) return
    this.toast = `${this.periodRequestLabel(period)} from ${period.reference}. Available to Withdraw: ${formatKes(period.availableToWithdraw ?? 0)}.`
    this.cdr.markForCheck()
  }

  startInvoiceUpload(relationship: CustomerRelationship, event?: Event): void {
    event?.stopPropagation()
    if (!this.canUploadInvoices(relationship)) return
    this.returnRelationship = this.selectedRelationship
    this.selectedRelationship = null
    this.invoiceUploadRelationship = relationship
  }

  closeInvoiceUpload(): void {
    this.invoiceUploadRelationship = null
    this.restoreRelationship()
  }

  completeInvoiceUpload(): void {
    const relationship = this.invoiceUploadRelationship
    if (!relationship) return
    this.invoiceUploadRelationship = null
    this.toast = `Invoice received for ${relationship.name}. Once eligible, it will appear in the matching Dynamic Period.`
    this.restoreRelationship()
    this.cdr.markForCheck()
  }

  closeOverlays(): void {
    this.selectedRelationship = null
    this.selectedPeriod = null
    this.invoiceUploadRelationship = null
    this.returnRelationship = null
  }

  private restoreRelationship(): void {
    if (!this.returnRelationship) return
    this.selectedRelationship = this.returnRelationship
    this.returnRelationship = null
  }

  ngOnDestroy(): void {
    this.destroyed$.next()
    this.destroyed$.complete()
  }
}

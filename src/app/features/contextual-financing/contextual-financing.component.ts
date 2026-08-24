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
  type CustomerProductId,
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

interface RelationshipPageCopy {
  heading: string
  intro: string
}

const RELATIONSHIP_PAGE_COPY: Record<CustomerProductId, RelationshipPageCopy> = {
  acl: {
    heading: 'Financing',
    intro: 'View your financing periods and repayment details.',
  },
  abf: {
    heading: 'Suppliers',
    intro: 'Choose a supplier to view available financing or request funds.',
  },
  stf: {
    heading: 'Partner Suppliers',
    intro: 'Choose a Partner Supplier to view available financing or request funds.',
  },
  'invoice-financing': {
    heading: 'Buyers',
    intro: 'Choose a buyer to view financing periods, upload invoices or request funds.',
  },
  infx: {
    heading: 'Buyers',
    intro: 'Choose a buyer to view available financing or request funds for an invoice.',
  },
}

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

  get relationshipHeading(): string {
    return this.workspace ? RELATIONSHIP_PAGE_COPY[this.workspace.id].heading : 'Financing'
  }

  get relationshipIntro(): string {
    return this.workspace ? RELATIONSHIP_PAGE_COPY[this.workspace.id].intro : ''
  }

  get periodBackLabel(): string | null {
    if (!this.returnRelationship) return null
    return `Back to ${this.relationshipCustomerType(this.returnRelationship)}`
  }

  relationshipAvailable(relationship: CustomerRelationship): number {
    if (this.workspace?.id === 'abf' && relationship.id === 'abf-quickmart') return 0
    if (this.workspace?.id === 'stf' && relationship.id === 'stf-greenharvest') return 0
    if (this.workspace?.id === 'invoice-financing' && relationship.id === 'inf-fresh') return 0
    return relationship.available
  }

  relationshipUsed(relationship: CustomerRelationship): number {
    const available = this.relationshipAvailable(relationship)
    return Math.max(0, relationship.limit - available)
  }

  relationshipAvailabilityLabel(relationship: CustomerRelationship): string {
    return this.relationshipAvailable(relationship) > 0 ? 'Available' : 'Unavailable'
  }

  relationshipAvailabilityTone(relationship: CustomerRelationship): string {
    return this.relationshipAvailable(relationship) > 0 ? 'status-success' : 'status-neutral'
  }

  relationshipAvailabilityTooltip(relationship: CustomerRelationship): string {
    return this.relationshipAvailable(relationship) > 0
      ? 'Financing is available.'
      : 'No financing is currently available.'
  }

  relationshipCustomerType(relationship: CustomerRelationship): string {
    if (relationship.relationshipType.includes('Supplier')) return 'Supplier'
    if (relationship.relationshipType.includes('Buyer')) return 'Buyer'
    return relationship.relationshipType
  }

  invoiceUploadSourceLabel(relationship: CustomerRelationship): string {
    return relationship.invoiceUploadOwner === 'client' ? 'You upload invoices' : 'Buyer uploads invoices'
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
    if (!this.workspace) return []
    return periodsForRelationship(this.workspace, relationship)
      .map((period, index) => ({ period, index }))
      .sort((a, b) => {
        const aOverdue = a.period.statusKey === 'overdue' || a.period.paymentAttention === 'overdue'
        const bOverdue = b.period.statusKey === 'overdue' || b.period.paymentAttention === 'overdue'
        if (aOverdue !== bOverdue) return aOverdue ? -1 : 1
        return a.index - b.index
      })
      .map(item => item.period)
  }

  openPeriod(period: CustomerFinancingPeriod): void {
    this.returnRelationship = this.selectedRelationship
    this.selectedRelationship = null
    this.selectedPeriod = period
  }

  backToRelationship(): void {
    this.selectedPeriod = null
    this.restoreRelationship()
  }

  closePeriod(): void {
    this.selectedPeriod = null
    this.returnRelationship = null
  }

  canRequestFromPeriod(period: CustomerFinancingPeriod): boolean {
    if (this.workspace?.id !== 'invoice-financing') return false
    if ((period.availableToWithdraw ?? 0) <= 0) return false
    if (period.statusKey !== 'live' && period.statusKey !== 'requested') return false
    return this.isWithinInvoiceFundingWindow(period)
  }

  periodRequestLabel(_period: CustomerFinancingPeriod): string {
    return 'Request funds'
  }

  startFundsRequest(relationship: CustomerRelationship, event?: Event): void {
    event?.stopPropagation()
    if (!relationship.fundsRequestEnabled || this.relationshipAvailable(relationship) <= 0) return

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
    this.toast = `You can request up to ${formatKes(period.availableToWithdraw ?? 0)} from this financing period.`
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
    this.toast = `Invoice received for ${relationship.name}. Eligible invoices will appear in the matching financing period.`
    this.restoreRelationship()
    this.cdr.markForCheck()
  }

  closeOverlays(): void {
    this.selectedRelationship = null
    this.selectedPeriod = null
    this.invoiceUploadRelationship = null
    this.returnRelationship = null
  }

  private isWithinInvoiceFundingWindow(period: CustomerFinancingPeriod): boolean {
    const dueDate = new Date(`${period.repaymentDueDate}T00:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const daysToDue = Math.ceil((dueDate.getTime() - today.getTime()) / 86_400_000)
    return daysToDue >= 7 && daysToDue <= 60
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

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
import {
  CustomerFilterBarComponent,
  type CustomerFilterField,
  type CustomerSortOption,
} from '../../shared/customer-filter-bar.component'
import { formatDate, formatKes } from '../../shared/customer-portal.data'
import { PrototypeExplainerComponent } from '../../shared/prototype-explainer.component'

interface RelationshipPageCopy { heading: string; intro: string }

const RELATIONSHIP_PAGE_COPY: Record<CustomerProductId, RelationshipPageCopy> = {
  acl: { heading: 'Financing', intro: 'View your financing periods and repayment details.' },
  abf: { heading: 'Suppliers', intro: 'Choose a supplier to view available financing or request funds.' },
  stf: { heading: 'Partner Suppliers', intro: 'Choose a Partner Supplier to view available financing or request funds.' },
  'invoice-financing': { heading: 'Buyers', intro: 'Choose a buyer to view financing periods, upload invoices or request funds.' },
  infx: { heading: 'Buyers', intro: 'Choose a buyer to view available financing or request funds for an invoice.' },
}

@Component({
  selector: 'app-contextual-financing',
  standalone: true,
  imports: [
    PrototypeExplainerComponent,
    CustomerFinancingPeriodModalComponent,
    CustomerFilterBarComponent,
  ],
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
  relationshipPeriodsOpen = false
  returnRelationshipPeriodsOpen = false

  toast = ''
  search = ''
  status = ''
  sort = ''
  page = 1
  readonly pageSize = 10

  periodSearch = ''
  periodStatus = ''
  periodSort = ''
  periodPage = 1
  readonly periodPageSize = 10

  readonly formatDate = formatDate
  readonly formatKes = formatKes
  readonly filterFields: readonly CustomerFilterField[] = [
    {
      key: 'status',
      label: 'Status',
      allLabel: 'All statuses',
      options: [
        { value: 'available', label: 'Available' },
        { value: 'unavailable', label: 'Unavailable' },
      ],
    },
  ]

  constructor() {
    this.route.parent?.paramMap
      .pipe(takeUntil(this.destroyed$))
      .subscribe(params => {
        this.experience = experienceById(params.get('experienceId')) ?? experienceById('acl')!
        this.workspace = customerWorkspaceById(this.experience.id)
        this.closeOverlays()
        this.resetList()
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

  get filterValues(): Readonly<Record<string, string>> { return { status: this.status } }

  get sortOptions(): readonly CustomerSortOption[] {
    const noun = this.workspace?.relationshipNoun ?? 'Name'
    return [
      { value: 'name-asc', label: `${noun}: A-Z` },
      { value: 'available-desc', label: 'Financing available: high to low' },
      { value: 'available-asc', label: 'Financing available: low to high' },
      { value: 'status-asc', label: 'Status: A-Z' },
    ]
  }

  get filteredRelationships(): readonly CustomerRelationship[] {
    const q = this.search.trim().toLowerCase()
    const items = (this.workspace?.relationships ?? [])
      .filter(r => !this.status || (this.status === 'available' ? this.relationshipAvailable(r) > 0 : this.relationshipAvailable(r) <= 0))
      .filter(r => !q || [r.name, formatKes(this.relationshipAvailable(r)), this.relationshipAvailabilityLabel(r)].join(' ').toLowerCase().includes(q))

    return [...items].sort((a, b) => {
      if (this.sort === 'available-desc') return this.relationshipAvailable(b) - this.relationshipAvailable(a)
      if (this.sort === 'available-asc') return this.relationshipAvailable(a) - this.relationshipAvailable(b)
      if (this.sort === 'status-asc') return this.relationshipAvailabilityLabel(a).localeCompare(this.relationshipAvailabilityLabel(b))
      return a.name.localeCompare(b.name)
    })
  }

  get relationshipPageItems(): readonly CustomerRelationship[] {
    const start = (this.page - 1) * this.pageSize
    return this.filteredRelationships.slice(start, start + this.pageSize)
  }

  get totalPages(): number { return Math.max(1, Math.ceil(this.filteredRelationships.length / this.pageSize)) }
  get pageNumbers(): readonly number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1) }
  get rangeStart(): number { return this.filteredRelationships.length ? (this.page - 1) * this.pageSize + 1 : 0 }
  get rangeEnd(): number { return Math.min(this.page * this.pageSize, this.filteredRelationships.length) }

  onSearch(value: string): void { this.search = value; this.page = 1 }
  onFilters(values: Record<string, string>): void { this.status = values['status'] ?? ''; this.page = 1 }
  onSort(value: string): void { this.sort = value; this.page = 1 }
  changePage(page: number): void { this.page = Math.min(Math.max(1, page), this.totalPages) }

  private resetList(): void {
    this.search = ''
    this.status = ''
    this.sort = ''
    this.page = 1
  }

  get periodBackLabel(): string | null {
    if (!this.returnRelationship) return null
    return this.returnRelationshipPeriodsOpen ? 'Back to financing periods' : `Back to ${this.relationshipCustomerType(this.returnRelationship)}`
  }

  relationshipAvailable(relationship: CustomerRelationship): number {
    if (this.workspace?.id === 'abf' && relationship.id === 'abf-quickmart') return 0
    if (this.workspace?.id === 'stf' && relationship.id === 'stf-greenharvest') return 0
    if (this.workspace?.id === 'invoice-financing' && relationship.id === 'inf-fresh') return 0
    return relationship.available
  }

  relationshipUsed(relationship: CustomerRelationship): number {
    return Math.max(0, relationship.limit - this.relationshipAvailable(relationship))
  }

  relationshipAvailabilityLabel(relationship: CustomerRelationship): string {
    return this.relationshipAvailable(relationship) > 0 ? 'Available' : 'Unavailable'
  }

  relationshipAvailabilityTone(relationship: CustomerRelationship): string {
    return this.relationshipAvailable(relationship) > 0 ? 'status-success' : 'status-neutral'
  }

  relationshipAvailabilityTooltip(relationship: CustomerRelationship): string {
    return this.relationshipAvailable(relationship) > 0 ? 'Financing is available.' : 'No financing is currently available.'
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
    this.returnRelationshipPeriodsOpen = false
    this.relationshipPeriodsOpen = false
    this.resetRelationshipPeriodList()
  }

  closeRelationship(): void {
    this.selectedRelationship = null
    this.relationshipPeriodsOpen = false
    this.resetRelationshipPeriodList()
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

  relationshipPeriodCount(relationship: CustomerRelationship): number {
    return this.relationshipPeriods(relationship).length
  }

  openRelationshipPeriods(): void {
    if (!this.selectedRelationship) return
    this.resetRelationshipPeriodList()
    this.relationshipPeriodsOpen = true
  }

  closeRelationshipPeriods(): void {
    this.relationshipPeriodsOpen = false
    this.resetRelationshipPeriodList()
  }

  get periodFilterFields(): readonly CustomerFilterField[] {
    const relationship = this.selectedRelationship
    if (!relationship) return []
    const statuses = new Map<string, string>()
    for (const period of this.relationshipPeriods(relationship)) statuses.set(period.statusKey, period.statusLabel)
    return [{
      key: 'status',
      label: 'Status',
      allLabel: 'All statuses',
      options: Array.from(statuses, ([value, label]) => ({ value, label })),
    }]
  }

  get periodFilterValues(): Readonly<Record<string, string>> { return { status: this.periodStatus } }

  get periodSortOptions(): readonly CustomerSortOption[] {
    return [
      { value: 'reference-asc', label: 'Reference: A-Z' },
      { value: 'due-asc', label: 'Due date: earliest' },
      { value: 'due-desc', label: 'Due date: latest' },
      { value: 'outstanding-desc', label: 'Outstanding: high to low' },
      { value: 'outstanding-asc', label: 'Outstanding: low to high' },
      { value: 'status-asc', label: 'Status: A-Z' },
    ]
  }

  get filteredRelationshipPeriods(): readonly CustomerFinancingPeriod[] {
    const relationship = this.selectedRelationship
    if (!relationship) return []
    const query = this.periodSearch.trim().toLowerCase()
    const periods = this.relationshipPeriods(relationship)
      .filter(period => !this.periodStatus || period.statusKey === this.periodStatus)
      .filter(period => !query || [
        period.reference,
        formatDate(period.repaymentDueDate, true),
        formatKes(period.outstandingBalance),
        period.statusLabel,
      ].join(' ').toLowerCase().includes(query))

    if (!this.periodSort) return periods

    return [...periods].sort((a, b) => {
      if (this.periodSort === 'reference-asc') return a.reference.localeCompare(b.reference)
      if (this.periodSort === 'due-asc') return a.repaymentDueDate.localeCompare(b.repaymentDueDate)
      if (this.periodSort === 'due-desc') return b.repaymentDueDate.localeCompare(a.repaymentDueDate)
      if (this.periodSort === 'outstanding-desc') return b.outstandingBalance - a.outstandingBalance
      if (this.periodSort === 'outstanding-asc') return a.outstandingBalance - b.outstandingBalance
      if (this.periodSort === 'status-asc') return a.statusLabel.localeCompare(b.statusLabel)
      return 0
    })
  }

  get periodPageItems(): readonly CustomerFinancingPeriod[] {
    const start = (this.periodPage - 1) * this.periodPageSize
    return this.filteredRelationshipPeriods.slice(start, start + this.periodPageSize)
  }

  get periodTotalPages(): number { return Math.max(1, Math.ceil(this.filteredRelationshipPeriods.length / this.periodPageSize)) }
  get periodPageNumbers(): readonly number[] { return Array.from({ length: this.periodTotalPages }, (_, i) => i + 1) }
  get periodRangeStart(): number { return this.filteredRelationshipPeriods.length ? (this.periodPage - 1) * this.periodPageSize + 1 : 0 }
  get periodRangeEnd(): number { return Math.min(this.periodPage * this.periodPageSize, this.filteredRelationshipPeriods.length) }

  onPeriodSearch(value: string): void { this.periodSearch = value; this.periodPage = 1 }
  onPeriodFilters(values: Record<string, string>): void { this.periodStatus = values['status'] ?? ''; this.periodPage = 1 }
  onPeriodSort(value: string): void { this.periodSort = value; this.periodPage = 1 }
  changePeriodPage(page: number): void { this.periodPage = Math.min(Math.max(1, page), this.periodTotalPages) }

  private resetRelationshipPeriodList(): void {
    this.periodSearch = ''
    this.periodStatus = ''
    this.periodSort = ''
    this.periodPage = 1
  }

  openPeriod(period: CustomerFinancingPeriod): void {
    this.returnRelationship = this.selectedRelationship
    this.returnRelationshipPeriodsOpen = this.relationshipPeriodsOpen
    this.selectedRelationship = null
    this.relationshipPeriodsOpen = false
    this.selectedPeriod = period
  }

  backToRelationship(): void {
    this.selectedPeriod = null
    this.restoreRelationship()
  }

  closePeriod(): void {
    this.selectedPeriod = null
    this.returnRelationship = null
    this.returnRelationshipPeriodsOpen = false
  }

  canRequestFromPeriod(period: CustomerFinancingPeriod): boolean {
    if (this.workspace?.id !== 'invoice-financing' || (period.availableToWithdraw ?? 0) <= 0 || (period.statusKey !== 'live' && period.statusKey !== 'requested')) return false
    return this.isWithinInvoiceFundingWindow(period)
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
    this.returnRelationshipPeriodsOpen = false
    this.selectedRelationship = null
    this.relationshipPeriodsOpen = false
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
    this.relationshipPeriodsOpen = false
    this.returnRelationshipPeriodsOpen = false
    this.resetRelationshipPeriodList()
  }

  private isWithinInvoiceFundingWindow(period: CustomerFinancingPeriod): boolean {
    const dueDate = new Date(`${period.repaymentDueDate}T00:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const days = Math.ceil((dueDate.getTime() - today.getTime()) / 86_400_000)
    return days >= 7 && days <= 60
  }

  private restoreRelationship(): void {
    if (!this.returnRelationship) return
    this.selectedRelationship = this.returnRelationship
    this.returnRelationship = null
    this.relationshipPeriodsOpen = this.returnRelationshipPeriodsOpen
    this.returnRelationshipPeriodsOpen = false
  }

  ngOnDestroy(): void {
    this.destroyed$.next()
    this.destroyed$.complete()
  }
}

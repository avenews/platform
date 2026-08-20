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
  paymentAttentionCounts,
  type CustomerFinancingPeriod,
  type CustomerWorkspace,
} from '../../core/experience/customer-product-workspace.data'
import {
  experienceById,
  type ExperienceActionKind,
  type PortalExperience,
} from '../../core/experience/contextual-experience.data'
import { ACL_FUNDS_REQUEST_DEMO_URL } from '../../core/experience/experience-links'
import { PortalExperienceService } from '../../core/experience/portal-experience.service'
import {
  CustomerFilterBarComponent,
  type CustomerFilterField,
} from '../../shared/customer-filter-bar.component'
import { CustomerFinancingPeriodModalComponent } from '../../shared/customer-financing-period-modal.component'
import { formatDate, formatKes } from '../../shared/customer-portal.data'
import { PrototypeExplainerComponent } from '../../shared/prototype-explainer.component'

@Component({
  selector: 'app-contextual-home',
  standalone: true,
  imports: [
    PrototypeExplainerComponent,
    CustomerFilterBarComponent,
    CustomerFinancingPeriodModalComponent,
  ],
  templateUrl: './contextual-home.component.html',
  styleUrls: [
    './contextual-home.component.css',
    './contextual-home.lifecycle-refinement.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContextualHomeComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly experienceService = inject(PortalExperienceService)
  private readonly cdr = inject(ChangeDetectorRef)
  private readonly destroyed$ = new Subject<void>()

  experience: PortalExperience = this.resolveExperience()
  workspace: CustomerWorkspace | undefined = customerWorkspaceById(this.experience.id)

  searchQuery = ''
  statusFilter = ''
  dueDateFilter = ''
  page = 1
  readonly pageSize = 10
  selectedPeriod: CustomerFinancingPeriod | null = null
  toast = ''

  readonly aclFundsRequestDemoUrl = ACL_FUNDS_REQUEST_DEMO_URL
  readonly formatDate = formatDate
  readonly formatKes = formatKes

  constructor() {
    this.route.parent?.paramMap
      .pipe(takeUntil(this.destroyed$))
      .subscribe(params => {
        this.experience = experienceById(params.get('experienceId')) ?? experienceById('acl')!
        this.workspace = customerWorkspaceById(this.experience.id)
        this.resetFilters()
        this.selectedPeriod = null
        this.cdr.markForCheck()
      })
  }

  private resolveExperience(): PortalExperience {
    const id = this.route.parent?.snapshot.paramMap.get('experienceId')
    return experienceById(id) ?? experienceById('acl')!
  }

  get filterFields(): readonly CustomerFilterField[] {
    if (!this.workspace) return []
    const statuses = new Map<string, string>()
    for (const period of this.workspace.periods) statuses.set(period.statusKey, period.statusLabel)

    return [
      {
        key: 'status',
        label: 'Status',
        allLabel: 'All statuses',
        options: Array.from(statuses, ([value, label]) => ({ value, label })),
      },
      {
        key: 'dueDate',
        label: 'Due date',
        allLabel: 'Any due date',
        options: [
          { value: 'payments-due', label: this.workspace.id === 'invoice-financing' ? 'Settlements due' : 'Payments due' },
          { value: 'overdue', label: 'Overdue' },
          { value: 'upcoming', label: 'Upcoming' },
        ],
      },
    ]
  }

  get filterValues(): Readonly<Record<string, string>> {
    return { status: this.statusFilter, dueDate: this.dueDateFilter }
  }

  get searchPlaceholder(): string {
    return 'Search'
  }

  get primaryActionLabel(): string {
    return this.workspace?.id === 'invoice-financing' ? 'Upload invoices' : (this.workspace?.primaryActionLabel ?? '')
  }

  get dueCounts(): { overdue: number; upcoming: number; total: number } {
    return this.workspace ? paymentAttentionCounts(this.workspace) : { overdue: 0, upcoming: 0, total: 0 }
  }

  get dueCountLabel(): string {
    const total = this.dueCounts.total
    if (this.workspace?.id === 'invoice-financing') {
      return `${total} ${total === 1 ? 'settlement' : 'settlements'} due`
    }
    return `${total} ${total === 1 ? 'payment' : 'payments'} due`
  }

  get dueSplitLabel(): string {
    return `${this.dueCounts.overdue} overdue · ${this.dueCounts.upcoming} upcoming`
  }

  get activityItemLabel(): string {
    return this.workspace?.id === 'invoice-financing' ? 'Dynamic Periods' : 'financing periods'
  }

  get filteredPeriods(): readonly CustomerFinancingPeriod[] {
    if (!this.workspace) return []
    const query = this.searchQuery.trim().toLowerCase()

    return this.workspace.periods
      .filter(period => !this.statusFilter || period.statusKey === this.statusFilter)
      .filter(period => this.matchesDueFilter(period))
      .filter(period => {
        if (!query) return true
        const relationshipSearch = this.workspace?.id === 'acl'
          ? 'Avenews Agri Credit Line'
          : `${period.relationshipName} ${this.customerRelationshipType(period.relationshipType)}`
        const searchableValues = [
          period.reference,
          relationshipSearch,
          period.statusLabel,
          period.disbursementDate ? formatDate(period.disbursementDate, true) : 'Pending',
          formatDate(period.repaymentDueDate, true),
          formatKes(period.amountFinanced),
          period.availableToWithdraw !== undefined ? formatKes(period.availableToWithdraw) : '',
          formatKes(period.totalRepaid),
          formatKes(period.outstandingBalance),
          period.invoiceReference ?? '',
          period.invoiceType ?? '',
        ]
        return searchableValues.join(' ').toLowerCase().includes(query)
      })
  }

  get pageItems(): readonly CustomerFinancingPeriod[] {
    const start = (this.page - 1) * this.pageSize
    return this.filteredPeriods.slice(start, start + this.pageSize)
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredPeriods.length / this.pageSize))
  }

  get pageNumbers(): readonly number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1)
  }

  get rangeStart(): number {
    return this.filteredPeriods.length ? (this.page - 1) * this.pageSize + 1 : 0
  }

  get rangeEnd(): number {
    return Math.min(this.page * this.pageSize, this.filteredPeriods.length)
  }

  primaryAction(): void {
    if (!this.workspace) return
    if (this.workspace.id === 'acl') {
      this.openAclFundsRequest()
      return
    }
    void this.router.navigate(this.experienceService.routeFor(this.workspace.id, 'financing'))
  }

  openAclFundsRequest(): void {
    const opened = window.open(this.aclFundsRequestDemoUrl, '_blank', 'noopener,noreferrer')
    if (opened) {
      opened.opener = null
      return
    }
    this.toast = 'Your browser blocked the Funds Request tab. Allow pop-ups and try again.'
    this.cdr.markForCheck()
  }

  filterPaymentsDue(): void {
    this.searchQuery = ''
    this.statusFilter = ''
    this.dueDateFilter = 'payments-due'
    this.page = 1
    this.selectedPeriod = null
    this.cdr.markForCheck()

    requestAnimationFrame(() => {
      document.getElementById('customer-financing-activity')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
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

  requestFundsForPeriod(period: CustomerFinancingPeriod, event?: Event): void {
    event?.stopPropagation()
    if (!this.canRequestFromPeriod(period)) return
    this.toast = `Request funds from ${period.reference}. Available to Withdraw: ${formatKes(period.availableToWithdraw ?? 0)}.`
    this.cdr.markForCheck()
  }

  openPeriod(period: CustomerFinancingPeriod): void {
    this.selectedPeriod = this.workspace?.id === 'acl'
      ? { ...period, relationshipName: 'Avenews', relationshipType: 'Agri Credit Line', note: undefined }
      : period
  }

  closePeriod(): void {
    this.selectedPeriod = null
  }

  onFilterValuesChange(values: Record<string, string>): void {
    this.statusFilter = values['status'] ?? ''
    this.dueDateFilter = values['dueDate'] ?? ''
    this.page = 1
  }

  onSearchValueChange(value: string): void {
    this.searchQuery = value
    this.page = 1
  }

  changePage(page: number): void {
    this.page = Math.min(Math.max(1, page), this.totalPages)
  }

  takePartnerAction(kind: ExperienceActionKind): void {
    if (kind === 'upload-invoices' || kind === 'view-invoice-uploads') {
      void this.router.navigate(this.experienceService.routeFor(this.experience.id, 'invoice-uploads'))
      return
    }
    if (kind === 'view-obligations') {
      void this.router.navigate(this.experienceService.routeFor(this.experience.id, 'obligations'))
      return
    }
    void this.router.navigate(this.experienceService.routeFor(this.experience.id, 'invoice-uploads'))
  }

  private customerRelationshipType(type: string): string {
    if (type.includes('Supplier')) return 'Supplier'
    if (type.includes('Buyer')) return 'Buyer'
    return type
  }

  private isWithinInvoiceFundingWindow(period: CustomerFinancingPeriod): boolean {
    const dueDate = new Date(`${period.repaymentDueDate}T00:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const daysToDue = Math.ceil((dueDate.getTime() - today.getTime()) / 86_400_000)
    return daysToDue >= 7 && daysToDue <= 60
  }

  private matchesDueFilter(period: CustomerFinancingPeriod): boolean {
    if (!this.dueDateFilter) return true
    if (this.dueDateFilter === 'payments-due') return period.paymentAttention !== null
    if (this.dueDateFilter === 'overdue') return period.paymentAttention === 'overdue'
    if (this.dueDateFilter === 'upcoming') return period.paymentAttention === 'upcoming'
    return true
  }

  private resetFilters(): void {
    this.searchQuery = ''
    this.statusFilter = ''
    this.dueDateFilter = ''
    this.page = 1
  }

  ngOnDestroy(): void {
    this.destroyed$.next()
    this.destroyed$.complete()
  }
}

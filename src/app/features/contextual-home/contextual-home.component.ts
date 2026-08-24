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
  type CustomerProductId,
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
  type CustomerSortOption,
} from '../../shared/customer-filter-bar.component'
import { CustomerFinancingPeriodModalComponent } from '../../shared/customer-financing-period-modal.component'
import { formatDate, formatKes } from '../../shared/customer-portal.data'
import { PrototypeExplainerComponent } from '../../shared/prototype-explainer.component'

interface CustomerHomeCopy {
  intro: string
  availableHelper: string
  outstandingHelper: string
  dueMetricLabel: string
  dueActionLabel: string
}

interface PartnerHomePayment {
  id: string
  supplier: string
  reference: string
  dueDate: string
  amount: number
  status: 'Overdue' | 'Upcoming'
  tone: 'status-danger' | 'status-info'
}

const CUSTOMER_HOME_COPY: Record<CustomerProductId, CustomerHomeCopy> = {
  acl: {
    intro: 'View available financing, repayments and financing periods.',
    availableHelper: 'Available for approved purchases',
    outstandingHelper: 'Across active financing',
    dueMetricLabel: 'Payments Due',
    dueActionLabel: 'View payments due',
  },
  abf: {
    intro: 'View financing by supplier, track repayments and request funds.',
    availableHelper: 'Across your approved suppliers',
    outstandingHelper: 'Across active financing periods',
    dueMetricLabel: 'Payments Due',
    dueActionLabel: 'View payments due',
  },
  stf: {
    intro: 'View financing by Partner Supplier, track repayments and request funds.',
    availableHelper: 'Across your Partner Suppliers',
    outstandingHelper: 'Across active financing periods',
    dueMetricLabel: 'Payments Due',
    dueActionLabel: 'View payments due',
  },
  'invoice-financing': {
    intro: 'View financing by buyer and invoice due date, upload invoices and request funds.',
    availableHelper: 'Across eligible financing periods',
    outstandingHelper: 'To be settled from buyer payments',
    dueMetricLabel: 'Buyer Payments Due',
    dueActionLabel: 'View payments due',
  },
  infx: {
    intro: 'Finance one invoice at a time, track repayments and request funds by buyer.',
    availableHelper: 'Across your approved buyers',
    outstandingHelper: 'Across active financing periods',
    dueMetricLabel: 'Payments Due',
    dueActionLabel: 'View payments due',
  },
}

const PARTNER_HOME_PAYMENTS: readonly PartnerHomePayment[] = [
  { id: 'coast-aug15', supplier: 'Coastline Produce Ltd', reference: 'PER-2026-08-15-COAST', dueDate: '2026-08-15', amount: 1040000, status: 'Overdue', tone: 'status-danger' },
  { id: 'kericho-sep10', supplier: 'Kericho Fresh Foods', reference: 'PER-2026-09-10-KERICHO', dueDate: '2026-09-10', amount: 720000, status: 'Upcoming', tone: 'status-info' },
  { id: 'kioko-sep15', supplier: 'Kioko Agri Supplies Ltd', reference: 'PER-2026-09-15-KIOKO', dueDate: '2026-09-15', amount: 1280000, status: 'Upcoming', tone: 'status-info' },
  { id: 'highlands-sep15', supplier: 'Highlands Food Processors', reference: 'PER-2026-09-15-HIGHLANDS', dueDate: '2026-09-15', amount: 1320000, status: 'Upcoming', tone: 'status-info' },
]

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
  availabilityFilter = ''
  sort = ''
  page = 1
  readonly pageSize = 10
  selectedPeriod: CustomerFinancingPeriod | null = null
  toast = ''

  readonly aclFundsRequestDemoUrl = ACL_FUNDS_REQUEST_DEMO_URL
  readonly partnerHomePayments = PARTNER_HOME_PAYMENTS
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

    const fields: CustomerFilterField[] = [
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
          { value: 'payments-due', label: 'Payments due' },
          { value: 'overdue', label: 'Overdue' },
          { value: 'upcoming', label: 'Upcoming' },
        ],
      },
    ]

    if (this.workspace.id === 'invoice-financing') {
      fields.push({
        key: 'availability',
        label: 'Availability',
        allLabel: 'Any availability',
        options: [
          { value: 'available-to-withdraw', label: 'Available to withdraw' },
        ],
      })
    }

    return fields
  }

  get filterValues(): Readonly<Record<string, string>> {
    return {
      status: this.statusFilter,
      dueDate: this.dueDateFilter,
      availability: this.availabilityFilter,
    }
  }

  get sortOptions(): readonly CustomerSortOption[] {
    if (!this.workspace) return []
    const nameLabel = this.workspace.id === 'acl' ? 'Reference' : this.workspace.relationshipNoun
    const amountLabel = this.workspace.id === 'invoice-financing' ? 'Available financing' : 'Amount financed'
    return [
      { value: 'name-asc', label: `${nameLabel}: A-Z` },
      { value: 'due-asc', label: 'Due date: earliest' },
      { value: 'due-desc', label: 'Due date: latest' },
      { value: 'amount-desc', label: `${amountLabel}: high to low` },
      { value: 'amount-asc', label: `${amountLabel}: low to high` },
      { value: 'outstanding-desc', label: 'Outstanding: high to low' },
      { value: 'outstanding-asc', label: 'Outstanding: low to high' },
      { value: 'status-asc', label: 'Status: A-Z' },
    ]
  }

  get searchPlaceholder(): string { return 'Search' }
  get primaryActionLabel(): string { return this.workspace?.id === 'invoice-financing' ? 'Upload invoices' : (this.workspace?.primaryActionLabel ?? '') }
  get homeIntro(): string { return this.workspace ? CUSTOMER_HOME_COPY[this.workspace.id].intro : this.experience.homeIntro }
  get availableMetricHelper(): string { return this.workspace ? CUSTOMER_HOME_COPY[this.workspace.id].availableHelper : '' }
  get outstandingMetricHelper(): string { return this.workspace ? CUSTOMER_HOME_COPY[this.workspace.id].outstandingHelper : '' }
  get dueMetricLabel(): string { return this.workspace ? CUSTOMER_HOME_COPY[this.workspace.id].dueMetricLabel : 'Payments Due' }
  get dueActionLabel(): string { return this.workspace ? CUSTOMER_HOME_COPY[this.workspace.id].dueActionLabel : 'View payments due' }
  get dueCounts(): { overdue: number; upcoming: number; total: number } { return this.workspace ? paymentAttentionCounts(this.workspace) : { overdue: 0, upcoming: 0, total: 0 } }
  get dueCountLabel(): string { const total = this.dueCounts.total; return `${total} ${total === 1 ? 'payment' : 'payments'} due` }
  get dueSplitLabel(): string { return `${this.dueCounts.overdue} overdue · ${this.dueCounts.upcoming} upcoming` }
  get activityItemLabel(): string { return 'financing periods' }

  get filteredPeriods(): readonly CustomerFinancingPeriod[] {
    if (!this.workspace) return []
    const query = this.searchQuery.trim().toLowerCase()
    const product = this.workspace

    const items = product.periods
      .filter(period => !this.statusFilter || period.statusKey === this.statusFilter)
      .filter(period => this.matchesDueFilter(period))
      .filter(period => !this.availabilityFilter || this.canRequestFromPeriod(period))
      .filter(period => {
        if (!query) return true
        const displayedName = product.id === 'acl' ? period.reference : period.relationshipName
        const displayedAmount = product.id === 'invoice-financing' ? (period.availableToWithdraw ?? 0) : period.amountFinanced
        return [
          displayedName,
          product.id === 'acl' ? '' : period.reference,
          formatDate(period.repaymentDueDate, true),
          formatKes(displayedAmount),
          period.statusLabel,
          formatKes(period.outstandingBalance),
        ].join(' ').toLowerCase().includes(query)
      })
      .map((period, index) => ({ period, index }))

    return items.sort((a, b) => {
      if (this.sort === 'name-asc') return this.periodSortName(a.period).localeCompare(this.periodSortName(b.period))
      if (this.sort === 'due-asc') return a.period.repaymentDueDate.localeCompare(b.period.repaymentDueDate)
      if (this.sort === 'due-desc') return b.period.repaymentDueDate.localeCompare(a.period.repaymentDueDate)
      if (this.sort === 'amount-desc') return this.periodSortAmount(b.period) - this.periodSortAmount(a.period)
      if (this.sort === 'amount-asc') return this.periodSortAmount(a.period) - this.periodSortAmount(b.period)
      if (this.sort === 'outstanding-desc') return b.period.outstandingBalance - a.period.outstandingBalance
      if (this.sort === 'outstanding-asc') return a.period.outstandingBalance - b.period.outstandingBalance
      if (this.sort === 'status-asc') return a.period.statusLabel.localeCompare(b.period.statusLabel)
      const aOverdue = a.period.statusKey === 'overdue' || a.period.paymentAttention === 'overdue'
      const bOverdue = b.period.statusKey === 'overdue' || b.period.paymentAttention === 'overdue'
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1
      return a.index - b.index
    }).map(item => item.period)
  }

  get pageItems(): readonly CustomerFinancingPeriod[] { const start = (this.page - 1) * this.pageSize; return this.filteredPeriods.slice(start, start + this.pageSize) }
  get totalPages(): number { return Math.max(1, Math.ceil(this.filteredPeriods.length / this.pageSize)) }
  get pageNumbers(): readonly number[] { return Array.from({ length: this.totalPages }, (_, index) => index + 1) }
  get rangeStart(): number { return this.filteredPeriods.length ? (this.page - 1) * this.pageSize + 1 : 0 }
  get rangeEnd(): number { return Math.min(this.page * this.pageSize, this.filteredPeriods.length) }

  primaryAction(): void {
    if (!this.workspace) return
    if (this.workspace.id === 'acl') { this.openAclFundsRequest(); return }
    if (this.workspace.id === 'invoice-financing') {
      void this.router.navigate(this.experienceService.routeFor(this.workspace.id, 'invoices'), { queryParams: { action: 'upload' } })
      return
    }
    void this.router.navigate(this.experienceService.routeFor(this.workspace.id, 'request-funds'))
  }

  openFundsRequest(): void {
    if (!this.workspace) return
    if (this.workspace.id === 'acl') { this.openAclFundsRequest(); return }
    void this.router.navigate(this.experienceService.routeFor(this.workspace.id, 'request-funds'))
  }

  openAclFundsRequest(): void {
    const opened = window.open(this.aclFundsRequestDemoUrl, '_blank', 'noopener,noreferrer')
    if (opened) { opened.opener = null; return }
    this.toast = 'Your browser blocked the Funds Request tab. Allow pop-ups and try again.'
    this.cdr.markForCheck()
  }

  filterAvailableFinancing(): void {
    if (this.workspace?.id !== 'invoice-financing') return
    this.searchQuery = ''; this.statusFilter = ''; this.dueDateFilter = ''; this.availabilityFilter = 'available-to-withdraw'; this.sort = ''; this.page = 1; this.selectedPeriod = null
    this.cdr.markForCheck(); this.scrollToFinancing()
  }

  filterPaymentsDue(): void {
    this.searchQuery = ''; this.statusFilter = ''; this.dueDateFilter = 'payments-due'; this.availabilityFilter = ''; this.sort = ''; this.page = 1; this.selectedPeriod = null
    this.cdr.markForCheck(); this.scrollToFinancing()
  }

  canRequestFromPeriod(period: CustomerFinancingPeriod): boolean {
    if (this.workspace?.id !== 'invoice-financing') return false
    if ((period.availableToWithdraw ?? 0) <= 0) return false
    if (period.statusKey !== 'live' && period.statusKey !== 'requested') return false
    return this.isWithinInvoiceFundingWindow(period)
  }

  periodRequestLabel(_period: CustomerFinancingPeriod): string { return 'Request funds' }

  requestFundsForPeriod(period: CustomerFinancingPeriod, event?: Event): void {
    event?.stopPropagation()
    if (!this.canRequestFromPeriod(period)) return
    this.toast = `You can request up to ${formatKes(period.availableToWithdraw ?? 0)} from this financing period.`
    this.cdr.markForCheck()
  }

  openPeriod(period: CustomerFinancingPeriod): void {
    this.selectedPeriod = this.workspace?.id === 'acl'
      ? { ...period, relationshipName: 'Avenews', relationshipType: 'Agri Credit Line', note: undefined }
      : period
  }

  closePeriod(): void { this.selectedPeriod = null }

  onFilterValuesChange(values: Record<string, string>): void {
    this.statusFilter = values['status'] ?? ''
    this.dueDateFilter = values['dueDate'] ?? ''
    this.availabilityFilter = values['availability'] ?? ''
    this.page = 1
  }
  onSearchValueChange(value: string): void { this.searchQuery = value; this.page = 1 }
  onSortValueChange(value: string): void { this.sort = value; this.page = 1 }
  changePage(page: number): void { this.page = Math.min(Math.max(1, page), this.totalPages) }

  takePartnerAction(kind: ExperienceActionKind): void {
    if (kind === 'upload-invoices') { void this.router.navigate(this.experienceService.routeFor(this.experience.id, 'invoice-uploads'), { queryParams: { action: 'upload' } }); return }
    if (kind === 'view-invoice-uploads') { void this.router.navigate(this.experienceService.routeFor(this.experience.id, 'invoice-uploads')); return }
    if (kind === 'view-obligations') { void this.router.navigate(this.experienceService.routeFor(this.experience.id, 'obligations')); return }
    if (kind === 'view-suppliers') { void this.router.navigate(this.experienceService.routeFor(this.experience.id, 'suppliers')); return }
    void this.router.navigate(this.experienceService.routeFor(this.experience.id, 'invoice-uploads'))
  }

  private periodSortName(period: CustomerFinancingPeriod): string { return this.workspace?.id === 'acl' ? period.reference : period.relationshipName }
  private periodSortAmount(period: CustomerFinancingPeriod): number { return this.workspace?.id === 'invoice-financing' ? (period.availableToWithdraw ?? 0) : period.amountFinanced }

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

  private scrollToFinancing(): void {
    requestAnimationFrame(() => {
      document.getElementById('customer-financing-activity')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  private resetFilters(): void {
    this.searchQuery = ''
    this.statusFilter = ''
    this.dueDateFilter = ''
    this.availabilityFilter = ''
    this.sort = ''
    this.page = 1
  }

  ngOnDestroy(): void {
    this.destroyed$.next()
    this.destroyed$.complete()
  }
}

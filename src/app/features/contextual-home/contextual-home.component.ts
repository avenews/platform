import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  inject,
} from '@angular/core'
import { AvButtonDirective, AvIconComponent } from '@avenews/design-system/angular'
import { ActivatedRoute, Router } from '@angular/router'
import { Subject, takeUntil } from 'rxjs'
import {
  BUSINESS,
  CREDIT_LINES,
  FINANCING_RECORDS,
  PROFILE,
  formatDate,
  formatKes,
  statusLabel,
  statusTone,
  type CreditLine,
  type FinancingRecord,
  type Installment,
} from '../../shared/customer-portal.data'
import {
  experienceById,
  type ExperienceActionKind,
  type ExperienceId,
  type PortalExperience,
} from '../../core/experience/contextual-experience.data'
import { ACL_FUNDS_REQUEST_DEMO_URL } from '../../core/experience/experience-links'
import { PortalExperienceService } from '../../core/experience/portal-experience.service'
import {
  CustomerFilterBarComponent,
  type CustomerFilterField,
} from '../../shared/customer-filter-bar.component'
import { PrototypeExplainerComponent } from '../../shared/prototype-explainer.component'

type RepaymentMethod = 'bank' | 'mpesa'

type CustomerFinancingPeriodStatus = {
  key: string
  label: string
  tone: string
}

type FinancingStatusRule = CustomerFinancingPeriodStatus & {
  customerFacing: boolean
}

const FINANCING_STATUS_RULES: Readonly<Record<string, FinancingStatusRule>> = {
  requested: { key: 'requested', label: 'Requested', tone: 'status-info', customerFacing: false },
  offered: { key: 'offered', label: 'Offered', tone: 'status-warning', customerFacing: false },
  validating: { key: 'validating', label: 'Validating', tone: 'status-warning', customerFacing: false },
  unavailable: { key: 'unavailable', label: 'Unavailable', tone: 'status-neutral', customerFacing: false },
  'to-sign-ap': { key: 'to-sign-ap', label: 'To Sign AP', tone: 'status-warning', customerFacing: false },
  'to-sign-rollover-ap': { key: 'to-sign-rollover-ap', label: 'To Sign Rollover AP', tone: 'status-warning', customerFacing: false },
  live: { key: 'live', label: 'Live', tone: 'status-live', customerFacing: true },
  overdue: { key: 'overdue', label: 'Overdue', tone: 'status-danger', customerFacing: true },
  default: { key: 'default', label: 'In Default', tone: 'status-danger', customerFacing: true },
  'in-default': { key: 'in-default', label: 'In Default', tone: 'status-danger', customerFacing: true },
  delinquent: { key: 'delinquent', label: 'Delinquent', tone: 'status-danger', customerFacing: true },
  'on-repayment-plan': { key: 'on-repayment-plan', label: 'On Repayment Plan', tone: 'status-warning', customerFacing: true },
  'transferred-to-repayment-plan': {
    key: 'transferred-to-repayment-plan',
    label: 'Transferred to Repayment Plan',
    tone: 'status-warning',
    customerFacing: true,
  },
  collections: { key: 'collections', label: 'Collections', tone: 'status-danger', customerFacing: true },
  'rolled-over': { key: 'rolled-over', label: 'Rolled Over', tone: 'status-neutral', customerFacing: false },
  refinanced: { key: 'refinanced', label: 'Refinanced', tone: 'status-neutral', customerFacing: false },
  repaid: { key: 'repaid', label: 'Repaid', tone: 'status-success', customerFacing: false },
  cancelled: { key: 'cancelled', label: 'Cancelled', tone: 'status-neutral', customerFacing: false },
  declined: { key: 'declined', label: 'Declined', tone: 'status-danger', customerFacing: false },
}

const BANK_DETAILS = [
  { label: 'Bank', value: 'ABSA Bank Kenya PLC' },
  { label: 'Account Name', value: 'Avenews KE Limited' },
  { label: 'Account Number', value: '2046346095' },
  { label: 'Branch Code', value: '03400' },
  { label: 'Branch Name', value: 'Headquarters' },
] as const

const MPESA_DETAILS = [
  { label: 'Paybill number', value: '4567121' },
  { label: 'Account Name', value: 'Avenews KE Limited' },
] as const

// Reuse existing production-representative rows for the ACL review view; do not invent new amounts.
// One row is overdue and one is upcoming so the Payments Due shortcut can demonstrate both paths.
const ACL_PERIOD_SOURCE_IDS = [
  'loan_asf_001',
  'loan_acl_001',
] as const

function aclPeriodRecord(id: string): FinancingRecord {
  const source = FINANCING_RECORDS.find(record => record.id === id)
  if (!source) throw new Error(`Missing ACL financing-period source record: ${id}`)

  return {
    ...source,
    id: `acl_period_${source.id}`,
    product: 'ACL',
    partner: 'Avenews',
    installments: source.installments.map(installment => ({ ...installment })),
  }
}

@Component({
  selector: 'app-contextual-home',
  standalone: true,
  imports: [
    PrototypeExplainerComponent,
    CustomerFilterBarComponent,
    AvButtonDirective,
    AvIconComponent,
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

  readonly aclFundsRequestDemoUrl = ACL_FUNDS_REQUEST_DEMO_URL
  readonly aclFinancingRecords: readonly FinancingRecord[] = ACL_PERIOD_SOURCE_IDS
    .map(id => aclPeriodRecord(id))
    .filter(record => this.customerFinancingPeriodStatus(record) !== null)
  readonly aclFilterFields: readonly CustomerFilterField[] = [
    {
      key: 'status',
      label: 'Status',
      allLabel: 'All statuses',
      options: this.uniqueAclStatuses(),
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
  readonly bankDetails = BANK_DETAILS
  readonly mpesaDetails = MPESA_DETAILS
  readonly clientPhone = PROFILE.contact.phone ?? 'Your registered phone number'
  readonly aclPageSize = 10

  aclPage = 1
  aclStatusFilter = ''
  aclDueDateFilter = ''
  aclSearchQuery = ''
  selectedAclRecord: FinancingRecord | null = null
  repaymentReturnRecord: FinancingRecord | null = null
  repaymentDetailsOpen = false
  repaymentMethod: RepaymentMethod = 'bank'
  toast = ''

  constructor() {
    this.route.parent?.paramMap
      .pipe(takeUntil(this.destroyed$))
      .subscribe(params => {
        this.experience = experienceById(params.get('experienceId')) ?? experienceById('acl')!
        this.closeAclOverlays()
        this.resetAclFilters()
        this.cdr.markForCheck()
      })
  }

  private resolveExperience(): PortalExperience {
    const id = this.route.parent?.snapshot.paramMap.get('experienceId')
    return experienceById(id) ?? experienceById('acl')!
  }

  private uniqueAclStatuses(): { value: string; label: string }[] {
    const statuses = new Map<string, string>()
    for (const record of this.aclFinancingRecords) {
      const status = this.customerFinancingPeriodStatus(record)
      if (status) statuses.set(status.key, status.label)
    }
    return Array.from(statuses, ([value, label]) => ({ value, label }))
  }

  displayProductName(experience: PortalExperience): string {
    const labels: Partial<Record<ExperienceId, string>> = {
      acl: 'Agri Credit Line',
      abf: 'Agri Buyer Financing',
      stf: 'Stockist Financing',
      infx: 'Invoice Financing Express',
    }
    return labels[experience.id] ?? experience.homeHeading
  }

  get primaryAclCreditLine(): CreditLine | undefined {
    return CREDIT_LINES.find(line => line.id === 'cl_acl_general')
      ?? CREDIT_LINES.find(line => line.product === 'ACL')
  }

  get paymentsDueLabel(): string {
    const count = BUSINESS.duePeriodsCount
    return `${count} ${count === 1 ? 'payment' : 'payments'} due`
  }

  get overduePaymentsCount(): number {
    return Math.min(BUSINESS.overdueLoansCount, BUSINESS.duePeriodsCount)
  }

  get upcomingPaymentsCount(): number {
    return Math.max(BUSINESS.duePeriodsCount - this.overduePaymentsCount, 0)
  }

  get aclFilterValues(): Readonly<Record<string, string>> {
    return {
      status: this.aclStatusFilter,
      dueDate: this.aclDueDateFilter,
    }
  }

  get filteredAclFinancingRecords(): readonly FinancingRecord[] {
    const query = this.aclSearchQuery.trim().toLowerCase()

    return this.aclFinancingRecords
      .filter(record => {
        if (!this.aclStatusFilter) return true
        return this.customerFinancingPeriodStatus(record)?.key === this.aclStatusFilter
      })
      .filter(record => this.matchesAclDueDateFilter(record))
      .filter(record => {
        if (!query) return true
        return [
          record.partner,
          this.fundsRequestReference(record),
          this.customerFinancingPeriodStatusLabel(record),
        ].join(' ').toLowerCase().includes(query)
      })
  }

  get aclPageItems(): readonly FinancingRecord[] {
    const start = (this.aclPage - 1) * this.aclPageSize
    return this.filteredAclFinancingRecords.slice(start, start + this.aclPageSize)
  }

  get aclTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredAclFinancingRecords.length / this.aclPageSize))
  }

  get aclPageNumbers(): readonly number[] {
    return Array.from({ length: this.aclTotalPages }, (_, index) => index + 1)
  }

  get aclRangeStart(): number {
    return this.filteredAclFinancingRecords.length ? (this.aclPage - 1) * this.aclPageSize + 1 : 0
  }

  get aclRangeEnd(): number {
    return Math.min(this.aclPage * this.aclPageSize, this.filteredAclFinancingRecords.length)
  }

  takeAction(kind: ExperienceActionKind): void {
    if (this.experience.id === 'acl') {
      if (kind === 'funds-request') this.openFundsRequest()
      return
    }
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

  openAclRecord(record: FinancingRecord): void {
    this.selectedAclRecord = record
  }

  closeAclRecord(): void {
    this.selectedAclRecord = null
  }

  openFundsRequest(): void {
    const opened = window.open(this.aclFundsRequestDemoUrl, '_blank', 'noopener,noreferrer')
    if (opened) {
      opened.opener = null
      return
    }

    this.toast = 'Your browser blocked the Funds Request tab. Allow pop-ups and try again.'
    this.cdr.markForCheck()
  }

  filterPaymentsDue(): void {
    this.closeAclOverlays()
    this.aclSearchQuery = ''
    this.aclStatusFilter = ''
    this.aclDueDateFilter = 'payments-due'
    this.aclPage = 1
    this.cdr.markForCheck()

    requestAnimationFrame(() => {
      document.getElementById('acl-financing-activity')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }

  openRepaymentDetails(returnRecord: FinancingRecord, method: RepaymentMethod = 'bank'): void {
    if (!this.nextRepaymentFor(returnRecord)) return
    this.selectedAclRecord = null
    this.repaymentReturnRecord = returnRecord
    this.repaymentMethod = method
    this.repaymentDetailsOpen = true
  }

  backToFinancingDetails(): void {
    const record = this.repaymentReturnRecord
    this.closeRepaymentDetails()
    if (record) this.selectedAclRecord = record
  }

  closeRepaymentDetails(): void {
    this.repaymentDetailsOpen = false
    this.repaymentReturnRecord = null
  }

  selectRepaymentMethod(method: RepaymentMethod): void {
    this.repaymentMethod = method
  }

  onAclFilterValuesChange(values: Record<string, string>): void {
    this.aclStatusFilter = values['status'] ?? ''
    this.aclDueDateFilter = values['dueDate'] ?? ''
    this.aclPage = 1
  }

  onAclSearchValueChange(value: string): void {
    this.aclSearchQuery = value
    this.aclPage = 1
  }

  changeAclPage(page: number): void {
    this.aclPage = Math.min(Math.max(1, page), this.aclTotalPages)
  }

  isDisbursedAdvance(record: FinancingRecord): boolean {
    return Boolean(record.disbursementDate)
  }

  recordDetailsEyebrow(record: FinancingRecord): string {
    return this.isDisbursedAdvance(record) ? 'Financing details' : 'Funds Request details'
  }

  recordAmountLabel(record: FinancingRecord): string {
    return this.isDisbursedAdvance(record) ? 'Amount Financed' : 'Requested Amount'
  }

  recordDisbursementDate(record: FinancingRecord): string {
    if (record.disbursementDate) return formatDate(record.disbursementDate)
    if (record.status === 'requested') return 'Pending'
    return 'Not disbursed'
  }

  tableFinancedAmount(record: FinancingRecord): string {
    return this.isDisbursedAdvance(record) ? formatKes(record.principal) : 'Not disbursed'
  }

  recordTotalRepaid(record: FinancingRecord): string {
    if (!this.isDisbursedAdvance(record)) return 'Not applicable'
    return record.totalRepaid ? formatKes(record.totalRepaid) : 'Nil'
  }

  recordOutstandingBalance(record: FinancingRecord): string {
    if (!this.isDisbursedAdvance(record)) return 'Not applicable'
    return formatKes(record.balance)
  }

  nextDueDateValue(record: FinancingRecord): string | null {
    const next = record.installments.find(item => item.status !== 'paid')
    if (next) return next.dueDate
    return record.installments.length
      ? record.installments[record.installments.length - 1].dueDate
      : null
  }

  nextDueDate(record: FinancingRecord): string {
    return formatDate(this.nextDueDateValue(record), true)
  }

  nextRepaymentFor(record: FinancingRecord): Installment | undefined {
    return record.installments.find(item => item.status !== 'paid')
  }

  recordPaymentsDueLabel(record: FinancingRecord): string {
    const count = record.installments.filter(item => item.status !== 'paid').length
    return `${count} ${count === 1 ? 'payment' : 'payments'} due`
  }

  installmentStatusLabel(status: Installment['status']): string {
    if (status === 'paid') return 'Paid'
    if (status === 'overdue') return 'Overdue'
    return 'Upcoming'
  }

  installmentStatusTone(status: Installment['status']): string {
    if (status === 'paid') return 'status-success'
    if (status === 'overdue') return 'status-danger'
    return 'status-info'
  }

  customerFinancingPeriodStatus(record: FinancingRecord): CustomerFinancingPeriodStatus | null {
    if (!record.disbursementDate) return null

    const rawStatus = String(record.status).trim().toLowerCase()
    const rawRule = FINANCING_STATUS_RULES[rawStatus]
    if (!rawRule?.customerFacing) return null

    if (rawStatus === 'live' && record.installments.some(item => item.status === 'overdue')) {
      const overdue = FINANCING_STATUS_RULES['overdue']
      return { key: overdue.key, label: overdue.label, tone: overdue.tone }
    }

    return { key: rawRule.key, label: rawRule.label, tone: rawRule.tone }
  }

  customerFinancingPeriodStatusLabel(record: FinancingRecord): string {
    return this.customerFinancingPeriodStatus(record)?.label ?? statusLabel(record.status)
  }

  customerFinancingPeriodStatusTone(record: FinancingRecord): string {
    return this.customerFinancingPeriodStatus(record)?.tone ?? statusTone(record.status)
  }

  fundsRequestReference(record: FinancingRecord): string {
    return record.fundsRequestId
      .replace(/^fr_/i, 'FR-')
      .replaceAll('_', '-')
      .toUpperCase()
  }

  async copyPaymentValue(value: string, label: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value)
      this.toast = `${label} copied.`
    } catch {
      this.toast = `${label}: ${value}`
    }
    this.cdr.markForCheck()
  }

  closeAclOverlays(): void {
    this.selectedAclRecord = null
    this.repaymentReturnRecord = null
    this.repaymentDetailsOpen = false
  }

  resetAclFilters(): void {
    this.aclStatusFilter = ''
    this.aclDueDateFilter = ''
    this.aclSearchQuery = ''
    this.aclPage = 1
  }

  private matchesAclDueDateFilter(record: FinancingRecord): boolean {
    if (!this.aclDueDateFilter) return true
    if (this.aclDueDateFilter === 'payments-due') {
      return record.installments.some(item => item.status === 'overdue' || item.status === 'upcoming')
    }
    if (this.aclDueDateFilter === 'overdue') return record.installments.some(item => item.status === 'overdue')
    if (this.aclDueDateFilter === 'upcoming') return record.installments.some(item => item.status === 'upcoming')
    return true
  }

  ngOnDestroy(): void {
    this.destroyed$.next()
    this.destroyed$.complete()
  }

  readonly business = BUSINESS
  readonly formatDate = formatDate
  readonly formatKes = formatKes
  readonly statusLabel = statusLabel
  readonly statusTone = statusTone
}

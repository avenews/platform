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
  type FinancingStatus,
  type Installment,
} from '../../shared/customer-portal.data'
import {
  experienceById,
  type ExperienceActionKind,
  type ExperienceId,
  type PortalExperience,
} from '../../core/experience/contextual-experience.data'
import { PortalExperienceService } from '../../core/experience/portal-experience.service'
import {
  CustomerFilterBarComponent,
  type CustomerFilterField,
} from '../../shared/customer-filter-bar.component'
import { PrototypeExplainerComponent } from '../../shared/prototype-explainer.component'

type RepaymentMethod = 'bank' | 'mpesa'

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

@Component({
  selector: 'app-contextual-home',
  standalone: true,
  imports: [PrototypeExplainerComponent, CustomerFilterBarComponent],
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

  readonly aclFinancingRecords: readonly FinancingRecord[] = FINANCING_RECORDS.filter(record => record.product === 'ACL')
  readonly aclFilterFields: readonly CustomerFilterField[] = [
    {
      key: 'status',
      label: 'Status',
      allLabel: 'All statuses',
      options: this.uniqueAclStatuses().map(status => ({ value: status, label: statusLabel(status) })),
    },
    {
      key: 'dueDate',
      label: 'Due date',
      allLabel: 'Any due date',
      options: [
        { value: 'upcoming', label: 'Upcoming' },
        { value: 'overdue', label: 'Overdue' },
        { value: 'no-schedule', label: 'No repayment schedule' },
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
  repaymentRecord: FinancingRecord | null = null
  fundsRequestOpen = false
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

  private uniqueAclStatuses(): FinancingStatus[] {
    return Array.from(new Set(this.aclFinancingRecords.map(record => record.status)))
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

  get nextAclRepaymentRecord(): FinancingRecord | undefined {
    return this.aclFinancingRecords.find(record =>
      record.installments.some(installment => installment.dueDate === BUSINESS.nextRepaymentDate),
    )
  }

  get nextAclInstallment(): Installment | undefined {
    return this.nextAclRepaymentRecord?.installments
      .find(installment => installment.dueDate === BUSINESS.nextRepaymentDate)
  }

  get nextAclInstallmentStatus(): string {
    const status = this.nextAclInstallment?.status ?? 'upcoming'
    return this.installmentStatusLabel(status)
  }

  get nextAclInstallmentTone(): string {
    const status = this.nextAclInstallment?.status ?? 'upcoming'
    return this.installmentStatusTone(status)
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
      .filter(record => !this.aclStatusFilter || record.status === this.aclStatusFilter)
      .filter(record => this.matchesAclDueDateFilter(record))
      .filter(record => {
        if (!query) return true
        return [
          record.partner,
          this.fundsRequestReference(record),
          statusLabel(record.status),
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
    this.fundsRequestOpen = true
  }

  closeFundsRequest(): void {
    this.fundsRequestOpen = false
  }

  completeFundsRequest(): void {
    this.fundsRequestOpen = false
    this.toast = 'Funds Request flow opened.'
  }

  openRepaymentDetails(record: FinancingRecord | undefined = this.nextAclRepaymentRecord, method: RepaymentMethod = 'bank'): void {
    if (!record) return
    this.selectedAclRecord = null
    this.repaymentRecord = record
    this.repaymentMethod = method
    this.repaymentDetailsOpen = true
  }

  closeRepaymentDetails(): void {
    this.repaymentDetailsOpen = false
    this.repaymentRecord = null
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

  nextDueDateValue(record: FinancingRecord): string | null {
    return record.installments.find(item => item.status !== 'paid')?.dueDate ?? null
  }

  nextDueDate(record: FinancingRecord): string {
    return formatDate(this.nextDueDateValue(record), true)
  }

  nextRepaymentFor(record: FinancingRecord): Installment | undefined {
    return record.installments.find(item => item.status !== 'paid')
  }

  knownRepaymentAmount(record: FinancingRecord): number | null {
    return record.id === this.nextAclRepaymentRecord?.id
      && this.nextDueDateValue(record) === BUSINESS.nextRepaymentDate
      ? BUSINESS.nextRepaymentAmount
      : null
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
    this.repaymentRecord = null
    this.fundsRequestOpen = false
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
    if (this.aclDueDateFilter === 'no-schedule') return !record.installments.some(item => item.status !== 'paid')
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

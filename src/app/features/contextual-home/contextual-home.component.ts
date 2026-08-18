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
  type Installment,
} from '../../shared/customer-portal.data'
import {
  experienceById,
  type ExperienceActionKind,
  type ExperienceId,
  type PortalExperience,
} from '../../core/experience/contextual-experience.data'
import { PortalExperienceService } from '../../core/experience/portal-experience.service'
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
  imports: [PrototypeExplainerComponent],
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

  readonly aclCreditLines: readonly CreditLine[] = CREDIT_LINES.filter(line => line.product === 'ACL')
  readonly aclFinancingRecords: readonly FinancingRecord[] = FINANCING_RECORDS.filter(record => record.product === 'ACL')
  readonly bankDetails = BANK_DETAILS
  readonly mpesaDetails = MPESA_DETAILS
  readonly clientPhone = PROFILE.contact.phone ?? 'Client phone number'
  readonly aclPageSize = 5

  aclPage = 1
  selectedAclRecord: FinancingRecord | null = null
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
        this.cdr.markForCheck()
      })
  }

  private resolveExperience(): PortalExperience {
    const id = this.route.parent?.snapshot.paramMap.get('experienceId')
    return experienceById(id) ?? experienceById('acl')!
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
    return this.aclCreditLines.find(line => line.id === 'cl_acl_general') ?? this.aclCreditLines[0]
  }

  get nextAclInstallment(): Installment | undefined {
    return this.aclFinancingRecords
      .flatMap(record => record.installments)
      .find(installment => installment.dueDate === BUSINESS.nextRepaymentDate)
  }

  get nextAclInstallmentStatus(): string {
    const status = this.nextAclInstallment?.status ?? 'upcoming'
    if (status === 'paid') return 'Paid'
    if (status === 'overdue') return 'Overdue'
    return 'Upcoming'
  }

  get nextAclInstallmentTone(): string {
    const status = this.nextAclInstallment?.status ?? 'upcoming'
    if (status === 'paid') return 'status-success'
    if (status === 'overdue') return 'status-danger'
    return 'status-info'
  }

  get aclPageItems(): readonly FinancingRecord[] {
    const start = (this.aclPage - 1) * this.aclPageSize
    return this.aclFinancingRecords.slice(start, start + this.aclPageSize)
  }

  get aclTotalPages(): number {
    return Math.max(1, Math.ceil(this.aclFinancingRecords.length / this.aclPageSize))
  }

  get aclPageNumbers(): readonly number[] {
    return Array.from({ length: this.aclTotalPages }, (_, index) => index + 1)
  }

  get aclRangeStart(): number {
    return this.aclFinancingRecords.length ? (this.aclPage - 1) * this.aclPageSize + 1 : 0
  }

  get aclRangeEnd(): number {
    return Math.min(this.aclPage * this.aclPageSize, this.aclFinancingRecords.length)
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
    this.toast = 'Agri Credit Line Funds Request prototype opened.'
  }

  openRepaymentDetails(method: RepaymentMethod = 'bank'): void {
    this.selectedAclRecord = null
    this.repaymentMethod = method
    this.repaymentDetailsOpen = true
  }

  closeRepaymentDetails(): void {
    this.repaymentDetailsOpen = false
  }

  selectRepaymentMethod(method: RepaymentMethod): void {
    this.repaymentMethod = method
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
    this.fundsRequestOpen = false
    this.repaymentDetailsOpen = false
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

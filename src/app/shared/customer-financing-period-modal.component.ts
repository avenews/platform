import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  type OnChanges,
  type SimpleChanges,
} from '@angular/core'
import { PROFILE, formatDate, formatKes } from './customer-portal.data'
import type {
  CustomerFinancingPeriod,
  CustomerInstalment,
  InstalmentStatus,
} from '../core/experience/customer-product-workspace.data'
import { documentsForPeriod } from '../core/experience/financing-documents.data'

type RepaymentMethod = 'bank' | 'mpesa'

const FUNDS_REQUEST_SNAPSHOT_URL = '/demo-documents/funds-request-snapshot-demo.pdf'

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
  selector: 'app-customer-financing-period-modal',
  standalone: true,
  template: `
    @if (period && !repaymentOpen && !documentsOpen) {
      <div class="baseline-modal-backdrop customer-period-backdrop" role="presentation" (click)="close.emit()">
        <section class="baseline-modal customer-period-modal" role="dialog" aria-modal="true" [attr.aria-labelledby]="period.id + '-title'" (click)="$event.stopPropagation()">
          <header class="baseline-modal__head customer-period-modal__head">
            <div class="customer-period-modal__heading">
              @if (backLabel) {
                <button type="button" class="baseline-button baseline-button--secondary customer-modal-back" (click)="back.emit()">
                  <span aria-hidden="true">←</span><span>{{ backLabel }}</span>
                </button>
              }
              <div><p class="page-eyebrow">Financing period details</p><h2 [id]="period.id + '-title'">{{ period.reference }}</h2></div>
            </div>
            <button type="button" class="baseline-modal__close" aria-label="Close" (click)="close.emit()">&times;</button>
          </header>

          <div class="baseline-modal__body customer-period-modal__body">
            <div class="customer-period-modal__summary">
              <span class="baseline-financing-cell"><strong>{{ period.relationshipName }}</strong>@if (productId !== 'acl') { <span>{{ customerRelationshipType }}</span> }</span>
              <span class="baseline-status" [class]="'baseline-status ' + period.statusTone">{{ period.statusLabel }}</span>
            </div>

            @if (overdueInstalments.length) {
              <section class="customer-overdue" aria-label="Overdue instalments">
                <div><p class="page-eyebrow">Needs attention</p><h3>Overdue instalments</h3></div>
                <div class="customer-instalment-list customer-instalment-list--overdue">
                  @for (instalment of overdueInstalments; track instalment.label + instalment.dueDate) {
                    <div class="customer-instalment-row">
                      <div><strong>{{ instalment.label }}</strong><span>{{ formatKes(instalment.amount) }} · Due {{ formatDate(instalment.dueDate) }}</span></div>
                      <span class="baseline-status status-danger">Overdue</span>
                    </div>
                  }
                </div>
              </section>
            } @else if (period.statusKey === 'overdue' && period.settlementMode === 'buyer-payment') {
              <section class="customer-overdue customer-overdue--buyer"><div><p class="page-eyebrow">Needs attention</p><h3>Buyer payment overdue</h3></div><strong>{{ formatKes(period.outstandingBalance) }} outstanding</strong><span>Due {{ formatDate(period.repaymentDueDate) }}</span></section>
            }

            <dl class="customer-period-details">
              <div><dt>Disbursement Date</dt><dd>{{ period.disbursementDate ? formatDate(period.disbursementDate) : 'Pending' }}</dd></div>
              <div><dt>{{ dueDateLabel }}</dt><dd>{{ formatDate(period.repaymentDueDate) }}</dd></div>
              <div><dt>Amount Financed</dt><dd>{{ formatKes(period.amountFinanced) }}</dd></div>
              <div><dt>{{ totalRepaidLabel }}</dt><dd>{{ formatKes(period.totalRepaid) }}</dd></div>
              <div><dt>{{ outstandingLabel }}</dt><dd>{{ formatKes(period.outstandingBalance) }}</dd></div>
            </dl>

            @if (canRequestFunds) {
              <button type="button" class="baseline-button baseline-button--primary baseline-button--block customer-period-request" (click)="requestFunds.emit(period)">Request funds</button>
            }

            @if (period.instalments.length) {
              <section class="customer-instalments" aria-label="Repayment schedule">
                <div class="customer-instalments__heading"><div><p class="page-eyebrow">Repayment schedule</p><h3>Instalments</h3></div></div>
                <div class="customer-instalment-list">
                  @for (instalment of period.instalments; track instalment.label + instalment.dueDate) {
                    <div class="customer-instalment-row"><div><strong>{{ instalment.label }}</strong><span>{{ formatKes(instalment.amount) }} · Due {{ formatDate(instalment.dueDate) }}</span></div><span class="baseline-status" [class]="'baseline-status ' + instalmentTone(instalment.status)">{{ instalmentLabel(instalment.status) }}</span></div>
                  }
                </div>
              </section>
            } @else if (period.settlementMode !== 'buyer-payment' && period.amountDue > 0) {
              <section class="customer-instalments" aria-label="Repayment schedule">
                <div class="customer-instalments__heading"><div><p class="page-eyebrow">Repayment schedule</p><h3>Single repayment</h3></div></div>
                <div class="customer-single-repayment"><span>Amount due</span><strong>{{ formatKes(period.amountDue) }}</strong><small>Due {{ formatDate(period.repaymentDueDate) }}</small></div>
              </section>
            }

            <div class="customer-period-footer-actions" [class.is-single]="period.outstandingBalance <= 0">
              <button type="button" class="baseline-button baseline-button--secondary baseline-button--block" (click)="openDocuments()">Files</button>
              @if (period.outstandingBalance > 0) {
                <button type="button" class="baseline-button baseline-button--secondary baseline-button--block" (click)="openRepayment()">{{ repaymentActionLabel }}</button>
              }
            </div>
          </div>
        </section>
      </div>
    }

    @if (period && documentsOpen) {
      <div class="baseline-modal-backdrop customer-period-backdrop" role="presentation" (click)="closeDocuments()">
        <section class="baseline-modal customer-period-modal" role="dialog" aria-modal="true" [attr.aria-labelledby]="period.id + '-documents-title'" (click)="$event.stopPropagation()">
          <header class="baseline-modal__head customer-period-modal__head">
            <div class="customer-period-modal__heading">
              <button type="button" class="baseline-button baseline-button--secondary customer-modal-back" (click)="closeDocuments()"><span aria-hidden="true">←</span><span>Back</span></button>
              <div><p class="page-eyebrow">Documents</p><h2 [id]="period.id + '-documents-title'">Files</h2><small>{{ period.reference }}</small></div>
            </div>
            <button type="button" class="baseline-modal__close" aria-label="Close" (click)="close.emit()">&times;</button>
          </header>
          <div class="baseline-modal__body customer-period-modal__body">
            <div class="customer-document-list">
              <div class="customer-document-row customer-document-row--legal"><span><strong>Funds Request snapshot</strong><small>Immutable legal snapshot generated after submission · PDF</small></span><a class="baseline-button baseline-button--secondary" [href]="fundsRequestSnapshotUrl" target="_blank" rel="noopener noreferrer">View PDF</a></div>
              @for (document of periodDocuments; track document.id) {
                <div class="customer-document-row"><span><strong>{{ document.type }}</strong><small>{{ document.reference }} · {{ document.fileName }}</small></span><a class="baseline-button baseline-button--secondary" [href]="document.fileUrl" target="_blank" rel="noopener noreferrer">{{ document.type === 'Invoice' ? 'View invoice' : 'View' }}</a></div>
              }
            </div>
          </div>
        </section>
      </div>
    }

    @if (period && repaymentOpen) {
      <div class="baseline-modal-backdrop customer-period-backdrop" role="presentation" (click)="closeRepayment()">
        <section class="baseline-modal customer-period-modal" role="dialog" aria-modal="true" [attr.aria-labelledby]="period.id + '-repayment-title'" (click)="$event.stopPropagation()">
          <header class="baseline-modal__head customer-period-modal__head">
            <div class="customer-period-modal__heading"><button type="button" class="baseline-button baseline-button--secondary customer-modal-back" (click)="closeRepayment()"><span aria-hidden="true">←</span><span>Back</span></button><div><p class="page-eyebrow">{{ repaymentEyebrow }}</p><h2 [id]="period.id + '-repayment-title'">{{ period.reference }}</h2></div></div>
            <button type="button" class="baseline-modal__close" aria-label="Close" (click)="close.emit()">&times;</button>
          </header>
          <div class="baseline-modal__body customer-period-modal__body">
            <div class="customer-repayment-summary"><span>{{ amountDueLabel }}</span><strong>{{ formatKes(period.amountDue) }}</strong><small>{{ period.relationshipName }} · Due {{ formatDate(period.repaymentDueDate) }}</small></div>
            @if (period.settlementMode === 'buyer-payment') {
              <section class="customer-settlement-card"><div><span>Buyer</span><strong>{{ period.relationshipName }}</strong></div><div><span>Payment destination</span><strong>Your Avenews Clearing Account</strong></div><div><span>Financing period</span><strong>{{ period.reference }}</strong></div></section>
              <div class="customer-period-note">When the buyer pays, Avenews settles the outstanding financing and sends any remaining amount to you.</div>
            } @else {
              <div class="customer-payment-methods" role="tablist" aria-label="Repayment method"><button type="button" role="tab" [attr.aria-selected]="repaymentMethod === 'bank'" [class.is-active]="repaymentMethod === 'bank'" (click)="repaymentMethod = 'bank'">Bank Transfer</button><button type="button" role="tab" [attr.aria-selected]="repaymentMethod === 'mpesa'" [class.is-active]="repaymentMethod === 'mpesa'" (click)="repaymentMethod = 'mpesa'">M-Pesa Paybill</button></div>
              <div class="customer-payment-details">
                @for (item of repaymentMethod === 'bank' ? bankDetails : mpesaDetails; track item.label) { <div><span><small>{{ item.label }}</small><strong>{{ item.value }}</strong></span><button type="button" (click)="copy(item.value, item.label)">Copy</button></div> }
                @if (repaymentMethod === 'mpesa') { <div><span><small>Account Number</small><strong>{{ clientPhone }}</strong><em>Use your registered phone number</em></span><button type="button" (click)="copy(clientPhone, 'Account Number')">Copy</button></div> }
              </div>
            }
          </div>
        </section>
      </div>
    }

    @if (toast) { <button type="button" class="baseline-toast" (click)="toast = ''">{{ toast }}</button> }
  `,
  styles: [`
    :host { display: contents; }
    .customer-period-backdrop { display:flex; align-items:center; justify-content:center; padding:24px; }
    .customer-period-modal { width:min(100%,720px); max-height:min(88dvh,860px); display:flex; flex-direction:column; overflow:hidden; margin:0; border-radius:14px; }
    .customer-period-modal__head { flex:0 0 auto; }
    .customer-period-modal__heading { min-width:0; display:grid; gap:8px; }
    .customer-period-modal__heading > div { display:grid; gap:4px; min-width:0; }
    .customer-period-modal__heading p, .customer-period-modal__heading h2, .customer-period-modal__heading small { margin:0; }
    .customer-period-modal__heading small { color:var(--av-color-text-muted,#66788a); }
    .customer-modal-back { width:fit-content; min-height:36px; justify-self:start; padding-inline:12px; }
    .customer-period-modal__body { min-height:0; flex:1 1 auto; overflow-y:auto; overscroll-behavior:contain; -webkit-overflow-scrolling:touch; display:grid; align-content:start; gap:16px; }
    .customer-period-modal__summary { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; }
    .customer-period-details { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); grid-auto-rows:minmax(66px,auto); margin:0; overflow:visible; border:1px solid var(--av-color-surface-border,#e1e7eb); border-radius:10px; background:#fff; }
    .customer-period-details > div { min-width:0; display:grid; align-content:center; gap:4px; padding:13px 15px; border-right:1px solid var(--av-color-surface-border,#e1e7eb); border-bottom:1px solid var(--av-color-surface-border,#e1e7eb); }
    .customer-period-details > div:nth-child(2n) { border-right:0; }
    .customer-period-details > div:last-child:nth-child(odd) { grid-column:1/-1; border-right:0; }
    .customer-period-details > div:last-child { border-bottom:0; }
    .customer-period-details > div:nth-last-child(2):nth-child(odd) { border-bottom:0; }
    .customer-period-details dt,.customer-period-details dd { margin:0; }
    .customer-period-details dt { color:var(--av-color-text-muted,#66788a); font-size:11px; }
    .customer-period-details dd { color:var(--av-color-text-heading,#0d343f); font-size:13px; font-weight:700; overflow-wrap:anywhere; }
    .customer-period-footer-actions { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
    .customer-period-footer-actions.is-single { grid-template-columns:1fr; }
    .customer-period-request { margin:0; }
    .customer-overdue { display:grid; gap:10px; padding:14px; border:1px solid #efb4b4; border-radius:10px; background:#fff4f4; }
    .customer-overdue p,.customer-overdue h3 { margin:0; }
    .customer-overdue h3 { color:var(--av-color-text-heading,#0d343f); font-size:16px; }
    .customer-overdue--buyer > strong { color:#c8322b; font-size:20px; }
    .customer-overdue--buyer > span { color:var(--av-color-text-muted,#66788a); font-size:12px; }
    .customer-instalments,.customer-instalments__heading > div { display:grid; gap:10px; }
    .customer-instalments__heading p,.customer-instalments__heading h3 { margin:0; }
    .customer-instalments__heading h3 { color:var(--av-color-text-heading,#0d343f); font-size:16px; }
    .customer-instalment-list,.customer-document-list,.customer-payment-details,.customer-settlement-card { overflow:hidden; border:1px solid var(--av-color-surface-border,#e1e7eb); border-radius:10px; background:#fff; }
    .customer-instalment-list--overdue { border-color:#efb4b4; }
    .customer-instalment-row,.customer-document-row,.customer-payment-details > div,.customer-settlement-card > div { display:flex; align-items:center; justify-content:space-between; gap:14px; padding:12px 14px; border-bottom:1px solid var(--av-color-surface-border,#e1e7eb); }
    .customer-instalment-row:last-child,.customer-document-row:last-child,.customer-payment-details > div:last-child,.customer-settlement-card > div:last-child { border-bottom:0; }
    .customer-instalment-row > div,.customer-document-row > span,.customer-payment-details > div > span { min-width:0; display:grid; gap:3px; }
    .customer-instalment-row strong,.customer-document-row strong,.customer-payment-details strong,.customer-settlement-card strong { color:var(--av-color-text-heading,#0d343f); font-size:13px; }
    .customer-instalment-row span:not(.baseline-status),.customer-document-row small,.customer-payment-details small,.customer-payment-details em,.customer-settlement-card span { color:var(--av-color-text-muted,#66788a); font-size:11px; font-style:normal; overflow-wrap:anywhere; }
    .customer-document-row--legal { background:var(--av-color-surface-subtle,#f6f7f9); }
    .customer-single-repayment,.customer-repayment-summary { display:grid; gap:3px; padding:15px; border:1px solid var(--av-color-surface-border,#e1e7eb); border-radius:10px; background:#fff; }
    .customer-repayment-summary { border-color:var(--av-color-primary-border,#bdeff3); background:var(--av-color-primary-subtle,#eefbfc); }
    .customer-single-repayment span,.customer-single-repayment small,.customer-repayment-summary span,.customer-repayment-summary small { color:var(--av-color-text-muted,#66788a); font-size:11px; }
    .customer-single-repayment strong { color:var(--av-color-text-heading,#0d343f); font-size:20px; }
    .customer-repayment-summary strong { color:var(--av-color-text-heading,#0d343f); font-size:24px; }
    .customer-period-note { padding:13px 15px; border:1px solid var(--av-color-surface-border,#e1e7eb); border-radius:10px; background:var(--av-color-surface-subtle,#f6f7f9); color:var(--av-color-text-muted,#66788a); font-size:12px; line-height:1.55; }
    .customer-payment-methods { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; padding:4px; border-radius:9px; background:var(--av-color-surface-subtle,#f6f7f9); }
    .customer-payment-methods button { min-height:42px; border:1px solid transparent; border-radius:7px; background:transparent; color:var(--av-color-text,#25384a); font:inherit; font-size:13px; font-weight:700; cursor:pointer; }
    .customer-payment-methods button.is-active { border-color:var(--av-color-primary-border,#bdeff3); background:#fff; color:var(--av-color-action,#16b3c4); }
    .customer-payment-details button { flex:0 0 auto; min-height:34px; padding:0 12px; border:1px solid var(--av-color-surface-border,#dfe4e8); border-radius:6px; background:#fff; color:var(--av-color-text-heading,#0d343f); font:inherit; font-size:11px; font-weight:700; cursor:pointer; }
    @media (max-width:767px) {
      .customer-period-backdrop { align-items:flex-end; padding:0; }
      .customer-period-modal { width:100%; max-height:92dvh; border-radius:18px 18px 0 0; border-bottom:0; }
      .customer-period-modal__body { gap:14px; }
      .customer-period-details { grid-template-columns:1fr; grid-auto-rows:minmax(62px,auto); }
      .customer-period-details > div,.customer-period-details > div:last-child:nth-child(odd) { grid-column:auto; border-right:0; }
      .customer-period-details > div { border-bottom:1px solid var(--av-color-surface-border,#e1e7eb); }
      .customer-period-details > div:last-child { border-bottom:0; }
      .customer-instalment-row,.customer-document-row,.customer-payment-details > div,.customer-settlement-card > div { align-items:flex-start; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerFinancingPeriodModalComponent implements OnChanges {
  @Input() period: CustomerFinancingPeriod | null = null
  @Input() productId = ''
  @Input() dueDateLabel = 'Repayment Due Date'
  @Input() totalRepaidLabel = 'Total Repaid'
  @Input() outstandingLabel = 'Outstanding Balance'
  @Input() backLabel: string | null = null
  @Output() readonly requestFunds = new EventEmitter<CustomerFinancingPeriod>()
  @Output() readonly back = new EventEmitter<void>()
  @Output() readonly close = new EventEmitter<void>()

  repaymentOpen = false
  documentsOpen = false
  repaymentMethod: RepaymentMethod = 'bank'
  toast = ''

  readonly bankDetails = BANK_DETAILS
  readonly mpesaDetails = MPESA_DETAILS
  readonly clientPhone = PROFILE.contact.phone ?? 'Your registered phone number'
  readonly fundsRequestSnapshotUrl = FUNDS_REQUEST_SNAPSHOT_URL
  readonly formatDate = formatDate
  readonly formatKes = formatKes

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['period']) {
      this.repaymentOpen = false
      this.documentsOpen = false
      this.repaymentMethod = 'bank'
      this.toast = ''
    }
  }

  get customerRelationshipType(): string {
    const type = this.period?.relationshipType ?? ''
    if (type.includes('Supplier')) return 'Supplier'
    if (type.includes('Buyer')) return 'Buyer'
    return type
  }

  get periodDocuments() {
    return this.period ? documentsForPeriod(this.period.id) : []
  }

  get overdueInstalments(): readonly CustomerInstalment[] {
    return this.period?.instalments.filter(instalment => instalment.status === 'overdue') ?? []
  }

  get canRequestFunds(): boolean {
    if (this.productId !== 'invoice-financing' || !this.period) return false
    if ((this.period.availableToWithdraw ?? 0) <= 0) return false
    if (this.period.statusKey !== 'live' && this.period.statusKey !== 'requested') return false
    const dueDate = new Date(`${this.period.repaymentDueDate}T00:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const daysToDue = Math.ceil((dueDate.getTime() - today.getTime()) / 86_400_000)
    return daysToDue >= 7 && daysToDue <= 60
  }

  get repaymentActionLabel(): string { return this.period?.settlementMode === 'buyer-payment' ? 'Payment details' : 'Repayment details' }
  get repaymentEyebrow(): string { return this.period?.settlementMode === 'buyer-payment' ? 'Payment details' : 'Repayment details' }
  get amountDueLabel(): string { return this.period?.settlementMode === 'buyer-payment' ? 'Outstanding amount' : 'Amount due' }

  instalmentLabel(status: InstalmentStatus): string {
    if (status === 'paid') return 'Paid'
    if (status === 'overdue') return 'Overdue'
    if (status === 'scheduled') return 'Scheduled'
    return 'Upcoming'
  }

  instalmentTone(status: InstalmentStatus): string {
    if (status === 'paid') return 'status-success'
    if (status === 'overdue') return 'status-danger'
    if (status === 'scheduled') return 'status-warning'
    return 'status-info'
  }

  openDocuments(): void { this.documentsOpen = true }
  closeDocuments(): void { this.documentsOpen = false }
  openRepayment(): void { this.repaymentOpen = true }
  closeRepayment(): void { this.repaymentOpen = false }

  async copy(value: string, label: string): Promise<void> {
    try { await navigator.clipboard.writeText(value); this.toast = `${label} copied.` }
    catch { this.toast = `${label}: ${value}` }
  }
}

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
  InstalmentStatus,
} from '../core/experience/customer-product-workspace.data'

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
  selector: 'app-customer-financing-period-modal',
  standalone: true,
  template: `
    @if (period && !repaymentOpen) {
      <div class="baseline-modal-backdrop customer-period-backdrop" role="presentation" (click)="close.emit()">
        <section
          class="baseline-modal customer-period-modal"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="period.id + '-title'"
          (click)="$event.stopPropagation()"
        >
          <header class="baseline-modal__head customer-period-modal__head">
            <div>
              <p class="page-eyebrow">{{ detailEyebrow }}</p>
              <h2 [id]="period.id + '-title'">{{ period.reference }}</h2>
            </div>
            <button type="button" class="baseline-modal__close" aria-label="Close" (click)="close.emit()">&times;</button>
          </header>

          <div class="baseline-modal__body customer-period-modal__body">
            <div class="customer-period-modal__summary">
              <span class="baseline-financing-cell">
                <strong>{{ period.relationshipName }}</strong>
                @if (productId !== 'acl') {
                  <span>{{ customerRelationshipType }}</span>
                }
              </span>
              <span class="baseline-status" [class]="'baseline-status ' + period.statusTone">{{ period.statusLabel }}</span>
            </div>

            <dl class="customer-period-details">
              <div title="The date Avenews disbursed the approved financing."><dt>Disbursement Date</dt><dd>{{ period.disbursementDate ? formatDate(period.disbursementDate) : 'Pending' }}</dd></div>
              <div><dt>{{ dueDateLabel }}</dt><dd>{{ formatDate(period.repaymentDueDate) }}</dd></div>
              <div><dt>Amount Financed</dt><dd>{{ formatKes(period.amountFinanced) }}</dd></div>
              <div><dt>{{ totalRepaidLabel }}</dt><dd>{{ formatKes(period.totalRepaid) }}</dd></div>
              <div><dt>{{ outstandingLabel }}</dt><dd>{{ formatKes(period.outstandingBalance) }}</dd></div>
              @if (period.settlementMode === 'buyer-payment') {
                <div><dt>Settlement</dt><dd>Buyer payment</dd></div>
              }
              @if (period.invoiceReference && productId !== 'abf') {
                <div><dt>Invoice</dt><dd>{{ period.invoiceReference }}</dd></div>
              }
              @if (period.invoiceType) {
                <div><dt>Invoice type</dt><dd>{{ period.invoiceType }}</dd></div>
              }
              @if (period.eligibleReceivables !== undefined) {
                <div><dt>Eligible Receivables</dt><dd>{{ formatKes(period.eligibleReceivables) }}</dd></div>
              }
              @if (period.availableToWithdraw !== undefined) {
                <div><dt>Available to Withdraw</dt><dd>{{ formatKes(period.availableToWithdraw) }}</dd></div>
              }
              @if (period.financedDays) {
                <div><dt>Financing Period</dt><dd>{{ period.financedDays }} days</dd></div>
              }
            </dl>

            @if (canRequestFunds) {
              <button
                type="button"
                class="baseline-button baseline-button--primary baseline-button--block customer-period-request"
                (click)="requestFunds.emit(period)"
              >Request funds</button>
            }

            <section class="customer-instalments" aria-label="Repayment schedule">
              <div class="customer-instalments__heading">
                <div>
                  <p class="page-eyebrow">{{ period.settlementMode === 'buyer-payment' ? 'Settlement' : 'Repayment schedule' }}</p>
                  <h3>{{ period.instalments.length ? 'Instalments' : singleRepaymentHeading }}</h3>
                </div>
              </div>

              @if (period.instalments.length) {
                <div class="customer-instalment-list">
                  @for (instalment of period.instalments; track instalment.label + instalment.dueDate) {
                    <div class="customer-instalment-row">
                      <div>
                        <strong>{{ instalment.label }}</strong>
                        <span>{{ formatKes(instalment.amount) }} · Due {{ formatDate(instalment.dueDate) }}</span>
                      </div>
                      <span class="baseline-status" [class]="'baseline-status ' + instalmentTone(instalment.status)">{{ instalmentLabel(instalment.status) }}</span>
                    </div>
                  }
                </div>
              } @else {
                <div class="customer-single-repayment">
                  <span>{{ singleRepaymentLabel }}</span>
                  <strong>{{ formatKes(period.amountDue) }}</strong>
                  <small>Due {{ formatDate(period.repaymentDueDate) }}</small>
                </div>
              }
            </section>

            @if (period.outstandingBalance > 0) {
              <button
                type="button"
                class="baseline-button baseline-button--secondary baseline-button--block"
                (click)="openRepayment()"
              >{{ repaymentActionLabel }}</button>
            }
          </div>
        </section>
      </div>
    }

    @if (period && repaymentOpen) {
      <div class="baseline-modal-backdrop customer-period-backdrop" role="presentation" (click)="closeRepayment()">
        <section
          class="baseline-modal customer-period-modal customer-repayment-modal"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="period.id + '-repayment-title'"
          (click)="$event.stopPropagation()"
        >
          <header class="baseline-modal__head customer-period-modal__head customer-repayment-modal__head">
            <div class="customer-repayment-modal__heading">
              <button type="button" class="customer-modal-back" aria-label="Back to financing period" (click)="closeRepayment()">‹ <span>Back</span></button>
              <div>
                <p class="page-eyebrow">{{ repaymentEyebrow }}</p>
                <h2 [id]="period.id + '-repayment-title'">{{ period.reference }}</h2>
              </div>
            </div>
            <button type="button" class="baseline-modal__close" aria-label="Close" (click)="close.emit()">&times;</button>
          </header>

          <div class="baseline-modal__body customer-period-modal__body">
            <div class="customer-repayment-summary">
              <span>{{ amountDueLabel }}</span>
              <strong>{{ formatKes(period.amountDue) }}</strong>
              <small>{{ period.relationshipName }} · Due {{ formatDate(period.repaymentDueDate) }}</small>
            </div>

            @if (period.settlementMode === 'buyer-payment') {
              <section class="customer-settlement-card">
                <div><span>Buyer</span><strong>{{ period.relationshipName }}</strong></div>
                <div><span>Payment destination</span><strong>Client Clearing Account managed by Avenews</strong></div>
                <div><span>Dynamic Period</span><strong>{{ period.reference }}</strong></div>
              </section>

              <div class="customer-period-note">
                The Buyer payment is applied to this Dynamic Period. Avenews settles the financing and transfers any remaining proceeds according to your financing arrangement.
              </div>
            } @else {
              <div class="customer-payment-methods" role="tablist" aria-label="Repayment method">
                <button type="button" role="tab" [attr.aria-selected]="repaymentMethod === 'bank'" [class.is-active]="repaymentMethod === 'bank'" (click)="repaymentMethod = 'bank'">Bank Transfer</button>
                <button type="button" role="tab" [attr.aria-selected]="repaymentMethod === 'mpesa'" [class.is-active]="repaymentMethod === 'mpesa'" (click)="repaymentMethod = 'mpesa'">M-Pesa Paybill</button>
              </div>

              @if (repaymentMethod === 'bank') {
                <div class="customer-payment-details" role="tabpanel">
                  @for (item of bankDetails; track item.label) {
                    <div><span><small>{{ item.label }}</small><strong>{{ item.value }}</strong></span><button type="button" (click)="copy(item.value, item.label)">Copy</button></div>
                  }
                </div>
              } @else {
                <div class="customer-payment-details" role="tabpanel">
                  @for (item of mpesaDetails; track item.label) {
                    <div><span><small>{{ item.label }}</small><strong>{{ item.value }}</strong></span><button type="button" (click)="copy(item.value, item.label)">Copy</button></div>
                  }
                  <div><span><small>Account Number</small><strong>{{ clientPhone }}</strong><em>Use your registered phone number</em></span><button type="button" (click)="copy(clientPhone, 'Account Number')">Copy</button></div>
                </div>
              }
            }
          </div>
        </section>
      </div>
    }

    @if (toast) {
      <button type="button" class="baseline-toast" (click)="toast = ''">{{ toast }}</button>
    }
  `,
  styles: [`
    :host { display: contents; }

    .customer-period-backdrop {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .customer-period-modal {
      width: min(100%, 680px);
      max-height: min(88dvh, 860px);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      margin: 0;
      border-radius: 14px;
    }

    .customer-period-modal__head { flex: 0 0 auto; }
    .customer-period-modal__head > div,
    .customer-repayment-modal__heading > div { display: grid; gap: 4px; min-width: 0; }
    .customer-period-modal__head p,
    .customer-period-modal__head h2 { margin: 0; }

    .customer-period-modal__body {
      min-height: 0;
      flex: 1 1 auto;
      overflow-y: auto;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
    }

    .customer-period-modal__summary {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
    }

    .customer-period-details {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      margin: 0;
      overflow: hidden;
      border: 1px solid var(--av-color-surface-border, #e1e7eb);
      border-radius: 10px;
      background: #fff;
    }

    .customer-period-details > div {
      display: grid;
      gap: 4px;
      padding: 13px 15px;
      border-right: 1px solid var(--av-color-surface-border, #e1e7eb);
      border-bottom: 1px solid var(--av-color-surface-border, #e1e7eb);
    }

    .customer-period-details > div:nth-child(2n) { border-right: 0; }
    .customer-period-details dt,
    .customer-period-details dd { margin: 0; }
    .customer-period-details dt { color: var(--av-color-text-muted, #66788a); font-size: 11px; }
    .customer-period-details dd { color: var(--av-color-text-heading, #0d343f); font-size: 13px; font-weight: 700; overflow-wrap: anywhere; }

    .customer-period-request {
      border-color: var(--av-color-success, #16865b) !important;
      background: var(--av-color-success, #16865b) !important;
      color: #fff !important;
    }

    .customer-instalments,
    .customer-instalments__heading > div { display: grid; gap: 10px; }
    .customer-instalments__heading p,
    .customer-instalments__heading h3 { margin: 0; }
    .customer-instalments__heading h3 { color: var(--av-color-text-heading, #0d343f); font-size: 16px; }

    .customer-instalment-list {
      overflow: hidden;
      border: 1px solid var(--av-color-surface-border, #e1e7eb);
      border-radius: 10px;
      background: #fff;
    }

    .customer-instalment-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 13px 15px;
      border-bottom: 1px solid var(--av-color-surface-border, #e1e7eb);
    }

    .customer-instalment-row:last-child { border-bottom: 0; }
    .customer-instalment-row > div { display: grid; gap: 3px; min-width: 0; }
    .customer-instalment-row strong { color: var(--av-color-text-heading, #0d343f); font-size: 13px; }
    .customer-instalment-row span:not(.baseline-status) { color: var(--av-color-text-muted, #66788a); font-size: 11px; }

    .customer-single-repayment {
      display: grid;
      gap: 3px;
      padding: 15px;
      border: 1px solid var(--av-color-surface-border, #e1e7eb);
      border-radius: 10px;
      background: #fff;
    }
    .customer-single-repayment span,
    .customer-single-repayment small { color: var(--av-color-text-muted, #66788a); font-size: 11px; }
    .customer-single-repayment strong { color: var(--av-color-text-heading, #0d343f); font-size: 20px; }

    .customer-repayment-modal__heading { min-width: 0; display: grid; gap: 7px; }
    .customer-modal-back {
      width: fit-content;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 0;
      border: 0;
      background: transparent;
      color: var(--av-color-action, #16b3c4);
      font: inherit;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }

    .customer-repayment-summary {
      display: grid;
      gap: 3px;
      padding: 16px;
      border: 1px solid var(--av-color-primary-border, #bdeff3);
      border-radius: 10px;
      background: var(--av-color-primary-subtle, #eefbfc);
    }
    .customer-repayment-summary span,
    .customer-repayment-summary small { color: var(--av-color-text-muted, #66788a); font-size: 11px; }
    .customer-repayment-summary strong { color: var(--av-color-text-heading, #0d343f); font-size: 24px; }

    .customer-period-note,
    .customer-settlement-card,
    .customer-payment-details {
      overflow: hidden;
      border: 1px solid var(--av-color-surface-border, #e1e7eb);
      border-radius: 10px;
      background: #fff;
    }

    .customer-period-note {
      padding: 13px 15px;
      background: var(--av-color-surface-subtle, #f6f7f9);
      color: var(--av-color-text-muted, #66788a);
      font-size: 12px;
      line-height: 1.55;
    }

    .customer-settlement-card > div,
    .customer-payment-details > div {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 13px 14px;
      border-bottom: 1px solid var(--av-color-surface-border, #e1e7eb);
    }
    .customer-settlement-card > div:last-child,
    .customer-payment-details > div:last-child { border-bottom: 0; }
    .customer-settlement-card span,
    .customer-payment-details small,
    .customer-payment-details em { color: var(--av-color-text-muted, #66788a); font-size: 11px; font-style: normal; }
    .customer-settlement-card strong,
    .customer-payment-details strong { color: var(--av-color-text-heading, #0d343f); font-size: 13px; text-align: right; overflow-wrap: anywhere; }

    .customer-payment-methods {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      padding: 4px;
      border-radius: 9px;
      background: var(--av-color-surface-subtle, #f6f7f9);
    }
    .customer-payment-methods button {
      min-height: 42px;
      border: 1px solid transparent;
      border-radius: 7px;
      background: transparent;
      color: var(--av-color-text, #25384a);
      font: inherit;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    .customer-payment-methods button.is-active {
      border-color: var(--av-color-primary-border, #bdeff3);
      background: #fff;
      color: var(--av-color-action, #16b3c4);
      box-shadow: 0 1px 3px rgba(16, 24, 40, .08);
    }

    .customer-payment-details > div > span { min-width: 0; display: grid; gap: 2px; }
    .customer-payment-details button {
      flex: 0 0 auto;
      min-height: 34px;
      padding: 0 12px;
      border: 1px solid var(--av-color-surface-border, #dfe4e8);
      border-radius: 6px;
      background: #fff;
      color: var(--av-color-text-heading, #0d343f);
      font: inherit;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
    }

    @media (max-width: 767px) {
      .customer-period-backdrop { align-items: flex-end; padding: 0; }
      .customer-period-modal {
        width: 100%;
        max-height: 92dvh;
        border-radius: 18px 18px 0 0;
        border-bottom: 0;
      }
      .customer-period-details { grid-template-columns: 1fr; }
      .customer-period-details > div { border-right: 0; }
      .customer-instalment-row,
      .customer-settlement-card > div,
      .customer-payment-details > div { align-items: flex-start; }
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
  @Output() readonly requestFunds = new EventEmitter<CustomerFinancingPeriod>()
  @Output() readonly close = new EventEmitter<void>()

  repaymentOpen = false
  repaymentMethod: RepaymentMethod = 'bank'
  toast = ''

  readonly bankDetails = BANK_DETAILS
  readonly mpesaDetails = MPESA_DETAILS
  readonly clientPhone = PROFILE.contact.phone ?? 'Your registered phone number'
  readonly formatDate = formatDate
  readonly formatKes = formatKes

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['period']) {
      this.repaymentOpen = false
      this.repaymentMethod = 'bank'
      this.toast = ''
    }
  }

  get detailEyebrow(): string {
    return this.period?.settlementMode === 'buyer-payment' ? 'Dynamic Period details' : 'Financing period details'
  }

  get customerRelationshipType(): string {
    const type = this.period?.relationshipType ?? ''
    if (type.includes('Supplier')) return 'Supplier'
    if (type.includes('Buyer')) return 'Buyer'
    return type
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

  get singleRepaymentHeading(): string {
    return this.period?.settlementMode === 'buyer-payment' ? 'Settlement' : 'Single repayment'
  }

  get singleRepaymentLabel(): string {
    return this.period?.settlementMode === 'buyer-payment' ? 'Outstanding to settle from Buyer payment' : 'Amount due'
  }

  get repaymentActionLabel(): string {
    return this.period?.settlementMode === 'buyer-payment' ? 'View settlement details' : 'View repayment details'
  }

  get repaymentEyebrow(): string {
    return this.period?.settlementMode === 'buyer-payment' ? 'Settlement details' : 'Repayment details'
  }

  get amountDueLabel(): string {
    return this.period?.settlementMode === 'buyer-payment' ? 'Outstanding to settle' : 'Amount due'
  }

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

  openRepayment(): void {
    this.repaymentOpen = true
  }

  closeRepayment(): void {
    this.repaymentOpen = false
  }

  async copy(value: string, label: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value)
      this.toast = `${label} copied.`
    } catch {
      this.toast = `${label}: ${value}`
    }
  }
}

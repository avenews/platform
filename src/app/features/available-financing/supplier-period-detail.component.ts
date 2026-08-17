import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { RouterLink } from '@angular/router'
import { ActionExplainerComponent } from '../../shared/action-explainer.component'
import { formatDate, formatKes } from '../../shared/customer-portal.data'
import {
  SUPPLIER_ADVANCES,
  SUPPLIER_PERIOD_INVOICES,
  supplierAdvanceStatusLabel,
  supplierAdvanceStatusTone,
  supplierInvoiceStatusLabel,
  supplierInvoiceStatusTone,
  supplierPeriodStatusLabel,
  supplierPeriodStatusTone,
  supplierRelationshipLabel,
  type SupplierFinancingPeriod,
} from '../../shared/supplier-financing.data'

@Component({
  selector: 'app-supplier-period-detail',
  standalone: true,
  imports: [RouterLink, ActionExplainerComponent],
  template: `
    <div class="portal-page supplier-period-page">
      <a routerLink="/available-financing" class="supplier-period-back">Back to Available Financing</a>

      <section class="supplier-period-hero baseline-section">
        <div class="supplier-period-hero__copy">
          <p class="page-eyebrow">Supplier Financing period</p>
          <h1>{{ period.buyerName }}</h1>
          <p>{{ supplierRelationshipLabel(period.relationshipModel) }} · Invoices due {{ formatDate(period.dueDate) }} · {{ period.daysRemaining }} days remaining</p>
          <span class="baseline-status" [class]="'baseline-status ' + supplierPeriodStatusTone(period)">{{ supplierPeriodStatusLabel(period) }}</span>
        </div>
        <div class="supplier-period-hero__amount">
          <small>Available to Withdraw</small>
          <strong>{{ formatKes(period.availableToWithdraw) }}</strong>
          <span>Last recalculated {{ formatDate(period.lastRecalculatedAt) }}</span>
        </div>
      </section>

      <app-action-explainer
        secondaryLabel="View invoices"
        [primaryLabel]="canRequestFunds ? 'Request funds' : 'Requests unavailable'"
        [disabled]="!canRequestFunds"
        heading="Why this amount?"
        [description]="constraintCopy"
        [supportingText]="formatKes(period.borrowingBase) + ' borrowing base'"
        [warning]="period.availableToWithdraw === 0"
        (secondary)="showInvoices()"
        (primary)="startRequest()"
      />

      <section class="baseline-section supplier-money" aria-labelledby="supplier-money-title">
        <div class="baseline-section-heading">
          <div><p class="page-eyebrow">Availability</p><h2 id="supplier-money-title">How your availability is calculated</h2></div>
        </div>
        <div class="supplier-money__grid">
          <div><span>Total receivables</span><strong>{{ formatKes(period.totalReceivables) }}</strong></div>
          <div><span>Eligible receivables</span><strong>{{ formatKes(period.eligibleReceivables) }}</strong></div>
          <div><span>Advance rate</span><strong>{{ formatPercent(period.advanceRate) }}</strong></div>
          <div><span>Borrowing base</span><strong>{{ formatKes(period.borrowingBase) }}</strong></div>
          <div><span>Already drawn</span><strong>{{ formatKes(period.drawnPrincipal) }}</strong></div>
          <div><span>Reserved</span><strong>{{ formatKes(period.reservedAmount) }}</strong></div>
          <div class="supplier-money__available"><span>Available to Withdraw</span><strong>{{ formatKes(period.availableToWithdraw) }}</strong></div>
        </div>
        <p class="supplier-money__limits">Buyer sub-limit remaining {{ formatKes(period.relationshipCreditRemaining) }} · Facility remaining {{ formatKes(period.facilityCreditRemaining) }} · Business remaining {{ formatKes(period.businessCreditRemaining) }}</p>
      </section>

      <section id="period-invoices" class="baseline-section" aria-labelledby="period-invoices-title">
        <div class="baseline-section-heading">
          <div><p class="page-eyebrow">Receivables</p><h2 id="period-invoices-title">Invoices</h2></div>
          <span class="supplier-period-count">{{ periodInvoices.length }} invoices</span>
        </div>
        <div class="baseline-table-wrap">
          <table class="baseline-table supplier-detail-table">
            <thead><tr><th>Invoice</th><th>Amount</th><th>Uploaded</th><th>Uploaded by</th><th>Status</th><th>Advance</th></tr></thead>
            <tbody>
              @for (invoice of periodInvoices; track invoice.id) {
                <tr>
                  <td><strong>{{ invoice.reference }}</strong></td>
                  <td>{{ formatKes(invoice.amount) }}</td>
                  <td>{{ formatDate(invoice.uploadedAt) }}</td>
                  <td>{{ invoice.uploadedBy }}</td>
                  <td><span class="baseline-status" [class]="'baseline-status ' + supplierInvoiceStatusTone(invoice.eligibilityStatus)">{{ supplierInvoiceStatusLabel(invoice.eligibilityStatus) }}</span></td>
                  <td>{{ invoice.linkedAdvanceId ? advanceReference(invoice.linkedAdvanceId) : '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="baseline-cards">
          @for (invoice of periodInvoices; track invoice.id) {
            <article class="baseline-record-card">
              <div class="baseline-record-card__head"><strong>{{ invoice.reference }}</strong><span class="baseline-status" [class]="'baseline-status ' + supplierInvoiceStatusTone(invoice.eligibilityStatus)">{{ supplierInvoiceStatusLabel(invoice.eligibilityStatus) }}</span></div>
              <div class="baseline-metrics"><span class="baseline-metric"><small>Amount</small><strong>{{ formatKes(invoice.amount) }}</strong></span><span class="baseline-metric"><small>Uploaded</small><strong>{{ formatDate(invoice.uploadedAt) }}</strong></span></div>
              <p class="baseline-muted">Uploaded by {{ invoice.uploadedBy }}</p>
            </article>
          }
        </div>
      </section>

      <section class="baseline-section" aria-labelledby="period-advances-title">
        <div class="baseline-section-heading">
          <div><p class="page-eyebrow">Funds Requests</p><h2 id="period-advances-title">Advances</h2></div>
          <span class="supplier-period-count">{{ periodAdvances.length }} advances</span>
        </div>
        @if (periodAdvances.length) {
          <div class="baseline-table-wrap">
            <table class="baseline-table supplier-detail-table">
              <thead><tr><th>Reference</th><th>Request date</th><th>Disbursement</th><th>Principal</th><th>Daily markup</th><th>Tenor</th><th>Total repayable</th><th>Status</th></tr></thead>
              <tbody>
                @for (advance of periodAdvances; track advance.id) {
                  <tr>
                    <td><strong>{{ advance.reference }}</strong></td>
                    <td>{{ formatDate(advance.requestDate) }}</td>
                    <td>{{ advance.disbursementDate ? formatDate(advance.disbursementDate) : 'Pending' }}</td>
                    <td>{{ formatKes(advance.principal) }}</td>
                    <td>{{ formatDailyRate(advance.dailyMarkupRate) }}</td>
                    <td>{{ advance.tenorDays }} days</td>
                    <td>{{ formatKes(advance.totalRepayable) }}</td>
                    <td><span class="baseline-status" [class]="'baseline-status ' + supplierAdvanceStatusTone(advance.status)">{{ supplierAdvanceStatusLabel(advance.status) }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="baseline-cards">
            @for (advance of periodAdvances; track advance.id) {
              <article class="baseline-record-card">
                <div class="baseline-record-card__head"><strong>{{ advance.reference }}</strong><span class="baseline-status" [class]="'baseline-status ' + supplierAdvanceStatusTone(advance.status)">{{ supplierAdvanceStatusLabel(advance.status) }}</span></div>
                <div class="baseline-metrics"><span class="baseline-metric"><small>Principal</small><strong>{{ formatKes(advance.principal) }}</strong></span><span class="baseline-metric"><small>Total repayable</small><strong>{{ formatKes(advance.totalRepayable) }}</strong></span></div>
                <p class="baseline-muted">{{ formatDailyRate(advance.dailyMarkupRate) }} per day · {{ advance.tenorDays }} days</p>
              </article>
            }
          </div>
        } @else {
          <div class="baseline-empty"><strong>No Advances yet</strong><p>This period has not been drawn against yet.</p></div>
        }
      </section>
    </div>

    @if (toast) { <button type="button" class="baseline-toast" (click)="toast = ''">{{ toast }}</button> }
  `,
  styles: [`
    :host{display:block}
    .supplier-period-page{display:grid;gap:20px;max-width:1400px;margin:0 auto;padding:24px 32px 40px}
    .supplier-period-back{justify-self:start;color:var(--av-color-text-heading,#0d343f);font-size:13px;font-weight:600;text-decoration:none}
    .supplier-period-back::before{content:"\\2190";margin-right:8px}
    .supplier-period-hero{display:flex;align-items:flex-start;justify-content:space-between;gap:32px;padding:24px}
    .supplier-period-hero__copy{display:grid;gap:6px}.supplier-period-hero__copy h1,.supplier-period-hero__copy p{margin:0}.supplier-period-hero__copy h1{font-size:32px;line-height:1.2}.supplier-period-hero__copy>p:not(.page-eyebrow){color:var(--av-color-text-muted,#66788a)}
    .supplier-period-hero__amount{min-width:300px;display:grid;gap:4px;border:1px solid var(--av-color-primary-border,#bdeff3);border-radius:14px;background:var(--av-color-primary-subtle,#eefbfc);padding:18px 20px}.supplier-period-hero__amount small,.supplier-period-hero__amount span{color:var(--av-color-text-muted,#66788a);font-size:12px}.supplier-period-hero__amount strong{color:var(--av-color-text-heading,#0d343f);font-size:32px;line-height:1.2}
    .baseline-section-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:16px}.baseline-section-heading h2,.baseline-section-heading p{margin:0}.baseline-section-heading h2{font-size:20px}
    .supplier-period-count{flex:0 0 auto;border:1px solid var(--av-color-surface-border,#e1e7eb);border-radius:999px;background:#fff;color:var(--av-color-text-muted,#66788a);font-size:12px;font-weight:600;padding:6px 10px}
    .supplier-money__grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid var(--av-color-surface-border,#e1e7eb);border-radius:12px;overflow:hidden}.supplier-money__grid>div{display:grid;gap:6px;padding:16px;border-right:1px solid var(--av-color-surface-border,#e1e7eb);border-bottom:1px solid var(--av-color-surface-border,#e1e7eb)}.supplier-money__grid>div:nth-child(4n){border-right:0}.supplier-money__grid span{color:var(--av-color-text-muted,#66788a);font-size:12px}.supplier-money__grid strong{font-size:16px}.supplier-money__available{background:var(--av-color-primary-subtle,#eefbfc)}.supplier-money__available strong{color:var(--av-color-text-heading,#0d343f);font-size:20px}.supplier-money__limits{margin:12px 0 0;color:var(--av-color-text-muted,#66788a);font-size:12px}
    .supplier-detail-table{min-width:960px}
    @media(max-width:900px){.supplier-period-hero{display:grid}.supplier-period-hero__amount{min-width:0;width:100%;box-sizing:border-box}.supplier-money__grid{grid-template-columns:repeat(2,minmax(0,1fr))}.supplier-money__grid>div:nth-child(4n){border-right:1px solid var(--av-color-surface-border,#e1e7eb)}.supplier-money__grid>div:nth-child(2n){border-right:0}}
    @media(max-width:767px){.supplier-period-page{gap:16px;padding:16px}.supplier-period-hero{padding:18px}.supplier-period-hero__copy h1{font-size:26px}.supplier-period-hero__amount strong{font-size:28px}.supplier-money__grid{grid-template-columns:1fr}.supplier-money__grid>div{border-right:0}.baseline-section-heading{align-items:center}}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierPeriodDetailComponent {
  @Input({ required: true }) period!: SupplierFinancingPeriod
  toast = ''

  get periodInvoices() { return SUPPLIER_PERIOD_INVOICES.filter(invoice => invoice.periodId === this.period.id) }
  get periodAdvances() { return SUPPLIER_ADVANCES.filter(advance => advance.periodId === this.period.id) }
  get canRequestFunds(): boolean { return this.period.lifecycleStatus === 'open' && this.period.availableToWithdraw > 0 }

  get constraintCopy(): string {
    if (this.period.bindingConstraint === 'relationship-limit') return `Limited by the approved ${this.period.buyerName} sub-limit of ${formatKes(this.period.relationshipCreditRemaining)} remaining, not by receivables.`
    if (this.period.bindingConstraint === 'facility-limit') return `Limited by your Supplier Financing facility headroom of ${formatKes(this.period.facilityCreditRemaining)}.`
    if (this.period.bindingConstraint === 'business-limit') return `Limited by your overall available credit of ${formatKes(this.period.businessCreditRemaining)}.`
    if (this.period.bindingConstraint === 'request-window') return `Requests open on ${formatDate(this.period.fundsRequestOpensAt)}. The receivables are already grouped in this period.`
    if (this.period.bindingConstraint === 'verification-pending') return 'Your invoices are being verified. We will update the period as soon as eligible receivables are approved.'
    if (this.period.bindingConstraint === 'settlement') return 'This period is awaiting buyer payment. No additional request can be submitted.'
    return 'Availability is limited by eligible receivables after amounts already drawn and reserved.'
  }

  startRequest(): void { if (this.canRequestFunds) this.toast = `Period-scoped Funds Request started for up to ${formatKes(this.period.availableToWithdraw)}.` }
  showInvoices(): void { document.getElementById('period-invoices')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  advanceReference(id: string): string { return SUPPLIER_ADVANCES.find(item => item.id === id)?.reference ?? '—' }
  formatPercent(value: number): string { return `${Math.round(value * 100)}%` }
  formatDailyRate(value: number): string { return `${(value * 100).toFixed(2)}%` }

  readonly formatKes = formatKes
  readonly formatDate = formatDate
  readonly supplierRelationshipLabel = supplierRelationshipLabel
  readonly supplierPeriodStatusLabel = supplierPeriodStatusLabel
  readonly supplierPeriodStatusTone = supplierPeriodStatusTone
  readonly supplierInvoiceStatusLabel = supplierInvoiceStatusLabel
  readonly supplierInvoiceStatusTone = supplierInvoiceStatusTone
  readonly supplierAdvanceStatusLabel = supplierAdvanceStatusLabel
  readonly supplierAdvanceStatusTone = supplierAdvanceStatusTone
}

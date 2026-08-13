import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { RouterLink } from '@angular/router'
import {
  FINANCING_RECORDS,
  type CreditLine,
  type FinancingRecord,
  formatDate,
  formatKes,
  productLabel,
  statusLabel,
  statusTone,
} from '../../shared/customer-portal.data'
import { SUPPLIER_FINANCING_PERIODS } from '../../shared/supplier-financing.data'

@Component({
  selector: 'app-credit-line-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (isSupplierFinancing) {
      <div class="portal-page supplier-relationship-page">
        <a routerLink="/available-financing" class="relationship-back">Back to Available Financing</a>
        <section class="supplier-relationship-hero surface-card">
          <div>
            <p class="page-eyebrow">Financing Relationship</p>
            <span class="baseline-status status-success">Available</span>
            <h1>Supplier Financing</h1>
            <p>{{ line.partner }}</p>
          </div>
          <div class="relationship-availability">
            <span>Relationship headroom</span>
            <strong>{{ formatKes(line.available) }}</strong>
            <small>Funds Requests are submitted against a specific period.</small>
          </div>
        </section>
        <section class="baseline-card relationship-explainer">
          <div class="baseline-card__header"><h2>How this relationship works</h2></div>
          <div class="baseline-card__body">
            <ol>
              <li>Eligible invoices from {{ line.partner }} are grouped by invoice due date.</li>
              <li>Each due-date group becomes one Supplier Financing period.</li>
              <li>You request funds from the period while its request window is open.</li>
              <li>Every approved Funds Request becomes one Advance against that period.</li>
            </ol>
            @if (firstPeriodId) {
              <a [routerLink]="['/available-financing', firstPeriodId]" class="baseline-button baseline-button--primary">View current period</a>
            } @else {
              <div class="baseline-empty"><strong>No periods yet</strong><p>Periods appear once eligible invoices are accepted for this buyer and due date.</p></div>
            }
          </div>
        </section>
      </div>
    } @else {
      <div class="portal-page baseline-page">
        <section class="credit-detail-hero">
          <div><span class="baseline-status" [class]="line.available > 0 ? 'baseline-status status-success' : 'baseline-status status-neutral'">{{ line.available > 0 ? 'Available' : 'Unavailable' }}</span></div>
          <h1>{{ displayProductLabel }}</h1>
          <p>{{ line.partner }}</p>
        </section>

        <section class="baseline-card">
          <div class="baseline-card__header"><h2>Credit line</h2></div>
          <div class="baseline-card__body">
            <div class="credit-detail-grid">
              <dl class="baseline-data-list">
                <div><dt>Total credit limit</dt><dd>{{ formatKes(line.totalLimit) }}</dd></div>
                <div><dt>In use</dt><dd>{{ formatKes(line.used) }}</dd></div>
                <div><dt>Available now</dt><dd>{{ formatKes(line.available) }}</dd></div>
                @if (line.rewardsBalance) { <div><dt>Rewards balance</dt><dd>{{ formatKes(line.rewardsBalance) }}</dd></div> }
              </dl>
              <div class="baseline-section">
                <div class="baseline-section-heading"><div><h2>Available to draw</h2><p>{{ availablePercent }}% of this line is available.</p></div></div>
                <div class="credit-progress" role="progressbar" [attr.aria-valuenow]="availablePercent" aria-valuemin="0" aria-valuemax="100"><span [style.width.%]="availablePercent"></span></div>
              </div>
            </div>
          </div>
        </section>

        <section class="baseline-section">
          @if (line.available <= 0) { <div class="baseline-banner baseline-banner--warning">Your credit line is fully used.</div> }
          @else if (hasOverdue) { <div class="baseline-banner baseline-banner--warning">Clear your overdue payment before requesting funds.</div> }
          <div class="credit-action-stack">
            @if (isInvoiceProduct) {
              <button type="button" class="baseline-button baseline-button--primary baseline-button--block" (click)="openAction('upload')">Upload delivery invoice</button>
            }
            <button type="button" class="baseline-button baseline-button--block" [class.baseline-button--secondary]="isInvoiceProduct" [class.baseline-button--primary]="!isInvoiceProduct" [disabled]="line.available <= 0 || hasOverdue" (click)="openAction('request')">Request funds</button>
          </div>
        </section>

        <section class="baseline-section">
          <div class="baseline-section-heading"><div><h2>Active financing on this line</h2></div></div>
          @if (activeRecords.length) {
            <div class="baseline-cards" style="display:grid">
              @for (record of activeRecords; track record.id) {
                <article class="baseline-record-card" [class.baseline-record-card--danger]="record.status === 'delinquent'">
                  <div class="baseline-record-card__head">
                    <span class="baseline-financing-cell"><strong>{{ record.partner }}</strong><span>{{ displayProductLabel }}</span></span>
                    <span class="baseline-status" [class]="'baseline-status ' + statusTone(record.status)">{{ statusLabel(record.status) }}</span>
                  </div>
                  <div class="baseline-metrics">
                    <span class="baseline-metric"><small>Amount Financed</small><strong>{{ formatKes(record.principal) }}</strong></span>
                    <span class="baseline-metric"><small>Outstanding Balance</small><strong>{{ formatKes(record.balance) }}</strong></span>
                  </div>
                  <div class="baseline-metrics">
                    <span class="baseline-metric"><small>Disbursement Date</small><strong>{{ record.disbursementDate ? formatDate(record.disbursementDate) : 'Pending' }}</strong></span>
                    <span class="baseline-metric"><small>Repayment Due Date</small><strong>{{ nextDueDate(record) }}</strong></span>
                  </div>
                </article>
              }
            </div>
          } @else {
            <div class="baseline-empty"><strong>No active financing on this line</strong><p>Request funds to draw against your available credit.</p></div>
          }
        </section>
      </div>

      @if (selectedAction) {
        <div class="baseline-modal-backdrop baseline-modal-backdrop--sheet" role="presentation" (click)="selectedAction = ''">
          <section class="baseline-modal baseline-modal--small baseline-modal--sheet" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
            <header class="baseline-modal__head">
              <h2>{{ selectedAction === 'upload' ? 'Upload delivery invoice' : 'Request funds' }} - {{ displayProductLabel }}</h2>
              <button type="button" class="baseline-modal__close" (click)="selectedAction = ''" aria-label="Close">&times;</button>
            </header>
            <div class="baseline-modal__body">
              <div class="baseline-banner">In production, this opens the secure Avenews workflow.</div>
              <button type="button" class="baseline-button baseline-button--ghost baseline-button--block" (click)="selectedAction = ''">Not now</button>
            </div>
          </section>
        </div>
      }
    }
  `,
  styles: [`
    :host { display: block; }
    .supplier-relationship-page { display: grid; gap: 20px; }
    .relationship-back { justify-self: start; color: var(--av-color-text-heading, #0d343f); font-size: 13px; font-weight: 600; text-decoration: none; }
    .relationship-back::before { content: "\\2190"; margin-right: 8px; }
    .supplier-relationship-hero { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 360px); gap: 28px; align-items: center; padding: 28px 32px; }
    .supplier-relationship-hero > div:first-child { display: grid; justify-items: start; gap: 8px; }
    .supplier-relationship-hero h1, .supplier-relationship-hero p, .supplier-relationship-hero .page-eyebrow { margin: 0; }
    .supplier-relationship-hero h1 { color: var(--av-color-text-heading, #0d343f); font-size: 32px; line-height: 1.15; }
    .supplier-relationship-hero p { color: var(--av-color-text-muted, #66788a); }
    .relationship-availability { display: grid; gap: 5px; border: 1px solid var(--av-color-primary-border, #bdeff3); border-radius: 14px; background: var(--av-color-primary-subtle, #eefbfc); padding: 20px 22px; }
    .relationship-availability span, .relationship-availability small { color: var(--av-color-text-muted, #66788a); font-size: 12px; }
    .relationship-availability strong { color: var(--av-color-text-heading, #0d343f); font-family: var(--av-font-heading, "Plus Jakarta Sans", sans-serif); font-size: 30px; }
    .relationship-explainer ol { display: grid; gap: 10px; margin: 0 0 20px; padding-left: 20px; color: var(--av-color-text, #25384a); }
    @media (max-width: 767px) {
      .supplier-relationship-page { gap: 16px; }
      .supplier-relationship-hero { grid-template-columns: 1fr; gap: 20px; padding: 20px; }
      .supplier-relationship-hero h1 { font-size: 26px; }
      .relationship-availability { padding: 18px; }
      .relationship-explainer .baseline-button { width: 100%; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreditLineDetailComponent {
  @Input({ required: true }) line!: CreditLine
  selectedAction = ''

  get activeRecords(): FinancingRecord[] {
    return FINANCING_RECORDS.filter(record =>
      record.product === this.line.product &&
      record.partner === this.line.partner &&
      (record.status === 'live' || record.status === 'delinquent'),
    )
  }

  get availablePercent(): number {
    if (!this.line.totalLimit) return 0
    return Math.round((this.line.available / this.line.totalLimit) * 100)
  }

  get hasOverdue(): boolean {
    return this.activeRecords.some(record => record.status === 'delinquent' || record.status === 'default')
  }

  get isSupplierFinancing(): boolean {
    // The legacy relationship URL remains as a compatibility route while the
    // reviewable customer path now links directly to Supplier Financing periods.
    return false
  }

  get isInvoiceProduct(): boolean {
    return this.line.product === 'ASF' || this.line.product === 'SF'
  }

  get displayProductLabel(): string {
    if (this.line.product === 'ASFX') return 'Supplier Financing Express (SFX)'
    return productLabel(this.line.product)
  }

  get firstPeriodId(): string | null {
    return SUPPLIER_FINANCING_PERIODS.find(period => period.relationshipId === this.line.id)?.id ?? null
  }

  openAction(action: 'upload' | 'request'): void {
    this.selectedAction = action
  }

  nextDueDate(record: FinancingRecord): string {
    return formatDate(record.installments.find(item => item.status !== 'paid')?.dueDate)
  }

  readonly formatKes = formatKes
  readonly formatDate = formatDate
  readonly statusLabel = statusLabel
  readonly statusTone = statusTone
}

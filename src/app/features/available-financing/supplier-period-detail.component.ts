import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { RouterLink } from '@angular/router'
import { ActionExplainerComponent } from '../../shared/action-explainer.component'
import { formatDate, formatKes } from '../../shared/customer-portal.data'
import { SUPPLIER_ADVANCES, SUPPLIER_PERIOD_INVOICES, type SupplierFinancingPeriod } from '../../shared/supplier-financing.data'
import { SupplierPeriodAdvancesComponent } from './supplier-period-advances.component'
import { SupplierPeriodHeroComponent } from './supplier-period-hero.component'
import { SupplierPeriodInvoicesComponent } from './supplier-period-invoices.component'
import { SupplierPeriodMoneyComponent } from './supplier-period-money.component'

@Component({
  selector: 'app-supplier-period-detail',
  standalone: true,
  imports: [RouterLink, ActionExplainerComponent, SupplierPeriodHeroComponent, SupplierPeriodMoneyComponent, SupplierPeriodInvoicesComponent, SupplierPeriodAdvancesComponent],
  template: `
    <div class="portal-page supplier-period-page">
      <a routerLink="/available-financing" class="supplier-period-back">Back to Available Financing</a>
      <app-supplier-period-hero [period]="period" />
      <app-action-explainer secondaryLabel="View invoices" [primaryLabel]="canRequestFunds ? 'Request funds' : 'Requests unavailable'" [disabled]="!canRequestFunds" heading="Why this amount?" [description]="constraintCopy" [supportingText]="formatKes(period.borrowingBase) + ' borrowing base'" [warning]="period.availableToWithdraw === 0" (secondary)="showInvoices()" (primary)="startRequest()" />
      <app-supplier-period-money [period]="period" />
      <app-supplier-period-invoices [invoices]="periodInvoices" [verificationPendingCount]="period.verificationPendingCount" />
      <app-supplier-period-advances [advances]="periodAdvances" />
    </div>
    @if (toast) { <button type="button" class="baseline-toast" (click)="toast = ''">{{ toast }}</button> }
  `,
  styles: [`:host{display:block}.supplier-period-page{display:grid;gap:20px;max-width:1400px;margin:0 auto;padding:24px 32px 40px}.supplier-period-back{justify-self:start;color:var(--av-color-text-heading,#0d343f);font-size:13px;font-weight:600;text-decoration:none}.supplier-period-back::before{content:"\\2190";margin-right:8px}@media(max-width:767px){.supplier-period-page{gap:16px}}`],
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
    if (this.period.bindingConstraint === 'request-window') return `Requests open on ${formatDate(this.period.fundsRequestOpensAt)}. The receivables are already grouped in this period.`
    if (this.period.bindingConstraint === 'settlement') return 'This period is awaiting buyer payment. No additional request can be submitted.'
    return 'Availability is limited by eligible receivables after amounts already drawn and reserved.'
  }
  startRequest(): void { if (this.canRequestFunds) this.toast = `Period-scoped Funds Request started for up to ${formatKes(this.period.availableToWithdraw)}.` }
  showInvoices(): void { document.getElementById('period-invoices')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  readonly formatKes = formatKes
}

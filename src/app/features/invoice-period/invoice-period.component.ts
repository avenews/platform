import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import {
  INVOICE_FINANCING_PERIODS,
  PERIOD_ADVANCES,
  PERIOD_INVOICES,
  advanceStatusLabel,
  advanceStatusTone,
  formatDate,
  formatKes,
  invoiceStatusLabel,
  invoiceStatusTone,
  periodStatusTone,
  relationshipModelLabel,
  type InvoiceFinancingPeriod,
} from '../../core/experience/invoice-financing.data'
import { PrototypeExplainerComponent } from '../../shared/prototype-explainer.component'

@Component({
  selector: 'app-invoice-period',
  standalone: true,
  imports: [PrototypeExplainerComponent],
  templateUrl: './invoice-period.component.html',
  styleUrl: './invoice-period.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoicePeriodComponent {
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)

  readonly period: InvoiceFinancingPeriod | undefined = INVOICE_FINANCING_PERIODS.find(
    item => item.id === this.route.snapshot.paramMap.get('periodId'),
  )
  requestOpen = false
  toast = ''

  get invoices() {
    return this.period ? PERIOD_INVOICES.filter(item => item.periodId === this.period?.id) : []
  }

  get advances() {
    return this.period ? PERIOD_ADVANCES.filter(item => item.periodId === this.period?.id) : []
  }

  get canRequestFunds(): boolean {
    return this.period?.status === 'open' && (this.period?.availableToWithdraw ?? 0) > 0
  }

  back(): void {
    void this.router.navigate(['/experience', 'invoice-financing', 'financing'])
  }

  openRequest(): void {
    if (!this.canRequestFunds) return
    this.requestOpen = true
  }

  closeRequest(): void {
    this.requestOpen = false
  }

  completeRequest(): void {
    this.requestOpen = false
    this.toast = `Funds Request prototype started for up to ${formatKes(this.period?.availableToWithdraw ?? 0)}.`
  }

  scrollToInvoices(): void {
    document.getElementById('dynamic-period-invoices')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  formatPercent(value: number): string {
    return `${Math.round(value * 100)}%`
  }

  formatDailyRate(value: number): string {
    return `${(value * 100).toFixed(2)}%`
  }

  readonly formatKes = formatKes
  readonly formatDate = formatDate
  readonly relationshipModelLabel = relationshipModelLabel
  readonly periodStatusTone = periodStatusTone
  readonly invoiceStatusLabel = invoiceStatusLabel
  readonly invoiceStatusTone = invoiceStatusTone
  readonly advanceStatusLabel = advanceStatusLabel
  readonly advanceStatusTone = advanceStatusTone
}

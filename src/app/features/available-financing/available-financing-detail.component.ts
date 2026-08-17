import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { CREDIT_LINES, type CreditLine } from '../../shared/customer-portal.data'
import {
  SUPPLIER_FINANCING_PERIODS,
  type SupplierFinancingPeriod,
} from '../../shared/supplier-financing.data'
import { CreditLineDetailComponent } from './credit-line-detail.component'
import { SupplierPeriodDetailComponent } from './supplier-period-detail.component'

@Component({
  selector: 'app-available-financing-detail',
  standalone: true,
  imports: [RouterLink, CreditLineDetailComponent, SupplierPeriodDetailComponent],
  template: `
    @if (period; as currentPeriod) {
      <app-supplier-period-detail [period]="currentPeriod" />
    } @else if (line) {
      <app-credit-line-detail [line]="line" />
    } @else {
      <div class="portal-page baseline-empty">
        <strong>Financing record not found</strong>
        <p>The requested financing relationship or Supplier Financing period is not available in this prototype.</p>
        <a routerLink="/available-financing" class="baseline-button baseline-button--secondary">Back to Available Financing</a>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvailableFinancingDetailComponent {
  private readonly route = inject(ActivatedRoute)
  private readonly routeId = this.route.snapshot.paramMap.get('id')

  readonly line: CreditLine | undefined = CREDIT_LINES.find(item => item.id === this.routeId)
  readonly period: SupplierFinancingPeriod | undefined = SUPPLIER_FINANCING_PERIODS.find(item => item.id === this.routeId)
}

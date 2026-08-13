import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { INVOICE_GROUPS, type InvoiceGroup } from '../../shared/customer-portal.data'
import { SupplierPeriodDetailComponent } from './supplier-period-detail.component'

@Component({
  selector: 'app-supplier-financing-period',
  standalone: true,
  imports: [RouterLink, SupplierPeriodDetailComponent],
  template: `
    @if (period; as currentPeriod) {
      <app-supplier-period-detail [period]="currentPeriod" />
    } @else {
      <div class="portal-page baseline-empty">
        <strong>Supplier Financing period not found</strong>
        <p>The requested period is not available in this prototype.</p>
        <a routerLink="/available-financing" class="baseline-button baseline-button--secondary">Back to Available Financing</a>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierFinancingPeriodComponent {
  private readonly route = inject(ActivatedRoute)
  readonly period: InvoiceGroup | undefined = INVOICE_GROUPS.find(item => item.id === this.route.snapshot.paramMap.get('id'))
}

import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import {
  CREDIT_LINES,
  INVOICE_GROUPS,
  type CreditLine,
  type InvoiceGroup,
  type ProductCode,
  formatDate,
  formatKes,
  productLabel,
} from '../../shared/customer-portal.data'
import {
  CustomerFilterBarComponent,
  type CustomerFilterField,
} from '../../shared/customer-filter-bar.component'

@Component({
  selector: 'app-available-financing',
  standalone: true,
  imports: [CommonModule, RouterLink, CustomerFilterBarComponent],
  templateUrl: './available-financing.component.html',
  styles: [`
    .supplier-periods-section { scroll-margin-top: 24px; }
    .supplier-periods-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:24px; }
    .supplier-periods-heading h2, .supplier-periods-heading p { margin:0; }
    .supplier-periods-heading h2 { color:var(--av-color-text-heading,#0d343f); font-size:20px; line-height:1.3; }
    .supplier-periods-heading .page-eyebrow { margin-bottom:4px; }
    .supplier-periods-heading .baseline-muted { max-width:760px; margin-top:4px; }
    .supplier-period-count { flex:0 0 auto; border:1px solid var(--av-color-surface-border,#e1e7eb); border-radius:999px; background:var(--av-color-surface,#fff); color:var(--av-color-text-muted,#66788a); font-size:12px; font-weight:600; padding:6px 10px; }
    .supplier-periods-table { min-width:1040px; }
    .supplier-period-link, .supplier-period-date, .supplier-period-stack { display:grid; gap:2px; }
    .supplier-period-link { color:inherit; text-decoration:none; }
    .supplier-period-link:hover strong { color:var(--av-color-action,#16b3c4); }
    .supplier-period-link span, .supplier-period-date small, .supplier-period-stack small, .supplier-period-note { color:var(--av-color-text-muted,#66788a); font-size:12px; }
    .supplier-period-available { color:var(--av-color-text-heading,#0d343f); white-space:nowrap; }
    .supplier-period-note { display:block; margin-top:6px; }
    .supplier-period-card__availability { display:grid; gap:3px; border:1px solid var(--av-color-primary-border,#bdeff3); border-radius:12px; background:var(--av-color-primary-subtle,#eefbfc); padding:14px 16px; }
    .supplier-period-card__availability small, .supplier-period-card__availability span { color:var(--av-color-text-muted,#66788a); font-size:12px; }
    .supplier-period-card__availability strong { color:var(--av-color-text-heading,#0d343f); font-size:24px; line-height:1.2; }
    @media (max-width:767px) { .supplier-periods-heading { display:grid; gap:10px; } .supplier-period-count { justify-self:start; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvailableFinancingComponent {
  readonly products: { value: ProductCode; label: string }[] = [
    { value: 'ACL', label: this.displayProductLabel('ACL') },
    { value: 'ABF', label: this.displayProductLabel('ABF') },
    { value: 'SF', label: this.displayProductLabel('SF') },
    { value: 'ASF', label: this.displayProductLabel('ASF') },
    { value: 'ASFX', label: this.displayProductLabel('ASFX') },
  ]

  readonly filterFields: readonly CustomerFilterField[] = [
    { key: 'product', label: 'Product', allLabel: 'All products', options: this.products },
    { key: 'status', label: 'Status', allLabel: 'All statuses', options: [{ value: 'available', label: 'Available' }, { value: 'unavailable', label: 'Unavailable' }] },
  ]

  readonly invoiceGroups = INVOICE_GROUPS
  productFilter = ''
  statusFilter = ''
  searchQuery = ''
  page = 1
  readonly pageSize = 10
  toast = ''

  get filterValues(): Readonly<Record<string, string>> { return { product: this.productFilter, status: this.statusFilter } }
  get filteredCreditLines(): CreditLine[] {
    const query = this.searchQuery.trim().toLowerCase()
    return CREDIT_LINES
      .filter(line => !this.productFilter || line.product === this.productFilter)
      .filter(line => !this.statusFilter || (this.statusFilter === 'available' ? line.available > 0 : line.available === 0))
      .filter(line => !query || [line.partner, this.displayProductLabel(line.product)].join(' ').toLowerCase().includes(query))
  }
  get pageItems(): CreditLine[] { const start = (this.page - 1) * this.pageSize; return this.filteredCreditLines.slice(start, start + this.pageSize) }
  get totalPages(): number { return Math.max(1, Math.ceil(this.filteredCreditLines.length / this.pageSize)) }
  get pageNumbers(): number[] { return Array.from({ length: this.totalPages }, (_, index) => index + 1) }
  get rangeStart(): number { return this.filteredCreditLines.length ? (this.page - 1) * this.pageSize + 1 : 0 }
  get rangeEnd(): number { return Math.min(this.page * this.pageSize, this.filteredCreditLines.length) }

  onFilterValuesChange(values: Record<string, string>): void { this.productFilter = values['product'] ?? ''; this.statusFilter = values['status'] ?? ''; this.page = 1 }
  onSearchValueChange(value: string): void { this.searchQuery = value; this.page = 1 }
  resetFilters(): void { this.productFilter = ''; this.statusFilter = ''; this.searchQuery = ''; this.page = 1 }
  changePage(nextPage: number): void { this.page = Math.min(Math.max(1, nextPage), this.totalPages) }
  availabilityLabel(line: CreditLine): string { return line.available > 0 ? 'Available' : 'Unavailable' }
  availabilityClass(line: CreditLine): string { return line.available > 0 ? 'status-success' : 'status-neutral' }

  displayProductLabel(code: ProductCode | null): string {
    if (code === 'ASF') return 'Supplier Financing'
    if (code === 'ASFX') return 'Supplier Financing Express (SFX)'
    return productLabel(code)
  }
  isSupplierFinancing(code: ProductCode): boolean { return code === 'ASF' }
  isInvoiceProduct(code: ProductCode): boolean { return code === 'SF' }
  financingLink(line: CreditLine): string[] {
    if (this.isSupplierFinancing(line.product)) {
      const period = this.invoiceGroups.find(group => this.periodBuyerName(group) === line.partner) ?? this.invoiceGroups[0]
      if (period) return ['/available-financing', period.id]
    }
    return ['/available-financing', line.id]
  }
  actionLabel(line: CreditLine): string {
    if (this.isSupplierFinancing(line.product)) return 'View periods'
    return this.isInvoiceProduct(line.product) ? 'Upload delivery invoice' : 'Request funds'
  }
  triggerAction(line: CreditLine): void {
    if (this.isSupplierFinancing(line.product)) { document.getElementById('supplier-financing-periods')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return }
    this.toast = this.isInvoiceProduct(line.product) ? `Invoice upload started for ${this.displayProductLabel(line.product)}.` : `Funds Request started for ${this.displayProductLabel(line.product)}.`
  }

  periodBuyerName(group: InvoiceGroup): string { return group.id.endsWith('15b') ? 'FreshProduce Kenya Ltd' : group.buyerName }
  periodDueDate(group: InvoiceGroup): string { if (group.id.endsWith('05-30')) return '2026-09-15'; if (group.id.endsWith('15a')) return '2026-10-30'; return '2026-09-05' }
  periodDaysLabel(group: InvoiceGroup): string { if (group.id.endsWith('05-30')) return '33 days remaining'; if (group.id.endsWith('15a')) return '78 days remaining'; return '23 days remaining' }
  periodRelationshipLabel(group: InvoiceGroup): string { return group.id.endsWith('15b') ? 'Counterparty Buyer' : 'Partner Buyer' }
  periodDrawn(group: InvoiceGroup): number { return group.id.endsWith('05-30') ? 500000 : 0 }
  periodReserved(group: InvoiceGroup): number { return group.id.endsWith('05-30') ? 100000 : 0 }
  periodAvailable(group: InvoiceGroup): number { if (group.status === 'validating') return 0; if (group.id.endsWith('05-30')) return 650000; return group.maxRequestable }
  periodStatusLabel(group: InvoiceGroup): string { if (group.status === 'validating') return 'Invoices under review'; if (group.id.endsWith('15a')) return 'Opens on 31 Aug'; return 'Open for requests' }
  periodStatusClass(group: InvoiceGroup): string { if (group.status === 'validating') return 'status-warning'; if (group.id.endsWith('15a')) return 'status-neutral'; return 'status-info' }
  periodActionLabel(group: InvoiceGroup): string { if (group.status === 'validating') return 'View invoices'; if (group.id.endsWith('15a')) return 'View period'; return 'Request funds' }

  readonly formatKes = formatKes
  readonly formatDate = formatDate
}

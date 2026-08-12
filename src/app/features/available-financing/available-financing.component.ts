import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import {
  CREDIT_LINES,
  INVOICE_GROUPS,
  type CreditLine,
  type ProductCode,
  formatDate,
  formatKes,
  productLabel,
} from '../../shared/customer-portal.data'

@Component({
  selector: 'app-available-financing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './available-financing.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvailableFinancingComponent {
  readonly products: { value: ProductCode; label: string }[] = [
    { value: 'ACL', label: productLabel('ACL') },
    { value: 'ABF', label: productLabel('ABF') },
    { value: 'SF', label: productLabel('SF') },
    { value: 'ASF', label: productLabel('ASF') },
    { value: 'ASFX', label: productLabel('ASFX') },
  ]

  readonly invoiceGroups = INVOICE_GROUPS
  productFilter = ''
  statusFilter = ''
  page = 1
  readonly pageSize = 10
  toast = ''

  get filteredCreditLines(): CreditLine[] {
    return CREDIT_LINES
      .filter(line => !this.productFilter || line.product === this.productFilter)
      .filter(line => {
        if (!this.statusFilter) return true
        if (this.statusFilter === 'available') return line.available > 0
        return line.available === 0
      })
  }

  get pageItems(): CreditLine[] {
    const start = (this.page - 1) * this.pageSize
    return this.filteredCreditLines.slice(start, start + this.pageSize)
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredCreditLines.length / this.pageSize))
  }

  get rangeStart(): number {
    return this.filteredCreditLines.length ? (this.page - 1) * this.pageSize + 1 : 0
  }

  get rangeEnd(): number {
    return Math.min(this.page * this.pageSize, this.filteredCreditLines.length)
  }

  resetFilters(): void {
    this.productFilter = ''
    this.statusFilter = ''
    this.page = 1
  }

  changePage(nextPage: number): void {
    this.page = Math.min(Math.max(1, nextPage), this.totalPages)
  }

  availabilityLabel(line: CreditLine): string {
    return line.available > 0 ? 'Available' : 'Unavailable'
  }

  availabilityClass(line: CreditLine): string {
    return line.available > 0 ? 'status-success' : 'status-neutral'
  }

  isInvoiceProduct(code: ProductCode): boolean {
    return code === 'ASF' || code === 'SF'
  }

  actionLabel(line: CreditLine): string {
    return this.isInvoiceProduct(line.product) ? 'Upload invoices' : 'Request funds'
  }

  triggerAction(line: CreditLine): void {
    this.toast = this.isInvoiceProduct(line.product)
      ? `Invoice upload started for ${productLabel(line.product)}.`
      : `Funds Request started for ${productLabel(line.product)}.`
  }

  triggerGroupAction(groupStatus: 'ready' | 'validating'): void {
    this.toast = groupStatus === 'validating'
      ? 'Opening the linked invoice records.'
      : 'Funds Request started for this invoice group.'
  }

  readonly productLabel = productLabel
  readonly formatKes = formatKes
  readonly formatDate = formatDate
}

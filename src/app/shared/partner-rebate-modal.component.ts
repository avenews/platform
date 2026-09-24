import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core'
import { PARTNER_REBATES } from '../core/experience/invoice-portal.data'
import { queryPartnerRebates, type PartnerRebate, type RebateBalanceFilter, type RebateSort } from '../core/experience/partner-rebates.data'
import { CustomerFilterBarComponent, type CustomerFilterField, type CustomerSortOption } from './customer-filter-bar.component'
import { InvoiceDialogFocusDirective } from './invoice-dialog-focus.directive'
import { InvoiceHelpComponent } from './invoice-help.component'
import { formatKes } from './customer-portal.data'

@Component({
  selector: 'app-partner-rebate-modal', standalone: true,
  imports: [CustomerFilterBarComponent, InvoiceDialogFocusDirective, InvoiceHelpComponent],
  templateUrl: './partner-rebate-modal.component.html',
  styleUrl: './partner-rebate-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartnerRebateModalComponent implements OnChanges {
  @Input() rows: readonly PartnerRebate[] = PARTNER_REBATES
  @Output() close = new EventEmitter<void>()
  readonly formatKes = formatKes
  search = ''
  balance: RebateBalanceFilter = ''
  sort: RebateSort = ''
  result = queryPartnerRebates(this.rows)
  readonly filterFields: readonly CustomerFilterField[] = [{
    key: 'balance', label: 'Rebate balance', allLabel: 'All rebates', options: [
      {value: 'due', label: 'Rebate due'},
      {value: 'paid', label: 'Fully paid'},
      {value: 'none', label: 'Not yet earned'},
    ],
  }]
  readonly sortOptions: readonly CustomerSortOption[] = [
    {value: 'supplier-asc', label: 'Supplier: A-Z'},
    {value: 'due-desc', label: 'Rebate due: high to low'},
    {value: 'due-asc', label: 'Rebate due: low to high'},
    {value: 'earned-desc', label: 'Rebate earned: high to low'},
    {value: 'collected-desc', label: 'Principal collected: high to low'},
  ]
  get filterValues(): Readonly<Record<string, string>> { return {balance: this.balance} }
  ngOnChanges(): void { this.refresh() }
  onSearch(value: string): void { this.search = value; this.refresh() }
  onFilters(values: Record<string, string>): void {
    const value = values['balance']
    this.balance = value === 'due' || value === 'paid' || value === 'none' ? value : ''
    this.refresh()
  }
  onSort(value: string): void {
    this.sort = (this.sortOptions.some(option => option.value === value) ? value : '') as RebateSort
    this.refresh()
  }
  changePage(page: number): void { this.refresh(page) }
  private refresh(page = 1): void {
    this.result = queryPartnerRebates(this.rows, {search: this.search, balance: this.balance, sort: this.sort, page})
  }
}

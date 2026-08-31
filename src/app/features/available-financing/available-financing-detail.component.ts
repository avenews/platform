import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ActivatedRoute, RouterLink } from '@angular/router'
import {
  CREDIT_LINES,
  FINANCING_RECORDS,
  type CreditLine,
  type FinancingRecord,
  formatDate,
  formatKes,
  productLabel,
  statusLabel,
  statusTone,
} from '../../shared/customer-portal.data'

@Component({
  selector: 'app-available-financing-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './available-financing-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvailableFinancingDetailComponent {
  private readonly route = inject(ActivatedRoute)
  readonly line: CreditLine | undefined = CREDIT_LINES.find(item => item.id === this.route.snapshot.paramMap.get('id'))
  selectedAction = ''

  get activeRecords(): FinancingRecord[] {
    if (!this.line) return []
    return FINANCING_RECORDS.filter(record =>
      record.product === this.line?.product &&
      record.partner === this.line?.partner &&
      (record.status === 'live' || record.status === 'delinquent'),
    )
  }

  get availablePercent(): number {
    if (!this.line?.totalLimit) return 0
    return Math.round((this.line.available / this.line.totalLimit) * 100)
  }

  get hasOverdue(): boolean {
    return this.activeRecords.some(record => record.status === 'delinquent' || record.status === 'default')
  }

  get isInvoiceProduct(): boolean {
    return this.line?.product === 'ASF' || this.line?.product === 'SF'
  }

  openAction(action: 'upload' | 'request'): void {
    this.selectedAction = action
  }

  nextDueDate(record: FinancingRecord): string {
    return formatDate(record.installments.find(item => item.status !== 'paid')?.dueDate)
  }

  readonly productLabel = productLabel
  readonly formatKes = formatKes
  readonly formatDate = formatDate
  readonly statusLabel = statusLabel
  readonly statusTone = statusTone
}

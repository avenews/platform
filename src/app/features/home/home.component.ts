import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { AvButtonDirective, AvStatusBadgeComponent, type StatusBadgeColor } from '@avenews/design-system/angular'

interface FinancingPeriod {
  partner: string
  product: string
  disbursementDate: string
  repaymentDueDate: string
  amountFinanced: string
  status: string
  statusColor: StatusBadgeColor
  totalRepaid: string
  outstandingBalance: string
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, AvButtonDirective, AvStatusBadgeComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  readonly businessName = 'Kioko Agri Supplies Ltd'

  readonly financingPeriods: FinancingPeriod[] = [
    {
      partner: 'Twiga Foods Ltd',
      product: 'Invoice Financing (INF)',
      disbursementDate: '11 Apr 26',
      repaymentDueDate: '11 May 26',
      amountFinanced: 'Ksh 850,000',
      status: 'Delinquent',
      statusColor: 'danger',
      totalRepaid: 'Nil',
      outstandingBalance: 'Ksh 850,000',
    },
    {
      partner: 'Highlands Fresh Produce',
      product: 'Invoice Financing (INF)',
      disbursementDate: '10 Jan 26',
      repaymentDueDate: '10 Feb 26',
      amountFinanced: 'Ksh 1,200,000',
      status: 'Default',
      statusColor: 'danger',
      totalRepaid: 'Nil',
      outstandingBalance: 'Ksh 1,200,000',
    },
    {
      partner: 'Quick Mart Stores',
      product: 'Agri Buyer Financing (ABF)',
      disbursementDate: '22 Apr 26',
      repaymentDueDate: '22 Jun 26',
      amountFinanced: 'Ksh 380,000',
      status: 'Live',
      statusColor: 'live',
      totalRepaid: 'Nil',
      outstandingBalance: 'Ksh 380,000',
    },
    {
      partner: 'Avenews',
      product: 'Agri Credit Line (ACL)',
      disbursementDate: '18 Mar 26',
      repaymentDueDate: '25 May 26',
      amountFinanced: 'Ksh 1,400,000',
      status: 'Live',
      statusColor: 'live',
      totalRepaid: 'Ksh 200,000',
      outstandingBalance: 'Ksh 1,400,000',
    },
    {
      partner: 'Meru Agrovets Ltd',
      product: 'Stockist Financing (STF)',
      disbursementDate: 'Pending',
      repaymentDueDate: '—',
      amountFinanced: 'Ksh 250,000',
      status: 'Offered',
      statusColor: 'warning',
      totalRepaid: 'Nil',
      outstandingBalance: 'Ksh 250,000',
    },
  ]
}

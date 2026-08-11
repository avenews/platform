import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import {
  AvButtonDirective,
  AvIconComponent,
  AvInlineBannerComponent,
  AvStatusBadgeComponent,
  type StatusBadgeColor,
} from '@avenews/design-system/angular'

interface Metric {
  label: string
  value: string
  note: string
  icon: string
  tone: 'default' | 'warning' | 'danger'
}

interface ProductSummary {
  code: string
  name: string
  description: string
  available: string
  status: string
  statusColor: StatusBadgeColor
}

interface ActivityRow {
  reference: string
  product: string
  partner: string
  amount: string
  date: string
  status: string
  statusColor: StatusBadgeColor
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    AvButtonDirective,
    AvIconComponent,
    AvInlineBannerComponent,
    AvStatusBadgeComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  readonly metrics: Metric[] = [
    {
      label: 'Available credit',
      value: 'KES 2,450,000',
      note: 'Across approved facilities',
      icon: 'wallet',
      tone: 'default',
    },
    {
      label: 'Active financing',
      value: '4',
      note: 'Three products in use',
      icon: 'cash',
      tone: 'default',
    },
    {
      label: 'Payments due',
      value: '2',
      note: 'Next payment in 6 days',
      icon: 'calendar',
      tone: 'warning',
    },
    {
      label: 'Payments overdue',
      value: '1',
      note: 'Requires attention',
      icon: 'alert-circle',
      tone: 'danger',
    },
  ]

  readonly products: ProductSummary[] = [
    {
      code: 'ACL',
      name: 'Agri Credit Line',
      description: 'Recurring working capital for approved inventory and business purchases.',
      available: 'KES 850,000 available',
      status: 'Available',
      statusColor: 'success',
    },
    {
      code: 'ABF',
      name: 'Agri Buyer Financing',
      description: 'Financing for eligible supplier invoices and approved reimbursements.',
      available: 'KES 600,000 available',
      status: 'Available',
      statusColor: 'success',
    },
    {
      code: 'STF',
      name: 'Stockist Financing',
      description: 'Purchases from approved Partner Suppliers within an approved program.',
      available: 'Limit review in progress',
      status: 'Under review',
      statusColor: 'warning',
    },
    {
      code: 'INF',
      name: 'Supplier Financing',
      description: 'Eligible receivables grouped by supplier, buyer and invoice due date.',
      available: 'KES 1,000,000 available',
      status: 'Available',
      statusColor: 'success',
    },
  ]

  readonly recentActivity: ActivityRow[] = [
    {
      reference: 'FR-1048',
      product: 'Agri Credit Line',
      partner: 'Mwangaza Produce Ltd',
      amount: 'KES 350,000',
      date: 'Due 24 Aug 2026',
      status: 'Live',
      statusColor: 'live',
    },
    {
      reference: 'FR-1042',
      product: 'Agri Buyer Financing',
      partner: 'Karibu Foods Ltd',
      amount: 'KES 180,000',
      date: 'Submitted 10 Aug 2026',
      status: 'Under review',
      statusColor: 'info',
    },
    {
      reference: 'DP-221',
      product: 'Supplier Financing',
      partner: 'National Retailer Ltd',
      amount: 'KES 640,000',
      date: 'Due 30 Aug 2026',
      status: 'Open',
      statusColor: 'primary',
    },
  ]
}

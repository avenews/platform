import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import {
  AvButtonDirective,
  AvCardComponent,
  AvDataListComponent,
  AvIconComponent,
  AvInlineBannerComponent,
  AvInputComponent,
  AvSegmentComponent,
  AvSelectComponent,
  AvStatusBadgeComponent,
  type DataField,
  type SegmentOption,
  type SelectOption,
} from '@avenews/design-system/angular'
import {
  PortalNavIconComponent,
  type PortalNavIconName,
} from '../../layouts/portal-shell/portal-nav-icon.component'

interface NavigationSpecimen {
  label: string
  icon: PortalNavIconName
  availability: string
}

@Component({
  selector: 'app-design-lab',
  standalone: true,
  imports: [
    RouterLink,
    AvButtonDirective,
    AvCardComponent,
    AvDataListComponent,
    AvIconComponent,
    AvInlineBannerComponent,
    AvInputComponent,
    AvSegmentComponent,
    AvSelectComponent,
    AvStatusBadgeComponent,
    PortalNavIconComponent,
  ],
  templateUrl: './design-lab.component.html',
  styleUrl: './design-lab.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesignLabComponent {
  readonly designSystemVersion = '1.9.0'
  readonly designSystemCommit = '4dd1b7b28e9e9a7744c73eb9bb7c8dd1a560900e'
  readonly customerBaselineCommit = '97d9d96fed1fde3f55b10eb97c56e4b20845a36d'

  audience = 'customer'
  product = 'ACL'
  referenceEmail = 'amina.kamau@example.com'

  readonly audienceOptions: SegmentOption[] = [
    { value: 'customer', label: 'Customer' },
    { value: 'partner', label: 'Partner' },
  ]

  readonly productOptions: SelectOption[] = [
    { value: 'ACL', label: 'Agri Credit Line (ACL)' },
    { value: 'ABF', label: 'Agri Buyer Financing (ABF)' },
    { value: 'STF', label: 'Stockist Financing (STF)' },
    { value: 'INF', label: 'Invoice Financing (INF)' },
    { value: 'INFX', label: 'Invoice Financing Express (INFX)' },
  ]

  readonly navigationSpecimens: readonly NavigationSpecimen[] = [
    { label: 'Home', icon: 'home', availability: 'Desktop and mobile' },
    { label: 'Available Financing', icon: 'wallet', availability: 'Desktop and mobile' },
    { label: 'Financing Activity', icon: 'bar-chart', availability: 'Desktop and mobile' },
    { label: 'Invoices & Documents', icon: 'receipt', availability: 'Desktop and mobile' },
    { label: 'Support', icon: 'help-circle', availability: 'Desktop and profile menu' },
    { label: 'Manage Users', icon: 'person', availability: 'Admin desktop and profile menu' },
  ]

  readonly detailFields: DataField[] = [
    { key: 'limit', label: 'Credit Limit', value: 'Ksh 1,500,000' },
    { key: 'available', label: 'Available Credit', value: 'Ksh 850,000' },
    { key: 'relationship', label: 'Financing Relationship', value: 'Demo Customer · Mwangaza Produce' },
    { key: 'repayment', label: 'Next Repayment Due Date', value: '24 Aug 2026' },
  ]

  onAudienceChange(value: string): void {
    this.audience = value
  }

  onProductChange(value: string): void {
    this.product = value
  }
}

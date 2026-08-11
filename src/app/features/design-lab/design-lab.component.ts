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
  ],
  templateUrl: './design-lab.component.html',
  styleUrl: './design-lab.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesignLabComponent {
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
    { value: 'INF', label: 'Supplier Financing (INF)' },
    { value: 'SFX', label: 'Supplier Financing Express (SFX)' },
  ]

  readonly detailFields: DataField[] = [
    { key: 'limit', label: 'Credit Limit', value: 'KES 1,500,000' },
    { key: 'available', label: 'Available Credit', value: 'KES 850,000' },
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

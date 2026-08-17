import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { PrototypeExplainerComponent } from '../../shared/prototype-explainer.component'

type PartnerSection = 'invoice-uploads' | 'obligations' | 'suppliers'

interface UploadBatch {
  id: string
  fileName: string
  uploadedAt: string
  operator: string
  imported: number
  skipped: number
  failed: number
  status: string
  statusTone: string
}

interface Obligation {
  dueDate: string
  supplierCount: number
  invoiceCount: number
  invoiceValue: string
  financedAgainst: string
  status: string
  statusTone: string
}

interface PartnerSupplierRow {
  business: string
  identifier: string
  stage: string
  lastUpload: string
  invoiceValue: string
  statusTone: string
}

@Component({
  selector: 'app-partner-workspace',
  standalone: true,
  imports: [PrototypeExplainerComponent],
  templateUrl: './partner-workspace.component.html',
  styleUrl: './partner-workspace.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartnerWorkspaceComponent {
  private readonly route = inject(ActivatedRoute)

  readonly section = (this.route.snapshot.data['section'] ?? 'invoice-uploads') as PartnerSection
  uploadOpen = false
  toast = ''

  readonly uploadBatches: readonly UploadBatch[] = [
    { id: 'batch-aug-12', fileName: 'twiga-suppliers-2026-08-12.xlsx', uploadedAt: '12 Aug 2026, 09:42', operator: 'Daniel Otieno', imported: 37, skipped: 1, failed: 2, status: 'Needs attention', statusTone: 'status-warning' },
    { id: 'batch-aug-05', fileName: 'twiga-suppliers-2026-08-05.xlsx', uploadedAt: '05 Aug 2026, 10:18', operator: 'Daniel Otieno', imported: 42, skipped: 3, failed: 0, status: 'Processed', statusTone: 'status-success' },
    { id: 'batch-jul-28', fileName: 'twiga-suppliers-2026-07-28.xlsx', uploadedAt: '28 Jul 2026, 14:06', operator: 'Miriam Achieng', imported: 31, skipped: 0, failed: 0, status: 'Processed', statusTone: 'status-success' },
  ]

  readonly obligations: readonly Obligation[] = [
    { dueDate: '15 Sep 2026', supplierCount: 18, invoiceCount: 46, invoiceValue: 'KES 8,420,000', financedAgainst: 'KES 5,920,000', status: 'Upcoming', statusTone: 'status-info' },
    { dueDate: '30 Sep 2026', supplierCount: 13, invoiceCount: 31, invoiceValue: 'KES 5,780,000', financedAgainst: 'KES 3,610,000', status: 'Upcoming', statusTone: 'status-info' },
    { dueDate: '31 Aug 2026', supplierCount: 11, invoiceCount: 28, invoiceValue: 'KES 4,260,000', financedAgainst: 'KES 2,980,000', status: 'Payment processing', statusTone: 'status-warning' },
  ]

  readonly suppliers: readonly PartnerSupplierRow[] = [
    { business: 'Kioko Agri Supplies Ltd', identifier: 'SUP-0042', stage: 'Active', lastUpload: '12 Aug 2026', invoiceValue: 'KES 1,750,000', statusTone: 'status-success' },
    { business: 'Nairobi Fresh Traders Ltd', identifier: 'SUP-0068', stage: 'Active', lastUpload: '12 Aug 2026', invoiceValue: 'KES 980,000', statusTone: 'status-success' },
    { business: 'Makueni Produce Company', identifier: 'SUP-0091', stage: 'Onboarding', lastUpload: '-', invoiceValue: '-', statusTone: 'status-warning' },
    { business: 'Highlands Food Processors', identifier: 'SUP-0104', stage: 'Active', lastUpload: '05 Aug 2026', invoiceValue: 'KES 620,000', statusTone: 'status-success' },
  ]

  openUpload(): void {
    this.uploadOpen = true
  }

  closeUpload(): void {
    this.uploadOpen = false
  }

  completeUpload(): void {
    this.uploadOpen = false
    this.toast = 'Prototype invoice batch received. Per-row processing results would appear in Upload History.'
  }
}

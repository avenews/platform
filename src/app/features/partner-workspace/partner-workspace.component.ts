import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { formatKes } from '../../shared/customer-portal.data'

type PartnerSection = 'invoice-uploads' | 'obligations' | 'suppliers'

interface UploadBatch {
  id: string
  fileName: string
  uploadedAt: string
  imported: number
  skipped: number
  failed: number
  status: string
  statusTone: string
}

interface Obligation {
  id: string
  dueDate: string
  supplierCount: number
  invoiceCount: number
  invoiceValue: number
  financedAgainst: number
  status: string
  statusTone: string
}

interface PartnerSupplierRow {
  id: string
  business: string
  identifier: string
  maxFinancing: number
  used: number
  available: number
  status: string
  statusTone: string
  lastUpload: string
}

@Component({
  selector: 'app-partner-workspace',
  standalone: true,
  templateUrl: './partner-workspace.component.html',
  styleUrl: './partner-workspace.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartnerWorkspaceComponent {
  private readonly route = inject(ActivatedRoute)

  readonly section = (this.route.snapshot.data['section'] ?? 'invoice-uploads') as PartnerSection
  readonly formatKes = formatKes

  uploadOpen = this.section === 'invoice-uploads' && this.route.snapshot.queryParamMap.get('action') === 'upload'
  inviteSupplierOpen = false
  selectedBatch: UploadBatch | null = null
  selectedObligation: Obligation | null = null
  selectedSupplier: PartnerSupplierRow | null = null
  supplierLimitMode = false
  toast = ''

  readonly uploadBatches: readonly UploadBatch[] = [
    { id: 'batch-aug-12', fileName: 'twiga-suppliers-2026-08-12.xlsx', uploadedAt: '12 Aug 2026, 09:42', imported: 37, skipped: 1, failed: 2, status: 'Needs attention', statusTone: 'status-warning' },
    { id: 'batch-aug-05', fileName: 'twiga-suppliers-2026-08-05.xlsx', uploadedAt: '05 Aug 2026, 10:18', imported: 42, skipped: 3, failed: 0, status: 'Processed', statusTone: 'status-success' },
    { id: 'batch-jul-28', fileName: 'twiga-suppliers-2026-07-28.xlsx', uploadedAt: '28 Jul 2026, 14:06', imported: 31, skipped: 0, failed: 0, status: 'Processed', statusTone: 'status-success' },
  ]

  readonly obligations: readonly Obligation[] = [
    { id: 'payment-2026-09-15', dueDate: '15 Sep 2026', supplierCount: 18, invoiceCount: 46, invoiceValue: 8420000, financedAgainst: 5920000, status: 'Upcoming', statusTone: 'status-info' },
    { id: 'payment-2026-09-30', dueDate: '30 Sep 2026', supplierCount: 13, invoiceCount: 31, invoiceValue: 5780000, financedAgainst: 3610000, status: 'Upcoming', statusTone: 'status-info' },
    { id: 'payment-2026-08-31', dueDate: '31 Aug 2026', supplierCount: 11, invoiceCount: 28, invoiceValue: 4260000, financedAgainst: 2980000, status: 'Payment processing', statusTone: 'status-warning' },
  ]

  readonly suppliers: readonly PartnerSupplierRow[] = [
    { id: 'supplier-kioko', business: 'Kioko Agri Supplies Ltd', identifier: 'SUP-0042', maxFinancing: 1500000, used: 850000, available: 650000, status: 'Available', statusTone: 'status-success', lastUpload: '12 Aug 2026' },
    { id: 'supplier-nairobi', business: 'Nairobi Fresh Traders Ltd', identifier: 'SUP-0068', maxFinancing: 1000000, used: 400000, available: 600000, status: 'Available', statusTone: 'status-success', lastUpload: '12 Aug 2026' },
    { id: 'supplier-makueni', business: 'Makueni Produce Company', identifier: 'SUP-0091', maxFinancing: 600000, used: 0, available: 600000, status: 'Unavailable', statusTone: 'status-neutral', lastUpload: 'No invoices yet' },
    { id: 'supplier-highlands', business: 'Highlands Food Processors', identifier: 'SUP-0104', maxFinancing: 900000, used: 900000, available: 0, status: 'Max financing used', statusTone: 'status-warning', lastUpload: '05 Aug 2026' },
  ]

  openUpload(): void {
    this.closeDetailModals()
    this.uploadOpen = true
  }

  closeUpload(): void {
    this.uploadOpen = false
  }

  completeUpload(): void {
    this.uploadOpen = false
    this.toast = 'Invoice batch received. Processing results will appear in Upload History.'
  }

  openBatch(batch: UploadBatch): void {
    this.closeDetailModals()
    this.selectedBatch = batch
  }

  closeBatch(): void {
    this.selectedBatch = null
  }

  openObligation(item: Obligation): void {
    this.closeDetailModals()
    this.selectedObligation = item
  }

  closeObligation(): void {
    this.selectedObligation = null
  }

  openSupplier(supplier: PartnerSupplierRow, manageLimit = false): void {
    this.closeDetailModals()
    this.selectedSupplier = supplier
    this.supplierLimitMode = manageLimit
  }

  closeSupplier(): void {
    this.selectedSupplier = null
    this.supplierLimitMode = false
  }

  saveSupplierLimit(): void {
    const supplier = this.selectedSupplier
    if (!supplier) return
    this.closeSupplier()
    this.toast = `Supplier financing limit update prepared for ${supplier.business}.`
  }

  openInviteSupplier(): void {
    this.closeDetailModals()
    this.inviteSupplierOpen = true
  }

  closeInviteSupplier(): void {
    this.inviteSupplierOpen = false
  }

  completeInviteSupplier(): void {
    this.inviteSupplierOpen = false
    this.toast = 'Supplier invitation prepared for review.'
  }

  private closeDetailModals(): void {
    this.selectedBatch = null
    this.selectedObligation = null
    this.selectedSupplier = null
    this.supplierLimitMode = false
    this.inviteSupplierOpen = false
  }
}

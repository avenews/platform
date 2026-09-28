/** Original preview-77 fixtures, shared without changing their values or statuses. */
export type PartnerSection = 'invoice-uploads' | 'obligations' | 'suppliers'
export type SupplierStatusKey = 'available' | 'unavailable' | 'max-used'
export type PeriodStatusKey = 'open' | 'cutoff' | 'settled' | 'overdue' | 'expired'
export type PaymentStatusKey = 'upcoming' | 'processing' | 'overdue' | 'paid'

export interface UploadBatch {
  id: string
  fileName: string
  uploadedAt: string
  imported: number
  skipped: number
  failed: number
  supplierCount: number
  periodCount: number
  status: string
  statusTone: string
}

export interface PartnerSupplierRow {
  id: string
  business: string
  identifier: string
  maxFinancing: number
  used: number
  available: number
  statusKey: SupplierStatusKey
  status: string
  statusTone: string
  lastUpload: string
  periodIds: readonly string[]
}

export interface PartnerPeriod {
  id: string
  reference: string
  supplierId: string
  dueDate: string
  invoiceCount: number
  invoiceValue: number
  financedAgainst: number
  amountToPay: number
  periodStatusKey: PeriodStatusKey
  periodStatus: string
  periodTone: string
  paymentStatusKey: PaymentStatusKey
  paymentStatus: string
  paymentTone: string
  paymentReference: string
}

export const PARTNER_UPLOAD_BATCHES: readonly UploadBatch[] = [
    { id: 'batch-aug-12', fileName: 'twiga-suppliers-2026-08-12.xlsx', uploadedAt: '12 Aug 2026, 09:42', imported: 37, skipped: 1, failed: 2, supplierCount: 18, periodCount: 21, status: 'Needs attention', statusTone: 'status-warning' },
    { id: 'batch-aug-05', fileName: 'twiga-suppliers-2026-08-05.xlsx', uploadedAt: '05 Aug 2026, 10:18', imported: 42, skipped: 3, failed: 0, supplierCount: 24, periodCount: 28, status: 'Processed', statusTone: 'status-success' },
    { id: 'batch-jul-28', fileName: 'twiga-suppliers-2026-07-28.xlsx', uploadedAt: '28 Jul 2026, 14:06', imported: 31, skipped: 0, failed: 0, supplierCount: 16, periodCount: 19, status: 'Processed', statusTone: 'status-success' },
  ]

export const PARTNER_SUPPLIERS: readonly PartnerSupplierRow[] = [
    { id: 'supplier-kioko', business: 'Kioko Agri Supplies Ltd', identifier: 'SUP-0042', maxFinancing: 1500000, used: 850000, available: 650000, statusKey: 'available', status: 'Available', statusTone: 'status-success', lastUpload: '12 Aug 2026', periodIds: ['pb-kioko-sep15', 'pb-kioko-sep30'] },
    { id: 'supplier-nairobi', business: 'Nairobi Fresh Traders Ltd', identifier: 'SUP-0068', maxFinancing: 1000000, used: 400000, available: 600000, statusKey: 'available', status: 'Available', statusTone: 'status-success', lastUpload: '12 Aug 2026', periodIds: ['pb-nairobi-aug31', 'pb-nairobi-sep30'] },
    { id: 'supplier-makueni', business: 'Makueni Produce Company', identifier: 'SUP-0091', maxFinancing: 600000, used: 0, available: 600000, statusKey: 'unavailable', status: 'Unavailable', statusTone: 'status-neutral', lastUpload: 'No eligible invoices yet', periodIds: ['pb-makueni-expired'] },
    { id: 'supplier-highlands', business: 'Highlands Food Processors', identifier: 'SUP-0104', maxFinancing: 900000, used: 900000, available: 0, statusKey: 'max-used', status: 'Max financing used', statusTone: 'status-warning', lastUpload: '05 Aug 2026', periodIds: ['pb-highlands-sep15', 'pb-highlands-oct15'] },
    { id: 'supplier-rift', business: 'Rift Valley Grains Ltd', identifier: 'SUP-0112', maxFinancing: 750000, used: 300000, available: 450000, statusKey: 'available', status: 'Available', statusTone: 'status-success', lastUpload: '05 Aug 2026', periodIds: ['pb-rift-sep20'] },
    { id: 'supplier-coast', business: 'Coastline Produce Ltd', identifier: 'SUP-0133', maxFinancing: 1200000, used: 650000, available: 550000, statusKey: 'available', status: 'Available', statusTone: 'status-success', lastUpload: '28 Jul 2026', periodIds: ['pb-coast-aug15', 'pb-coast-oct01'] },
    { id: 'supplier-kericho', business: 'Kericho Fresh Foods', identifier: 'SUP-0158', maxFinancing: 500000, used: 500000, available: 0, statusKey: 'max-used', status: 'Max financing used', statusTone: 'status-warning', lastUpload: '28 Jul 2026', periodIds: ['pb-kericho-sep10'] },
    { id: 'supplier-eldoret', business: 'Eldoret Farm Inputs', identifier: 'SUP-0174', maxFinancing: 850000, used: 250000, available: 600000, statusKey: 'available', status: 'Available', statusTone: 'status-success', lastUpload: '12 Aug 2026', periodIds: ['pb-eldoret-oct10'] },
  ]

export const PARTNER_PERIODS: readonly PartnerPeriod[] = [
    { id: 'pb-kioko-sep15', reference: 'PER-2026-09-15-KIOKO', supplierId: 'supplier-kioko', dueDate: '2026-09-15', invoiceCount: 8, invoiceValue: 1280000, financedAgainst: 850000, amountToPay: 1280000, periodStatusKey: 'cutoff', periodStatus: 'Cutoff', periodTone: 'status-warning', paymentStatusKey: 'upcoming', paymentStatus: 'Upcoming', paymentTone: 'status-info', paymentReference: 'TWIGA-KIOKO-150926' },
    { id: 'pb-kioko-sep30', reference: 'PER-2026-09-30-KIOKO', supplierId: 'supplier-kioko', dueDate: '2026-09-30', invoiceCount: 5, invoiceValue: 760000, financedAgainst: 0, amountToPay: 760000, periodStatusKey: 'open', periodStatus: 'Open', periodTone: 'status-info', paymentStatusKey: 'upcoming', paymentStatus: 'Upcoming', paymentTone: 'status-info', paymentReference: 'TWIGA-KIOKO-300926' },
    { id: 'pb-nairobi-aug31', reference: 'PER-2026-08-31-NAIROBI', supplierId: 'supplier-nairobi', dueDate: '2026-08-31', invoiceCount: 6, invoiceValue: 940000, financedAgainst: 400000, amountToPay: 940000, periodStatusKey: 'cutoff', periodStatus: 'Cutoff', periodTone: 'status-warning', paymentStatusKey: 'processing', paymentStatus: 'Payment processing', paymentTone: 'status-warning', paymentReference: 'TWIGA-NAIROBI-310826' },
    { id: 'pb-nairobi-sep30', reference: 'PER-2026-09-30-NAIROBI', supplierId: 'supplier-nairobi', dueDate: '2026-09-30', invoiceCount: 4, invoiceValue: 620000, financedAgainst: 0, amountToPay: 620000, periodStatusKey: 'open', periodStatus: 'Open', periodTone: 'status-info', paymentStatusKey: 'upcoming', paymentStatus: 'Upcoming', paymentTone: 'status-info', paymentReference: 'TWIGA-NAIROBI-300926' },
    { id: 'pb-makueni-expired', reference: 'PER-2026-07-31-MAKUENI', supplierId: 'supplier-makueni', dueDate: '2026-07-31', invoiceCount: 2, invoiceValue: 180000, financedAgainst: 0, amountToPay: 180000, periodStatusKey: 'expired', periodStatus: 'Expired', periodTone: 'status-neutral', paymentStatusKey: 'paid', paymentStatus: 'Paid', paymentTone: 'status-success', paymentReference: 'TWIGA-MAKUENI-310726' },
    { id: 'pb-highlands-sep15', reference: 'PER-2026-09-15-HIGHLANDS', supplierId: 'supplier-highlands', dueDate: '2026-09-15', invoiceCount: 7, invoiceValue: 1320000, financedAgainst: 900000, amountToPay: 1320000, periodStatusKey: 'cutoff', periodStatus: 'Cutoff', periodTone: 'status-warning', paymentStatusKey: 'upcoming', paymentStatus: 'Upcoming', paymentTone: 'status-info', paymentReference: 'TWIGA-HIGHLANDS-150926' },
    { id: 'pb-highlands-oct15', reference: 'PER-2026-10-15-HIGHLANDS', supplierId: 'supplier-highlands', dueDate: '2026-10-15', invoiceCount: 3, invoiceValue: 410000, financedAgainst: 0, amountToPay: 410000, periodStatusKey: 'open', periodStatus: 'Open', periodTone: 'status-info', paymentStatusKey: 'upcoming', paymentStatus: 'Upcoming', paymentTone: 'status-info', paymentReference: 'TWIGA-HIGHLANDS-151026' },
    { id: 'pb-rift-sep20', reference: 'PER-2026-09-20-RIFT', supplierId: 'supplier-rift', dueDate: '2026-09-20', invoiceCount: 5, invoiceValue: 590000, financedAgainst: 300000, amountToPay: 590000, periodStatusKey: 'open', periodStatus: 'Open', periodTone: 'status-info', paymentStatusKey: 'upcoming', paymentStatus: 'Upcoming', paymentTone: 'status-info', paymentReference: 'TWIGA-RIFT-200926' },
    { id: 'pb-coast-aug15', reference: 'PER-2026-08-15-COAST', supplierId: 'supplier-coast', dueDate: '2026-08-15', invoiceCount: 9, invoiceValue: 1040000, financedAgainst: 650000, amountToPay: 1040000, periodStatusKey: 'overdue', periodStatus: 'Overdue', periodTone: 'status-danger', paymentStatusKey: 'overdue', paymentStatus: 'Overdue', paymentTone: 'status-danger', paymentReference: 'TWIGA-COAST-150826' },
    { id: 'pb-coast-oct01', reference: 'PER-2026-10-01-COAST', supplierId: 'supplier-coast', dueDate: '2026-10-01', invoiceCount: 4, invoiceValue: 510000, financedAgainst: 0, amountToPay: 510000, periodStatusKey: 'open', periodStatus: 'Open', periodTone: 'status-info', paymentStatusKey: 'upcoming', paymentStatus: 'Upcoming', paymentTone: 'status-info', paymentReference: 'TWIGA-COAST-011026' },
    { id: 'pb-kericho-sep10', reference: 'PER-2026-09-10-KERICHO', supplierId: 'supplier-kericho', dueDate: '2026-09-10', invoiceCount: 4, invoiceValue: 720000, financedAgainst: 500000, amountToPay: 720000, periodStatusKey: 'cutoff', periodStatus: 'Cutoff', periodTone: 'status-warning', paymentStatusKey: 'upcoming', paymentStatus: 'Upcoming', paymentTone: 'status-info', paymentReference: 'TWIGA-KERICHO-100926' },
    { id: 'pb-eldoret-oct10', reference: 'PER-2026-10-10-ELDORET', supplierId: 'supplier-eldoret', dueDate: '2026-10-10', invoiceCount: 3, invoiceValue: 480000, financedAgainst: 250000, amountToPay: 480000, periodStatusKey: 'open', periodStatus: 'Open', periodTone: 'status-info', paymentStatusKey: 'upcoming', paymentStatus: 'Upcoming', paymentTone: 'status-info', paymentReference: 'TWIGA-ELDORET-101026' },
  ]

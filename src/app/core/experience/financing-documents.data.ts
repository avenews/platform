import type { CustomerProductId } from './customer-product-workspace.data'

export type FinancingDocumentType =
  | 'Invoice'
  | 'Proof of Delivery'
  | 'Proof of Payment'
  | 'Trade Document'

export interface FinancingDocument {
  id: string
  productId: CustomerProductId
  periodId: string
  type: FinancingDocumentType
  fileName: string
  fileUrl: string
  reference: string
  counterparty: string
  amount?: number
  dueDate?: string
  status?: string
  statusTone?: string
}

export const FINANCING_DOCUMENTS: readonly FinancingDocument[] = [
  {
    id: 'doc-acl-0318-invoice',
    productId: 'acl',
    periodId: 'acl-live-0318',
    type: 'Invoice',
    fileName: 'INV-ACL-318.svg',
    fileUrl: '/demo-documents/acl-fr-2026-0318-invoice.svg',
    reference: 'INV-ACL-318',
    counterparty: 'Mt Kenya Cooperative',
    amount: 1_400_000,
  },
  {
    id: 'doc-acl-0318-pod',
    productId: 'acl',
    periodId: 'acl-live-0318',
    type: 'Proof of Delivery',
    fileName: 'POD-FR-2026-0318.svg',
    fileUrl: '/demo-documents/proof-of-delivery-demo.svg',
    reference: 'POD-FR-2026-0318',
    counterparty: 'Mt Kenya Cooperative',
  },
  {
    id: 'doc-abf-qm-invoice',
    productId: 'abf',
    periodId: 'abf-quickmart-live',
    type: 'Invoice',
    fileName: 'INV-QM-2042.svg',
    fileUrl: '/demo-documents/abf-inv-qm-2042.svg',
    reference: 'INV-QM-2042',
    counterparty: 'Quick Mart Stores',
    amount: 450_000,
  },
  {
    id: 'doc-abf-qm-pod',
    productId: 'abf',
    periodId: 'abf-quickmart-live',
    type: 'Proof of Delivery',
    fileName: 'POD-QM-2042.svg',
    fileUrl: '/demo-documents/proof-of-delivery-demo.svg',
    reference: 'POD-QM-2042',
    counterparty: 'Quick Mart Stores',
  },
  {
    id: 'doc-abf-naivas-invoice',
    productId: 'abf',
    periodId: 'abf-naivas-overdue',
    type: 'Invoice',
    fileName: 'INV-NV-1128.svg',
    fileUrl: '/demo-documents/abf-inv-nv-1128.svg',
    reference: 'INV-NV-1128',
    counterparty: 'Naivas Fresh Produce',
    amount: 540_000,
  },
  {
    id: 'doc-abf-naivas-pop',
    productId: 'abf',
    periodId: 'abf-naivas-overdue',
    type: 'Proof of Payment',
    fileName: 'POP-NV-1128.svg',
    fileUrl: '/demo-documents/proof-of-payment-demo.svg',
    reference: 'POP-NV-1128',
    counterparty: 'Naivas Fresh Produce',
  },
  {
    id: 'doc-abf-naivas-pod',
    productId: 'abf',
    periodId: 'abf-naivas-overdue',
    type: 'Proof of Delivery',
    fileName: 'POD-NV-1128.svg',
    fileUrl: '/demo-documents/proof-of-delivery-demo.svg',
    reference: 'POD-NV-1128',
    counterparty: 'Naivas Fresh Produce',
  },
  {
    id: 'doc-stf-gh-invoice',
    productId: 'stf',
    periodId: 'stf-greenharvest-live',
    type: 'Invoice',
    fileName: 'GH-INV-8831.svg',
    fileUrl: '/demo-documents/stf-gh-inv-8831.svg',
    reference: 'GH-INV-8831',
    counterparty: 'GreenHarvest Distributors',
    amount: 300_000,
  },
  {
    id: 'doc-stf-gh-pod',
    productId: 'stf',
    periodId: 'stf-greenharvest-live',
    type: 'Proof of Delivery',
    fileName: 'POD-GH-8831.svg',
    fileUrl: '/demo-documents/proof-of-delivery-demo.svg',
    reference: 'POD-GH-8831',
    counterparty: 'GreenHarvest Distributors',
  },
  {
    id: 'doc-infx-kisumu-invoice',
    productId: 'infx',
    periodId: 'infx-kisumu-live',
    type: 'Invoice',
    fileName: 'INV-2026-0028.svg',
    fileUrl: '/demo-documents/infx-inv-2026-0028.svg',
    reference: 'INV-2026-0028',
    counterparty: 'Kisumu Buyers Co-op',
    amount: 1_050_000,
    dueDate: '2026-09-02',
  },
  {
    id: 'doc-infx-kisumu-pod',
    productId: 'infx',
    periodId: 'infx-kisumu-live',
    type: 'Proof of Delivery',
    fileName: 'POD-2026-0028.svg',
    fileUrl: '/demo-documents/proof-of-delivery-demo.svg',
    reference: 'POD-2026-0028',
    counterparty: 'Kisumu Buyers Co-op',
  },
  {
    id: 'doc-inf-twiga-7811',
    productId: 'invoice-financing',
    periodId: 'inf-twiga-live',
    type: 'Invoice',
    fileName: 'INV-7811.svg',
    fileUrl: '/demo-documents/inf-twiga-inv-7811.svg',
    reference: 'INV-7811',
    counterparty: 'Twiga Foods Ltd',
    amount: 980_000,
    dueDate: '2026-09-15',
    status: 'Financed',
    statusTone: 'status-live',
  },
  {
    id: 'doc-inf-twiga-7812',
    productId: 'invoice-financing',
    periodId: 'inf-twiga-live',
    type: 'Invoice',
    fileName: 'INV-7812.svg',
    fileUrl: '/demo-documents/inf-twiga-inv-7812.svg',
    reference: 'INV-7812',
    counterparty: 'Twiga Foods Ltd',
    amount: 770_000,
    dueDate: '2026-09-15',
    status: 'Eligible',
    statusTone: 'status-success',
  },
  {
    id: 'doc-inf-fresh-9120',
    productId: 'invoice-financing',
    periodId: 'inf-fresh-overdue',
    type: 'Invoice',
    fileName: 'INV-9120.svg',
    fileUrl: '/demo-documents/inf-fresh-inv-9120.svg',
    reference: 'INV-9120',
    counterparty: 'FreshProduce Kenya Ltd',
    amount: 600_000,
    dueDate: '2026-08-15',
    status: 'Overdue',
    statusTone: 'status-danger',
  },
  {
    id: 'doc-inf-fresh-9322',
    productId: 'invoice-financing',
    periodId: 'inf-fresh-cancelled',
    type: 'Invoice',
    fileName: 'INV-9322.svg',
    fileUrl: '/demo-documents/inf-fresh-inv-9322.svg',
    reference: 'INV-9322',
    counterparty: 'FreshProduce Kenya Ltd',
    amount: 500_000,
    dueDate: '2026-09-30',
    status: 'Not financed',
    statusTone: 'status-neutral',
  },
]

export function documentsForPeriod(periodId: string): readonly FinancingDocument[] {
  return FINANCING_DOCUMENTS.filter(document => document.periodId === periodId)
}

export function invoiceFinancingInvoices(): readonly FinancingDocument[] {
  return FINANCING_DOCUMENTS.filter(
    document => document.productId === 'invoice-financing' && document.type === 'Invoice',
  )
}

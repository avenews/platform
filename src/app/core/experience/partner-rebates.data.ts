import { PARTNER_REBATES } from './invoice-portal.data'
import { formatKes } from '../../shared/customer-portal.data'

/** Read-only rebate ledger. Never infer rebates from invoice value or unpaid financing. */
export type PartnerRebate = (typeof PARTNER_REBATES)[number]
export type RebateBalanceFilter = '' | 'due' | 'paid' | 'none'
export type RebateSort = '' | 'supplier-asc' | 'due-desc' | 'due-asc' | 'earned-desc' | 'collected-desc'
export interface RebateQuery {
  search?: string
  balance?: RebateBalanceFilter
  sort?: RebateSort
  page?: number
  pageSize?: number
}
export interface RebateTotals { collected: number; earned: number; paid: number; due: number }

const rebateBySupplier = new Map(PARTNER_REBATES.map(rebate => [rebate.supplierId, rebate]))
export function partnerRebateForSupplier(supplierId: string): PartnerRebate | undefined {
  return rebateBySupplier.get(supplierId)
}
export function rebateTotals(rows: readonly PartnerRebate[]): RebateTotals {
  const sum = (field: keyof RebateTotals) => rows.reduce((total, row) => total + Math.round(row[field] * 100), 0) / 100
  return {collected: sum('collected'), earned: sum('earned'), paid: sum('paid'), due: sum('due')}
}

/** Filter the full ledger before paginating; rendered rows and page buttons stay bounded. */
export function queryPartnerRebates(rows: readonly PartnerRebate[], query: RebateQuery = {}) {
  const search = (query.search ?? '').trim().toLowerCase()
  const filtered = rows.filter(row => {
    if (query.balance === 'due' && row.due <= 0) return false
    if (query.balance === 'paid' && !(row.earned > 0 && row.due === 0)) return false
    if (query.balance === 'none' && row.earned !== 0) return false
    if (!search) return true
    return [row.supplier, `${row.rate * 100}%`, ...[row.collected, row.earned, row.paid, row.due].flatMap(amount => [String(amount), formatKes(amount)])]
      .join(' ').toLowerCase().includes(search)
  })
  filtered.sort((a, b) => {
    let order = 0
    switch (query.sort) {
      case 'supplier-asc': order = a.supplier.localeCompare(b.supplier); break
      case 'due-asc': order = a.due - b.due; break
      case 'earned-desc': order = b.earned - a.earned; break
      case 'collected-desc': order = b.collected - a.collected; break
      default: order = b.due - a.due
    }
    return order || a.supplier.localeCompare(b.supplier) || a.supplierId.localeCompare(b.supplierId)
  })
  const pageSize = Math.max(1, Math.min(50, Math.floor(query.pageSize || 5)))
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const page = Math.max(1, Math.min(pages, Math.floor(query.page || 1)))
  const start = (page - 1) * pageSize
  const pageNumbers = Array.from(new Set([1, page - 1, page, page + 1, pages]))
    .filter(number => number > 0 && number <= pages).sort((a, b) => a - b)
  return {
    items: filtered.slice(start, start + pageSize), page, pages, pageNumbers,
    count: filtered.length, totalCount: rows.length,
    start: filtered.length ? start + 1 : 0, end: Math.min(start + pageSize, filtered.length),
    totals: rebateTotals(rows), matchingTotals: rebateTotals(filtered),
    narrowed: Boolean(search || query.balance),
  }
}

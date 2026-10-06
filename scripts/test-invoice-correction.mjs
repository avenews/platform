import { build } from 'esbuild'
import { readFileSync, rmSync } from 'node:fs'
import assert from 'node:assert/strict'

await build({
  stdin: {
    contents: `import '@angular/compiler';
      export * from './src/app/core/experience/invoice-portal.data';
      export * from './src/app/core/experience/customer-product-workspace.data';
      export * from './src/app/core/experience/partner-workspace.data';
      export * from './src/app/core/experience/partner-rebates.data';
      export {InvoicePartySelectComponent} from './src/app/shared/invoice-party-select.component';
      export {createEnvironmentInjector,runInInjectionContext,ElementRef} from '@angular/core';`,
    resolveDir: process.cwd(),
  },
  outfile: '.invoice-correction-domain.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  packages: 'external',
})

const d = await import('../.invoice-correction-domain.mjs')
let count = 0
function test(name, fn) { fn(); count++; console.log('PASS ' + name) }

const workspace = d.customerWorkspaceById('invoice-financing')
const manualParty = d.supplierInvoiceParties().find(p => p.id === 'inf-fresh')
const automaticParty = d.partnerInvoiceParties()[0]
const invoiceFile = new File(['invoice-content'], 'invoice.pdf', { type: 'application/pdf', lastModified: 1 })
const podFile = new File(['delivery-content'], 'delivery.pdf', { type: 'application/pdf', lastModified: 2 })
const futureDueDate = '2026-11-30'
const manualInvoice = { id: 1, reference: 'INV-TEST-001', amount: 125000, file: invoiceFile }
const section = { id: 1, partyId: manualParty.id, dueDate: futureDueDate, invoices: [manualInvoice], delivery: [podFile] }

test('baseline Invoice Financing values and lifecycle statuses stay intact', () => {
  assert.equal(workspace.availableMetricValue, 970000)
  assert.equal(workspace.outstandingMetricValue, 1300000)
  assert.deepEqual(
    [...new Set(workspace.periods.map(p => p.statusLabel))].sort(),
    ['Cancelled','Declined','Live','Overdue','Repaid','Requested'].sort(),
  )
})

test('two eligible Twiga periods still reconcile to Ksh 970,000', () => {
  const periods = workspace.periods.filter(d.invoiceCanRequest)
  assert.equal(periods.length, 2)
  assert.equal(periods.reduce((total, period) => total + period.availableToWithdraw, 0), 970000)
  assert.ok(!readFileSync('src/app/core/experience/invoice-portal.data.ts', 'utf8').includes('292_000'))
})

test('overdue block is relationship specific', () => {
  assert.equal(d.invoiceRelationshipHasOverdue('inf-fresh'), true)
  assert.equal(d.invoiceRelationshipHasOverdue('inf-twiga'), false)
  assert.equal(d.invoiceFinancingAvailability(workspace.periods.find(p => p.id === 'inf-fresh-overdue')).key, 'blocked-overdue')
})

test('partner payment status model has no processing state and retains twelve periods', () => {
  assert.equal(d.PARTNER_PERIODS.length, 12)
  assert.ok(d.PARTNER_PERIODS.every(period => !['processing', 'Payment processing'].includes(period.paymentStatusKey) && period.paymentStatus !== 'Payment processing'))
  const unpaid = d.PARTNER_PERIODS.filter(period => period.paymentStatusKey !== 'paid')
  assert.equal(unpaid.length, 11)
  assert.equal(unpaid.reduce((total, period) => total + period.amountToPay, 0), 8670000)
  assert.equal(unpaid.reduce((total, period) => total + Math.max(0, period.amountToPay - (period.amountReceived ?? 0)), 0), 8420000)
  assert.equal(unpaid.filter(period => period.paymentStatusKey === 'overdue').length, 1)
})

test('partner invoice fixtures reconcile to period counts and values', () => {
  assert.equal(d.PARTNER_INVOICES.length, 60)
  for (const period of d.PARTNER_PERIODS) {
    const invoices = d.PARTNER_INVOICES.filter(invoice => invoice.periodId === period.id)
    assert.equal(invoices.length, period.invoiceCount)
    assert.equal(invoices.reduce((total, invoice) => total + invoice.amount, 0), period.invoiceValue)
  }
})

test('processing mode is explicit and Partner Buyer mode is automatic', () => {
  assert.equal(manualParty.processingMode, 'manual')
  assert.ok(d.partnerInvoiceParties().every(party => party.processingMode === 'automatic'))
  assert.ok(d.partnerInvoiceParties().every(party => d.canUploadFor(party, 'partner')))
})

test('manual upload requires invoice number amount attachment and POD', () => {
  const store = new d.InvoiceDocumentsStore()
  assert.doesNotThrow(() => store.validate([section], 'supplier'))
  assert.throws(() => store.validate([{...section, invoices:[{...manualInvoice, reference:''}]}], 'supplier'))
  assert.throws(() => store.validate([{...section, invoices:[{...manualInvoice, amount:0}]}], 'supplier'))
  assert.throws(() => store.validate([{...section, invoices:[{...manualInvoice, file:null}]}], 'supplier'))
  assert.throws(() => store.validate([{...section, delivery:[]}], 'supplier'))
})

test('manual upload rejects overdue and invalid dates but accepts dates beyond sixty days', () => {
  const store = new d.InvoiceDocumentsStore()
  assert.throws(() => store.validate([{...section, dueDate:'2026-10-05'}], 'supplier'))
  assert.throws(() => store.validate([{...section, dueDate:'2026-02-31'}], 'supplier'))
  assert.doesNotThrow(() => store.validate([{...section, dueDate:'2027-03-01'}], 'supplier'))
  const state = d.invoiceFundingWindowState('2027-03-01', new Date('2026-10-06T00:00:00Z'))
  assert.equal(state.key, 'not-yet-available')
  assert.equal(state.eligibleFrom, '2026-12-31')
})

test('manual upload rejects duplicate sections invoice numbers and files', () => {
  const store = new d.InvoiceDocumentsStore()
  assert.throws(() => store.validate([section, {...section, id:2}], 'supplier'))
  assert.throws(() => store.validate([{...section, invoices:[manualInvoice, {...manualInvoice, id:2, file:new File(['other'], 'other.pdf', {lastModified:3})}]}], 'supplier'))
  assert.throws(() => store.validate([{...section, invoices:[manualInvoice, {...manualInvoice, id:2, reference:'INV-TEST-002'}]}], 'supplier'))
})

test('manual file policy rejects unsafe empty and oversized attachments', () => {
  const store = new d.InvoiceDocumentsStore()
  assert.throws(() => store.validate([{...section, invoices:[{...manualInvoice, file:new File(['x'], 'script.exe')}]}], 'supplier'))
  assert.throws(() => store.validate([{...section, invoices:[{...manualInvoice, file:new File([], 'empty.pdf')}]}], 'supplier'))
  assert.throws(() => store.validate([{...section, invoices:[{...manualInvoice, file:new File([new Uint8Array(10*1024*1024+1)], 'large.pdf')}]}], 'supplier'))
})

test('manual submission is locked Awaiting review and does not change facility totals', () => {
  const store = new d.InvoiceDocumentsStore()
  assert.throws(() => store.save([section], 'supplier', 'a', 'Amara', false))
  const receipt = store.save([section], 'supplier', 'a', 'Amara', true, '2026-10-06T08:00:00Z')
  assert.equal(receipt.mode, 'manual')
  assert.equal(receipt.processingStatus, 'completed')
  assert.equal(receipt.sections[0].invoices[0].reference, 'INV-TEST-001')
  assert.equal(receipt.sections[0].invoices[0].amount, 125000)
  const added = store.supplierInvoices().find(invoice => invoice.reference === 'INV-TEST-001')
  assert.equal(added.status, 'Awaiting review')
  assert.equal(added.amount, 125000)
  assert.equal(workspace.availableMetricValue, 970000)
})

test('automatic Partner Buyer upload accepts bulk files without extracted field confirmation', () => {
  const store = new d.InvoiceDocumentsStore()
  const bulk = new File(['rows'], 'partner-bulk.xlsx', {lastModified:10})
  assert.doesNotThrow(() => store.validateAutomatic([bulk]))
  const receipt = store.saveAutomatic([bulk], 'buyer-user', 'Buyer User', true, '2026-10-06T08:00:00Z')
  assert.equal(receipt.mode, 'automatic')
  assert.equal(receipt.processingStatus, 'processing')
  assert.deepEqual(receipt.automaticFiles, ['partner-bulk.xlsx'])
  assert.deepEqual(receipt.sections, [])
})

test('automatic upload blocks duplicate and invalid files', () => {
  const store = new d.InvoiceDocumentsStore()
  const duplicate = new File(['rows'], 'same.xlsx', {lastModified:11})
  assert.throws(() => store.validateAutomatic([duplicate, duplicate]))
  assert.throws(() => store.validateAutomatic([new File(['x'], 'bad.exe')]))
})

test('legal acknowledgement is recorded without creating a Funds Request', () => {
  const store = new d.InvoiceDocumentsStore()
  const receipt = store.save([section], 'supplier', 'a', 'Amara', true, '2026-10-06T08:00:00Z')
  assert.equal(receipt.privacyNoticeAcknowledged, true)
  assert.equal(receipt.termsAcknowledged, true)
  assert.ok(receipt.declaration.endsWith('I acknowledge the Privacy Notice and Terms & Conditions.'))
  assert.equal(receipt.fundsRequest, undefined)
})

test('typed search clears stale committed party until a valid selection is made', () => {
  const injector = d.createEnvironmentInjector([{provide:d.ElementRef,useValue:{nativeElement:{contains:()=>false,querySelector:()=>null}}}])
  d.runInInjectionContext(injector, () => {
    const selector = new d.InvoicePartySelectComponent()
    selector.parties = [
      {id:'one',name:'Supplier one',uploader:'buyer',pod:false,sublimit:0,processingMode:'automatic'},
      {id:'two',name:'Supplier two',uploader:'buyer',pod:false,sublimit:0,processingMode:'automatic'},
      {id:'blocked',name:'Blocked',uploader:'supplier',pod:false,sublimit:0,processingMode:'manual'},
    ]
    selector.role = 'partner'
    selector.value = 'one'
    selector.ngOnChanges()
    const emitted = []
    selector.valueChange.subscribe(value => emitted.push(value))
    selector.search('two')
    assert.equal(selector.value, '')
    assert.deepEqual(emitted, [''])
    selector.dismiss()
    assert.equal(selector.query, '')
    selector.choose(selector.parties[2])
    assert.deepEqual(emitted, [''])
    selector.choose(selector.parties[1])
    assert.deepEqual(emitted, ['', 'two'])
  })
  injector.destroy()
})

test('partner relationship terms hide supplier pricing', () => {
  const terms = d.invoiceRelationshipTerms(automaticParty.id, 'partner')
  const labels = terms.map(term => term.label)
  assert.ok(!labels.includes('Advance rate'))
  assert.ok(!labels.includes('Daily markup'))
  assert.ok(!labels.includes('Financing period'))
  assert.ok(labels.includes('Payment terms'))
  assert.ok(labels.includes('Invoice uploads'))
})

test('clearing accounts never substitute the general collection account', () => {
  for (const supplier of d.PARTNER_SUPPLIERS) {
    const account = d.clearingAccountFor(supplier.id)
    if (account) assert.notEqual(account.number, '2046346095')
  }
  assert.equal(d.clearingAccountFor('supplier-eldoret'), null)
})

test('rebate ledger remains principal collected minus paid rebates', () => {
  for (const rebate of d.PARTNER_REBATES) assert.equal(rebate.due, Math.round(rebate.collected * rebate.rate * 100) / 100 - rebate.paid)
  assert.deepEqual(d.rebateTotals(d.PARTNER_REBATES), {collected:350000,earned:3100,paid:500,due:2600})
})

test('rebate table defaults to at least ten rows per page', () => {
  const result = d.queryPartnerRebates(d.PARTNER_REBATES)
  assert.equal(result.items.length, 8)
  assert.equal(result.count, 8)
  assert.equal(result.pages, 1)
})

test('rebate search filters a 1000 supplier ledger before pagination', () => {
  const rows = Array.from({length:1000}, (_,i) => ({
    supplierId:String(i), supplier:`Supplier ${String(i).padStart(4,'0')}`,
    rate:0.01, collected:100000, earned:1000, paid:i%2?500:1000, due:i%2?500:0,
  }))
  const result = d.queryPartnerRebates(rows, {page:100,balance:'due',sort:'supplier-asc'})
  assert.equal(result.count, 500)
  assert.equal(result.page, 50)
  assert.equal(result.items.length, 10)
  assert.equal(result.items.at(-1).supplier, 'Supplier 0999')
  const searched = d.queryPartnerRebates(rows, {search:'Supplier 0999',page:100})
  assert.equal(searched.count, 1)
  assert.equal(searched.page, 1)
  assert.equal(searched.items[0], rows[999])
  assert.equal(searched.matchingTotals.due, 500)
  assert.equal(searched.totals.due, 250000)
})

console.log(`${count} correction domain checks passed.`)
rmSync('.invoice-correction-domain.mjs')

import { build } from 'esbuild'
import { readFileSync, rmSync } from 'node:fs'
import assert from 'node:assert/strict'
await build({stdin:{contents:`import '@angular/compiler'; export * from './src/app/core/experience/invoice-portal.data'; export * from './src/app/core/experience/customer-product-workspace.data'; export * from './src/app/core/experience/partner-workspace.data'; export {InvoicePartySelectComponent} from './src/app/shared/invoice-party-select.component'; export {createEnvironmentInjector,runInInjectionContext,ElementRef} from '@angular/core';`,resolveDir:process.cwd()},outfile:'.invoice-correction-domain.mjs',bundle:true,platform:'node',format:'esm',packages:'external'})
const d=await import('../.invoice-correction-domain.mjs')
let count=0
function test(name,fn){fn();count++;console.log('PASS '+name)}
const workspace=d.customerWorkspaceById('invoice-financing')
test('preview 77 financing values and lifecycle statuses are preserved',()=>{assert.equal(workspace.availableMetricValue,970000);assert.equal(workspace.outstandingMetricValue,1300000);assert.deepEqual([...new Set(workspace.periods.map(p=>p.statusLabel))].sort(),['Cancelled','Declined','Live','Overdue','Repaid','Requested'].sort())})
test('two assessed eligible periods reconcile to Ksh 970,000 without invented reservations',()=>{const p=workspace.periods.filter(d.invoiceCanRequest);assert.equal(p.length,2);assert.equal(p.reduce((n,p)=>n+p.availableToWithdraw,0),970000);assert.ok(!readFileSync('src/app/core/experience/invoice-portal.data.ts','utf8').includes('292_000'))})
test('two payments due remain one overdue and one upcoming',()=>{assert.deepEqual(d.paymentAttentionCounts(workspace),{overdue:1,upcoming:1,total:2})})
test('outstanding filter uses disbursed unpaid balances only',()=>{const rows=workspace.periods.filter(p=>p.disbursementDate&&p.outstandingBalance>0);assert.equal(rows.length,2);assert.equal(rows.reduce((n,p)=>n+p.outstandingBalance,0),1300000)})
test('global credit limit remains independently configured',()=>assert.equal(d.INVOICE_FACILITY.approvedLimit,3000000))
test('original partner payment records, counts and amounts are preserved',()=>{assert.equal(d.PARTNER_PERIODS.length,12);const unpaid=d.PARTNER_PERIODS.filter(p=>p.paymentStatusKey!=='paid');assert.equal(unpaid.length,11);assert.equal(unpaid.reduce((n,p)=>n+p.amountToPay,0),8670000);assert.equal(unpaid.filter(p=>p.paymentStatusKey==='overdue').length,1)})
test('rebate ledger is based on collected principal minus paid rebates',()=>{for(const r of d.PARTNER_REBATES)assert.equal(r.due,Math.round(r.collected*r.rate*100)/100-r.paid);assert.equal(d.PARTNER_REBATES.reduce((n,r)=>n+r.due,0),2600)})
test('partner invoice fixtures reconcile to unchanged period counts and totals',()=>{for(const p of d.PARTNER_PERIODS){const inv=d.PARTNER_INVOICES.filter(i=>i.periodId===p.id);assert.equal(inv.length,p.invoiceCount);assert.equal(inv.reduce((n,i)=>n+i.amount,0),p.invoiceValue);assert.ok(inv.every(i=>!i.fileUrl))}})
test('upload ownership is configurable and not inferred from partner type',()=>{const parties=d.supplierInvoiceParties();assert.equal(parties.filter(p=>d.canUploadFor(p,'supplier')).length,1);assert.ok(parties.filter(p=>p.uploader==='buyer').every(p=>!d.canUploadFor(p,'supplier')));assert.equal(d.canUploadFor({...parties[0],uploader:'supplier'},'supplier'),true)})
const file=new File(['invoice-content'],'invoice.pdf',{type:'application/pdf'})
const pod=new File(['delivery-content'],'delivery.pdf',{type:'application/pdf'})
const section={id:1,partyId:'inf-fresh',dueDate:'2026-09-30',invoices:[file],delivery:[pod]}
test('original supplier invoice table retains its original four records',()=>{const store=new d.InvoiceDocumentsStore();assert.equal(store.supplierInvoices().length,4);assert.deepEqual(store.supplierInvoices().map(i=>i.status),['Financed','Eligible','Overdue','Not financed'])})
test('main and period invoice views use the same records',()=>{const store=new d.InvoiceDocumentsStore();const row=store.supplierInvoices().find(i=>i.reference==='INV-9120');assert.equal(store.periodInvoices('inf-fresh-overdue','supplier')[0],row);assert.equal(store.periodInvoices('inf-fresh-declined','supplier').length,0)})
test('unassigned parties and wrong roles cannot upload',()=>{const store=new d.InvoiceDocumentsStore();assert.throws(()=>store.validate([{...section,partyId:'inf-twiga'}],'supplier'));assert.throws(()=>store.validate([section],'partner'))})
test('delivery evidence, duplicate sections and file validation are enforced',()=>{const store=new d.InvoiceDocumentsStore();assert.throws(()=>store.validate([{...section,delivery:[]}],'supplier'));assert.throws(()=>store.validate([section,{...section,id:2}],'supplier'));assert.throws(()=>store.validate([{...section,invoices:[new File(['x'],'script.exe')]}],'supplier'));assert.throws(()=>store.validate([{...section,invoices:[file,file]}],'supplier'));assert.throws(()=>store.validate([{...section,invoices:[new File([],'empty.pdf')]}],'supplier'))})
test('confirmation required and submission identity/time recorded without changing credit',()=>{const store=new d.InvoiceDocumentsStore();assert.throws(()=>store.save([section],'supplier','a','Amara',false));const receipt=store.save([section],'supplier','a','Amara',true);assert.equal(receipt.actorId,'a');assert.equal(receipt.declaration,d.INVOICE_DECLARATION);assert.ok(receipt.createdAt);assert.equal(store.periodInvoices('inf-fresh-cancelled','supplier').length,2);assert.equal(workspace.availableMetricValue,970000)})
test('compact selector can search hundreds of relationships with bounded rendering',()=>{const injector=d.createEnvironmentInjector([{provide:d.ElementRef,useValue:{nativeElement:{contains:()=>false,querySelector:()=>null}}}]);d.runInInjectionContext(injector,()=>{const selector=new d.InvoicePartySelectComponent();selector.parties=Array.from({length:500},(_,i)=>({id:String(i),name:`Supplier ${i}`,uploader:'buyer',pod:false,sublimit:0}));selector.role='partner';assert.equal(selector.matches.length,30);selector.query='Supplier 499';assert.equal(selector.matches.length,1);assert.equal(selector.matches[0].id,'499')});injector.destroy()})
test('clearing account never substitutes general collection account',()=>{for(const s of d.PARTNER_SUPPLIERS){const a=d.clearingAccountFor(s.id);if(a)assert.notEqual(a.number,'2046346095')}assert.equal(d.clearingAccountFor('supplier-eldoret'),null)})

test('spreadsheet invoice formats are accepted for both roles, but POD stays documentary',()=>{
  const store=new d.InvoiceDocumentsStore()
  for(const ext of ['xls','xlsx','csv']) {
    const invoices=[new File(['sheet rows'],'invoices.'+ext)]
    store.validate([{...section,invoices}],'supplier')
    store.validate([{...section,partyId:d.partnerInvoiceParties()[0].id,invoices,delivery:[]}],'partner')
    assert.throws(()=>store.validate([{...section,delivery:invoices}],'supplier'))
  }
})
test('confirmation time and legal references are recorded without authorising a Funds Request',()=>{
  const store=new d.InvoiceDocumentsStore(),confirmedAt='2026-09-24T08:00:00Z'
  const receipt=store.save([section],'supplier','a','Amara',true,confirmedAt)
  assert.equal(receipt.confirmedAt,confirmedAt)
  assert.equal(receipt.privacyNoticeAcknowledged,true)
  assert.equal(receipt.termsAcknowledged,true)
  assert.ok(receipt.declaration.endsWith('I acknowledge the Privacy Notice and Terms & Conditions.'))
  assert.ok(receipt.fundsRequestTermsUrl.includes('1sKfI46A5zjWpzkHsXXOoefbcRB3XK2eha_h0VjteOTM'))
  assert.ok(receipt.privacyNoticeUrl.includes('1Majh4ZEQ26icfUSVVycA2e9J3JE0uw_i2syI1WTiZQY'))
  assert.equal(receipt.fundsRequest,undefined)
  assert.throws(()=>store.save([section],'supplier','a','Amara',true,''))
})
test('search and dismissal preserve the committed party; only permitted changed selections emit',()=>{
  const injector=d.createEnvironmentInjector([{provide:d.ElementRef,useValue:{nativeElement:{contains:()=>false,querySelector:()=>null}}}])
  d.runInInjectionContext(injector,()=>{
    const selector=new d.InvoicePartySelectComponent()
    selector.parties=[{id:'one',name:'Supplier one',uploader:'buyer'},{id:'two',name:'Supplier two',uploader:'buyer'},{id:'blocked',name:'Blocked',uploader:'supplier'}]
    selector.role='partner';selector.value='one';selector.ngOnChanges()
    const emitted=[];selector.valueChange.subscribe(value=>emitted.push(value))
    selector.search('two');assert.equal(selector.value,'one');assert.deepEqual(emitted,[])
    selector.dismiss();assert.equal(selector.query,'Supplier one')
    selector.choose(selector.parties[0]);assert.deepEqual(emitted,[])
    selector.choose(selector.parties[2]);assert.deepEqual(emitted,[])
    selector.choose(selector.parties[1]);assert.deepEqual(emitted,['two'])
  });injector.destroy()
})
test('invalid calendar dates, oversize files and too many sections are rejected',()=>{
  const store=new d.InvoiceDocumentsStore()
  assert.throws(()=>store.validate([{...section,dueDate:'2026-02-31'}],'supplier'))
  assert.throws(()=>store.validate([{...section,invoices:[new File([new Uint8Array(10*1024*1024+1)],'large.pdf')]}],'supplier'))
  assert.throws(()=>store.validate(Array.from({length:21},(_,i)=>({...section,id:i})),'supplier'))
})
console.log(`${count} correction domain checks passed.`)
rmSync('.invoice-correction-domain.mjs')

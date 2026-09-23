import assert from 'node:assert/strict'
import { mkdir, rm } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { build } from 'esbuild'
import '@angular/compiler'

const dir=resolve('.review-test')
await mkdir(dir,{recursive:true})
await build({entryPoints:['src/app/features/invoice-review/invoice-review.store.ts'],bundle:true,packages:'external',platform:'node',format:'esm',outfile:resolve(dir,'store.mjs'),logLevel:'silent'})
const {InvoiceReviewStore,REVIEW_DATE,FILE_POLICY}=await import(pathToFileURL(resolve(dir,'store.mjs')).href)
const stores=[]
let passed=0
const store=()=>{const value=new InvoiceReviewStore();stores.push(value);return value}
const file=(name='invoice.pdf')=>new File(['%PDF-1.4\nreview sample'],name,{type:'application/pdf',lastModified:1})
const group=(overrides={})=>({id:'g1',relationshipId:'inf-fresh',dueDate:'2026-09-30',files:[file()],pod:[file('delivery.pdf')],...overrides})
const date=(days)=>new Date(Date.parse(REVIEW_DATE+'T00:00:00Z')+days*86400000).toISOString().slice(0,10)
function check(name,fn){fn();passed++;console.log(`PASS ${name}`)}
try {
  check('supplier totals distinguish disbursed outstanding, reservations, unused credit and financing available now',()=>{
    const s=store();assert.equal(s.outstandingTotal,1300000);assert.equal(s.reservedTotal,292000);assert.equal(s.headroom,1408000);assert.equal(s.availableTotal,320000)
  })
  check('source invoice records are shared between the main list and exact period',()=>{
    const s=store(),p=s.periods.find(p=>p.id==='inf-twiga-live');assert.equal(s.invoiceValue(p),1750000)
    for(const invoice of s.periodInvoices(p)) assert.strictEqual(s.invoicesFor('supplier').find(i=>i.id===invoice.id),invoice)
    assert.ok(s.invoicesFor('supplier').some(i=>!i.fileUrl))
    assert.ok(s.periodInvoices(p).every(i=>i.periodId===p.id))
  })
  check('supplier and partner scopes exclude unrelated relationships',()=>{
    const s=store();assert.ok(s.invoicesFor('partner').every(i=>i.buyer==='Twiga Foods Ltd'));assert.ok(s.invoicesFor('supplier').every(i=>i.supplier===s.customer));assert.equal(s.relationshipsFor('partner').length,8)
  })
  check('ownership uses configuration rather than relationship type',()=>{
    const s=store(),twiga=s.relationship('inf-twiga'),fresh=s.relationship('inf-fresh')
    assert.equal(s.canUpload(twiga,'supplier'),false);assert.equal(s.canUpload(fresh,'supplier'),true)
    twiga.owner='supplier';assert.equal(s.canUpload(twiga,'supplier'),true);assert.equal(s.canUpload(twiga,'partner'),false)
  })
  check('all buyer-owned relationships produce no supplier upload options',()=>{
    const s=store();s.relationshipsFor('supplier').forEach(r=>r.owner='buyer');assert.equal(s.relationshipsFor('supplier').some(r=>s.canUpload(r,'supplier')),false)
  })
  check('new review requests reserve credit but never increase disbursed outstanding',()=>{
    const s=store(),p=s.periods.find(p=>p.id==='inf-twiga-requested');s.reserveForReview(p,50000)
    assert.equal(s.availableTotal,270000);assert.equal(s.reservedTotal,342000);assert.equal(s.outstandingTotal,1300000);assert.equal(p.disbursed,0);assert.equal(s.requests.length,1)
    assert.throws(()=>s.reserveForReview(p,1000000));assert.throws(()=>s.reserveForReview(p,NaN));assert.throws(()=>s.reserveForReview(p,-1))
  })
  check('shared global credit is capped once, not counted once for each buyer',()=>{
    const s=store();s.approvedLimit=s.outstandingTotal+s.reservedTotal+100000
    const p={id:'spec-fresh',reference:'SPEC',relationshipId:'inf-fresh',dueDate:'2026-10-15',disbursed:0,principalCollected:0,buyerPaid:0,reserved:0,closed:false}
    s.periods.push(p);s.invoices.push({id:'spec-invoice',reference:'SPEC',periodId:p.id,relationshipId:p.relationshipId,buyer:'FreshProduce Kenya Ltd',supplier:s.customer,dueDate:p.dueDate,amount:1000000,status:'Eligible',eligible:true})
    assert.equal(s.availableTotal,100000);assert.ok(s.relationshipsFor('supplier').reduce((n,r)=>n+s.relationshipAvailable(r),0)>s.availableTotal)
  })
  check('funding window includes day 7 and day 60, excludes day 6 and day 61',()=>{
    const s=store(),p={...s.periods.find(p=>p.id==='inf-twiga-requested')}
    for(const [days,expected] of [[6,false],[7,true],[60,true],[61,false]]){p.dueDate=date(days);assert.equal(s.withinWindow(p),expected)}
  })
  check('rebates use principal collected less rebate paid, not invoice value or disbursements',()=>{
    const s=store();assert.equal(s.rebateDue,2600)
    const coast=s.relationship('partner-coast');assert.deepEqual(s.rebate(coast),{collected:150000,earned:1500,paid:500,due:1000})
    assert.equal(s.rebate(s.relationship('partner-highlands')).earned,0)
  })
  check('partial buyer payments reduce the full invoice obligation',()=>{
    const s=store(),p=s.periods.find(p=>p.relationshipId==='partner-coast');assert.equal(s.amountToPay(p),890000);assert.equal(s.paymentStatus(p),'Overdue')
    const paid=s.periods.find(p=>p.relationshipId==='partner-makueni');assert.equal(s.amountToPay(paid),0);assert.equal(s.paymentStatus(paid),'Paid')
  })
  check('upload rejects an unassigned uploader and an unknown relationship',()=>{
    const s=store();assert.throws(()=>s.validateUpload([group({relationshipId:'inf-twiga'})],'supplier'),/other party/);assert.throws(()=>s.validateUpload([group({relationshipId:'missing'})],'supplier'))
  })
  check('duplicate relationship and date sections are rejected',()=>{
    const s=store();assert.throws(()=>s.validateUpload([group(),group({id:'g2'})],'supplier'),/merge sections/)
  })
  check('required POD and unconfigured POD are handled explicitly',()=>{
    const s=store();assert.throws(()=>s.validateUpload([group({pod:[]})],'supplier'),/Proof of Delivery/)
    s.relationship('inf-fresh').pod=null;assert.throws(()=>s.validateUpload([group()],'supplier'),/confirmation/)
  })
  check('upload policy rejects past dates, unsupported and empty files, duplicates and too many groups',()=>{
    const s=store();assert.throws(()=>s.validateUpload([group({dueDate:date(-1)})],'supplier'))
    assert.throws(()=>s.validateUpload([group({files:[file('invoice.exe')]})],'supplier'))
    assert.throws(()=>s.validateUpload([group({files:[new File([],'empty.pdf')]})],'supplier'))
    const duplicate=file();assert.throws(()=>s.validateUpload([group({files:[duplicate,duplicate]})],'supplier'),/twice/)
    assert.throws(()=>s.validateUpload(Array.from({length:21},()=>group()),'supplier'))
    assert.throws(()=>s.validateUpload([group({pod:Array.from({length:11},(_,i)=>file(`pod-${i}.pdf`))})],'supplier'))
  })
  check('uploads remain accepted after funding cutoff but create no additional financing',()=>{
    const s=store();assert.doesNotThrow(()=>s.validateUpload([group({dueDate:date(3)})],'supplier'))
    const before=s.availableTotal;s.saveUpload([group({dueDate:date(3)})],'supplier','Demo reviewer','review-contact',new Date().toISOString());assert.equal(s.availableTotal,before)
  })
  check('confirmation identity and time are required and recorded with grouped uploads and POD',()=>{
    const s=store(),g=group(),time=new Date().toISOString()
    assert.throws(()=>s.saveUpload([g],'supplier','Reviewer','contact',''))
    const receipt=s.saveUpload([g],'supplier','Demo reviewer','review-contact',time)
    assert.equal(receipt.actorId,'review-contact');assert.equal(receipt.confirmedAt,time);assert.equal(receipt.groups[0].relationshipId,g.relationshipId)
    assert.equal(s.attachments.length,1);assert.equal(s.receipts.length,1)
    const uploaded=s.invoices.find(i=>i.fileName==='invoice.pdf');assert.equal(uploaded.amount,null);assert.equal(uploaded.eligible,false);assert.equal(uploaded.periodId,'inf-fresh-cancelled');assert.ok(uploaded.fileUrl.startsWith('blob:'))
  })
  check('partner spreadsheet uploads are explicit unparsed review records',()=>{
    const s=store(),g=group({relationshipId:'inf-twiga',dueDate:'2026-10-15',files:[file('batch.csv')],pod:[]})
    const before=s.availableTotal;s.saveUpload([g],'partner','Demo reviewer','contact',new Date().toISOString());assert.equal(s.availableTotal,before)
    assert.equal(s.invoices.find(i=>i.fileName==='batch.csv').status,'Review upload')
  })
  console.log(`\n${passed} invoice-review domain checks passed.`)
} finally {stores.forEach(s=>s.ngOnDestroy());await rm(dir,{recursive:true,force:true})}

import { test, expect, type Page, type Locator } from '@playwright/test'
const session = {contactId:'usr_001',contactFirstName:'Amara',contactLastName:'Osei',contactEmail:'amara@example.test',businessId:'biz_demo_001',businessName:'Kioko Agri Supplies Ltd',role:'admin'}
const terms = 'https://docs.google.com/document/d/1sKfI46A5zjWpzkHsXXOoefbcRB3XK2eha_h0VjteOTM/edit?tab=t.0#heading=h.t4m1vp8ushhx'
const privacy = 'https://docs.google.com/document/d/1Majh4ZEQ26icfUSVVycA2e9J3JE0uw_i2syI1WTiZQY/edit?tab=t.0#heading=h.t0r9ovjgdv4y'
const file = (name:string) => ({name,mimeType:name.endsWith('pdf')?'application/pdf':'application/vnd.ms-excel',buffer:Buffer.from('review fixture')})
const rows = (page:Page) => page.locator('.customer-activity-table tbody tr:visible,.customer-activity-cards .customer-financing-card:visible')
const buyerRows = (page:Page) => page.locator('.relationship-table tbody tr:visible,.relationship-cards .relationship-card:visible')
async function goto(page:Page,path='invoice-financing/home') { await page.goto('/experience/'+path); await expect(page.locator('h1').first()).toBeVisible(); await page.evaluate(()=>document.fonts.ready) }
async function upload(page:Page) { await page.getByRole('button',{name:'Upload invoices',exact:true}).first().click(); const modal=page.getByRole('dialog'); await expect(modal.locator('.invoice-upload-group')).toHaveCount(1); return modal }
async function select(modal:Locator,name='FreshProduce') { await modal.getByRole('combobox').first().fill(name); await modal.getByRole('option').filter({hasText:name}).click() }
async function ready(modal:Locator) { await select(modal); await modal.locator('input[type="date"]').fill('2026-09-30'); await modal.locator('input[type="file"]').first().setInputFiles(file('invoice.xlsx')); await modal.locator('input[type="file"]').last().setInputFiles(file('delivery.pdf')) }
async function modalPeriod(page:Page,ref:string) { await rows(page).filter({hasText:ref}).first().click(); return page.getByRole('dialog') }
async function within(page:Page) {
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+2)).toBeTruthy()
  for(const modal of await page.getByRole('dialog').all()) { if(!await modal.isVisible())continue; const box=await modal.boundingBox(); const viewport=page.viewportSize()!; expect(box!.x).toBeGreaterThanOrEqual(-1);expect(box!.x+box!.width).toBeLessThanOrEqual(viewport.width+1); expect(box!.y).toBeGreaterThanOrEqual(-1);expect(box!.y+box!.height).toBeLessThanOrEqual(viewport.height+1) }
}
test.beforeEach(async({page}) => { await page.addInitScript(s=>localStorage.setItem('av_customer_portal_session',JSON.stringify(s)),session) })
test.afterEach(async({page}) => { await within(page); for(const text of ['Review preview','Sample data as of','reserved for pending','Review mode.','This preview does not replace','4 unpaid periods'])await expect(page.locator('body')).not.toContainText(text) })

test('direct uploader and stable dropdown retain buyer, evidence and confirmation while searching',async({page},info) => {
  await goto(page); const modal=await upload(page); await expect(modal.getByRole('button',{name:'Continue',exact:true})).toHaveCount(0); await expect(modal.locator('.invoice-chooser-space')).toHaveCount(0)
  await ready(modal); await modal.getByRole('checkbox').check(); await modal.getByRole('combobox').scrollIntoViewIfNeeded()
  const before=await modal.boundingBox(); const hint=modal.locator('.party-select__hint'); const hintBox=await hint.boundingBox()
  await modal.getByRole('combobox').fill('Twiga'); await expect(modal.getByRole('option').filter({hasText:'Twiga'})).toBeDisabled(); await expect(hint).toHaveText('You upload invoices'); expect(await hint.boundingBox()).toEqual(hintBox)
  const opened=await modal.boundingBox(); expect(opened!.height).toBeCloseTo(before!.height,0); expect(opened!.y).toBeCloseTo(before!.y,0)
  await modal.getByRole('combobox').press('Escape'); await expect(modal.getByRole('combobox')).toHaveValue('FreshProduce Kenya Ltd'); await expect(modal).toContainText('invoice.xlsx'); await expect(modal).toContainText('delivery.pdf'); await expect(modal.getByRole('checkbox')).toBeChecked()
  const toggle=modal.locator('.party-select__toggle'), icon=toggle.locator('svg'); const tb=await toggle.boundingBox(), ib=await icon.boundingBox(); expect(Math.abs(tb!.y+tb!.height/2-ib!.y-ib!.height/2)).toBeLessThan(1)
  await page.screenshot({path:info.outputPath('stable-uploader.png'),fullPage:true})
})

test('dashed pickers, spreadsheet invoices, role-aware instructions and legal links',async({page},info) => {
  await goto(page); const modal=await upload(page); await select(modal)
  await expect(modal.locator('.invoice-file-chooser')).toHaveCount(2)
  for (const chooser of await modal.locator('.invoice-file-chooser').all()) expect(await chooser.evaluate(e=>getComputedStyle(e).borderStyle)).toBe('dashed')
  const input=modal.locator('input[type="file"]').first(); for(const ext of ['.xls','.xlsx','.csv'])await expect(input).toHaveAttribute('accept',new RegExp(ext.replace('.','\\.')))
  await expect(modal.locator('.invoice-upload-instructions')).toContainText('same buyer and payment due date'); await expect(modal.locator('.invoice-upload-instructions')).toContainText('Proof of Delivery'); await expect(modal.locator('.invoice-upload-instructions')).toContainText('+ Add another section')
  await expect(modal.getByRole('link',{name:'Funds Request Terms & Conditions',exact:true})).toHaveAttribute('href',terms); await expect(modal.getByRole('link',{name:'Privacy Notice',exact:true}).first()).toHaveAttribute('href',privacy)
  for(const link of await modal.getByRole('link').all()) {await expect(link).toHaveAttribute('target','_blank');await expect(link).toHaveAttribute('rel',/noopener/)}
  await expect(modal.locator('.invoice-upload-confirmation')).toContainText('completed deliveries, not pre-delivery or disputed invoices'); await expect(modal.locator('.invoice-upload-terms')).toContainText('when a Funds Request is submitted')
  await modal.locator('input[type="date"]').fill('2026-09-30'); await input.setInputFiles([file('one.xls'),file('two.xlsx'),file('three.csv')]); await modal.locator('input[type="file"]').last().setInputFiles(file('delivery.pdf'));await modal.getByRole('checkbox').check()
  await page.screenshot({path:info.outputPath('uploader-confirmation.png'),fullPage:true})
  await modal.getByRole('button',{name:'Submit invoices',exact:true}).click();await expect(modal.getByRole('status')).toContainText('Invoices added');await expect(modal.getByRole('status')).toContainText('What happens next');await expect(modal.getByRole('status')).toContainText('Eligible, approved invoices create or update');await expect(modal.getByRole('status')).toContainText('Funds Request window is open')
  await page.screenshot({path:info.outputPath('upload-next-steps.png'),fullPage:true});await modal.getByRole('button',{name:'View invoices',exact:true}).click();await expect(page).toHaveURL(/invoice-financing\/invoices$/);await expect(page.locator('body')).toContainText('one.xls')
})

test('uploader validation, remove files and repeatable sections remain intact',async({page}) => {
  await goto(page);const modal=await upload(page);await ready(modal)
  await modal.getByRole('button',{name:'Submit invoices'}).click();await expect(modal.getByRole('alert')).toContainText('Confirm')
  await modal.getByRole('button',{name:'Copy section 1',exact:true}).click();await expect(modal.locator('.invoice-upload-group')).toHaveCount(2);await expect(modal.locator('.invoice-upload-group').last().getByRole('combobox')).toHaveValue('FreshProduce Kenya Ltd')
  await modal.getByRole('button',{name:'Remove section 2',exact:true}).click();await modal.getByRole('button',{name:'Remove invoice.xlsx',exact:true}).click();await expect(modal.locator('.invoice-upload-file').filter({hasText:'invoice.xlsx'})).toHaveCount(0)
  await modal.locator('input[type="file"]').first().setInputFiles(file('bad.exe'));await modal.getByRole('checkbox').check();await modal.getByRole('button',{name:'Submit invoices'}).click();await expect(modal.getByRole('alert')).toContainText('file format')
  await modal.getByRole('button',{name:'Close',exact:true}).click();await expect(modal).toContainText('Discard the invoices');await modal.getByRole('button',{name:'Keep editing'}).click();await expect(modal).toContainText('bad.exe')
})

test('card-driven filters are visible, preserved through search and sort, and clearable',async({page},info) => {
  await goto(page);await page.getByRole('button',{name:'View available periods',exact:true}).click();await expect(rows(page)).toHaveCount(2);const summary=page.locator('.customer-filter-summary');await expect(summary).toContainText('Available to request');await expect(page.locator('.baseline-status:visible').filter({hasText:'Available to request'})).toHaveCount(0)
  await page.locator('.customer-filter-search input:visible').fill('Twiga');await expect(summary).toContainText('Available to request');await expect(rows(page)).toHaveCount(2)
  const desktop=page.viewportSize()!.width>=768
  if(!desktop)await page.getByRole('button',{name:'Filters',exact:true}).click()
  await page.locator('select[aria-label="Status"]:visible').selectOption('available-to-request')
  await page.locator('select[aria-label="Sort by"]:visible').selectOption('amount-desc')
  if(!desktop)await page.getByRole('button',{name:'Apply',exact:true}).click()
  await expect(summary).toContainText('Available to request');await expect(rows(page)).toHaveCount(2)
  if(desktop){await expect(page.getByRole('button',{name:'Clear filters',exact:true}).first()).toBeEnabled();await page.getByRole('button',{name:'Clear filters',exact:true}).first().click()}else await summary.getByRole('button',{name:'Clear filters'}).click()
  await expect(rows(page)).toHaveCount(6);await expect(summary).toHaveCount(0)
  for(const [button,label] of [['View outstanding periods','Outstanding financing'],['View payments due in Financing','Payments due']]) {await page.getByRole('button',{name:button,exact:true}).click();await expect(summary).toContainText(label);await expect(rows(page)).toHaveCount(2);await page.screenshot({path:info.outputPath(label+'.png'),fullPage:true});await summary.getByRole('button',{name:'Clear filters'}).click();await expect(rows(page)).toHaveCount(6)}
})

test('modal main actions share a desktop row and stack on mobile, with Lucide Back and aligned values',async({page},info) => {
  await goto(page);let modal=await modalPeriod(page,'DP-2026-10-15-TWIGA')
  const request=await modal.getByRole('button',{name:'Request funds',exact:true}).boundingBox(), files=await modal.getByRole('button',{name:'Files',exact:true}).boundingBox()
  if(page.viewportSize()!.width>=768){expect(request!.y).toBeCloseTo(files!.y,0);expect(request!.x+request!.width).toBeLessThan(files!.x)}else expect(request!.y+request!.height).toBeLessThan(files!.y)
  await page.screenshot({path:info.outputPath('modal-actions.png'),fullPage:true});await modal.getByRole('button',{name:'Close',exact:true}).click();modal=await modalPeriod(page,'DP-2026-08-15-FRESH')
  await modal.getByRole('button',{name:'Payment details',exact:true}).click();modal=page.getByRole('dialog');await expect(modal.getByRole('button',{name:'Back',exact:true}).locator('svg')).toHaveAttribute('viewBox','0 0 24 24')
  for(const value of await modal.locator('.customer-settlement-card>div>strong').all())expect(await value.evaluate(e=>getComputedStyle(e).textAlign)).toBe('right')
  await expect(modal).toContainText('Your Avenews Clearing Account');await page.screenshot({path:info.outputPath('payment-alignment.png'),fullPage:true})
})

test('buyer details show complete grids, full-width Settlement and a noninteractive upload-owner indicator',async({page},info) => {
  await goto(page,'invoice-financing/financing');const twiga=buyerRows(page).filter({hasText:'Twiga Foods Ltd'});const owner=twiga.locator('.invoice-upload-owner');await expect(owner).toHaveAttribute('role','note');expect(await owner.evaluate(e=>getComputedStyle(e).borderStyle)).toBe('solid');await expect(twiga.getByRole('button',{name:'Upload invoices'})).toHaveCount(0)
  await buyerRows(page).filter({hasText:'FreshProduce Kenya Ltd'}).getByRole('button',{name:'View more',exact:true}).click();const modal=page.getByRole('dialog')
  for(const grid of await modal.locator('.relationship-detail-grid').all()) {const dims=await grid.evaluate(e=>({height:e.clientHeight,scroll:e.scrollHeight,last:e.lastElementChild!.getBoundingClientRect().bottom,bottom:e.getBoundingClientRect().bottom}));expect(dims.scroll).toBeLessThanOrEqual(dims.height+2);expect(dims.last).toBeLessThanOrEqual(dims.bottom+1)}
  const settlement=modal.locator('.relationship-detail-grid__wide');await expect(settlement).toContainText('Settlement');const box=await settlement.boundingBox(),grid=await settlement.locator('..').boundingBox();expect(box!.width).toBeCloseTo(grid!.width-2,0)
  await settlement.scrollIntoViewIfNeeded();await expect(settlement.getByText('Buyer pays into the designated clearing account.',{exact:false})).toBeVisible();await page.screenshot({path:info.outputPath('complete-buyer-details.png'),fullPage:true})
  await modal.getByRole('button',{name:'Upload invoices',exact:true}).click();await expect(page.getByRole('dialog').getByRole('combobox')).toHaveValue('FreshProduce Kenya Ltd')
})

test('page navigation resets scroll but opening or closing a modal does not',async({page}) => {
  await goto(page);await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));const y=await page.evaluate(()=>scrollY)
  await page.getByRole('link',{name:'Buyers',exact:true}).first().click();await expect(page).toHaveURL(/invoice-financing\/financing$/);await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0)
  await page.evaluate(()=>window.scrollTo(0,200));const row=buyerRows(page).filter({hasText:'FreshProduce Kenya Ltd'});await row.getByRole('button',{name:'View more',exact:true}).scrollIntoViewIfNeeded();const before=await page.evaluate(()=>scrollY);await row.getByRole('button',{name:'View more',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).click();expect(await page.evaluate(()=>scrollY)).toBeCloseTo(before,0)
  await page.getByRole('link',{name:'Home',exact:true}).first().click();await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);expect(y).toBeGreaterThanOrEqual(0)
})

test('shared Partner uploader scrolls its options, accepts spreadsheets and explains supplier next steps',async({page},info) => {
  await goto(page,'invoice-partner/invoice-uploads');const modal=await upload(page);await modal.getByRole('combobox').focus();const options=modal.getByRole('listbox');await expect(options).toBeVisible();const before=await modal.boundingBox();const bodyScroll=await modal.locator('.invoice-upload-body').evaluate(e=>e.scrollTop)
  expect(await options.evaluate(e=>e.scrollHeight>e.clientHeight)).toBeTruthy();await options.evaluate(e=>e.scrollTop=e.scrollHeight);expect(await modal.locator('.invoice-upload-body').evaluate(e=>e.scrollTop)).toBe(bodyScroll);expect((await modal.boundingBox())!.height).toBeCloseTo(before!.height,0)
  await select(modal,'Coastline');await expect(modal.locator('input[type="file"]')).toHaveCount(1);await modal.locator('input[type="date"]').fill('2026-09-30');await modal.locator('input[type="file"]').setInputFiles(file('bulk-invoices.xls'));await modal.getByRole('checkbox').check();await modal.getByRole('button',{name:'Submit invoices'}).click();await expect(modal.getByRole('status')).toContainText('The supplier can request funds');await page.screenshot({path:info.outputPath('partner-upload-next-steps.png'),fullPage:true})
})

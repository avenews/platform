import {test,expect,type Page,type Locator} from '@playwright/test'
const session={contactId:'usr_001',contactFirstName:'Amara',contactLastName:'Osei',contactEmail:'amara@example.test',businessId:'biz_demo_001',businessName:'Kioko Agri Supplies Ltd',role:'admin'}
const forbidden=['Review preview','Sample data as of','No live uploads or payments','Review mode.','This preview does not replace','reserved for pending','4 unpaid periods','Showing periods available for a new financing request']
async function goto(page:Page,path:string){await page.goto('/experience/'+path);await expect(page.locator('h1').first()).toBeVisible();await page.evaluate(()=>document.fonts.ready)}
async function geometry(page:Page){const b=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth,dialogs:Array.from(document.querySelectorAll('[role="dialog"]')).filter(e=>(e as HTMLElement).offsetParent!==null).map(e=>({left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right,top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom})),height:innerHeight}));expect(b.width).toBeLessThanOrEqual(b.viewport+2);for(const d of b.dialogs){expect(d.left).toBeGreaterThanOrEqual(-1);expect(d.right).toBeLessThanOrEqual(b.viewport+1);expect(d.top).toBeGreaterThanOrEqual(-1);expect(d.bottom).toBeLessThanOrEqual(b.height+1)}}
const activity=(p:Page)=>p.locator('.customer-activity-table tbody tr:visible,.customer-activity-cards .customer-financing-card:visible')
const invoices=(scope:Page|Locator)=>scope.locator('.invoice-files-table tbody tr:visible,.invoice-files-cards .invoice-file-card:visible')
async function choose(scope:Locator,text:string){await scope.getByRole('combobox').fill(text);await scope.getByRole('option').filter({hasText:text}).click()}
async function openPeriod(page:Page,ref:string){await activity(page).filter({hasText:ref}).first().click();return page.getByRole('dialog').filter({hasText:ref})}
test.beforeEach(async({page})=>{await page.addInitScript(s=>localStorage.setItem('av_customer_portal_session',JSON.stringify(s)),session)})
test.afterEach(async({page})=>{for(const text of forbidden)await expect(page.locator('body')).not.toContainText(text);await geometry(page)})

test('original home cards values statuses and outstanding filter',async({page},info)=>{
 await goto(page,'invoice-financing/home')
 const cards=page.locator('.customer-product-summary')
 await expect(cards).toContainText('Ksh 970,000');await expect(cards).toContainText('Ksh 1,300,000');await expect(cards).toContainText('2 payments due');await expect(cards).toContainText('1 overdue');await expect(cards).toContainText('1 upcoming');await expect(cards).toContainText('Total approved limit: Ksh 3,000,000')
 await expect(page.locator('.invoice-explanation')).toContainText('2 eligible financing periods');await expect(page.locator('.invoice-explanation av-tooltip')).toHaveCount(0)
 await expect(activity(page)).toHaveCount(6);await expect(page.locator('.customer-financing-activity')).toContainText('Cancelled');await expect(page.locator('.customer-financing-activity')).toContainText('Live')
 await page.screenshot({path:info.outputPath('supplier-home.png'),fullPage:true})
 await page.getByRole('button',{name:'View outstanding periods',exact:true}).click();await expect(activity(page)).toHaveCount(2);await expect(activity(page).filter({hasText:'DP-2026-10-15-TWIGA'})).toHaveCount(0)
 await page.getByRole('button',{name:'View available periods',exact:true}).click();await expect(activity(page)).toHaveCount(2)
})

test('main Invoices retains the original flat table and four invoice records',async({page},info)=>{
 await goto(page,'invoice-financing/invoices');await expect(page.getByRole('tab')).toHaveCount(0);await expect(page.locator('body')).not.toContainText('Upload history');await expect(invoices(page)).toHaveCount(4)
 await expect(invoices(page).filter({hasText:'INV-7811'})).toContainText('Financed');await expect(invoices(page).filter({hasText:'INV-7812'})).toContainText('Eligible');await expect(page.getByRole('link',{name:'Invoices',exact:true}).first()).toBeVisible()
 await page.screenshot({path:info.outputPath('invoices-original-table.png'),fullPage:true})
})

test('original period overview and Files remain with invoices in a bottom area',async({page},info)=>{
 await goto(page,'invoice-financing/home');const modal=await openPeriod(page,'DP-2026-08-15-FRESH')
 await expect(modal.locator('.customer-overdue--buyer')).toContainText('Buyer payment overdue');await expect(modal.locator('.customer-period-details')).toContainText('Ksh 450,000');await expect(modal.getByRole('tab')).toHaveCount(0)
 await expect(modal.getByRole('button',{name:'Files',exact:true})).toBeVisible();await modal.locator('summary').filter({hasText:'Invoices (1)'}).click()
 await expect(invoices(modal)).toHaveCount(1);await expect(invoices(modal)).toContainText('INV-9120');await expect(modal.getByRole('link',{name:'View invoice',exact:true})).toHaveCount(1)
 await page.screenshot({path:info.outputPath('period-invoices-area.png'),fullPage:true})
 await modal.getByRole('button',{name:'Files',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Funds Request snapshot');await expect(page.getByRole('link',{name:'View PDF'})).toBeVisible()
})

test('buyer ownership and compact native uploader work without help icons',async({page},info)=>{
 await goto(page,'invoice-financing/home');await page.getByRole('button',{name:'Upload invoices',exact:true}).click();const modal=page.getByRole('dialog')
 await expect(modal.locator('av-tooltip')).toHaveCount(0);await modal.getByRole('combobox').focus();await expect(modal.getByRole('option').filter({hasText:'Twiga Foods'})).toHaveAttribute('aria-disabled','true');await choose(modal,'FreshProduce')
 await modal.getByRole('button',{name:'Continue',exact:true}).click();await modal.locator('input[type="date"]').fill('2026-09-30');await modal.locator('input[type="file"]').first().setInputFiles({name:'supplier-invoice.pdf',mimeType:'application/pdf',buffer:Buffer.from('invoice file')})
 await modal.getByRole('button',{name:'Submit invoices'}).click();await expect(modal.getByRole('alert')).toContainText('Proof of Delivery');await modal.locator('input[type="file"]').last().setInputFiles({name:'delivery.pdf',mimeType:'application/pdf',buffer:Buffer.from('delivery file')});await modal.getByRole('checkbox').check()
 await page.screenshot({path:info.outputPath('native-uploader.png'),fullPage:true})
 await modal.getByRole('button',{name:'Submit invoices'}).click();await expect(modal.getByRole('status')).toContainText('Invoices added');await modal.getByRole('button',{name:'Done',exact:true}).click()
 await page.getByRole('link',{name:'Invoices',exact:true}).first().click();await expect(invoices(page).filter({hasText:'Pending review'})).toHaveCount(1);await expect(invoices(page).filter({hasText:'Pending review'})).toContainText('Uploaded')
})

test('Buyers keeps original actions and adds clear ownership and terms',async({page})=>{
 await goto(page,'invoice-financing/financing');const row=page.locator('.relationship-table tbody tr:visible,.relationship-cards .relationship-card:visible').filter({hasText:'Twiga Foods Ltd'})
 await expect(row).toContainText('Buyer uploads invoices');await expect(row.getByRole('button',{name:'Upload invoices'})).toHaveCount(0);await row.getByRole('button',{name:'View more',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Relationship terms');await expect(page.getByRole('dialog')).toContainText('0.17% per financed day')
})

test('Partner Home and Payments have different summaries but share original payment table',async({page},info)=>{
 await goto(page,'invoice-partner/home');await expect(page.getByRole('heading',{name:'Partner Buyer Portal',exact:true})).toBeVisible();await expect(page.locator('.contextual-metrics')).toContainText('Rebate due');await expect(page.locator('.contextual-metrics')).toContainText('Invoices Uploaded');await expect(page.locator('.partner-summary-grid')).toHaveCount(0);await expect(page.locator('.partner-home-workspace-grid')).toHaveCount(0)
 const homeRows=await page.locator('.partner-payments-table tbody tr:visible,.partner-workspace-cards .partner-payment-card:visible').allTextContents();expect(homeRows.length).toBe(6)
 await page.screenshot({path:info.outputPath('partner-home.png'),fullPage:true})
 await page.getByRole('button',{name:'View rebate breakdown',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Ksh 2,600');await expect(page.getByRole('dialog')).toContainText('Principal collected');await page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).click()
 await goto(page,'invoice-partner/obligations');await expect(page.locator('.partner-summary-grid')).toContainText('Amount due');await expect(page.locator('.partner-summary-grid')).toContainText('Ksh 8,670,000');await expect(page.locator('.partner-summary-grid')).toContainText('Overdue payments');await expect(page.getByRole('button',{name:'View rebate breakdown'})).toHaveCount(0);await expect(page.locator('.partner-workspace-hero .page-eyebrow')).toHaveCount(0)
 const paymentRows=await page.locator('.partner-payments-table tbody tr:visible,.partner-workspace-cards .partner-payment-card:visible').allTextContents();expect(paymentRows).toEqual(homeRows)
 await page.screenshot({path:info.outputPath('partner-payments.png'),fullPage:true})
})

test('partner payment modal retains original full amount and contains clearing details plus no-file invoices',async({page},info)=>{
 await goto(page,'invoice-partner/obligations');const row=page.locator('.partner-payments-table tbody tr:visible,.partner-workspace-cards .partner-payment-card:visible').filter({hasText:'PER-2026-08-15-COAST'});await row.getByRole('button',{name:'View payment'}).click();const modal=page.getByRole('dialog')
 await expect(modal.locator('.partner-payment-total')).toContainText('Ksh 1,040,000');await expect(modal).toContainText('Clearing account details');await expect(modal).toContainText('DEMO-SUP-0133');await expect(modal).not.toContainText('2046346095')
 await modal.getByRole('button',{name:'Copy account number',exact:true}).click();await expect(modal.locator('[role="status"]')).toContainText(/copied|Select and copy/)
 await modal.locator('summary').filter({hasText:'Invoices (9)'}).click();await expect(invoices(modal)).toHaveCount(9);await expect(modal.getByRole('link',{name:'View invoice',exact:true})).toHaveCount(0)
 await page.screenshot({path:info.outputPath('partner-period.png'),fullPage:true})
})

test('eligible Funds Request list retains baseline styling without explanation banners',async({page})=>{
 await goto(page,'invoice-financing/request-funds');await expect(page.locator('.request-hub__table tbody tr:visible,.request-hub__cards .baseline-record-card:visible')).toHaveCount(2);await expect(page.locator('body')).not.toContainText('Showing periods available')
})

test('icon-only tooltips use the installed design system and requested dark bubble',async({page},info)=>{
 await goto(page,'invoice-financing/home');const help=page.locator('.customer-product-summary app-invoice-help').first();await expect(help.locator('av-tooltip')).toHaveCount(1);const btn=help.locator('button');const b=await btn.boundingBox();expect(b!.width).toBeLessThanOrEqual(20);expect(b!.height).toBeLessThanOrEqual(24);await btn.click();await expect(help.locator('.av-tooltip__bubble')).toBeVisible();await page.screenshot({path:info.outputPath('tooltip.png'),fullPage:true})
})

test('original card and invoice table visual properties match preview 77',async({page,browser})=>{
 const reference=process.env['REFERENCE_BASE_URL'];test.skip(!reference,'Reference comparison runs in CI against exact preview 77')
 const ref=await browser.newPage({viewport:page.viewportSize()!});await ref.addInitScript(s=>localStorage.setItem('av_customer_portal_session',JSON.stringify(s)),session)
 const style=async(p:Page,selector:string)=>p.locator(selector).first().evaluate(e=>{const s=getComputedStyle(e);return {background:s.backgroundColor,radius:s.borderRadius,padding:s.padding,border:s.border,font:s.font,fontWeight:s.fontWeight,shadow:s.boxShadow}})
 await goto(page,'invoice-financing/home');await ref.goto(reference+'/experience/invoice-financing/home');await expect(ref.locator('.customer-product-summary')).toBeVisible();await ref.evaluate(()=>document.fonts.ready)
 for(const selector of ['.customer-summary-card','.customer-summary-card>strong','.customer-summary-card>small'])expect(await style(page,selector)).toEqual(await style(ref,selector))
 await goto(page,'invoice-financing/invoices');await ref.goto(reference+'/experience/invoice-financing/invoices');await expect(ref.locator('app-customer-invoices')).toBeVisible();await ref.evaluate(()=>document.fonts.ready)
 if(page.viewportSize()!.width>=768){for(const selector of ['.invoice-files-table','.invoice-files-table td','.invoice-files-table th','.invoice-files-table .baseline-button'])expect(await style(page,selector)).toEqual(await style(ref,selector))}else{for(const selector of ['.invoice-file-card','.invoice-file-card .baseline-button'])expect(await style(page,selector)).toEqual(await style(ref,selector))}
 await ref.close()
})

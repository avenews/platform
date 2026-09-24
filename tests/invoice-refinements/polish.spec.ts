import { test, expect, type Page } from '@playwright/test'
const session={contactId:'usr_001',contactFirstName:'Amara',contactLastName:'Osei',contactEmail:'amara@example.test',businessId:'biz_demo_001',businessName:'Kioko Agri Supplies Ltd',role:'admin'}
const declaration='I confirm that all submitted invoices reflect completed deliveries, not pre-delivery or disputed invoices. I acknowledge the Privacy Notice and Terms & Conditions.'
async function goto(page:Page,path:string) { await page.goto('/experience/'+path);await expect(page.locator('h1').first()).toBeVisible();await page.evaluate(()=>document.fonts.ready) }
test.beforeEach(async({page})=>{await page.addInitScript(s=>localStorage.setItem('av_customer_portal_session',JSON.stringify(s)),session)})
test.afterEach(async({page})=>{expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBeTruthy()})

test('responsibility sits below both buyer names, never in the action area',async({page},info)=>{
  await goto(page,'invoice-financing/financing')
  const rows=page.locator('.relationship-table tbody tr:visible,.relationship-cards .relationship-card:visible')
  for(const [buyer,copy,upload] of [['FreshProduce Kenya Ltd','You upload invoices',true],['Twiga Foods Ltd','Buyer uploads invoices',false]] as const){
    const row=rows.filter({hasText:buyer}), identity=row.locator('.relationship-buyer-identity'), note=identity.locator('.invoice-upload-owner')
    await expect(note).toHaveText(copy);await expect(row.getByRole('button',{name:'Upload invoices',exact:true})).toHaveCount(upload?1:0)
    await expect(row.locator('.relationship-table__actions .invoice-upload-owner,.relationship-card__actions .invoice-upload-owner')).toHaveCount(0)
    const name=await identity.locator('strong').boundingBox(),hint=await note.boundingBox()
    expect(hint!.y).toBeGreaterThanOrEqual(name!.y+name!.height-1);expect(hint!.x).toBeCloseTo(name!.x,0)
    expect(await note.evaluate(e=>getComputedStyle(e).borderStyle)).toBe('none')
  }
  await page.screenshot({path:info.outputPath('buyer-name-responsibility.png'),fullPage:true})
})

test('shared uploader has one plain confirmation and no branding footer or legal sentence',async({page},info)=>{
  for(const role of ['invoice-financing/home','invoice-partner/invoice-uploads']){
    await goto(page,role);await page.getByRole('button',{name:'Upload invoices',exact:true}).first().click();const modal=page.getByRole('dialog')
    await expect(modal.locator('.invoice-upload-confirmation')).toHaveText(declaration)
    await expect(modal.locator('footer,.invoice-upload-terms')).toHaveCount(0);await expect(modal.getByRole('link')).toHaveCount(0)
    await expect(modal).not.toContainText('This service is powered by');await expect(modal).not.toContainText('Read the Funds Request')
    await expect(modal.getByRole('heading',{name:'Uploader Instructions'})).toBeVisible()
    await modal.getByRole('button',{name:'Submit invoices',exact:true}).scrollIntoViewIfNeeded()
    await page.screenshot({path:info.outputPath(role.startsWith('invoice-partner')?'partner-short-confirmation.png':'supplier-short-confirmation.png')})
    await modal.getByRole('button',{name:'Close',exact:true}).click()
  }
})

test('Partner Invoices uses design-system tabs with keyboard and linked accessible panels',async({page},info)=>{
  await goto(page,'invoice-partner/invoice-uploads')
  const tabs=page.getByRole('tablist',{name:'Invoice workspace'}), invoices=tabs.getByRole('tab',{name:'Invoices',exact:true}),history=tabs.getByRole('tab',{name:'Upload history',exact:true})
  await expect(page.locator('av-tabs .av-tabs--underline')).toHaveCount(1);await expect(invoices).toHaveAttribute('aria-selected','true')
  await expect(page.getByRole('tabpanel')).toHaveCount(1);await expect(page.getByRole('tabpanel')).toHaveAttribute('id','av-tab-panel-partner-invoices')
  await expect(history).toHaveAttribute('tabindex','-1');await invoices.focus();await invoices.press('ArrowRight')
  await expect(history).toBeFocused();await expect(history).toHaveAttribute('aria-selected','true');await expect(page.getByRole('tabpanel')).toHaveAttribute('id','av-tab-panel-partner-upload-history')
  await expect(page.getByRole('tabpanel')).toHaveAttribute('aria-labelledby',await history.getAttribute('id') as string)
  await page.screenshot({path:info.outputPath('partner-history-tab.png'),fullPage:true})
  await history.press('Home');await expect(invoices).toBeFocused();await expect(invoices).toHaveAttribute('aria-selected','true')
  await invoices.press('End');await expect(history).toBeFocused();await history.press('ArrowRight');await expect(invoices).toBeFocused()
  await page.screenshot({path:info.outputPath('partner-invoices-tab.png'),fullPage:true})
})

test('tab switches retain invoice search, sorting and pagination and history details work',async({page})=>{
  await goto(page,'invoice-partner/invoice-uploads');let panel=page.getByRole('tabpanel')
  await panel.locator('.customer-filter-search input:visible').fill('Coastline')
  if(page.viewportSize()!.width<768)await panel.getByRole('button',{name:'Filters',exact:true}).click()
  await panel.locator('select[aria-label="Sort by"]:visible').selectOption('amount-desc')
  if(page.viewportSize()!.width<768)await panel.getByRole('button',{name:'Apply',exact:true}).click()
  await page.getByRole('tab',{name:'Upload history',exact:true}).click();panel=page.getByRole('tabpanel')
  const row=panel.locator('.partner-upload-table tbody tr:visible,.partner-workspace-cards .baseline-record-card:visible').first()
  await expect(row).toContainText('twiga-suppliers-2026-08-12.xlsx');await row.getByRole('button',{name:'View',exact:true}).click()
  await expect(page.getByRole('dialog')).toContainText('Financing Periods Updated');await page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).click()
  await expect(page.getByRole('tab',{name:'Upload history',exact:true})).toHaveAttribute('aria-selected','true')
  await page.getByRole('tab',{name:'Invoices',exact:true}).click();panel=page.getByRole('tabpanel')
  await expect(panel.locator('.customer-filter-search input:visible')).toHaveValue('Coastline')
  if(page.viewportSize()!.width<768)await panel.getByRole('button',{name:'Filters',exact:true}).click()
  await expect(panel.locator('select[aria-label="Sort by"]:visible')).toHaveValue('amount-desc')
  if(page.viewportSize()!.width<768)await panel.getByRole('button',{name:'Apply',exact:true}).click()
  // Use the existing Clear filters control, then check that a non-first page survives a tab switch.
  if(page.viewportSize()!.width<768)await panel.getByRole('button',{name:'Filters',exact:true}).click()
  await panel.locator('.customer-filter-clear:visible,.customer-filter-panel__clear:visible').click()
  if(page.viewportSize()!.width<768)await panel.getByRole('button',{name:'Apply',exact:true}).click()
  await panel.locator('.baseline-pagination__controls button').filter({hasText:/^2$/}).click()
  await page.getByRole('tab',{name:'Upload history',exact:true}).click();await page.getByRole('tab',{name:'Invoices',exact:true}).click()
  await expect(page.getByRole('tabpanel').locator('.baseline-pagination__controls .is-active')).toHaveText('2')
})

test('View invoices after upload selects invoices even when opened from Upload history',async({page})=>{
  await goto(page,'invoice-partner/invoice-uploads');await page.getByRole('tab',{name:'Upload history',exact:true}).click()
  await page.getByRole('button',{name:'Upload invoices',exact:true}).click();const modal=page.getByRole('dialog')
  await modal.getByRole('combobox').fill('Coastline');await modal.getByRole('option').filter({hasText:'Coastline'}).click()
  await modal.locator('input[type="date"]').fill('2026-09-30')
  await modal.locator('input[type="file"]').setInputFiles({name:'latest-polish.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:Buffer.from('review fixture')})
  await modal.getByRole('checkbox').check();await modal.getByRole('button',{name:'Submit invoices',exact:true}).click();await expect(modal.getByRole('status')).toContainText('What happens next')
  await modal.getByRole('button',{name:'View invoices',exact:true}).click();await expect(page.getByRole('tab',{name:'Invoices',exact:true})).toHaveAttribute('aria-selected','true')
  await page.getByRole('tabpanel').locator('.customer-filter-search input:visible').fill('latest-polish.xlsx')
  await expect(page.getByRole('tabpanel').locator('.invoice-files-table tbody tr:visible,.invoice-files-cards .invoice-file-card:visible')).toHaveCount(1)
})

test('column help icons are raised without changing card help or table typography',async({page},info)=>{
  // Tables are desktop-only; each project checks its nearest desktop table layout here.
  if(page.viewportSize()!.width<768)await page.setViewportSize({width:1024,height:800})
  for(const path of ['invoice-financing/home','invoice-financing/financing','invoice-financing/invoices','invoice-financing/request-funds','invoice-partner/invoice-uploads','invoice-partner/obligations','invoice-partner/suppliers']){
    await goto(page,path)
    const help=page.locator('.baseline-table th app-invoice-help:visible')
    expect(await help.count()).toBeGreaterThan(0)
    for(const icon of await help.all()){
      expect(await icon.evaluate(e=>getComputedStyle(e).top)).toBe('-2px')
      await expect(icon.locator('av-icon svg')).toHaveAttribute('viewBox','0 0 24 24')
    }
    if(path==='invoice-financing/home')expect(await page.locator('.customer-summary-card app-invoice-help').first().evaluate(e=>getComputedStyle(e).top)).toBe('auto')
  }
  await goto(page,'invoice-financing/financing');await page.screenshot({path:info.outputPath('heading-tooltip-alignment.png'),fullPage:true})
})

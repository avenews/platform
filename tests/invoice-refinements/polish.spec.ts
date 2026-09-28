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

test('shared uploader has one linked confirmation and no branding footer or legal sentence',async({page},info)=>{
  for(const role of ['invoice-financing/home','invoice-partner/invoice-uploads']){
    await goto(page,role);await page.getByRole('button',{name:'Upload invoices',exact:true}).first().click();const modal=page.getByRole('dialog')
    await expect(modal.locator('.invoice-upload-confirmation')).toHaveText(declaration)
    await expect(modal.locator('footer,.invoice-upload-terms')).toHaveCount(0);await expect(modal.getByRole('link')).toHaveCount(2)
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


test('shared filters summarize search filters and sorting while headed toolbars align to the table edge',async({page})=>{
  await page.setViewportSize({width:1440,height:1000})

  await goto(page,'invoice-financing/home')
  const homeTable=page.locator('.customer-financing-activity .baseline-table-wrap')
  const homeClear=page.locator('.customer-activity-toolbar .customer-filter-clear:visible')
  const homeTableBox=await homeTable.boundingBox(),homeClearBox=await homeClear.boundingBox()
  expect(Math.abs((homeClearBox!.x+homeClearBox!.width)-(homeTableBox!.x+homeTableBox!.width))).toBeLessThanOrEqual(3)

  const homeSearch=page.locator('.customer-activity-toolbar .customer-filter-search input:visible')
  await homeSearch.fill('Twiga')
  const statusSelect=page.locator('.customer-activity-toolbar select[aria-label="Status"]:visible')
  await statusSelect.selectOption({index:1})
  const sortSelect=page.locator('.customer-activity-toolbar select[aria-label="Sort by"]:visible')
  await sortSelect.selectOption({index:1})
  const statusLabel=await statusSelect.locator('option:checked').textContent()
  const sortLabel=await sortSelect.locator('option:checked').textContent()
  const homeSummary=page.locator('.customer-activity-toolbar .customer-filter-summary')
  await expect(homeSummary).toContainText('Search "Twiga"')
  await expect(homeSummary).toContainText(statusLabel!.trim())
  await expect(homeSummary).toContainText(sortLabel!.trim())

  await goto(page,'invoice-financing/financing')
  await page.locator('.relationship-section .customer-filter-search input:visible').fill('Fresh')
  const buyerSort=page.locator('.relationship-section select[aria-label="Sort by"]:visible')
  await buyerSort.selectOption({index:1})
  const buyerSortLabel=await buyerSort.locator('option:checked').textContent()
  const buyerSummary=page.locator('.relationship-section .customer-filter-summary')
  await expect(buyerSummary).toContainText('Search "Fresh"')
  await expect(buyerSummary).toContainText(buyerSortLabel!.trim())

  await goto(page,'invoice-partner/obligations')
  const paymentTable=page.locator('.partner-list-section .baseline-table-wrap')
  const paymentClear=page.locator('.partner-list-toolbar .customer-filter-clear:visible')
  const paymentTableBox=await paymentTable.boundingBox(),paymentClearBox=await paymentClear.boundingBox()
  expect(Math.abs((paymentClearBox!.x+paymentClearBox!.width)-(paymentTableBox!.x+paymentTableBox!.width))).toBeLessThanOrEqual(3)

  await goto(page,'invoice-partner/suppliers')
  await expect(page.getByRole('heading',{name:'Supplier financing',exact:true})).toHaveCount(0)
  const supplierSearch=page.locator('.partner-list-section .customer-filter-search input:visible')
  const supplierTable=page.locator('.partner-list-section .baseline-table-wrap')
  const supplierSearchBox=await supplierSearch.boundingBox(),supplierTableBox=await supplierTable.boundingBox()
  expect(Math.abs(supplierSearchBox!.x-supplierTableBox!.x)).toBeLessThanOrEqual(3)
})

test('modal detail values use the shared medium weight across customer and partner experiences',async({page})=>{
  await page.setViewportSize({width:1440,height:1000})
  for(const path of ['acl/home','abf/home','stf/home','infx/home','invoice-financing/home']){
    await goto(page,path)
    const row=page.locator('.customer-activity-table tbody tr:visible').first()
    await expect(row).toBeVisible()
    await row.click()
    const modal=page.getByRole('dialog')
    const values=modal.locator('.customer-period-details dd')
    expect(await values.count(), `Expected financing detail values on ${path}`).toBeGreaterThan(0)
    for(const value of await values.all()) expect(await value.evaluate(e=>getComputedStyle(e).fontWeight)).toBe('500')
    await modal.getByRole('button',{name:'Close',exact:true}).click()
  }

  await goto(page,'invoice-financing/financing')
  await page.locator('.relationship-table tbody tr:visible').first().click()
  let modal=page.getByRole('dialog')
  for(const value of await modal.locator('.relationship-detail-grid dd').all()) expect(await value.evaluate(e=>getComputedStyle(e).fontWeight)).toBe('500')
  await modal.getByRole('button',{name:'Close',exact:true}).click()

  await goto(page,'invoice-partner/suppliers')
  await page.locator('.partner-suppliers-table tbody tr:visible').first().click()
  modal=page.getByRole('dialog')
  for(const value of await modal.locator('.partner-detail-grid dd').all()) expect(await value.evaluate(e=>getComputedStyle(e).fontWeight)).toBe('500')
})

test('copyable payment details confirm Copied inline and reset automatically',async({page})=>{
  await page.setViewportSize({width:1440,height:1000})

  await goto(page,'acl/home')
  await page.locator('.customer-activity-table tbody tr:visible').first().click()
  let modal=page.getByRole('dialog')
  const repayment=modal.getByRole('button',{name:'Repayment details',exact:true})
  if(await repayment.count()){
    await repayment.click()
    modal=page.getByRole('dialog')
    const copy=modal.locator('.customer-payment-details > div').first().getByRole('button')
    await copy.click()
    await expect(copy).toHaveText('Copied')
    await expect(copy).toHaveText('Copy',{timeout:2500})
  } else {
    await modal.getByRole('button',{name:'Close',exact:true}).click()
  }

  await goto(page,'invoice-partner/obligations')
  await page.locator('.partner-payments-table tbody tr:visible').first().click()
  modal=page.getByRole('dialog')
  const referenceCopy=modal.locator('.partner-copy-reference')
  await referenceCopy.click()
  await expect(referenceCopy).toHaveText('Copied')
  await expect(referenceCopy).toHaveText('Copy payment reference',{timeout:2500})

  const clearing=modal.locator('app-clearing-account-details')
  const accountNumberRow=clearing.locator('.customer-payment-details > div').filter({hasText:'Account number'})
  const accountCopy=accountNumberRow.getByRole('button')
  await accountCopy.click()
  await expect(accountCopy).toHaveText('Copied')
  await expect(accountCopy).toHaveText('Copy',{timeout:2500})
})

test('primary first-column typography is consistent across customer and partner tables',async({page})=>{
  await page.setViewportSize({width:1440,height:1000})
  const checks=[
    ['invoice-financing/home','.customer-activity-table tbody tr:visible td:first-child .baseline-financing-cell strong'],
    ['invoice-financing/financing','.relationship-table tbody tr:visible td:first-child .relationship-name-button strong'],
    ['invoice-financing/request-funds','.request-hub__table tbody tr:visible td:first-child .baseline-financing-cell strong'],
    ['invoice-financing/invoices','.invoice-files-table tbody tr:visible td:first-child .baseline-financing-cell strong'],
    ['invoice-partner/obligations','.partner-payments-table tbody tr:visible td:first-child .baseline-financing-cell strong'],
    ['invoice-partner/suppliers','.partner-suppliers-table tbody tr:visible td:first-child .baseline-financing-cell strong'],
  ] as const
  for(const [path,selector] of checks){
    await goto(page,path)
    const primary=page.locator(selector).first()
    await expect(primary).toBeVisible()
    const style=await primary.evaluate(e=>({size:getComputedStyle(e).fontSize,weight:getComputedStyle(e).fontWeight}))
    expect(style.size).toBe('14px')
    expect(style.weight).toBe('600')
  }
})

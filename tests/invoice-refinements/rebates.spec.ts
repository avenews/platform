import { test, expect, type Page, type Locator } from '@playwright/test'
const session={contactId:'usr_001',contactFirstName:'Amara',contactLastName:'Osei',contactEmail:'amara@example.test',businessId:'biz_demo_001',businessName:'Kioko Agri Supplies Ltd',role:'admin'}
const terms='https://docs.google.com/document/d/1sKfI46A5zjWpzkHsXXOoefbcRB3XK2eha_h0VjteOTM/edit?tab=t.0#heading=h.t4m1vp8ushhx'
const privacy='https://docs.google.com/document/d/1Majh4ZEQ26icfUSVVycA2e9J3JE0uw_i2syI1WTiZQY/edit?tab=t.0#heading=h.t0r9ovjgdv4y'
async function goto(page:Page,path:string){await page.goto('/experience/'+path);await expect(page.locator('h1').first()).toBeVisible();await page.evaluate(()=>document.fonts.ready)}
const rebateRows=(modal:Locator)=>modal.locator('.invoice-rebate-table tbody tr:visible,.invoice-rebate-cards article:visible')
async function balance(page:Page,modal:Locator,value:string){
 const mobile=page.viewportSize()!.width<768
 if(mobile)await modal.getByRole('button',{name:'Filters',exact:true}).click()
 await modal.locator('select[aria-label="Rebate balance"]:visible').selectOption(value)
 if(mobile)await modal.getByRole('button',{name:'Apply',exact:true}).click()
}
async function clear(page:Page,modal:Locator){
 if(page.viewportSize()!.width<768){await modal.getByRole('button',{name:'Filters',exact:true}).click();await modal.getByRole('button',{name:'Clear all',exact:true}).click();await modal.getByRole('button',{name:'Apply',exact:true}).click()}
 else await modal.locator('.customer-filter-clear:visible').click()
}
test.beforeEach(async({page})=>{await page.addInitScript(s=>localStorage.setItem('av_customer_portal_session',JSON.stringify(s)),session)})
test.afterEach(async({page})=>{expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBeTruthy()})

test('inline Privacy and Terms are styled real links and do not toggle the declaration',async({page,context},info)=>{
 // Only exercise link wiring: do not depend on source Google Docs sharing permissions.
 await context.route('https://docs.google.com/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<title>Linked document</title>'}))
 for(const role of ['invoice-financing/home','invoice-partner/invoice-uploads']){
  await goto(page,role);await page.getByRole('button',{name:'Upload invoices',exact:true}).first().click();const modal=page.getByRole('dialog')
  await expect(modal.locator('footer,.invoice-upload-terms')).toHaveCount(0);await expect(modal.getByRole('link')).toHaveCount(2)
  const checkbox=modal.getByRole('checkbox');await checkbox.check()
  for(const [label,url] of [['Privacy Notice',privacy],['Terms & Conditions',terms]]){
   const link=modal.getByRole('link',{name:label,exact:true});await expect(link).toHaveAttribute('href',url);await expect(link).toHaveAttribute('target','_blank');await expect(link).toHaveAttribute('rel',/noopener/)
   await link.scrollIntoViewIfNeeded();const style=await link.evaluate(e=>({decoration:getComputedStyle(e).textDecorationLine,color:getComputedStyle(e).color,parent:getComputedStyle(e.parentElement!).color}))
   expect(style.decoration).toContain('underline');expect(style.color).not.toBe(style.parent)
   const popupPromise=page.waitForEvent('popup');await link.click();const popup=await popupPromise;await popup.waitForLoadState();expect(popup.url()).toBe(url);await popup.close();await expect(checkbox).toBeChecked();await expect(modal).toBeVisible()
  }
  await page.screenshot({path:info.outputPath(role.startsWith('invoice-partner')?'partner-legal-links.png':'supplier-legal-links.png')})
  await modal.getByRole('button',{name:'Close',exact:true}).click()
 }
})

test('Home and Suppliers use the same searchable rebate modal and preserve totals',async({page},info)=>{
 for(const [path,button] of [['invoice-partner/home','View rebate breakdown'],['invoice-partner/suppliers','Rebate breakdown']]){
  await goto(page,path);const opener=page.getByRole('button',{name:button,exact:true});await opener.click();const modal=page.getByRole('dialog',{name:'Rebate breakdown'})
  await expect(page.locator('app-partner-rebate-modal')).toHaveCount(1);await expect(modal.locator('.invoice-rebate-total')).toHaveText('Total rebate due: Ksh 2,600');await expect(rebateRows(modal)).toHaveCount(5)
  await modal.locator('input[type="search"]:visible').fill('Coastline');await expect(rebateRows(modal)).toHaveCount(1)
  const row=rebateRows(modal).first();await expect(row).toContainText('Coastline Produce Ltd');await expect(row).toContainText('Ksh 1,500');await expect(row).toContainText('Ksh 1,000')
  await expect(modal.locator('.invoice-rebate-matching')).toContainText('1 of 8 suppliers');await expect(modal.locator('.invoice-rebate-matching')).toContainText('Matching rebate due: Ksh 1,000');await expect(modal.locator('.invoice-rebate-total')).toContainText('Ksh 2,600')
  await page.screenshot({path:info.outputPath(path.endsWith('home')?'home-rebate-search.png':'suppliers-rebate-search.png')})
  await clear(page,modal);await expect(rebateRows(modal)).toHaveCount(5);await expect(modal.locator('.invoice-rebate-matching')).toHaveCount(0)
  await modal.getByRole('button',{name:'Close',exact:true}).click();await expect(opener).toBeFocused()
 }
})

test('rebate filters, no results and sorting are visible and clearable',async({page})=>{
 await goto(page,'invoice-partner/suppliers');await page.getByRole('button',{name:'Rebate breakdown',exact:true}).click();const modal=page.getByRole('dialog')
 await balance(page,modal,'due');await expect(rebateRows(modal)).toHaveCount(2);await expect(modal.locator('.customer-filter-summary')).toContainText('Rebate due')
 await modal.locator('input[type="search"]:visible').fill('Nairobi');await expect(rebateRows(modal)).toHaveCount(1);await expect(modal.locator('.customer-filter-summary')).toContainText('Rebate due')
 await modal.locator('input[type="search"]:visible').fill('No such supplier');await expect(modal.locator('.baseline-empty:visible')).toContainText('No matching suppliers');await expect(modal.locator('.invoice-rebate-matching')).toContainText('Ksh 0')
 await clear(page,modal);await expect(rebateRows(modal)).toHaveCount(5)
 await balance(page,modal,'paid');await expect(modal.locator('.baseline-empty:visible')).toContainText('No matching suppliers');await clear(page,modal)
 await balance(page,modal,'none');await expect(modal.locator('.invoice-rebate-pagination')).toContainText('of 6 suppliers');await expect(modal.locator('.invoice-rebate-matching')).toContainText('Ksh 0');await clear(page,modal)
 const mobile=page.viewportSize()!.width<768;if(mobile)await modal.getByRole('button',{name:'Filters',exact:true}).click()
 await modal.locator('select[aria-label="Sort by"]:visible').selectOption('supplier-asc');if(mobile)await modal.getByRole('button',{name:'Apply',exact:true}).click()
 await expect(rebateRows(modal).first()).toContainText('Coastline Produce Ltd');await clear(page,modal);await expect(rebateRows(modal).first()).toContainText('Nairobi Fresh Traders Ltd')
})

test('rebate pagination is bounded and search resets it without changing totals',async({page})=>{
 await goto(page,'invoice-partner/home');await page.getByRole('button',{name:'View rebate breakdown',exact:true}).click();const modal=page.getByRole('dialog')
 await expect(modal.getByRole('button',{name:'Previous rebate page',exact:true})).toBeDisabled()
 await modal.getByRole('button',{name:'Next rebate page',exact:true}).click();await expect(rebateRows(modal)).toHaveCount(3);await expect(modal.locator('.invoice-rebate-pagination')).toContainText('6-8 of 8 suppliers');await expect(modal.getByRole('button',{name:'Next rebate page',exact:true})).toBeDisabled()
 await modal.locator('input[type="search"]:visible').fill('Nairobi');await expect(rebateRows(modal)).toHaveCount(1);await expect(modal.locator('.invoice-rebate-pagination')).toContainText('1-1 of 1 suppliers');await expect(modal.locator('.invoice-rebate-total')).toContainText('Ksh 2,600')
 await clear(page,modal);await expect(modal.locator('.invoice-rebate-pagination')).toContainText('1-5 of 8 suppliers')
})

test('supplier details add exactly one rebate row with the matching earned and due amounts',async({page},info)=>{
 await goto(page,'invoice-partner/suppliers')
 const actions=page.locator('.partner-workspace-hero__actions'),rebate=actions.getByRole('button',{name:'Rebate breakdown'}),upload=actions.getByRole('button',{name:'Upload invoices'})
 const rb=await rebate.boundingBox(),ub=await upload.boundingBox()
 if(page.viewportSize()!.width>=768)expect(rb!.y).toBeCloseTo(ub!.y,0);else expect(ub!.y).toBeGreaterThan(rb!.y)
 const rows=page.locator('.partner-suppliers-table tbody tr:visible,.partner-workspace-cards .partner-supplier-card:visible')
 for(const [name,earned,due] of [['Coastline Produce Ltd','Ksh 1,500','Ksh 1,000'],['Kioko Agri Supplies Ltd','Ksh 0','Ksh 0']]){
  await rows.filter({hasText:name}).getByRole('button',{name:'View more',exact:true}).click();const modal=page.getByRole('dialog')
  const entries=modal.locator('.partner-supplier-rebate');await expect(entries).toHaveCount(2)
  await expect(entries.nth(0).locator('dt')).toContainText('Rebate earned');await expect(entries.nth(0).locator('dd')).toHaveText(earned)
  await expect(entries.nth(1).locator('dt')).toContainText('Rebate due');await expect(entries.nth(1).locator('dd')).toHaveText(due)
  const a=await entries.nth(0).boundingBox(),b=await entries.nth(1).boundingBox();if(page.viewportSize()!.width>=768)expect(a!.y).toBeCloseTo(b!.y,0);else expect(b!.y).toBeGreaterThan(a!.y)
  await entries.last().scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath(name.startsWith('Coastline')?'supplier-rebate-row.png':'zero-rebate-row.png')})
  await modal.getByRole('button',{name:'Close',exact:true}).click()
 }
})

test('rebates remain partner-only and neither reduce financing nor change payment summaries',async({page})=>{
 await goto(page,'invoice-financing/home');await expect(page.locator('.customer-product-summary')).toContainText('Ksh 970,000');await expect(page.locator('.customer-product-summary')).toContainText('Ksh 1,300,000');await expect(page.locator('.customer-product-summary')).toContainText('2 payments due');await expect(page.getByRole('button',{name:/Rebate breakdown/i})).toHaveCount(0)
 await goto(page,'invoice-financing/financing');await page.locator('.relationship-table tbody tr:visible,.relationship-card:visible').filter({hasText:'FreshProduce'}).getByRole('button',{name:'View more',exact:true}).click();await expect(page.getByRole('dialog')).not.toContainText('Rebate earned');await page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).click()
 await goto(page,'invoice-partner/obligations');await expect(page.locator('.partner-summary-grid')).toContainText('Ksh 8,670,000');await expect(page.getByRole('button',{name:'Rebate breakdown',exact:true})).toHaveCount(0)
})

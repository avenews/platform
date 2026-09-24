import { test, expect, type Page, type Locator } from '@playwright/test'

const session = {contactId:'usr_001',contactFirstName:'Amara',contactLastName:'Osei',contactEmail:'amara@example.test',businessId:'biz_demo_001',businessName:'Kioko Agri Supplies Ltd',role:'admin'}
async function goto(page: Page, path: string) {
  await page.goto(path)
  await expect(page.locator('h1').first()).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
}
async function visibleBubble(page: Page, trigger: Locator) {
  const id = await trigger.getAttribute('aria-describedby')
  expect(id).toBeTruthy()
  const bubble = page.locator('#' + id)
  await expect(bubble).toBeVisible()
  await expect(bubble).toHaveAttribute('data-open', '')
  // Visibility alone does not catch ancestor overflow clipping. Hit-test the
  // entire bubble, including its lower text rows and both horizontal edges.
  const result = await bubble.evaluate(element => {
    const rect = element.getBoundingClientRect()
    const points = [0.1, 0.5, 0.9].flatMap(x => [0.15, 0.5, 0.85].map(y => {
      const hit = document.elementFromPoint(rect.left + rect.width*x, rect.top + rect.height*y)
      return hit === element || !!hit && element.contains(hit)
    }))
    return {left:rect.left, right:rect.right, top:rect.top, bottom:rect.bottom,
      width:document.documentElement.clientWidth, height:innerHeight, points,
      textHeight:element.scrollHeight, heightAvailable:element.clientHeight}
  })
  expect(result.left).toBeGreaterThanOrEqual(11)
  expect(result.right).toBeLessThanOrEqual(result.width - 11)
  expect(result.top).toBeGreaterThanOrEqual(11)
  expect(result.bottom).toBeLessThanOrEqual(result.height - 11)
  expect(result.points.every(Boolean)).toBeTruthy()
  expect(result.textHeight).toBeLessThanOrEqual(result.heightAvailable + 1)
  return bubble
}
async function supplierDetails(page: Page) {
  await goto(page, '/experience/invoice-partner/suppliers')
  const row = page.locator('.partner-suppliers-table tbody tr:visible,.partner-workspace-cards .partner-supplier-card:visible').filter({hasText:'Coastline Produce Ltd'})
  await row.getByRole('button', {name:'View more', exact:true}).click()
  const modal = page.getByRole('dialog')
  await expect(modal).toContainText('Relationship terms')
  return modal
}
test.beforeEach(async ({page}) => {
  await page.addInitScript(value => localStorage.setItem('av_customer_portal_session', JSON.stringify(value)), session)
})

test('card tooltips escape the card edges without changing cards or page width', async ({page}, info) => {
  for (const [path, cards] of [
    ['/experience/invoice-partner/home', '.contextual-metrics'],
    ['/experience/invoice-partner/obligations', '.partner-summary-grid'],
    ['/experience/invoice-financing/home', '.customer-product-summary'],
  ]) {
    await goto(page, path)
    expect(await page.locator(cards + ' app-invoice-help .av-tooltip__btn').count()).toBeGreaterThanOrEqual(2)
    for (const trigger of await page.locator(cards + ' app-invoice-help .av-tooltip__btn').all()) {
      await trigger.scrollIntoViewIfNeeded()
      const before = await page.locator(cards).boundingBox()
      const width = await page.evaluate(() => document.documentElement.scrollWidth)
      await trigger.hover()
      const bubble = await visibleBubble(page, trigger)
      await page.mouse.move(...await bubble.evaluate(e => {const r=e.getBoundingClientRect(); return [r.left+r.width/2,r.top+r.height/2] as [number,number]}))
      await expect(bubble).toBeVisible()
      expect((await page.locator(cards).boundingBox())!.height).toBeCloseTo(before!.height, 0)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
      await page.screenshot({path:info.outputPath(path.split('/').slice(-2).join('-')+'-tooltip.png')})
      await page.keyboard.press('Escape')
      await expect(bubble).not.toBeVisible()
    }
  }
})

test('rebate tooltips render past the last grid row and Escape keeps the modal open', async ({page}, info) => {
  const modal = await supplierDetails(page)
  for (const title of ['Rebate earned', 'Rebate due']) {
    const trigger = modal.locator('dt').filter({hasText:title}).locator('.av-tooltip__btn')
    await trigger.scrollIntoViewIfNeeded()
    const before = await modal.locator('.partner-detail-grid').first().boundingBox()
    await trigger.click()
    const bubble = await visibleBubble(page, trigger)
    await expect(bubble).toContainText(title === 'Rebate earned' ? 'including amounts already paid' : 'Separate from the supplier')
    expect((await modal.locator('.partner-detail-grid').first().boundingBox())!.height).toBeCloseTo(before!.height,0)
    await page.screenshot({path:info.outputPath(title.replaceAll(' ','-')+'-unclipped.png')})
    await page.keyboard.press('Escape')
    await expect(bubble).not.toBeVisible()
    await expect(modal).toBeVisible()
  }
  const trigger = modal.locator('.partner-supplier-rebate').last().locator('.av-tooltip__btn')
  await modal.getByRole('button', {name:'Close',exact:true}).focus()
  await trigger.focus()
  await visibleBubble(page, trigger)
  await modal.getByRole('button', {name:'Close',exact:true}).click()
  await expect(page.locator('.portal-tooltip-overlay[data-open]')).toHaveCount(0)
})

test('Settlement has one full-width top divider on desktop and mobile', async ({page}, info) => {
  const modal = await supplierDetails(page)
  const settlement = modal.locator('.partner-detail-grid__wide').filter({hasText:'Settlement'})
  await settlement.scrollIntoViewIfNeeded()
  const geometry = await settlement.evaluate(element => {
    const style=getComputedStyle(element), previous=element.previousElementSibling!, grid=element.parentElement!
    return {border:style.borderTopWidth, borderStyle:style.borderTopStyle,
      previousBorder:getComputedStyle(previous).borderBottomWidth,
      width:element.getBoundingClientRect().width, gridWidth:grid.getBoundingClientRect().width}
  })
  expect(geometry.border).toBe('1px')
  expect(geometry.borderStyle).toBe('solid')
  expect(geometry.previousBorder).toBe('0px')
  expect(geometry.width).toBeCloseTo(geometry.gridWidth - 2, 0)
  await expect(settlement).toContainText('transfers the remaining proceeds to the supplier')
  await page.screenshot({path:info.outputPath('settlement-divider.png')})
})

test('product selection cards lose the divider and spare description height only', async ({page}, info) => {
  await goto(page, '/access')
  const cards = page.locator('.access-card')
  expect(await cards.count()).toBeGreaterThan(0)
  for (const card of await cards.all()) {
    const values = await card.evaluate(element => {
      const text=element.querySelector('p')!, summary=element.querySelector('.access-card__summary'), style=getComputedStyle(element)
      const range=document.createRange();range.selectNodeContents(text)
      return {minHeight:style.minHeight, textHeight:text.getBoundingClientRect().height,
        lineHeight:parseFloat(getComputedStyle(text).lineHeight), textRects:range.getClientRects().length,
        border:summary?getComputedStyle(summary).borderTopWidth:null,
        padding:summary?getComputedStyle(summary).paddingTop:null,
        gap:summary?summary.getBoundingClientRect().top-text.getBoundingClientRect().bottom:null}
    })
    expect(values.minHeight).toBe('0px')
    expect(values.textHeight).toBeLessThanOrEqual(values.lineHeight*values.textRects+1)
    if(values.border!==null) {
      expect(values.border).toBe('0px');expect(values.padding).toBe('0px')
      expect(values.gap).toBeCloseTo(8,0)
    }
    await expect(card.locator('.access-card__action')).toHaveText('View')
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width)
  await page.screenshot({path:info.outputPath('compact-product-selection.png'),fullPage:true})
  await cards.first().click()
  await expect(page).toHaveURL(/\/experience\//)
})

test('table heading tooltips do not create blank columns and close on navigation', async ({page}) => {
  await goto(page,'/experience/invoice-partner/home')
  await page.getByRole('button',{name:'View rebate breakdown',exact:true}).click()
  const modal=page.getByRole('dialog'), headings=modal.locator('th app-invoice-help .av-tooltip__btn')
  if(page.viewportSize()!.width>=768) {
    for(const trigger of await headings.all()) {
      const width=await modal.locator('.baseline-table-wrap').evaluate(e=>e.scrollWidth)
      await trigger.hover();const bubble=await visibleBubble(page,trigger)
      expect(await modal.locator('.baseline-table-wrap').evaluate(e=>e.scrollWidth)).toBe(width)
      await page.keyboard.press('Escape');await expect(bubble).not.toBeVisible()
    }
  }
  await modal.getByRole('button',{name:'Close',exact:true}).click()
  const trigger=page.locator('.contextual-metrics app-invoice-help .av-tooltip__btn').first()
  await trigger.click();await visibleBubble(page,trigger)
  await page.getByRole('link',{name:'Suppliers',exact:true}).first().click()
  await expect(page).toHaveURL(/\/suppliers$/)
  await expect(page.locator('.portal-tooltip-overlay[data-open]')).toHaveCount(0)
})

test('body-mounted fallback escapes clipping and is removed with its view', async ({page}) => {
  await page.addInitScript(() => Object.defineProperty(HTMLElement.prototype,'showPopover',{value:undefined,configurable:true}))
  const modal=await supplierDetails(page)
  const trigger=modal.locator('.partner-supplier-rebate').last().locator('.av-tooltip__btn')
  await trigger.click();const bubble=await visibleBubble(page,trigger)
  await expect(bubble).toHaveAttribute('data-body-overlay','')
  await modal.getByRole('button',{name:'Close',exact:true}).click()
  await expect(bubble).toHaveCount(0)
})

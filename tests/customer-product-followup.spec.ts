import { expect, test, type Page } from '@playwright/test'

const SESSION_KEY = 'av_customer_portal_session'
const SCENARIO_KEY = 'av_experience_scenario'
const ACCESS_VISITED_KEY = 'av_customer_portal_access_visited'
const SESSION = {
  contactId: 'usr_001',
  contactFirstName: 'Amara',
  contactLastName: 'Osei',
  contactEmail: 'amara.osei@kiokoagri.co.ke',
  businessId: 'biz_demo_001',
  businessName: 'Kioko Agri Supplies Ltd',
  role: 'admin',
}

async function signIn(page: Page, visited = true): Promise<void> {
  await page.addInitScript(({ sessionKey, scenarioKey, accessVisitedKey, session, hasVisited }) => {
    localStorage.setItem(sessionKey, JSON.stringify(session))
    sessionStorage.setItem(scenarioKey, 'multiple')
    if (hasVisited) localStorage.setItem(accessVisitedKey, '1')
  }, {
    sessionKey: SESSION_KEY,
    scenarioKey: SCENARIO_KEY,
    accessVisitedKey: ACCESS_VISITED_KEY,
    session: SESSION,
    hasVisited: visited,
  })
}

async function openRelationship(page: Page, name: string): Promise<void> {
  const table = page.locator('.relationship-table-wrap')
  if (await table.isVisible()) {
    await page.locator('.relationship-table tbody tr').filter({ hasText: name }).getByRole('button', { name: 'View more' }).click()
  } else {
    await page.locator('.relationship-card').filter({ hasText: name }).getByRole('button', { name: 'View more' }).click()
  }
  await expect(page.locator('.relationship-modal')).toBeVisible()
}

async function openPartnerSupplier(page: Page, name: string): Promise<void> {
  const table = page.locator('.partner-suppliers-table')
  if (await table.isVisible()) {
    await table.locator('tbody tr').filter({ hasText: name }).getByRole('button', { name: 'View more' }).click()
  } else {
    await page.locator('.partner-supplier-card').filter({ hasText: name }).getByRole('button', { name: 'View more' }).click()
  }
  await expect(page.locator('.partner-modal')).toBeVisible()
}

test.describe('product consistency follow-up', () => {
  test('Invoice Financing removes the availability dropdown while keeping the available-period CTA', async ({ page }) => {
    await signIn(page)
    await page.goto('/experience/invoice-financing/home')

    const filterBar = page.locator('app-customer-filter-bar').first()
    await expect(filterBar.getByRole('combobox', { name: 'Availability' })).toHaveCount(0)

    await page.getByRole('button', { name: 'View available periods' }).click()
    await expect(page).toHaveURL(/\/experience\/invoice-financing\/home/)

    const table = page.locator('.customer-activity-table')
    if (await table.isVisible()) {
      const rows = table.locator('.customer-activity-row')
      expect(await rows.count()).toBeGreaterThan(0)
      for (let index = 0; index < await rows.count(); index += 1) {
        await expect(rows.nth(index).getByRole('button', { name: 'Request funds' })).toBeVisible()
      }
    } else {
      const cards = page.locator('.customer-financing-card')
      expect(await cards.count()).toBeGreaterThan(0)
      for (let index = 0; index < await cards.count(); index += 1) {
        await expect(cards.nth(index).getByRole('button', { name: 'Request funds' })).toBeVisible()
      }
    }
  })

  test('relationship rows open details from the whole row', async ({ page }) => {
    await signIn(page)
    await page.goto('/experience/abf/financing')

    const table = page.locator('.relationship-table-wrap')
    if (!(await table.isVisible())) return

    const row = page.locator('.relationship-table tbody tr').filter({ hasText: 'Quick Mart Stores' })
    await row.locator('td').nth(1).click()
    await expect(page.locator('.relationship-modal')).toBeVisible()
    await page.locator('.relationship-modal').getByRole('button', { name: 'Close' }).click()

    await row.getByRole('button', { name: 'View more' }).click()
    await expect(page.locator('.relationship-modal')).toBeVisible()
  })

  test('relationship financing periods use a searchable paginated sub-screen and return correctly', async ({ page }) => {
    await signIn(page)
    await page.goto('/experience/abf/financing')
    await openRelationship(page, 'Naivas Fresh Produce')

    const relationshipModal = page.locator('.relationship-modal')
    const periodsAction = relationshipModal.getByRole('button', { name: /View financing periods \(\d+\)/ })
    await expect(periodsAction).toBeVisible()
    await periodsAction.click()

    await expect(relationshipModal.getByRole('heading', { name: 'Financing periods', level: 2 })).toBeVisible()
    await expect(relationshipModal.locator('app-customer-filter-bar')).toBeVisible()
    await expect(relationshipModal.locator('.relationship-period-row').first()).toBeVisible()

    await relationshipModal.locator('.relationship-period-row__main').first().click()
    const periodModal = page.locator('.customer-period-modal').first()
    await expect(periodModal).toBeVisible()
    await expect(periodModal.getByRole('button', { name: 'Back to financing periods' })).toBeVisible()
    await periodModal.getByRole('button', { name: 'Back to financing periods' }).click()

    await expect(page.locator('.relationship-modal').getByRole('heading', { name: 'Financing periods', level: 2 })).toBeVisible()
  })

  test('financing table rows remain fully clickable', async ({ page }) => {
    await signIn(page)
    await page.goto('/experience/abf/home')

    const table = page.locator('.customer-activity-table')
    if (!(await table.isVisible())) return

    const row = table.locator('tbody tr').first()
    await row.locator('td').nth(1).click()
    await expect(page.locator('.customer-period-modal')).toBeVisible()
  })

  test('Partner Supplier rows open details from the whole row', async ({ page }) => {
    await signIn(page)
    await page.goto('/experience/invoice-partner/suppliers')

    const table = page.locator('.partner-suppliers-table')
    if (!(await table.isVisible())) return

    const row = table.locator('tbody tr').filter({ hasText: 'Coastline Produce Ltd' })
    await row.locator('td').nth(1).click()
    await expect(page.locator('.partner-modal')).toBeVisible()
  })

  test('Partner upload history rows open upload details from the whole row', async ({ page }) => {
    await signIn(page)
    await page.goto('/experience/invoice-partner/invoice-uploads')

    const table = page.locator('.partner-upload-table')
    if (!(await table.isVisible())) return

    await table.locator('tbody tr').first().locator('td').nth(1).click()
    await expect(page.locator('section[aria-labelledby="partner-batch-title"]')).toBeVisible()
  })

  test('Partner Supplier financing periods use a scalable sub-screen without duplicate status badges', async ({ page }) => {
    await signIn(page)
    await page.goto('/experience/invoice-partner/suppliers')
    await openPartnerSupplier(page, 'Coastline Produce Ltd')

    const modal = page.locator('.partner-modal')
    await modal.getByRole('button', { name: /View financing periods \(\d+\)/ }).click()
    await expect(modal.getByRole('heading', { name: 'Financing periods', level: 2 })).toBeVisible()
    await expect(modal.locator('app-customer-filter-bar')).toBeVisible()

    const overdue = modal.locator('.partner-period-row').filter({ hasText: 'PER-2026-08-15-COAST' })
    await expect(overdue).toBeVisible()
    await expect(overdue.locator('.baseline-status')).toHaveCount(1)
    await overdue.click()

    const paymentModal = page.locator('.partner-period-modal')
    await expect(paymentModal.getByRole('button', { name: 'Back to financing periods' })).toBeVisible()
    await paymentModal.getByRole('button', { name: 'Back to financing periods' }).click()
    await expect(page.locator('.partner-modal').getByRole('heading', { name: 'Financing periods', level: 2 })).toBeVisible()
  })

  test('Partner payment table rows open payment details from the row', async ({ page }) => {
    await signIn(page)
    await page.goto('/experience/invoice-partner/obligations')

    const table = page.locator('.partner-payments-table')
    if (!(await table.isVisible())) return

    await table.locator('tbody tr').first().locator('td').nth(2).click()
    await expect(page.locator('.partner-period-modal')).toBeVisible()
  })

  test('access chooser uses first-time Welcome then Welcome back with punctuation', async ({ page }) => {
    await signIn(page, false)
    await page.goto('/access?scenario=multiple')
    await expect(page.getByRole('heading', { name: 'Welcome.', level: 1 })).toBeVisible()

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Welcome back, Amara.', level: 1 })).toBeVisible()
  })

  test('access chooser developer control uses the compact top-right treatment', async ({ page }) => {
    await signIn(page)
    await page.goto('/access?scenario=multiple')

    const developer = page.locator('.access-developer__trigger')
    if (!(await developer.isVisible())) return

    const box = await developer.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.y).toBeLessThanOrEqual(1)
    expect(box!.height).toBeLessThanOrEqual(22)

    await developer.click()
    await expect(page.locator('.access-developer__menu')).toBeVisible()
    await expect(page.locator('.access-developer__menu')).toContainText('Experiences')
  })
})

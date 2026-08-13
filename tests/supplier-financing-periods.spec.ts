import { expect, test, type Page, type TestInfo } from '@playwright/test'

const SESSION_KEY = 'av_customer_portal_session'
const SESSION = {
  contactId: 'usr_001', contactFirstName: 'Amara', contactLastName: 'Osei', contactEmail: 'amara.osei@kiokoagri.co.ke',
  businessId: 'biz_demo_001', businessName: 'Kioko Agri Supplies Ltd', role: 'admin',
}

function isMobile(testInfo: TestInfo): boolean { return testInfo.project.name === 'mobile' || testInfo.project.name === 'minimum-mobile' }
async function signIn(page: Page): Promise<void> { await page.addInitScript(({ key, session }) => localStorage.setItem(key, JSON.stringify(session)), { key: SESSION_KEY, session: SESSION }) }
async function assertNoOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1)
}

test.describe('Supplier Financing period prototype', () => {
  test.beforeEach(async ({ page }) => { await signIn(page) })

  test('places Supplier Financing periods below the existing product relationships', async ({ page }, testInfo) => {
    await page.goto('/available-financing')
    await expect(page.getByRole('heading', { name: 'Available Financing', level: 1 })).toBeVisible()
    await expect(page.getByText('Supplier Financing', { exact: true }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Supplier Financing periods', level: 2 })).toBeVisible()
    await expect(page.getByText('Invoice Financing invoices ready for funding request', { exact: true })).toHaveCount(0)
    await expect(page.getByText('3 periods', { exact: true })).toBeVisible()
    if (isMobile(testInfo)) { await expect(page.locator('.supplier-periods-table')).toBeHidden(); await expect(page.locator('.supplier-period-cards')).toBeVisible() }
    else { await expect(page.locator('.supplier-periods-table')).toBeVisible(); await expect(page.locator('.supplier-period-cards')).toBeHidden() }
    await assertNoOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('supplier-financing-period-list.png'), fullPage: true })
  })

  test('shows the period as the primary supplier object with invoices and Advances', async ({ page }, testInfo) => {
    await page.goto('/available-financing/asfgroup_twiga_2026-05-30')
    await expect(page.getByRole('heading', { name: 'Twiga Foods Ltd', level: 1 })).toBeVisible()
    await expect(page.getByText('Available to Withdraw', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Ksh 650,000', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Limited by the approved Twiga Foods Ltd sub-limit of Ksh 650,000 remaining, not by receivables.', { exact: true })).toBeVisible()
    for (const line of ['Total receivables', 'Eligible receivables', 'Advance rate', 'Borrowing base', 'Already drawn', 'Reserved', 'Available to Withdraw']) await expect(page.getByText(line, { exact: true }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Invoices in this period', level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Advances against this period', level: 2 })).toBeVisible()
    await expect(page.getByText('Rebate', { exact: false })).toHaveCount(0)
    await page.getByRole('button', { name: 'Request funds' }).click()
    await expect(page.getByText('Period-scoped Funds Request started for up to Ksh 650,000.', { exact: true })).toBeVisible()
    await assertNoOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('supplier-financing-period-detail.png'), fullPage: true })
  })
})

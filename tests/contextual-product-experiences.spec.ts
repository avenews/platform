import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'

const SESSION_KEY = 'av_customer_portal_session'
const SCENARIO_KEY = 'av_experience_scenario'
const ACL_DEMO_URL = 'https://financing.avenews-gt.com/ishai/form/ACLDemoV2/formperma/yJ6BX6SANxu6zsGmFihcRuuAwT2dI9SbK4UGYlNIFog'
const SESSION = {
  contactId: 'usr_001', contactFirstName: 'Amara', contactLastName: 'Osei',
  contactEmail: 'amara.osei@kiokoagri.co.ke', businessId: 'biz_demo_001',
  businessName: 'Kioko Agri Supplies Ltd', role: 'admin',
}
const PRODUCTS = [
  { id: 'acl', label: 'Agri Credit Line', nav: ['Home', 'Funds Request'] },
  { id: 'abf', label: 'Agri Buyer Financing', nav: ['Home', 'Suppliers', 'Funds Request'] },
  { id: 'stf', label: 'Stockist Financing', nav: ['Home', 'Partner Suppliers', 'Funds Request'] },
  { id: 'invoice-financing', label: 'Invoice Financing', nav: ['Home', 'Buyers', 'Funds Request', 'Invoice Uploader'] },
  { id: 'infx', label: 'Invoice Financing Express', nav: ['Home', 'Buyers', 'Funds Request'] },
] as const

function mobile(testInfo: TestInfo): boolean {
  return testInfo.project.name === 'mobile' || testInfo.project.name === 'minimum-mobile'
}

async function signIn(page: Page): Promise<void> {
  await page.addInitScript(({ sessionKey, scenarioKey, session }) => {
    localStorage.setItem(sessionKey, JSON.stringify(session))
    sessionStorage.setItem(scenarioKey, 'multiple')
  }, { sessionKey: SESSION_KEY, scenarioKey: SCENARIO_KEY, session: SESSION })
}

async function noOverflow(page: Page): Promise<void> {
  const size = await page.evaluate(() => ({ c: document.documentElement.clientWidth, s: document.documentElement.scrollWidth }))
  expect(size.s).toBeLessThanOrEqual(size.c + 1)
}

async function openPeriod(page: Page, reference: string): Promise<Locator> {
  const table = page.locator('.customer-activity-table')
  if (await table.isVisible()) {
    await table.locator('.customer-activity-row').filter({ hasText: reference }).click()
  } else {
    await page.locator('.customer-financing-card').filter({ hasText: reference }).locator('.customer-record-card-button').click()
  }
  const dialog = page.locator('.customer-period-modal').first()
  await expect(dialog).toBeVisible()
  return dialog
}

async function relationship(page: Page, name: string): Promise<Locator> {
  const table = page.locator('.relationship-table-wrap')
  return await table.isVisible()
    ? page.locator('.relationship-table tbody tr').filter({ hasText: name })
    : page.locator('.relationship-card').filter({ hasText: name })
}

async function openRelationship(page: Page, name: string): Promise<Locator> {
  const row = await relationship(page, name)
  await row.getByRole('button', { name: 'View', exact: true }).click()
  const dialog = page.locator('.relationship-modal')
  await expect(dialog).toBeVisible()
  return dialog
}

test.describe('audited customer experience', () => {
  test.beforeEach(async ({ page }) => signIn(page))

  for (const product of PRODUCTS) {
    test(`${product.id} keeps overdue first, mobile funding in-card and task navigation`, async ({ page }, testInfo) => {
      await page.goto(`/experience/${product.id}/home`)
      await expect(page.getByRole('heading', { name: product.label, level: 1 })).toBeVisible()

      const first = mobile(testInfo)
        ? page.locator('.customer-financing-card').first()
        : page.locator('.customer-activity-row').first()
      await expect(first).toContainText('Overdue')
      await expect(first).toHaveCSS('background-color', 'rgb(255, 244, 244)')

      const hero = page.locator('.contextual-home__hero').locator('button').first()
      if (mobile(testInfo)) {
        await expect(hero).toBeHidden()
        await expect(page.locator('.customer-available-financing').getByRole('button', { name: 'Request funds' })).toBeVisible()
      } else {
        await expect(hero).toBeVisible()
      }

      const nav = mobile(testInfo) ? page.locator('.experience-bottom-nav') : page.locator('.experience-sidebar-nav')
      await expect(nav.locator('a')).toHaveText([...product.nav])
      await expect(nav).not.toContainText('Manage Users')

      const profile = mobile(testInfo) ? page.locator('.experience-avatar-trigger') : page.locator('.experience-profile-button')
      await profile.click()
      await expect(page.locator('.experience-profile-menu').getByRole('menuitem', { name: 'Manage Users' })).toBeVisible()
      await noOverflow(page)
    })
  }

  test('ACL visible Funds Request route keeps the permanent demo URL', async ({ page }) => {
    await page.goto('/experience/acl/home')
    const action = page.locator(`[data-external-url="${ACL_DEMO_URL}"]:visible`).first()
    await expect(action).toBeVisible()
    await expect(action).toHaveAttribute('data-external-url', ACL_DEMO_URL)
  })

  test('desktop financing tables keep secondary detail in the modal', async ({ page }, testInfo) => {
    if (mobile(testInfo)) return
    await page.goto('/experience/abf/home')
    await expect(page.locator('.customer-activity-table thead th')).toHaveText([
      'Reference', 'Repayment Due Date', 'Amount Financed', 'Status', 'Outstanding Balance', 'Action',
    ])
    const dialog = await openPeriod(page, 'FR-2026-0422')
    await expect(dialog).toContainText('Disbursement Date')
    await expect(dialog).toContainText('Total Repaid')
  })

  test('ACL, ABF, STF and INFX expose transaction files in financing-period detail', async ({ page }) => {
    await page.goto('/experience/acl/home')
    let dialog = await openPeriod(page, 'FR-2026-0318')
    await expect(dialog).toContainText('Transaction files')
    await expect(dialog.getByRole('link', { name: 'View' }).first()).toHaveAttribute('href', /demo-documents/)

    await page.goto('/experience/abf/financing')
    dialog = await openRelationship(page, 'Naivas Fresh Produce')
    await dialog.locator('.relationship-period-row').filter({ hasText: 'FR-2026-0407' }).locator('.relationship-period-row__main').click()
    await expect(page.locator('.customer-period-modal').first()).toContainText('Proof of Payment')

    await page.goto('/experience/stf/financing')
    dialog = await openRelationship(page, 'GreenHarvest Distributors')
    await dialog.locator('.relationship-period-row').filter({ hasText: 'FR-2026-0501' }).locator('.relationship-period-row__main').click()
    await expect(page.locator('.customer-period-modal').first()).toContainText('GH-INV-8831')

    await page.goto('/experience/infx/financing')
    dialog = await openRelationship(page, 'Kisumu Buyers Co-op')
    await dialog.locator('.relationship-period-row').filter({ hasText: 'FR-2026-0028' }).locator('.relationship-period-row__main').click()
    await expect(page.locator('.customer-period-modal').first()).toContainText('INV-2026-0028')
  })

  test('relationship tables stay concise while limit details remain available', async ({ page }, testInfo) => {
    await page.goto('/experience/abf/financing')
    if (!mobile(testInfo)) {
      await expect(page.locator('.relationship-table thead th')).toHaveText(['Supplier', 'Financing Available', 'Status', 'Action'])
    }
    const dialog = await openRelationship(page, 'Quick Mart Stores')
    await expect(dialog).toContainText('Max Financing')
    await expect(dialog).toContainText('Financing Used')
  })
})

test.describe('Invoice Financing invoice workspace', () => {
  test.beforeEach(async ({ page }) => signIn(page))

  test('invoice files have a dedicated page with overdue first and openable files', async ({ page }, testInfo) => {
    await page.goto('/experience/invoice-financing/invoices')
    await expect(page.getByRole('heading', { name: 'Invoices', level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: 'View invoice' }).first()).toHaveAttribute('href', /demo-documents/)
    const first = mobile(testInfo) ? page.locator('.invoice-file-card').first() : page.locator('.invoice-files-table tbody tr').first()
    await expect(first).toContainText('Overdue')
    await expect(first).toHaveCSS('background-color', 'rgb(255, 244, 244)')
  })

  test('Invoice Uploader only offers buyer relationships owned by the client', async ({ page }) => {
    await page.goto('/experience/invoice-financing/invoices?action=upload')
    const dialog = page.locator('.invoice-upload-modal')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('combobox', { name: 'Buyer' })).toHaveText('FreshProduce Kenya Ltd')
    await expect(dialog).not.toContainText('Twiga Foods Ltd')
  })

  test('Invoice Financing table uses customer-facing due date and financing availability', async ({ page }, testInfo) => {
    if (mobile(testInfo)) return
    await page.goto('/experience/invoice-financing/home')
    await expect(page.locator('.customer-activity-table thead th')).toHaveText([
      'Reference', 'Invoice Due Date', 'Available Financing', 'Status', 'Outstanding Amount', 'Action',
    ])
  })
})

test.describe('Partner Buyer Portal priorities', () => {
  test.beforeEach(async ({ page }) => signIn(page))

  test('home shows overdue then upcoming payments and requested nav order', async ({ page }, testInfo) => {
    await page.goto('/experience/invoice-partner/home')
    await expect(page.getByRole('heading', { name: 'Payments needing attention', level: 2 })).toBeVisible()
    const rows = mobile(testInfo) ? page.locator('.partner-home-payment-card') : page.locator('.partner-home-payments-table tbody tr')
    await expect(rows.first()).toContainText('Overdue')
    await expect(rows.first()).toHaveCSS('background-color', 'rgb(255, 244, 244)')
    await expect(page.locator('.partner-home-payments')).toContainText('Upcoming')
    const nav = mobile(testInfo) ? page.locator('.experience-bottom-nav') : page.locator('.experience-sidebar-nav')
    await expect(nav.locator('a')).toHaveText(['Home', 'Payments', 'Suppliers', 'Invoices'])
  })

  test('payments page is overdue-first and visible desktop columns are focused', async ({ page }, testInfo) => {
    await page.goto('/experience/invoice-partner/obligations')
    const rows = mobile(testInfo) ? page.locator('.partner-payment-card') : page.locator('.partner-payments-table tbody tr')
    await expect(rows.first()).toContainText('Overdue')
    if (!mobile(testInfo)) {
      await expect(page.locator('.partner-payments-table thead th:visible')).toHaveText([
        'Supplier', 'Financing Period', 'Due Date', 'Amount to Pay', 'Payment Status', 'Action',
      ])
    }
  })

  test('Partner Buyer can upload invoices and inspect supplier financing periods', async ({ page }) => {
    await page.goto('/experience/invoice-partner/invoice-uploads')
    await page.getByRole('button', { name: 'Upload invoices' }).click()
    await expect(page.locator('.partner-modal')).toContainText('multiple suppliers and due dates')

    await page.goto('/experience/invoice-partner/suppliers')
    const table = page.locator('.partner-suppliers-table')
    const row = await table.isVisible()
      ? table.locator('tbody tr').filter({ hasText: 'Kioko Agri Supplies Ltd' })
      : page.locator('.partner-supplier-card').filter({ hasText: 'Kioko Agri Supplies Ltd' })
    await row.getByRole('button', { name: 'View' }).click()
    await expect(page.locator('.partner-modal')).toContainText('PER-2026-09-15-KIOKO')
  })
})

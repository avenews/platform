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

async function openFiles(page: Page): Promise<Locator> {
  const dialog = page.locator('.customer-period-modal').first()
  await dialog.getByRole('button', { name: 'Files', exact: true }).click()
  const files = page.locator('.customer-period-modal').first()
  await expect(files.getByRole('heading', { name: 'Files', level: 2 })).toBeVisible()
  return files
}

async function visibleSortSelect(page: Page, testInfo: TestInfo): Promise<Locator> {
  const bar = page.locator('app-customer-filter-bar').first()
  if (mobile(testInfo)) {
    const mobileBar = bar.locator('[data-filter-layout="mobile"]')
    await mobileBar.getByRole('button', { name: 'Filters' }).click()
    return mobileBar.getByRole('combobox', { name: 'Sort by' })
  }
  return bar.locator('[data-filter-layout="desktop"]').getByRole('combobox', { name: 'Sort by' })
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

  test('ACL, ABF, STF and INFX expose all period files from the Files screen', async ({ page }) => {
    await page.goto('/experience/acl/home')
    let dialog = await openPeriod(page, 'FR-2026-0318')
    await expect(dialog.getByRole('button', { name: 'Files', exact: true })).toBeVisible()
    let files = await openFiles(page)
    await expect(files).toContainText('Funds Request snapshot')
    await expect(files).toContainText('Invoice')
    await expect(files).toContainText('Proof of Delivery')
    await expect(files.getByRole('link', { name: 'View invoice' })).toHaveAttribute('href', /demo-documents/)

    await page.goto('/experience/abf/financing')
    dialog = await openRelationship(page, 'Naivas Fresh Produce')
    await dialog.locator('.relationship-period-row').filter({ hasText: 'FR-2026-0407' }).locator('.relationship-period-row__main').click()
    files = await openFiles(page)
    await expect(files).toContainText('Funds Request snapshot')
    await expect(files).toContainText('Proof of Payment')
    await expect(files).toContainText('Proof of Delivery')

    await page.goto('/experience/stf/financing')
    dialog = await openRelationship(page, 'GreenHarvest Distributors')
    await dialog.locator('.relationship-period-row').filter({ hasText: 'FR-2026-0501' }).locator('.relationship-period-row__main').click()
    files = await openFiles(page)
    await expect(files).toContainText('Funds Request snapshot')
    await expect(files).toContainText('GH-INV-8831')

    await page.goto('/experience/infx/financing')
    dialog = await openRelationship(page, 'Kisumu Buyers Co-op')
    await dialog.locator('.relationship-period-row').filter({ hasText: 'FR-2026-0028' }).locator('.relationship-period-row__main').click()
    files = await openFiles(page)
    await expect(files).toContainText('Funds Request snapshot')
    await expect(files).toContainText('INV-2026-0028')
  })

  test('financing modal overview does not clip and Files shares the footer with payment details', async ({ page }) => {
    await page.goto('/experience/invoice-financing/home')
    const dialog = await openPeriod(page, 'DP-2026-08-15-FRESH')
    const details = dialog.locator('.customer-period-details')
    await expect(details).toBeVisible()
    const rows = await details.locator(':scope > div').evaluateAll((elements) => elements.map((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    })))
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every(row => row.scrollHeight <= row.clientHeight + 1)).toBeTruthy()

    const filesButton = dialog.getByRole('button', { name: 'Files', exact: true })
    const paymentButton = dialog.getByRole('button', { name: 'Payment details', exact: true })
    await expect(filesButton).toBeVisible()
    await expect(paymentButton).toBeVisible()
    const filesBox = await filesButton.boundingBox()
    const paymentBox = await paymentButton.boundingBox()
    expect(filesBox).not.toBeNull()
    expect(paymentBox).not.toBeNull()
    expect(Math.abs(filesBox!.y - paymentBox!.y)).toBeLessThanOrEqual(2)

    const files = await openFiles(page)
    await expect(files).toContainText('Funds Request snapshot')
    await expect(files).toContainText('INV-9120')
  })

  test('Funds Request sort options only use fields visible in each table', async ({ page }, testInfo) => {
    await page.goto('/experience/abf/request-funds')
    let sort = await visibleSortSelect(page, testInfo)
    await expect(sort).toBeVisible()
    let options = await sort.locator('option').allTextContents()
    expect(options).toContain('Sort by')
    expect(options).toContain('Supplier: A-Z')
    expect(options.some(option => option.includes('Due date'))).toBeFalsy()
    expect(options.some(option => option.includes('Available financing'))).toBeTruthy()

    const statusBar = page.locator('app-customer-filter-bar').first()
    const statusSelect = mobile(testInfo)
      ? statusBar.locator('[data-filter-layout="mobile"]').getByRole('combobox', { name: 'Status' })
      : statusBar.locator('[data-filter-layout="desktop"]').getByRole('combobox', { name: 'Status' })
    await expect(statusSelect.locator('option').first()).toHaveText('All statuses')

    await page.goto('/experience/invoice-financing/request-funds')
    sort = await visibleSortSelect(page, testInfo)
    options = await sort.locator('option').allTextContents()
    expect(options.some(option => option.includes('Invoice due date'))).toBeTruthy()
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

  test('Partner Buyer controls only expose visible status and sort fields', async ({ page }, testInfo) => {
    await page.goto('/experience/invoice-partner/obligations')
    let sort = await visibleSortSelect(page, testInfo)
    let options = await sort.locator('option').allTextContents()
    expect(options.some(option => option.includes('Financing period'))).toBeTruthy()
    expect(options.some(option => option.includes('Amount to pay'))).toBeTruthy()
    expect(options.some(option => option.includes('Period status'))).toBeFalsy()

    await page.goto('/experience/invoice-partner/suppliers')
    sort = await visibleSortSelect(page, testInfo)
    options = await sort.locator('option').allTextContents()
    expect(options.some(option => option.includes('Active periods'))).toBeTruthy()
    expect(options.some(option => option.includes('Next payment'))).toBeTruthy()
    expect(options.some(option => option.includes('Max financing'))).toBeFalsy()
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

import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'

const SESSION_KEY = 'av_customer_portal_session'
const SCENARIO_KEY = 'av_experience_scenario'
const ACL_DEMO_URL = 'https://financing.avenews-gt.com/ishai/form/ACLDemoV2/formperma/yJ6BX6SANxu6zsGmFihcRuuAwT2dI9SbK4UGYlNIFog'
const ABF_DEMO_URL = 'https://financing.avenews-gt.com/ishai/form/ABFDemo1/formperma/88hpcsGdZAsMIA0-EbgWUOc6jIqIr5VRd1htmpKqIRA'
const CUSTOMER_STATUSES = ['Overdue', 'Requested', 'Live', 'Repaid', 'Cancelled', 'Declined'] as const

const SESSION = {
  contactId: 'usr_001',
  contactFirstName: 'Amara',
  contactLastName: 'Osei',
  contactEmail: 'amara.osei@kiokoagri.co.ke',
  businessId: 'biz_demo_001',
  businessName: 'Kioko Agri Supplies Ltd',
  role: 'admin',
}

const CUSTOMER_DESTINATIONS = [
  { id: 'acl', label: 'Agri Credit Line' },
  { id: 'abf', label: 'Agri Buyer Financing' },
  { id: 'stf', label: 'Stockist Financing' },
  { id: 'invoice-financing', label: 'Invoice Financing' },
  { id: 'infx', label: 'Invoice Financing Express' },
] as const

function isMobile(testInfo: TestInfo): boolean {
  return testInfo.project.name === 'mobile' || testInfo.project.name === 'minimum-mobile'
}

async function signIn(
  page: Page,
  scenario: 'multiple' | 'abf-only' | 'partner-only' = 'multiple',
): Promise<void> {
  await page.addInitScript(
    ({ sessionKey, scenarioKey, session, scenarioValue }) => {
      localStorage.setItem(sessionKey, JSON.stringify(session))
      sessionStorage.setItem(scenarioKey, scenarioValue)
    },
    { sessionKey: SESSION_KEY, scenarioKey: SCENARIO_KEY, session: SESSION, scenarioValue: scenario },
  )
}

async function completePrototypeLogin(
  page: Page,
  scenario: 'multiple' | 'abf-only' | 'partner-only',
): Promise<void> {
  await page.goto(`/login?access=${scenario}`)
  await page.locator('input[type="email"]').fill('qa.customer@example.com')
  await page.getByRole('button', { name: /send code/i }).click()
  await page.locator('input[autocomplete="one-time-code"]').fill('123456')
  await page.getByRole('button', { name: 'Verify' }).click()
}

async function assertNoOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1)
}

async function openHomePeriod(page: Page, reference: string): Promise<void> {
  const table = page.locator('.customer-activity-table')
  if (await table.isVisible()) {
    await table.locator('.customer-activity-row').filter({ hasText: reference }).click()
    return
  }
  await page.locator('.customer-activity-cards .baseline-record-card')
    .filter({ hasText: reference })
    .locator('.customer-record-card-button')
    .click()
}

async function relationshipRow(page: Page, name: string): Promise<Locator> {
  const table = page.locator('.relationship-table-wrap')
  if (await table.isVisible()) return page.locator('.relationship-table tbody tr').filter({ hasText: name })
  return page.locator('.relationship-cards .relationship-card').filter({ hasText: name })
}

async function openRelationship(page: Page, name: string): Promise<void> {
  const row = await relationshipRow(page, name)
  await row.getByRole('button', { name: 'View', exact: true }).click()
  await expect(page.locator('.relationship-modal')).toBeVisible()
}

async function visibleStatusBadges(page: Page): Promise<Locator> {
  const table = page.locator('.customer-activity-table')
  return await table.isVisible()
    ? table.locator('tbody .baseline-status')
    : page.locator('.customer-activity-cards .baseline-status')
}

async function assertModalBodyScrollable(dialog: Locator): Promise<void> {
  const body = dialog.locator('.customer-period-modal__body, .relationship-modal__body, .partner-modal__body').first()
  await expect(body).toBeVisible()
  await expect(body).toHaveCSS('overflow-y', 'auto')
}

test.describe('product selection', () => {
  test('multiple destinations open a customer-facing selector', async ({ page }) => {
    await completePrototypeLogin(page, 'multiple')
    await expect(page).toHaveURL(/\/access$/)
    await expect(page.getByRole('heading', { name: 'Welcome back, Amara', level: 1 })).toBeVisible()
    await expect(page.locator('.access-card')).toHaveCount(6)
    for (const destination of CUSTOMER_DESTINATIONS) {
      const card = page.locator(`[data-experience-id="${destination.id}"]`)
      await expect(card).toContainText(destination.label)
      await expect(card).toContainText('Available Financing')
      await expect(card).toContainText('Outstanding Amount')
    }
    await expect(page.locator('.access-main')).not.toContainText('Dynamic Period')
    await expect(page.locator('.access-main')).not.toContainText('Client Supplier')
  })

  test('single-destination scenarios still land on product selection', async ({ page }) => {
    await completePrototypeLogin(page, 'abf-only')
    await expect(page).toHaveURL(/\/access$/)
    await expect(page.locator('.access-card')).toHaveCount(1)
    await expect(page.locator('[data-experience-id="abf"]')).toContainText('Agri Buyer Financing')
  })
})

test.describe('customer product homes', () => {
  test.beforeEach(async ({ page }) => signIn(page))

  for (const destination of CUSTOMER_DESTINATIONS) {
    test(`${destination.id} keeps the primary financing surface concise`, async ({ page }, testInfo) => {
      await page.goto(`/experience/${destination.id}/home`)
      await expect(page.getByRole('heading', { name: destination.label, level: 1 })).toBeVisible()
      const expectedHeroAction = destination.id === 'invoice-financing' ? 'Upload invoices' : 'Request funds'
      const heroAction = page.locator('.contextual-home__hero').locator('button').filter({ hasText: expectedHeroAction })

      if (isMobile(testInfo)) {
        await expect(heroAction).toBeHidden()
        await expect(page.locator('.customer-available-financing').getByRole('button', { name: 'Request funds' })).toBeVisible()
      } else {
        await expect(heroAction).toBeVisible()
      }

      const cards = page.locator('.customer-product-summary .contextual-metric')
      await expect(cards).toHaveCount(3)
      await expect(cards.nth(0)).toContainText('Available Financing')
      await expect(cards.nth(1)).toContainText('Outstanding Amount')
      await expect(page.getByRole('heading', { name: 'Financing', level: 2, exact: true })).toBeVisible()
      await expect(await visibleStatusBadges(page)).toHaveText(CUSTOMER_STATUSES)
      await assertNoOverflow(page)
    })
  }

  test('overdue financing is first and highlighted light red on table and cards', async ({ page }, testInfo) => {
    await page.goto('/experience/abf/home')
    const first = isMobile(testInfo)
      ? page.locator('.customer-activity-cards .customer-financing-card').first()
      : page.locator('.customer-activity-table tbody .customer-activity-row').first()
    await expect(first).toContainText('Overdue')
    await expect(first).toContainText('Naivas Fresh Produce')
    await expect(first).toHaveCSS('background-color', 'rgb(255, 244, 244)')
  })

  test('desktop financing table keeps secondary details in the modal', async ({ page }, testInfo) => {
    await page.goto('/experience/abf/home')
    if (isMobile(testInfo)) return
    const heading = page.locator('.customer-activity-table thead')
    await expect(heading).toContainText('Reference')
    await expect(heading).toContainText('Repayment Due Date')
    await expect(heading).toContainText('Amount Financed')
    await expect(heading).toContainText('Status')
    await expect(heading).toContainText('Outstanding Balance')
    await expect(heading).toContainText('Action')
    await expect(heading).not.toContainText('Disbursement Date')
    await expect(heading).not.toContainText('Total Repaid')

    await openHomePeriod(page, 'FR-2026-0422')
    const dialog = page.locator('.customer-period-modal').first()
    await expect(dialog).toContainText('Disbursement Date')
    await expect(dialog).toContainText('Total Repaid')
  })

  test('Invoice Financing uses customer-facing period language', async ({ page }) => {
    await page.goto('/experience/invoice-financing/home')
    const home = page.locator('.contextual-home')
    await expect(home).toContainText('View financing by buyer and invoice due date')
    await expect(home).toContainText('Across eligible financing periods')
    await expect(home).not.toContainText('Dynamic Period')
    await expect(home).not.toContainText('Client Supplier')
  })

  test('primary navigation exposes tasks while Manage Users lives in the profile menu', async ({ page }, testInfo) => {
    const expectations = [
      { id: 'acl', items: ['Home', 'Funds Request'] },
      { id: 'abf', items: ['Home', 'Suppliers', 'Funds Request'] },
      { id: 'stf', items: ['Home', 'Partner Suppliers', 'Funds Request'] },
      { id: 'invoice-financing', items: ['Home', 'Buyers', 'Funds Request', 'Invoice Uploader'] },
      { id: 'infx', items: ['Home', 'Buyers', 'Funds Request'] },
    ]

    for (const expected of expectations) {
      await page.goto(`/experience/${expected.id}/home`)
      const navigation = isMobile(testInfo)
        ? page.locator('.experience-bottom-nav')
        : page.locator('.experience-sidebar-nav')
      await expect(navigation.locator('a')).toHaveText(expected.items)
      await expect(navigation).not.toContainText('Manage Users')

      const profileTrigger = isMobile(testInfo)
        ? page.locator('.experience-avatar-trigger')
        : page.locator('.experience-profile-button')
      await profileTrigger.click()
      await expect(page.locator('.experience-profile-menu').getByRole('menuitem', { name: 'Manage Users' })).toBeVisible()
      await page.keyboard.press('Escape')
    }
  })

  test('ACL Funds Request keeps the permanent direct demo URL on the visible primary route', async ({ page }) => {
    await page.goto('/experience/acl/home')
    const request = page.locator(`[data-external-url="${ACL_DEMO_URL}"]:visible`).first()
    await expect(request).toBeVisible()
    await expect(request).toHaveAttribute('data-external-url', ACL_DEMO_URL)
  })
})

test.describe('transaction files and relationship detail', () => {
  test.beforeEach(async ({ page }) => signIn(page))

  test('ACL financing period exposes its invoice and supporting file', async ({ page }) => {
    await page.goto('/experience/acl/home')
    await openHomePeriod(page, 'FR-2026-0318')
    const dialog = page.locator('.customer-period-modal').first()
    await expect(dialog).toContainText('Transaction files')
    await expect(dialog).toContainText('Invoice')
    await expect(dialog).toContainText('Proof of Delivery')
    await expect(dialog.getByRole('link', { name: 'View' }).first()).toHaveAttribute('href', /demo-documents/)
    await assertModalBodyScrollable(dialog)
  })

  test('ABF keeps invoice evidence in financing-period detail', async ({ page }) => {
    await page.goto('/experience/abf/financing')
    await openRelationship(page, 'Naivas Fresh Produce')
    const relationship = page.locator('.relationship-modal')
    await relationship.locator('.relationship-period-row').filter({ hasText: 'FR-2026-0407' }).locator('.relationship-period-row__main').click()
    const dialog = page.locator('.customer-period-modal').first()
    await expect(dialog).toContainText('Transaction files')
    await expect(dialog).toContainText('Proof of Payment')
    await expect(dialog).toContainText('Proof of Delivery')
  })

  test('STF keeps Partner Supplier invoice evidence in period detail', async ({ page }) => {
    await page.goto('/experience/stf/financing')
    await openRelationship(page, 'GreenHarvest Distributors')
    await page.locator('.relationship-modal .relationship-period-row').filter({ hasText: 'FR-2026-0501' }).locator('.relationship-period-row__main').click()
    const dialog = page.locator('.customer-period-modal').first()
    await expect(dialog).toContainText('Transaction files')
    await expect(dialog).toContainText('GH-INV-8831')
  })

  test('INFX exposes its one invoice and POD in period detail', async ({ page }) => {
    await page.goto('/experience/infx/financing')
    await openRelationship(page, 'Kisumu Buyers Co-op')
    await page.locator('.relationship-modal .relationship-period-row').filter({ hasText: 'FR-2026-0028' }).locator('.relationship-period-row__main').click()
    const dialog = page.locator('.customer-period-modal').first()
    await expect(dialog).toContainText('INV-2026-0028')
    await expect(dialog).toContainText('Transaction files')
  })

  test('ABF relationship table focuses on availability and moves limit detail to modal', async ({ page }, testInfo) => {
    await page.goto('/experience/abf/financing')
    if (!isMobile(testInfo)) {
      const heading = page.locator('.relationship-table thead')
      await expect(heading).toContainText('Supplier')
      await expect(heading).toContainText('Financing Available')
      await expect(heading).toContainText('Status')
      await expect(heading).toContainText('Action')
      await expect(heading).not.toContainText('Max Financing')
      await expect(heading).not.toContainText('Financing Used')
    }
    await openRelationship(page, 'Quick Mart Stores')
    const dialog = page.locator('.relationship-modal')
    await expect(dialog).toContainText('Max Financing')
    await expect(dialog).toContainText('Financing Used')
  })

  test('ABF request actions keep the approved external demo destination', async ({ page }) => {
    await page.goto('/experience/abf/financing')
    const available = await relationshipRow(page, 'Naivas Fresh Produce')
    const request = available.getByRole('button', { name: 'Request funds' })
    await expect(request).toBeEnabled()
    await expect(request).toHaveAttribute('data-external-url', ABF_DEMO_URL)
  })
})

test.describe('Invoice Financing invoices', () => {
  test.beforeEach(async ({ page }) => signIn(page))

  test('dedicated invoice page exposes actual demo invoice files and overdue first', async ({ page }, testInfo) => {
    await page.goto('/experience/invoice-financing/invoices')
    await expect(page.getByRole('heading', { name: 'Invoices', level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: 'View invoice' }).first()).toHaveAttribute('href', /demo-documents/)
    const first = isMobile(testInfo)
      ? page.locator('.invoice-file-card').first()
      : page.locator('.invoice-files-table tbody tr').first()
    await expect(first).toContainText('Overdue')
    await expect(first).toHaveCSS('background-color', 'rgb(255, 244, 244)')
  })

  test('Invoice Uploader only offers buyers where the client owns invoice upload', async ({ page }) => {
    await page.goto('/experience/invoice-financing/invoices?action=upload')
    const dialog = page.locator('.invoice-upload-modal')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('combobox', { name: 'Buyer' })).toHaveText('FreshProduce Kenya Ltd')
    await expect(dialog).not.toContainText('Twiga Foods Ltd')
  })

  test('Invoice Financing main table stays focused on financing availability', async ({ page }, testInfo) => {
    await page.goto('/experience/invoice-financing/home')
    if (isMobile(testInfo)) return
    const heading = page.locator('.customer-activity-table thead')
    await expect(heading).toContainText('Invoice Due Date')
    await expect(heading).toContainText('Available Financing')
    await expect(heading).toContainText('Outstanding Amount')
    await expect(heading).not.toContainText('Disbursement Date')
    await expect(heading).not.toContainText('Buyer Payments Allocated')
    await expect(heading).not.toContainText('Total Repaid')
  })

  test('Invoice Financing relationship ownership remains explicit', async ({ page }) => {
    await page.goto('/experience/invoice-financing/financing')
    const twiga = await relationshipRow(page, 'Twiga Foods Ltd')
    const fresh = await relationshipRow(page, 'FreshProduce Kenya Ltd')
    await expect(twiga.getByRole('button', { name: 'Upload invoices' })).toHaveCount(0)
    await expect(fresh.getByRole('button', { name: 'Upload invoices' })).toBeVisible()

    await openRelationship(page, 'Twiga Foods Ltd')
    await expect(page.locator('.relationship-modal')).toContainText('Buyer uploads invoices')
  })

  test('buyer payment detail uses the customer-facing clearing-account description', async ({ page }) => {
    await page.goto('/experience/invoice-financing/home')
    await openHomePeriod(page, 'DP-2026-09-15-TWIGA')
    const period = page.locator('.customer-period-modal').first()
    await period.getByRole('button', { name: 'View payment details' }).click()
    const payment = page.locator('.customer-repayment-modal')
    await expect(payment).toContainText('Your Avenews Clearing Account')
    await expect(payment).not.toContainText('ABSA Bank Kenya PLC')
  })
})

test.describe('Partner Buyer Portal', () => {
  test.beforeEach(async ({ page }) => signIn(page))

  test('home shows overdue and upcoming payments and uses requested nav order', async ({ page }, testInfo) => {
    await page.goto('/experience/invoice-partner/home')
    await expect(page.getByRole('heading', { name: 'Partner Buyer Portal', level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Payments needing attention', level: 2 })).toBeVisible()

    const priority = isMobile(testInfo)
      ? page.locator('.partner-home-payment-card')
      : page.locator('.partner-home-payments-table tbody tr')
    await expect(priority.first()).toContainText('Overdue')
    await expect(priority.first()).toHaveCSS('background-color', 'rgb(255, 244, 244)')
    await expect(priority).toContainText(['Overdue', 'Upcoming'])

    const navigation = isMobile(testInfo)
      ? page.locator('.experience-bottom-nav')
      : page.locator('.experience-sidebar-nav')
    await expect(navigation.locator('a')).toHaveText(['Home', 'Payments', 'Suppliers', 'Invoices'])
    await assertNoOverflow(page)
  })

  test('payments list is overdue-first and keeps secondary detail in modal', async ({ page }, testInfo) => {
    await page.goto('/experience/invoice-partner/obligations')
    const first = isMobile(testInfo)
      ? page.locator('.partner-payment-card').first()
      : page.locator('.partner-payments-table tbody tr').first()
    await expect(first).toContainText('Overdue')

    if (!isMobile(testInfo)) {
      const heading = page.locator('.partner-payments-table thead')
      await expect(heading).toContainText('Supplier')
      await expect(heading).toContainText('Financing Period')
      await expect(heading).toContainText('Due Date')
      await expect(heading).toContainText('Amount to Pay')
      await expect(heading).toContainText('Payment Status')
      await expect(heading).not.toContainText('Invoices')
      await expect(heading).not.toContainText('Financing')
      await expect(heading).not.toContainText('Period Status')
    }
  })

  test('invoice upload remains a Partner Buyer responsibility', async ({ page }) => {
    await page.goto('/experience/invoice-partner/invoice-uploads')
    await page.getByRole('button', { name: 'Upload invoices' }).click()
    const dialog = page.locator('.partner-modal')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('multiple suppliers and due dates')
    await assertModalBodyScrollable(dialog)
  })

  test('supplier detail still contains financing-period and payment detail', async ({ page }) => {
    await page.goto('/experience/invoice-partner/suppliers')
    const table = page.locator('.partner-suppliers-table')
    if (await table.isVisible()) {
      await table.locator('tbody tr').filter({ hasText: 'Kioko Agri Supplies Ltd' }).getByRole('button', { name: 'View' }).click()
    } else {
      await page.locator('.partner-supplier-card').filter({ hasText: 'Kioko Agri Supplies Ltd' }).getByRole('button', { name: 'View' }).click()
    }
    const dialog = page.locator('.partner-modal').filter({ hasText: 'Kioko Agri Supplies Ltd' }).first()
    await expect(dialog).toContainText('Financing periods')
    await expect(dialog).toContainText('PER-2026-09-15-KIOKO')
  })
})

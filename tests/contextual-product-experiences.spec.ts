import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'

const SESSION_KEY = 'av_customer_portal_session'
const SCENARIO_KEY = 'av_experience_scenario'
const ACL_DEMO_URL = 'https://financing.avenews-gt.com/ishai/form/ACLDemoV2/formperma/yJ6BX6SANxu6zsGmFihcRuuAwT2dI9SbK4UGYlNIFog'
const ABF_DEMO_URL = 'https://financing.avenews-gt.com/ishai/form/ABFDemo1/formperma/88hpcsGdZAsMIA0-EbgWUOc6jIqIr5VRd1htmpKqIRA'
const CUSTOMER_STATUSES = ['Requested', 'Live', 'Overdue', 'Repaid', 'Cancelled', 'Declined'] as const

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
  await expect(page.getByRole('heading', { name: 'Verification code', level: 1 })).toBeVisible()
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
  if (await table.isVisible()) {
    return page.locator('.relationship-table tbody tr').filter({ hasText: name })
  }
  return page.locator('.relationship-cards .relationship-card').filter({ hasText: name })
}

async function openRelationship(page: Page, name: string): Promise<void> {
  const row = await relationshipRow(page, name)
  await row.getByRole('button', { name: 'View details' }).click()
  await expect(page.locator('.relationship-modal')).toBeVisible()
}

async function assertRelationshipListCount(page: Page, testInfo: TestInfo, count: number): Promise<void> {
  if (isMobile(testInfo)) {
    await expect(page.locator('.relationship-cards .relationship-card')).toHaveCount(count)
  } else {
    await expect(page.locator('.relationship-table tbody tr')).toHaveCount(count)
  }
}

async function assertModalBodyScrollable(dialog: Locator): Promise<void> {
  const body = dialog.locator('.customer-period-modal__body, .relationship-modal__body').first()
  await expect(body).toBeVisible()
  await expect(body).toHaveCSS('overflow-y', 'auto')
}

async function visibleStatusBadges(page: Page): Promise<Locator> {
  const table = page.locator('.customer-activity-table')
  return await table.isVisible()
    ? table.locator('tbody .baseline-status')
    : page.locator('.customer-activity-cards .baseline-status')
}

test.describe('post-OTP access resolution', () => {
  test('multiple destinations open the chooser with View actions', async ({ page }) => {
    await completePrototypeLogin(page, 'multiple')
    await expect(page).toHaveURL(/\/access$/)
    await expect(page.locator('.access-card')).toHaveCount(6)
    for (const destination of CUSTOMER_DESTINATIONS) {
      await expect(page.locator(`[data-experience-id="${destination.id}"]`)).toContainText(destination.label)
    }
    await expect(page.locator('[data-experience-id="invoice-partner"]')).toContainText('Invoice Financing - Partner Buyer')
    await expect(page.locator('.access-card__action')).toHaveText(['View', 'View', 'View', 'View', 'View', 'View'])
  })

  test('single ABF access routes straight to ABF Home', async ({ page }) => {
    await completePrototypeLogin(page, 'abf-only')
    await expect(page).toHaveURL(/\/experience\/abf\/home$/)
    await expect(page.getByRole('heading', { name: 'Agri Buyer Financing', level: 1 })).toBeVisible()
  })

  test('single Partner Buyer access routes straight to its workspace', async ({ page }) => {
    await completePrototypeLogin(page, 'partner-only')
    await expect(page).toHaveURL(/\/experience\/invoice-partner\/home$/)
    await expect(page.getByRole('heading', { name: 'Invoice Financing - Partner Buyer', level: 1 })).toBeVisible()
  })
})

test.describe('shared customer financing pattern', () => {
  test.beforeEach(async ({ page }) => signIn(page))

  for (const destination of CUSTOMER_DESTINATIONS) {
    test(`${destination.id} uses the concise Financing surface and all six customer statuses`, async ({ page }, testInfo) => {
      await page.goto(`/experience/${destination.id}/home`)
      await expect(page.getByRole('heading', { name: destination.label, level: 1 })).toBeVisible()
      await expect(page.locator('.contextual-home__hero').getByRole('button', { name: 'Request funds' })).toBeVisible()
      await expect(page.locator('.customer-product-summary .contextual-metric')).toHaveCount(3)
      await expect(page.getByRole('heading', { name: 'Financing', level: 2, exact: true })).toBeVisible()
      await expect(page.locator('.customer-financing-activity')).not.toContainText('Open a financing period for its full financing and repayment details.')
      await expect(await visibleStatusBadges(page)).toHaveText(CUSTOMER_STATUSES)
      await assertNoOverflow(page)
      await page.screenshot({ path: testInfo.outputPath(`${destination.id}-financing.png`), fullPage: true })
    })
  }

  test('financing identifiers follow each product context', async ({ page }) => {
    await page.goto('/experience/acl/home')
    const aclCell = page.locator('.customer-activity-table tbody .baseline-financing-cell').first()
    await expect(aclCell).toHaveText('FR-2026-0612')
    await expect(aclCell).not.toContainText('Agri Credit Line')

    const expectations = [
      { id: 'abf', relationship: 'Eastleigh Traders Co.', reference: 'FR-2026-0819' },
      { id: 'stf', relationship: 'GreenHarvest Distributors', reference: 'FR-2026-0820' },
      { id: 'invoice-financing', relationship: 'Twiga Foods Ltd', reference: 'DP-2026-10-15-TWIGA' },
      { id: 'infx', relationship: 'Mombasa Buyers Network', reference: 'FR-2026-0818' },
    ]

    for (const expected of expectations) {
      await page.goto(`/experience/${expected.id}/home`)
      const cell = page.locator('.customer-activity-table tbody .baseline-financing-cell').first()
      await expect(cell.locator('strong')).toHaveText(expected.relationship)
      await expect(cell).toContainText(expected.reference)
    }
  })

  test('filters are compact, explicit, and clearable', async ({ page }, testInfo) => {
    await page.goto('/experience/acl/home')
    const search = page.getByRole('searchbox', { name: 'Search Agri Credit Line financing' })
    await search.fill('FR-2026-0318')

    if (isMobile(testInfo)) {
      await page.getByRole('button', { name: 'Filters' }).click()
      await page.getByRole('combobox', { name: 'Status' }).selectOption('live')
      await page.getByRole('button', { name: 'Apply' }).click()
      await page.getByRole('button', { name: 'Filters' }).click()
      await page.getByRole('button', { name: 'Clear all' }).click()
      await page.getByRole('button', { name: 'Apply' }).click()
    } else {
      await page.getByRole('combobox', { name: 'Status' }).selectOption('live')
      const desktopSearch = page.locator('.customer-filter-bar__desktop .customer-filter-search')
      const width = await desktopSearch.evaluate(element => element.getBoundingClientRect().width)
      expect(width).toBeLessThanOrEqual(302)
      await page.locator('.customer-filter-bar__desktop').getByRole('button', { name: 'Clear filters' }).click()
    }

    await expect(search).toHaveValue('')
    if (!isMobile(testInfo)) {
      await expect(page.getByRole('combobox', { name: 'Status' })).toHaveValue('')
    }
  })

  test('Payments Due remains outlined and filters Financing', async ({ page }, testInfo) => {
    await page.goto('/experience/acl/home')
    const card = page.locator('.customer-payments-due')
    await expect(card).toContainText('2 payments due')
    await expect(card).toContainText('1 overdue · 1 upcoming')
    const action = card.getByRole('button', { name: 'View payments due in Financing' })
    await expect(action).toHaveClass(/baseline-button--secondary/)
    await action.click()

    if (isMobile(testInfo)) {
      await page.getByRole('button', { name: 'Filters' }).click()
      await expect(page.getByRole('combobox', { name: 'Due date' })).toHaveValue('payments-due')
    } else {
      await expect(page.getByRole('combobox', { name: 'Due date' })).toHaveValue('payments-due')
    }

    const table = page.locator('.customer-activity-table')
    if (await table.isVisible()) {
      await expect(table.locator('.customer-activity-row')).toHaveCount(2)
    } else {
      await expect(page.locator('.customer-activity-cards .baseline-record-card')).toHaveCount(2)
    }
  })

  test('primary navigation keeps relationship labels distinct from Manage Users', async ({ page }, testInfo) => {
    const expectations = [
      { id: 'acl', items: ['Home', 'Request Funds', 'Manage Users'] },
      { id: 'abf', items: ['Home', 'Suppliers', 'Manage Users'] },
      { id: 'stf', items: ['Home', 'Partner Suppliers', 'Manage Users'] },
      { id: 'invoice-financing', items: ['Home', 'Buyers', 'Manage Users'] },
      { id: 'infx', items: ['Home', 'Buyers', 'Manage Users'] },
    ]

    for (const expected of expectations) {
      await page.goto(`/experience/${expected.id}/home`)
      const navigation = isMobile(testInfo)
        ? page.locator('.experience-bottom-nav')
        : page.locator('.experience-sidebar-nav')
      await expect(navigation.locator('a')).toHaveText(expected.items)
    }
  })
})

test.describe('repayment details', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
    await page.goto('/experience/acl/home')
  })

  test('Live ACL financing retains Instalments and scrollable repayment details', async ({ page }) => {
    await openHomePeriod(page, 'FR-2026-0318')
    const periodDialog = page.locator('.customer-period-modal').first()
    await expect(periodDialog).toContainText('Instalment 1 of 2')
    await expect(periodDialog).toContainText('Instalment 2 of 2')
    await assertModalBodyScrollable(periodDialog)

    await periodDialog.getByRole('button', { name: 'View repayment details' }).click()
    const repaymentDialog = page.locator('.customer-repayment-modal')
    await expect(repaymentDialog).toContainText('ABSA Bank Kenya PLC')
    await assertModalBodyScrollable(repaymentDialog)
  })

  test('bank and M-Pesa values align left while Copy remains trailing', async ({ page }) => {
    await openHomePeriod(page, 'FR-2026-0318')
    await page.locator('.customer-period-modal').first().getByRole('button', { name: 'View repayment details' }).click()
    const repaymentDialog = page.locator('.customer-repayment-modal')

    await expect(repaymentDialog.locator('.customer-payment-details strong').first()).toHaveCSS('text-align', 'left')
    await expect(repaymentDialog.locator('.customer-payment-details').getByText('03400', { exact: true })).toHaveCSS('text-align', 'left')

    await repaymentDialog.getByRole('tab', { name: 'M-Pesa Paybill' }).click()
    await expect(repaymentDialog.locator('.customer-payment-details').getByText('4567121', { exact: true })).toHaveCSS('text-align', 'left')
    await expect(repaymentDialog.locator('.customer-payment-details').getByText('+254712345678', { exact: true })).toHaveCSS('text-align', 'left')
    await expect(repaymentDialog).toContainText('Use your registered phone number')
  })

  test('ACL Request funds keeps the permanent direct demo URL', async ({ page }) => {
    const requestFunds = page.locator('.contextual-home__hero').getByRole('button', { name: 'Request funds' })
    await expect(requestFunds).toHaveAttribute('data-external-url', ACL_DEMO_URL)
  })
})

test.describe('relationship-first request flows', () => {
  test.beforeEach(async ({ page }) => signIn(page))

  for (const relationshipPage of [
    { id: 'abf', heading: 'Approved Suppliers', count: 3 },
    { id: 'stf', heading: 'Partner Suppliers', count: 3 },
    { id: 'invoice-financing', heading: 'Buyer Relationships', count: 2 },
    { id: 'infx', heading: 'Approved Buyers', count: 3 },
  ] as const) {
    test(`${relationshipPage.id} uses one concise relationship heading and no duplicate helper line`, async ({ page }, testInfo) => {
      await page.goto(`/experience/${relationshipPage.id}/financing`)
      await expect(page.getByRole('heading', { name: relationshipPage.heading, level: 1 })).toHaveCount(1)
      await expect(page.locator('.contextual-financing__hero > div > p:not(.page-eyebrow)')).toHaveCount(1)
      await expect(page.locator('.relationship-section__intro')).toHaveCount(0)
      await expect(page.locator('.relationship-section')).not.toContainText('Open a Buyer for its financing details')
      await expect(page.locator('.relationship-section')).not.toContainText('Open a Supplier for its financing details')
      await assertRelationshipListCount(page, testInfo, relationshipPage.count)
      await assertNoOverflow(page)
    })
  }

  test('ABF Supplier details retain Supplier-scoped Funds Request URL and multiple status examples', async ({ page }) => {
    await page.goto('/experience/abf/financing')
    await openRelationship(page, 'Quick Mart Stores')
    const dialog = page.locator('.relationship-modal')
    await expect(dialog).toContainText('FR-2026-0422')
    await expect(dialog).toContainText('FR-2026-0124')
    const request = dialog.getByRole('button', { name: 'Request Funds for Quick Mart Stores' })
    await expect(request).toHaveAttribute('data-external-url', ABF_DEMO_URL)
    await assertModalBodyScrollable(dialog)
  })

  test('Stockist retains Partner Supplier Instalments and repayment flow', async ({ page }) => {
    await page.goto('/experience/stf/financing')
    await openRelationship(page, 'GreenHarvest Distributors')
    const relationshipDialog = page.locator('.relationship-modal')
    await relationshipDialog.locator('.relationship-period-row')
      .filter({ hasText: 'FR-2026-0501' })
      .locator('.relationship-period-row__main')
      .click()

    const periodDialog = page.locator('.customer-period-modal').first()
    await expect(periodDialog).toContainText('Instalment 1 of 2')
    await expect(periodDialog).toContainText('Instalment 2 of 2')
    await periodDialog.getByRole('button', { name: 'View repayment details' }).click()
    await expect(page.locator('.customer-repayment-modal')).toContainText('ABSA Bank Kenya PLC')
  })

  test('Invoice Financing makes mixed invoice ownership explicit', async ({ page }, testInfo) => {
    await page.goto('/experience/invoice-financing/financing')
    const twiga = await relationshipRow(page, 'Twiga Foods Ltd')
    const fresh = await relationshipRow(page, 'FreshProduce Kenya Ltd')

    await expect(twiga).toContainText('Buyer uploads')
    await expect(twiga.getByRole('button', { name: 'Upload invoices' })).toHaveCount(0)
    await expect(fresh).toContainText('You upload')
    await expect(fresh.getByRole('button', { name: 'Upload invoices' })).toBeVisible()

    await fresh.getByRole('button', { name: 'Upload invoices' }).click()
    const upload = page.locator('.invoice-upload-modal')
    await expect(upload).toBeVisible()
    await expect(upload).toContainText('FreshProduce Kenya Ltd')
    await upload.locator('input[type="date"]').fill('2026-09-30')
    await upload.locator('input[type="number"]').fill('500000')
    await upload.getByRole('button', { name: 'Submit invoice' }).click()
    await expect(page.locator('.baseline-toast')).toContainText('matching Dynamic Period')
    await assertNoOverflow(page)
    if (!isMobile(testInfo)) await expect(page.locator('.relationship-table thead')).toContainText('Invoices')
  })

  test('Invoice Financing highlights additional funds available on eligible Dynamic Periods', async ({ page }) => {
    await page.goto('/experience/invoice-financing/home')
    const requested = page.locator('.customer-activity-row').filter({ hasText: 'DP-2026-10-15-TWIGA' })
    if (await requested.isVisible()) {
      await expect(requested).toContainText('Ksh 320,000')
      await expect(requested).toContainText('Available to request')
      await expect(requested.getByRole('button', { name: 'Request more' })).toBeVisible()
    } else {
      const card = page.locator('.customer-activity-cards .baseline-record-card').filter({ hasText: 'DP-2026-10-15-TWIGA' })
      await expect(card).toContainText('Ksh 320,000')
      await expect(card.getByRole('button', { name: 'Request more' })).toBeVisible()
    }
    await expect(page.locator('.customer-activity-table thead')).toContainText('Period Due Date')
    await expect(page.locator('.customer-financing-activity')).not.toContainText('Dynamic Period Due Date')
  })

  test('Invoice Financing settlement remains Buyer-funded', async ({ page }) => {
    await page.goto('/experience/invoice-financing/home')
    await openHomePeriod(page, 'DP-2026-09-15-TWIGA')
    const periodDialog = page.locator('.customer-period-modal').first()
    await expect(periodDialog).toContainText('Buyer payment')
    await periodDialog.getByRole('button', { name: 'View settlement details' }).click()
    const settlementDialog = page.locator('.customer-repayment-modal')
    await expect(settlementDialog).toContainText('Client Clearing Account')
    await expect(settlementDialog).not.toContainText('ABSA Bank Kenya PLC')
    await expect(settlementDialog).not.toContainText('M-Pesa Paybill')
  })

  test('INFX retains one-invoice direct repayment', async ({ page }) => {
    await page.goto('/experience/infx/financing')
    await openRelationship(page, 'Kisumu Buyers Co-op')
    await page.locator('.relationship-modal .relationship-period-row')
      .filter({ hasText: 'FR-2026-0028' })
      .locator('.relationship-period-row__main')
      .click()
    const periodDialog = page.locator('.customer-period-modal').first()
    await expect(periodDialog).toContainText('INV-2026-0028')
    await periodDialog.getByRole('button', { name: 'View repayment details' }).click()
    await expect(page.locator('.customer-repayment-modal')).toContainText('ABSA Bank Kenya PLC')
  })
})

test.describe('Partner Buyer boundary', () => {
  test.beforeEach(async ({ page }) => signIn(page))

  test('Partner Buyer remains a distinct non-borrower workspace', async ({ page }) => {
    await page.goto('/experience/invoice-partner/home')
    await expect(page.getByRole('heading', { name: 'Invoice Financing - Partner Buyer', level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: /upload invoices/i })).toBeVisible()
    await expect(page.locator('.customer-product-summary')).toHaveCount(0)
  })
})

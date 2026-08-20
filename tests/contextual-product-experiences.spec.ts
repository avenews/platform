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
  await row.getByRole('button', { name: 'View', exact: true }).click()
  await expect(page.locator('.relationship-modal')).toBeVisible()
}

async function assertRelationshipListCount(page: Page, testInfo: TestInfo, count: number): Promise<void> {
  if (isMobile(testInfo)) {
    await expect(page.locator('.relationship-cards .relationship-card')).toHaveCount(count)
  } else {
    await expect(page.locator('.relationship-table tbody tr')).toHaveCount(count)
  }
}

async function partnerAction(page: Page, name: string): Promise<Locator> {
  const table = page.locator('.baseline-table-wrap').first()
  if (await table.isVisible()) {
    return table.getByRole('button', { name, exact: true }).first()
  }
  return page.locator('.partner-workspace-cards').getByRole('button', { name, exact: true }).first()
}

async function assertModalBodyScrollable(dialog: Locator): Promise<void> {
  const body = dialog.locator('.customer-period-modal__body, .relationship-modal__body, .partner-modal__body').first()
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
  test('multiple destinations open the chooser with primary View actions', async ({ page }) => {
    await completePrototypeLogin(page, 'multiple')
    await expect(page).toHaveURL(/\/access$/)
    await expect(page.locator('.access-card')).toHaveCount(6)
    for (const destination of CUSTOMER_DESTINATIONS) {
      await expect(page.locator(`[data-experience-id="${destination.id}"]`)).toContainText(destination.label)
    }
    await expect(page.locator('[data-experience-id="invoice-partner"]')).toContainText('Partner Buyer Portal')
    await expect(page.locator('.access-card__action')).toHaveText(['View', 'View', 'View', 'View', 'View', 'View'])
    await expect(page.locator('.prototype-explainer')).toHaveCount(0)
  })

  test('single ABF access routes straight to ABF Home', async ({ page }) => {
    await completePrototypeLogin(page, 'abf-only')
    await expect(page).toHaveURL(/\/experience\/abf\/home$/)
    await expect(page.getByRole('heading', { name: 'Agri Buyer Financing', level: 1 })).toBeVisible()
  })

  test('single Partner Buyer access routes straight to its workspace', async ({ page }) => {
    await completePrototypeLogin(page, 'partner-only')
    await expect(page).toHaveURL(/\/experience\/invoice-partner\/home$/)
    await expect(page.getByRole('heading', { name: 'Partner Buyer Portal', level: 1 })).toBeVisible()
  })
})

test.describe('shared customer financing pattern', () => {
  test.beforeEach(async ({ page }) => signIn(page))

  for (const destination of CUSTOMER_DESTINATIONS) {
    test(`${destination.id} uses the concise Financing surface and all six customer statuses`, async ({ page }, testInfo) => {
      await page.goto(`/experience/${destination.id}/home`)
      await expect(page.getByRole('heading', { name: destination.label, level: 1 })).toBeVisible()
      const expectedPrimary = destination.id === 'invoice-financing' ? 'Upload invoices' : 'Request funds'
      await expect(page.locator('.contextual-home__hero').getByRole('button', { name: expectedPrimary })).toBeVisible()
      await expect(page.locator('.customer-product-summary .contextual-metric')).toHaveCount(3)
      await expect(page.getByRole('heading', { name: 'Financing', level: 2, exact: true })).toBeVisible()
      await expect(page.locator('.prototype-explainer')).toHaveCount(0)
      await expect(await visibleStatusBadges(page)).toHaveText(CUSTOMER_STATUSES)
      await assertNoOverflow(page)
      await page.screenshot({ path: testInfo.outputPath(`${destination.id}-financing.png`), fullPage: true })
    })
  }

  test('Reference is the primary financing identifier', async ({ page }) => {
    await page.goto('/experience/acl/home')
    const aclCell = page.locator('.customer-activity-table tbody .baseline-financing-cell').first()
    await expect(aclCell).toHaveText('FR-2026-0612')

    const expectations = [
      { id: 'abf', relationship: 'Eastleigh Traders Co.', reference: 'FR-2026-0819' },
      { id: 'stf', relationship: 'GreenHarvest Distributors', reference: 'FR-2026-0820' },
      { id: 'invoice-financing', relationship: 'Twiga Foods Ltd', reference: 'DP-2026-10-15-TWIGA' },
      { id: 'infx', relationship: 'Mombasa Buyers Network', reference: 'FR-2026-0818' },
    ]

    for (const expected of expectations) {
      await page.goto(`/experience/${expected.id}/home`)
      const cell = page.locator('.customer-activity-table tbody .baseline-financing-cell').first()
      await expect(cell.locator('strong')).toHaveText(expected.reference)
      await expect(cell).toContainText(expected.relationship)
      await expect(page.locator('.customer-activity-table thead').getByText('Reference', { exact: true })).toBeVisible()
    }
  })

  test('filters are compact, explicit, searchable across visible values, and clearable', async ({ page }, testInfo) => {
    await page.goto('/experience/acl/home')
    const search = page.getByRole('searchbox', { name: 'Search all values in Agri Credit Line financing' })
    await expect(search).toHaveAttribute('placeholder', 'Search')
    await search.fill('Ksh 1,400,000')
    await expect(page.locator('.customer-activity-row')).toHaveCount(1)
    await expect(page.locator('.customer-activity-cards .baseline-record-card')).toHaveCount(1)
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
      expect(width).toBeLessThanOrEqual(222)
      const clear = page.locator('.customer-filter-bar__desktop').getByRole('button', { name: 'Clear filters' })
      await expect(clear).toHaveCSS('background-color', 'rgb(26, 46, 68)')
      await clear.click()
    }

    await expect(search).toHaveValue('')
    if (!isMobile(testInfo)) {
      await expect(page.getByRole('combobox', { name: 'Status' })).toHaveValue('')
    }
  })

  test('product switcher uses compact product-only rows', async ({ page }, testInfo) => {
    await page.goto('/experience/acl/home')
    const trigger = isMobile(testInfo)
      ? page.locator('.experience-mobile-context')
      : page.locator('.experience-context-trigger')
    await trigger.click()
    const firstProduct = page.locator('.experience-context-menu__product').first()
    await expect(firstProduct).toBeVisible()
    await expect(firstProduct).toHaveCSS('display', 'flex')
    await expect(firstProduct).toHaveCSS('min-height', '48px')
    await expect(page.locator('.experience-context-menu')).not.toContainText('Kioko Agri Supplies Ltd')
    await expect(page.locator('.experience-context-menu')).not.toContainText('Twiga Foods Ltd')
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
    await expect(periodDialog).not.toContainText('Client repayment')
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
    test(`${relationshipPage.id} uses one concise relationship heading`, async ({ page }, testInfo) => {
      await page.goto(`/experience/${relationshipPage.id}/financing`)
      await expect(page.getByRole('heading', { name: relationshipPage.heading, level: 1 })).toHaveCount(1)
      await expect(page.locator('.contextual-financing__hero > div > p:not(.page-eyebrow)')).toHaveCount(1)
      await expect(page.locator('.prototype-explainer')).toHaveCount(0)
      await assertRelationshipListCount(page, testInfo, relationshipPage.count)
      await assertNoOverflow(page)
    })
  }

  test('ABF shows available and max-used Supplier states with matching actions', async ({ page }) => {
    await page.goto('/experience/abf/financing')
    const maxed = await relationshipRow(page, 'Quick Mart Stores')
    await expect(maxed).toContainText('Unavailable')
    await expect(maxed).toContainText('Ksh 900,000')
    await expect(maxed).toContainText('Ksh 0')
    await expect(maxed.getByRole('button', { name: 'Request funds' })).toBeDisabled()

    const available = await relationshipRow(page, 'Naivas Fresh Produce')
    await expect(available).toContainText('Available')
    const request = available.getByRole('button', { name: 'Request funds' })
    await expect(request).toBeEnabled()
    await expect(request).toHaveAttribute('data-external-url', ABF_DEMO_URL)
  })

  test('ABF details use customer-facing Supplier copy and omit the single invoice reference', async ({ page }) => {
    await page.goto('/experience/abf/financing')
    await openRelationship(page, 'Eastleigh Traders Co.')
    const dialog = page.locator('.relationship-modal')
    await expect(dialog.getByText('Supplier', { exact: true })).toBeVisible()
    await dialog.locator('.relationship-period-row').filter({ hasText: 'FR-2026-0819' }).locator('.relationship-period-row__main').click()
    const periodDialog = page.locator('.customer-period-modal').first()
    await expect(periodDialog).not.toContainText('INV-ET-3301')
    await expect(periodDialog).not.toContainText('Supplier-scoped Funds Request submitted and awaiting approval.')
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
    await expect(periodDialog).not.toContainText('Client repayment')
    await periodDialog.getByRole('button', { name: 'View repayment details' }).click()
    await expect(page.locator('.customer-repayment-modal')).toContainText('ABSA Bank Kenya PLC')
  })

  test('Invoice Financing makes invoice ownership explicit through available actions and Buyer details', async ({ page }, testInfo) => {
    await page.goto('/experience/invoice-financing/financing')
    const twiga = await relationshipRow(page, 'Twiga Foods Ltd')
    const fresh = await relationshipRow(page, 'FreshProduce Kenya Ltd')

    await expect(twiga.getByRole('button', { name: 'Upload invoices' })).toHaveCount(0)
    await expect(fresh.getByRole('button', { name: 'Upload invoices' })).toBeVisible()

    await openRelationship(page, 'Twiga Foods Ltd')
    await expect(page.locator('.relationship-modal')).toContainText('Buyer uploads invoices')
    await page.locator('.relationship-modal').getByRole('button', { name: 'Close' }).click()

    await fresh.getByRole('button', { name: 'Upload invoices' }).click()
    const upload = page.locator('.invoice-upload-modal')
    await expect(upload).toBeVisible()
    await expect(upload).toContainText('FreshProduce Kenya Ltd')
    await upload.locator('input[type="date"]').fill('2026-09-30')
    await upload.locator('input[type="number"]').fill('500000')
    await upload.getByRole('button', { name: 'Submit invoice' }).click()
    await expect(page.locator('.baseline-toast')).toContainText('matching Dynamic Period')
    await assertNoOverflow(page)
    if (!isMobile(testInfo)) await expect(page.locator('.relationship-table thead')).not.toContainText('Invoices')
  })

  test('Invoice Financing keeps the table focused and makes Request funds primary', async ({ page }) => {
    await page.goto('/experience/invoice-financing/home')
    const tableHead = page.locator('.customer-activity-table thead')
    await expect(tableHead).toContainText('Reference')
    await expect(tableHead).toContainText('Period Due Date')
    await expect(tableHead).toContainText('Available to Withdraw')
    await expect(tableHead).not.toContainText('Disbursement Date')
    await expect(tableHead).not.toContainText('Buyer Payments Allocated')

    const requested = page.locator('.customer-activity-row').filter({ hasText: 'DP-2026-10-15-TWIGA' })
    if (await requested.isVisible()) {
      await expect(requested).toContainText('Ksh 320,000')
      await expect(requested).toContainText('Available to request')
      const action = requested.getByRole('button', { name: 'Request funds' })
      await expect(action).toBeVisible()
      await expect(action).toHaveClass(/baseline-button--primary/)
    } else {
      const card = page.locator('.customer-activity-cards .baseline-record-card').filter({ hasText: 'DP-2026-10-15-TWIGA' })
      await expect(card).toContainText('Ksh 320,000')
      await expect(card.getByRole('button', { name: 'Request funds' })).toHaveClass(/baseline-button--primary/)
    }
  })

  test('Invoice Financing detail keeps disbursement and Request funds in the modal', async ({ page }) => {
    await page.goto('/experience/invoice-financing/home')
    await openHomePeriod(page, 'DP-2026-09-15-TWIGA')
    const periodDialog = page.locator('.customer-period-modal').first()
    await expect(periodDialog).toContainText('Disbursement Date')
    await expect(periodDialog).toContainText('17 Aug 26')
    await expect(periodDialog.getByRole('button', { name: 'Request funds' })).toHaveClass(/baseline-button--primary/)
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

  test('INFX retains one-invoice direct repayment and unavailable max-used Buyer state', async ({ page }) => {
    await page.goto('/experience/infx/financing')
    const row = await relationshipRow(page, 'Kisumu Buyers Co-op')
    await expect(row).toContainText('Unavailable')
    await expect(row.getByRole('button', { name: 'Request funds' })).toBeDisabled()

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

test.describe('Partner Buyer Portal', () => {
  test.beforeEach(async ({ page }) => signIn(page))

  test('uses the same concise framework around Partner Buyer priorities', async ({ page }, testInfo) => {
    await page.goto('/experience/invoice-partner/home')
    await expect(page.getByRole('heading', { name: 'Partner Buyer Portal', level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: /upload invoices/i })).toBeVisible()
    await expect(page.locator('.contextual-metrics .contextual-metric')).toHaveCount(3)
    await expect(page.locator('.contextual-metrics')).toContainText('Invoices Uploaded')
    await expect(page.locator('.contextual-metrics')).toContainText('Payments Due')
    await expect(page.locator('.contextual-metrics')).toContainText('Supplier Financing Available')
    await expect(page.locator('.customer-product-summary')).toHaveCount(0)
    await expect(page.locator('.prototype-explainer')).toHaveCount(0)

    const navigation = isMobile(testInfo)
      ? page.locator('.experience-bottom-nav')
      : page.locator('.experience-sidebar-nav')
    await expect(navigation.locator('a')).toHaveText(['Home', 'Invoice Uploads', 'Payments', 'Suppliers', 'Manage Users'])
    await assertNoOverflow(page)
  })

  test('invoice upload actions use modals and remove Funds Request boundary copy', async ({ page }) => {
    await page.goto('/experience/invoice-partner/invoice-uploads')
    await expect(page.locator('.partner-workspace-page')).not.toContainText('No Funds Request action exists in this workspace.')
    await expect(page.locator('.partner-workspace-page')).not.toContainText('After eligible invoices form a Dynamic Period')

    await page.getByRole('button', { name: 'Upload invoices' }).click()
    const uploadDialog = page.locator('.partner-modal')
    await expect(uploadDialog).toBeVisible()
    await expect(uploadDialog.getByRole('heading', { name: 'Upload invoices' })).toBeVisible()
    await assertModalBodyScrollable(uploadDialog)
    await uploadDialog.getByRole('button', { name: 'Close' }).click()

    const firstView = await partnerAction(page, 'View')
    await firstView.click()
    const resultDialog = page.locator('.partner-modal')
    await expect(resultDialog).toContainText('Upload result')
    await expect(resultDialog).toContainText('Imported')
    await expect(resultDialog).toContainText('Failed')
  })

  test('payment actions open Partner Buyer payment details', async ({ page }) => {
    await page.goto('/experience/invoice-partner/obligations')
    await expect(page.getByRole('heading', { name: 'Payments', level: 1 })).toBeVisible()
    const action = await partnerAction(page, 'View payment')
    await expect(action).toHaveClass(/baseline-button--primary/)
    await action.click()
    const dialog = page.locator('.partner-modal')
    await expect(dialog).toContainText('Amount to pay')
    await expect(dialog).toContainText('Client Clearing Account (Managed by Avenews)')
    await assertModalBodyScrollable(dialog)
  })

  test('Supplier limits show available, unavailable and max-used states with modal actions', async ({ page }) => {
    await page.goto('/experience/invoice-partner/suppliers')
    await expect(page.getByRole('heading', { name: 'Suppliers', level: 1 })).toBeVisible()
    await expect(page.locator('.partner-workspace-page')).toContainText('Available')
    await expect(page.locator('.partner-workspace-page')).toContainText('Unavailable')
    await expect(page.locator('.partner-workspace-page')).toContainText('Max financing used')

    const manage = await partnerAction(page, 'Manage limit')
    await expect(manage).toHaveClass(/baseline-button--primary/)
    await manage.click()
    const manageDialog = page.locator('.partner-modal')
    await expect(manageDialog).toContainText('Max Financing')
    await expect(manageDialog.getByRole('button', { name: 'Save limit' })).toHaveClass(/baseline-button--primary/)
    await manageDialog.getByRole('button', { name: 'Close' }).click()

    await page.getByRole('button', { name: 'Invite Supplier' }).click()
    const inviteDialog = page.locator('.partner-modal')
    await expect(inviteDialog.getByRole('heading', { name: 'Invite Supplier' })).toBeVisible()
    await expect(inviteDialog.getByRole('button', { name: 'Send invitation' })).toHaveClass(/baseline-button--primary/)
  })
})

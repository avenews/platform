import { expect, test, type Page, type TestInfo } from '@playwright/test'

const SESSION_KEY = 'av_customer_portal_session'
const SCENARIO_KEY = 'av_experience_scenario'
const ACL_DEMO_URL = 'https://financing.avenews-gt.com/ishai/form/ACLDemoV2/formperma/yJ6BX6SANxu6zsGmFihcRuuAwT2dI9SbK4UGYlNIFog'
const ABF_DEMO_URL = 'https://financing.avenews-gt.com/ishai/form/ABFDemo1/formperma/88hpcsGdZAsMIA0-EbgWUOc6jIqIr5VRd1htmpKqIRA'

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
  await page.locator('.customer-activity-cards .baseline-record-card').filter({ hasText: reference }).getByRole('button').click()
}

async function openRelationship(page: Page, name: string): Promise<void> {
  const table = page.locator('.relationship-table-wrap')
  if (await table.isVisible()) {
    await page.locator('.relationship-table tbody tr').filter({ hasText: name }).getByRole('button', { name: 'View details' }).click()
  } else {
    await page.locator('.relationship-cards .relationship-card').filter({ hasText: name }).getByRole('button', { name: 'View details' }).click()
  }
  await expect(page.locator('.relationship-modal')).toBeVisible()
}

async function assertRelationshipListCount(page: Page, testInfo: TestInfo, count: number): Promise<void> {
  if (isMobile(testInfo)) {
    await expect(page.locator('.relationship-cards .relationship-card')).toHaveCount(count)
  } else {
    await expect(page.locator('.relationship-table tbody tr')).toHaveCount(count)
  }
}

async function assertModalBodyScrollable(dialog: ReturnType<Page['locator']>): Promise<void> {
  const body = dialog.locator('.customer-period-modal__body, .relationship-modal__body').first()
  await expect(body).toBeVisible()
  await expect(body).toHaveCSS('overflow-y', 'auto')
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

test.describe('consistent customer Home pattern', () => {
  test.beforeEach(async ({ page }) => signIn(page))

  for (const destination of CUSTOMER_DESTINATIONS) {
    test(`${destination.id} uses Request funds, summary cards and Financing Activity`, async ({ page }, testInfo) => {
      await page.goto(`/experience/${destination.id}/home`)
      await expect(page.getByRole('heading', { name: destination.label, level: 1 })).toBeVisible()
      await expect(page.locator('.contextual-home__hero').getByRole('button', { name: 'Request funds' })).toBeVisible()
      await expect(page.locator('.customer-product-summary .contextual-metric')).toHaveCount(3)
      await expect(page.getByRole('heading', { name: 'Financing Activity', level: 2 })).toBeVisible()
      await expect(page.locator('.customer-activity-table')).toBeAttached()
      await assertNoOverflow(page)
      await page.screenshot({ path: testInfo.outputPath(`${destination.id}-consistent-home.png`), fullPage: true })
    })
  }

  test('primary navigation keeps relationship labels distinct from Manage Users', async ({ page }, testInfo) => {
    const expectations = [
      { id: 'acl', items: ['Home', 'Request Funds', 'Manage Users'] },
      { id: 'abf', items: ['Home', 'Suppliers', 'Manage Users'] },
      { id: 'stf', items: ['Home', 'Partner Suppliers', 'Manage Users'] },
      { id: 'invoice-financing', items: ['Home', 'Buyers', 'Manage Users'] },
      { id: 'infx', items: ['Home', 'Buyers', 'Manage Users'] },
    ]

    for (const expectation of expectations) {
      await page.goto(`/experience/${expectation.id}/home`)
      const navigation = isMobile(testInfo)
        ? page.locator('.experience-bottom-nav')
        : page.locator('.experience-sidebar-nav')
      await expect(navigation.locator('a')).toHaveText(expectation.items)
    }
  })
})

test.describe('Agri Credit Line customer-visible statuses', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
    await page.goto('/experience/acl/home')
  })

  test('only Requested, Live, Overdue, Repaid, Cancelled and Declined are shown', async ({ page }) => {
    const expected = ['Requested', 'Live', 'Overdue', 'Repaid', 'Cancelled', 'Declined']
    const table = page.locator('.customer-activity-table')
    const statuses = await table.isVisible()
      ? table.locator('tbody .baseline-status')
      : page.locator('.customer-activity-cards .baseline-status')
    await expect(statuses).toHaveText(expected)
    await expect(page.locator('.customer-financing-activity')).not.toContainText('Delinquent')
    await expect(page.locator('.customer-financing-activity')).not.toContainText('In Default')
    await expect(page.locator('.customer-financing-activity')).not.toContainText('Repayment Plan')
    await expect(page.locator('.customer-financing-activity')).not.toContainText('Collections')
  })

  test('Payments Due remains concise, outlined, and filters the affected periods', async ({ page }, testInfo) => {
    const card = page.locator('.customer-payments-due')
    await expect(card).toContainText('2 payments due')
    await expect(card).toContainText('1 overdue · 1 upcoming')
    const action = card.getByRole('button', { name: 'View payments due in Financing activity' })
    await expect(action).toHaveClass(/baseline-button--secondary/)
    await action.click()

    if (isMobile(testInfo)) {
      await page.getByRole('button', { name: 'Filters' }).click()
      await expect(page.getByRole('combobox', { name: 'Due date' })).toHaveValue('payments-due')
    } else {
      await expect(page.getByRole('combobox', { name: 'Due date' }).first()).toHaveValue('payments-due')
    }

    const table = page.locator('.customer-activity-table')
    if (await table.isVisible()) {
      await expect(table.locator('.customer-activity-row')).toHaveCount(2)
    } else {
      await expect(page.locator('.customer-activity-cards .baseline-record-card')).toHaveCount(2)
    }
  })

  test('Live financing keeps Instalments and period-specific repayment scrollable', async ({ page }, testInfo) => {
    await openHomePeriod(page, 'FR-2026-0318')
    const periodDialog = page.locator('.customer-period-modal').first()
    await expect(periodDialog).toContainText('Instalment 1 of 2')
    await expect(periodDialog).toContainText('Instalment 2 of 2')
    await assertModalBodyScrollable(periodDialog)

    await periodDialog.getByRole('button', { name: 'View repayment details' }).click()
    const repaymentDialog = page.locator('.customer-repayment-modal')
    await expect(repaymentDialog).toContainText('FR-2026-0318')
    await expect(repaymentDialog).toContainText('ABSA Bank Kenya PLC')
    await assertModalBodyScrollable(repaymentDialog)
    await assertNoOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('acl-scrollable-repayment.png'), fullPage: true })
  })

  test('ACL Request funds keeps the permanent direct demo URL', async ({ page }) => {
    const requestFunds = page.locator('.contextual-home__hero').getByRole('button', { name: 'Request funds' })
    await expect(requestFunds).toHaveAttribute('data-external-url', ACL_DEMO_URL)
  })
})

test.describe('relationship-first request flows', () => {
  test.beforeEach(async ({ page }) => signIn(page))

  test('ABF Request funds leads to one Approved Suppliers heading and a relationship table', async ({ page }, testInfo) => {
    await page.goto('/experience/abf/home')
    await page.locator('.contextual-home__hero').getByRole('button', { name: 'Request funds' }).click()
    await expect(page).toHaveURL(/\/experience\/abf\/financing$/)
    await expect(page.getByRole('heading', { name: 'Approved Suppliers' })).toHaveCount(1)
    await assertRelationshipListCount(page, testInfo, 3)
    await assertNoOverflow(page)
  })

  test('ABF Supplier details keep the supplied Supplier-scoped Funds Request URL', async ({ page }) => {
    await page.goto('/experience/abf/financing')
    await openRelationship(page, 'Quick Mart Stores')
    const dialog = page.locator('.relationship-modal')
    await expect(dialog).toContainText('Supplier sub-limit')
    await expect(dialog).toContainText('FR-2026-0422')
    const request = dialog.getByRole('button', { name: 'Request funds for Quick Mart Stores' })
    await expect(request).toHaveAttribute('data-external-url', ABF_DEMO_URL)
    await assertModalBodyScrollable(dialog)

    await page.evaluate(() => {
      window.open = ((url?: string | URL) => {
        document.body.dataset['openedAbfUrl'] = String(url ?? '')
        return null
      }) as typeof window.open
    })
    await request.click()
    await expect(page.locator('body')).toHaveAttribute('data-opened-abf-url', ABF_DEMO_URL)
  })

  test('Stockist Request funds leads to Partner Suppliers and retains period repayment', async ({ page }, testInfo) => {
    await page.goto('/experience/stf/home')
    await page.locator('.contextual-home__hero').getByRole('button', { name: 'Request funds' }).click()
    await expect(page).toHaveURL(/\/experience\/stf\/financing$/)
    await expect(page.getByRole('heading', { name: 'Partner Suppliers' })).toHaveCount(1)
    await assertRelationshipListCount(page, testInfo, 3)

    await openRelationship(page, 'GreenHarvest Distributors')
    const relationshipDialog = page.locator('.relationship-modal')
    await expect(relationshipDialog).toContainText('Partner Supplier sub-limit')
    await relationshipDialog.locator('.relationship-period-row').filter({ hasText: 'FR-2026-0501' }).getByRole('button').first().click()

    const periodDialog = page.locator('.customer-period-modal').first()
    await expect(periodDialog).toContainText('Instalment 1 of 2')
    await expect(periodDialog).toContainText('Instalment 2 of 2')
    await periodDialog.getByRole('button', { name: 'View repayment details' }).click()
    await expect(page.locator('.customer-repayment-modal')).toContainText('ABSA Bank Kenya PLC')
  })

  test('Invoice Financing Request funds leads to Buyers and Buyer-funded settlement', async ({ page }, testInfo) => {
    await page.goto('/experience/invoice-financing/home')
    await page.locator('.contextual-home__hero').getByRole('button', { name: 'Request funds' }).click()
    await expect(page).toHaveURL(/\/experience\/invoice-financing\/financing$/)
    await expect(page.getByRole('heading', { name: 'Buyer Relationships' })).toHaveCount(1)
    await assertRelationshipListCount(page, testInfo, 2)

    await openRelationship(page, 'Twiga Foods Ltd')
    const relationshipDialog = page.locator('.relationship-modal')
    await expect(relationshipDialog).toContainText('Twiga Foods Ltd normally uploads the invoices')
    await expect(relationshipDialog.locator('.relationship-period-row')).toHaveCount(2)
    await expect(relationshipDialog.getByRole('button', { name: 'Request funds' })).toBeVisible()

    await relationshipDialog.locator('.relationship-period-row').filter({ hasText: 'DP-2026-09-15-TWIGA' }).getByRole('button').first().click()
    const periodDialog = page.locator('.customer-period-modal').first()
    await expect(periodDialog).toContainText('Buyer payment')
    await periodDialog.getByRole('button', { name: 'View settlement details' }).click()
    const settlementDialog = page.locator('.customer-repayment-modal')
    await expect(settlementDialog).toContainText('Client Clearing Account')
    await expect(settlementDialog).not.toContainText('ABSA Bank Kenya PLC')
    await expect(settlementDialog).not.toContainText('M-Pesa Paybill')
  })

  test('INFX Request funds leads to Buyers and one-invoice direct repayment', async ({ page }, testInfo) => {
    await page.goto('/experience/infx/home')
    await page.locator('.contextual-home__hero').getByRole('button', { name: 'Request funds' }).click()
    await expect(page).toHaveURL(/\/experience\/infx\/financing$/)
    await expect(page.getByRole('heading', { name: 'Approved Buyers' })).toHaveCount(1)
    await assertRelationshipListCount(page, testInfo, 3)

    await openRelationship(page, 'Kisumu Buyers Co-op')
    await page.locator('.relationship-modal .relationship-period-row').filter({ hasText: 'FR-2026-0028' }).getByRole('button').first().click()
    const periodDialog = page.locator('.customer-period-modal').first()
    await expect(periodDialog).toContainText('INV-2026-0028')
    await expect(periodDialog).toContainText('60 days')
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

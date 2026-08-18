import { expect, test, type Page, type TestInfo } from '@playwright/test'

const SESSION_KEY = 'av_customer_portal_session'
const SCENARIO_KEY = 'av_experience_scenario'
const CONTEXT_KEY = 'av_experience_context'
const SESSION = {
  contactId: 'usr_001',
  contactFirstName: 'Amara',
  contactLastName: 'Osei',
  contactEmail: 'amara.osei@kiokoagri.co.ke',
  businessId: 'biz_demo_001',
  businessName: 'Kioko Agri Supplies Ltd',
  role: 'admin',
}

const DESTINATIONS = [
  { id: 'acl', label: 'Agri Credit Line' },
  { id: 'abf', label: 'Agri Buyer Financing' },
  { id: 'stf', label: 'Stockist Financing' },
  { id: 'invoice-financing', label: 'Invoice Financing' },
  { id: 'infx', label: 'Invoice Financing Express' },
  { id: 'invoice-partner', label: 'Invoice Financing - Partner Buyer' },
] as const

const WELCOME_MESSAGES = [
  'Welcome back',
  'Good to see you again',
  'Ready when you are',
  'Welcome to Avenews',
  "Let's get started",
] as const

const LEGACY_TERMS = [
  /\bASF\b/,
  /\bASFO\b/,
  /\bASFX\b/,
  /\bSF\b/,
  /\bOfftaker\b/i,
  /\bAnchor Buyer\b/i,
  /\bBuyer Partner\b/i,
  /\bNon-Partner Buyer\b/i,
  /\bSupplier Client\b/i,
  /\bBuyer Client\b/i,
  /\bSupplier Financing\b/i,
  /\bSFX\b/,
]

const EXPLAINER = '[data-explainer-tone]'

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

async function customerFacingText(page: Page): Promise<string> {
  return page.locator('body').evaluate((body) => {
    const clone = body.cloneNode(true) as HTMLElement
    clone
      .querySelectorAll(
        'app-prototype-explainer, .developer-tools, .experience-developer-tools, .access-developer',
      )
      .forEach(node => node.remove())
    return clone.innerText
  })
}

async function assertNoLegacyTerminology(page: Page): Promise<void> {
  const text = await customerFacingText(page)
  for (const pattern of LEGACY_TERMS) expect(text).not.toMatch(pattern)
}

async function assertExplainer(page: Page, title: string, tone?: string): Promise<void> {
  const explainer = page.locator(`[data-explainer-title="${title}"]`)
  await expect(explainer).toBeVisible()
  if (tone) await expect(explainer).toHaveAttribute('data-explainer-tone', tone)
}

async function assertCenteredOrBottomSheet(
  dialog: ReturnType<Page['locator']>,
  page: Page,
  testInfo: TestInfo,
): Promise<void> {
  const box = await dialog.boundingBox()
  const viewport = page.viewportSize()
  expect(box).not.toBeNull()
  expect(viewport).not.toBeNull()
  if (!box || !viewport) return

  if (isMobile(testInfo)) {
    expect(Math.abs(box.y + box.height - viewport.height)).toBeLessThanOrEqual(2)
    return
  }

  const centerX = box.x + box.width / 2
  const centerY = box.y + box.height / 2
  expect(Math.abs(centerX - viewport.width / 2)).toBeLessThanOrEqual(3)
  expect(Math.abs(centerY - viewport.height / 2)).toBeLessThanOrEqual(12)
}

test.describe('post-OTP access resolution', () => {
  test('multiple destinations open the product selector', async ({ page }, testInfo) => {
    await completePrototypeLogin(page, 'multiple')

    await expect(page).toHaveURL(/\/access$/)
    await expect(page.getByText('Avenews portal', { exact: true })).toBeVisible()
    await expect(page.locator('.access-hero h1')).toHaveText(new RegExp(WELCOME_MESSAGES.join('|')))
    await expect(
      page.getByRole('heading', { name: 'What would you like to manage?', level: 2 }),
    ).toBeVisible()
    await expect(page.locator('.access-card')).toHaveCount(6)
    await expect(page.getByRole('heading', { name: 'Your available products', level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Partner workspace', level: 2 })).toBeVisible()
    await expect(page.getByText(/Signed in as/i)).toHaveCount(0)
    await expect(page.locator('.access-card__role')).toHaveCount(0)

    for (const destination of DESTINATIONS) {
      await expect(page.locator(`[data-experience-id="${destination.id}"]`)).toContainText(
        destination.label,
      )
    }

    await assertExplainer(page, 'Product selection appears only when there is a choice', 'purpose')
    await assertExplainer(page, 'The portal asks again on every new login', 'decision')
    await assertNoLegacyTerminology(page)
    await assertNoOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('product-selector.png'), fullPage: true })
  })

  test('one customer product opens directly after verification', async ({ page }, testInfo) => {
    await completePrototypeLogin(page, 'abf-only')

    await expect(page).toHaveURL(/\/experience\/abf\/home$/)
    await expect(page.getByRole('heading', { name: 'Agri Buyer Financing', level: 1 })).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'What would you like to manage?', level: 2 }),
    ).toHaveCount(0)
    await assertNoOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('single-product-direct.png'), fullPage: true })
  })

  test('one Partner workspace opens directly after verification', async ({ page }, testInfo) => {
    await completePrototypeLogin(page, 'partner-only')

    await expect(page).toHaveURL(/\/experience\/invoice-partner\/home$/)
    await expect(
      page.getByRole('heading', { name: 'Invoice Financing - Partner Buyer', level: 1 }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Upload invoices' })).toBeVisible()
    await expect(page.locator('button[data-action="funds-request"]')).toHaveCount(0)
    await assertNoOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('single-partner-direct.png'), fullPage: true })
  })
})

test.describe('contextual shell', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
  })

  for (const destination of DESTINATIONS) {
    test(`${destination.id} has a product-specific Home`, async ({ page }, testInfo) => {
      await page.goto(`/experience/${destination.id}/home`)

      await expect(page.getByRole('heading', { name: destination.label, level: 1 })).toBeVisible()
      await expect(page.locator('.contextual-metric')).toHaveCount(3)
      await expect(page.locator('.experience-context-copy')).toContainText(destination.label)
      await expect(page.locator('.experience-context-copy')).not.toContainText('Client Buyer')
      await expect(page.locator('.experience-context-copy')).not.toContainText('Client Supplier')
      await assertExplainer(page, 'You are viewing one product or Partner role at a time', 'decision')
      await assertNoLegacyTerminology(page)
      await assertNoOverflow(page)
      await page.screenshot({ path: testInfo.outputPath(`${destination.id}-home.png`), fullPage: true })
    })
  }

  test('primary navigation keeps frequent tasks and profile menu keeps secondary actions', async ({ page }, testInfo) => {
    const mobile = isMobile(testInfo)

    await page.goto('/experience/acl/home')
    const expectedAcl = ['Home', 'Manage Users']
    if (mobile) {
      await expect(page.locator('.experience-bottom-nav a')).toHaveText(expectedAcl)
    } else {
      await expect(page.locator('.experience-sidebar-nav .experience-nav-link span')).toHaveText(
        expectedAcl,
      )
    }

    const profileTrigger = mobile
      ? page.locator('.experience-avatar-trigger')
      : page.locator('.experience-profile-button')
    await profileTrigger.click()

    const profileMenu = page.getByRole('menu', { name: 'Profile menu' })
    await expect(profileMenu.getByRole('menuitem')).toHaveText([
      'View Profile',
      'Support',
      'Switch product or access',
      'Log out',
    ])
    await expect(profileMenu.getByRole('menuitem', { name: 'Manage Users' })).toHaveCount(0)
    await assertNoOverflow(page)
  })

  test('context switching remains session-only', async ({ page }, testInfo) => {
    await page.goto('/experience/abf/home')

    const contextTrigger = isMobile(testInfo)
      ? page.locator('.experience-mobile-context')
      : page.locator('.experience-context-trigger')
    await contextTrigger.click()

    const menu = page.getByRole('menu', { name: 'Switch product or access' })
    await expect(menu).toBeVisible()
    await menu
      .locator('button')
      .filter({ hasText: 'Invoice Financing' })
      .filter({ hasText: 'Kioko Agri Supplies Ltd' })
      .first()
      .click()
    await expect(page).toHaveURL(/\/experience\/invoice-financing\/home$/)

    const profileTrigger = isMobile(testInfo)
      ? page.locator('.experience-avatar-trigger')
      : page.locator('.experience-profile-button')
    await profileTrigger.click()
    await page.getByRole('menuitem', { name: 'Log out' }).click()
    await expect(page).toHaveURL(/\/login$/)

    const stored = await page.evaluate(
      ({ scenarioKey, contextKey }) => ({
        scenario: sessionStorage.getItem(scenarioKey),
        context: sessionStorage.getItem(contextKey),
      }),
      { scenarioKey: SCENARIO_KEY, contextKey: CONTEXT_KEY },
    )
    expect(stored).toEqual({ scenario: null, context: null })
  })

  test('desktop Developer menu toggles explainers without changing route', async ({ page }, testInfo) => {
    test.skip(isMobile(testInfo), 'Developer controls are desktop only')

    await page.goto('/experience/acl/home')
    const originalUrl = page.url()
    await expect(page.locator(EXPLAINER).first()).toBeVisible()

    await page.locator('.experience-developer-tools__trigger').click()
    const menu = page.getByRole('menu', { name: 'Developer experience shortcuts' })
    await menu.getByRole('menuitem', { name: 'Explainers: On' }).click()
    await expect(page.locator(EXPLAINER)).toHaveCount(0)
    expect(page.url()).toBe(originalUrl)

    await menu.getByRole('menuitem', { name: 'Explainers: Off' }).click()
    await expect(page.locator(EXPLAINER).first()).toBeVisible()
    expect(page.url()).toBe(originalUrl)
  })
})

test.describe('Agri Credit Line repayment scope', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
    await page.goto('/experience/acl/home')
  })

  test('summary is informational and repayment starts from Financing activity', async ({ page }, testInfo) => {
    await expect(page.getByRole('heading', { name: 'Agri Credit Line', level: 1 })).toBeVisible()
    await expect(page.locator('.acl-next-installment')).toContainText('FR-2026-0318')
    await expect(
      page.locator('.acl-next-installment').getByRole('button', { name: /repayment details/i }),
    ).toHaveCount(0)
    await expect(page.locator('.acl-help-grid')).toHaveCount(0)
    await expect(
      page.getByRole('heading', { name: 'Submitting a Funds Request', level: 2 }),
    ).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Making a repayment', level: 2 })).toHaveCount(0)

    await assertExplainer(page, 'The next Instalment summary is informational only', 'purpose')
    await assertExplainer(page, 'Funds Requests are product-level; repayments are financing-record level', 'action')
    await assertExplainer(page, 'Repayment instructions are opened only from a financing record', 'decision')

    const toolbar = page.locator('.acl-activity-toolbar')
    const heading = toolbar.locator('.baseline-section-heading')
    const filters = toolbar.locator('app-customer-filter-bar')
    await expect(heading).toBeVisible()
    await expect(filters).toBeVisible()

    const headingBox = await heading.boundingBox()
    const filterBox = await filters.boundingBox()
    expect(headingBox).not.toBeNull()
    expect(filterBox).not.toBeNull()

    if (headingBox && filterBox) {
      if (testInfo.project.name === 'desktop') {
        expect(filterBox.x).toBeGreaterThan(headingBox.x + headingBox.width - 1)
        expect(Math.abs(filterBox.y - headingBox.y)).toBeLessThanOrEqual(12)
      } else {
        expect(filterBox.y).toBeGreaterThanOrEqual(headingBox.y + headingBox.height)
      }
    }

    await expect(
      page.getByRole('searchbox', { name: 'Search Agri Credit Line financing activity' }),
    ).toBeVisible()
    await expect(page.locator('.acl-pagination')).toContainText(
      'Showing 1-2 of 2 financing records',
    )
    await assertNoOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('acl-summary-and-activity.png'), fullPage: true })
  })

  test('record details and repayment instructions stay scoped to the selected financing record', async ({ page }, testInfo) => {
    if (isMobile(testInfo)) {
      await page.locator('.acl-activity-cards .acl-record-card-button').first().click()
    } else {
      await page.locator('.acl-activity-table .acl-activity-row').first().click()
    }

    const recordDialog = page.locator('.acl-record-modal')
    await expect(recordDialog).toBeVisible()
    await expect(recordDialog).toContainText('FR-2026-0318')
    await expect(recordDialog).toContainText('Instalments')
    await assertCenteredOrBottomSheet(recordDialog, page, testInfo)

    await recordDialog
      .getByRole('button', { name: /View repayment details for FR-2026-0318/i })
      .click()

    const repaymentDialog = page.locator('.acl-repayment-modal')
    await expect(repaymentDialog).toBeVisible()
    await expect(repaymentDialog).toContainText('FR-2026-0318')
    await expect(repaymentDialog).toContainText('Financing reference')
    await expect(repaymentDialog).toContainText('ABSA Bank Kenya PLC')
    await expect(repaymentDialog).toContainText('2046346095')
    await assertCenteredOrBottomSheet(repaymentDialog, page, testInfo)

    await repaymentDialog.getByRole('tab', { name: 'M-Pesa Paybill' }).click()
    await expect(repaymentDialog).toContainText('4567121')
    await expect(repaymentDialog).toContainText('Use your registered phone number')
    await repaymentDialog.getByRole('button', { name: 'Close' }).click()

    await page.getByRole('button', { name: 'Submit Funds Request' }).first().click()
    const fundsRequestDialog = page.getByRole('dialog', { name: 'Submit Funds Request' })
    await expect(fundsRequestDialog).toContainText('Financing amount')
    await expect(fundsRequestDialog).toContainText('Disbursement recipient')
    await fundsRequestDialog.getByRole('button', { name: 'Close' }).click()
  })

  test('search keeps the existing financing dataset', async ({ page }) => {
    const search = page.getByRole('searchbox', {
      name: 'Search Agri Credit Line financing activity',
    })
    await search.fill('FR-2026-0510')

    if (await page.locator('.acl-activity-table').isVisible()) {
      await expect(page.locator('.acl-activity-table .acl-activity-row')).toHaveCount(1)
      await expect(page.locator('.acl-activity-table')).toContainText('FR-2026-0510')
    } else {
      await expect(page.locator('.acl-activity-cards .baseline-record-card')).toHaveCount(1)
      await expect(page.locator('.acl-activity-cards')).toContainText('FR-2026-0510')
    }
  })
})

test.describe('Support and remaining product boundaries', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
  })

  test('Support Quick Help links to the official Help Centre', async ({ page }) => {
    await page.goto('/experience/acl/support')

    const helpCentre = page.getByRole('link', { name: 'Open Help Centre' })
    await expect(helpCentre).toBeVisible()
    await expect(helpCentre).toHaveAttribute(
      'href',
      'https://www.avenews-gt.com/help-categories/getting-started',
    )
    await expect(helpCentre).toHaveAttribute('target', '_blank')
    await expect(
      page.getByText(
        'Browse step-by-step guides for getting started, Funds Requests, financing products, and repayments.',
        { exact: true },
      ),
    ).toBeVisible()
    await assertNoOverflow(page)
  })

  test('Agri Buyer Financing begins with Fully Paid or Unpaid Invoice', async ({ page }) => {
    await page.goto('/experience/abf/financing')
    await page.getByRole('button', { name: 'Start Funds Request' }).first().click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('button', { name: /Fully Paid Invoice/ })).toBeVisible()
    await expect(dialog.getByRole('button', { name: /Unpaid Invoice/ })).toBeVisible()
  })

  test('Stockist Financing and Invoice Financing Express keep evidence inside the Funds Request', async ({ page }) => {
    for (const id of ['stf', 'infx']) {
      await page.goto(`/experience/${id}/financing`)
      await expect(page.locator('[data-upload-placement="inside-funds-request"]')).toBeVisible()
      await expect(page.locator('[data-action="upload-invoices"]')).toHaveCount(0)
    }
  })

  test('Invoice Financing scopes Funds Requests to Dynamic Periods', async ({ page }, testInfo) => {
    await page.goto('/experience/invoice-financing/financing')

    const openPeriod = isMobile(testInfo)
      ? page.locator('.contextual-period-cards [data-dynamic-period-id="twiga-2026-09-15"]')
      : page.locator('.contextual-period-table [data-dynamic-period-id="twiga-2026-09-15"]')
    await openPeriod.locator('[data-action-scope="dynamic-period"]').click()

    await expect(page).toHaveURL(
      /\/experience\/invoice-financing\/financing\/period\/twiga-2026-09-15$/,
    )
    await expect(page.getByText('Available to Withdraw', { exact: true }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Request funds' })).toBeEnabled()
    await assertNoOverflow(page)
  })

  test('Partner Buyer workspace uploads invoices and does not submit Funds Requests', async ({ page }) => {
    await page.goto('/experience/invoice-partner/invoice-uploads')

    await expect(page.getByRole('button', { name: 'Upload invoices' })).toBeVisible()
    await expect(page.locator('button[data-action="funds-request"]')).toHaveCount(0)
    await expect(page.locator('[data-funds-request-available="false"]')).toBeVisible()
  })
})

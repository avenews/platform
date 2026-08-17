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
  { id: 'acl', heading: 'Agri Credit Line - ACL', role: 'Client Buyer' },
  { id: 'abf', heading: 'Agri Buyer Financing - ABF', role: 'Client Buyer' },
  { id: 'stf', heading: 'Stockist Financing - STF', role: 'Client Buyer - Stockist' },
  { id: 'invoice-financing', heading: 'Invoice Financing', role: 'Client Supplier' },
  { id: 'infx', heading: 'Invoice Financing Express - INFX', role: 'Client Supplier' },
  { id: 'invoice-partner', heading: 'Invoice Financing - Partner Buyer', role: 'Partner Buyer' },
] as const

const FINANCING_EXPLAINERS = [
  { id: 'acl', title: 'An approved Credit Limit does not create financing by itself' },
  { id: 'abf', title: 'ABF has two materially different invoice paths' },
  { id: 'stf', title: 'The Partner Supplier receives the approved disbursement' },
  { id: 'invoice-financing', title: 'The Dynamic Period is the Client Supplier\'s financing object' },
  { id: 'infx', title: 'INFX uses one invoice per Funds Request' },
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

async function signIn(page: Page, scenario: 'multiple' | 'abf-only' | 'partner-only' = 'multiple'): Promise<void> {
  await page.addInitScript(
    ({ sessionKey, scenarioKey, session, scenarioValue }) => {
      localStorage.setItem(sessionKey, JSON.stringify(session))
      sessionStorage.setItem(scenarioKey, scenarioValue)
    },
    { sessionKey: SESSION_KEY, scenarioKey: SCENARIO_KEY, session: SESSION, scenarioValue: scenario },
  )
}

async function completePrototypeLogin(page: Page, scenario: 'multiple' | 'abf-only' | 'partner-only'): Promise<void> {
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

async function assertNoLegacyTerminology(page: Page): Promise<void> {
  const text = await page.locator('body').innerText()
  for (const pattern of LEGACY_TERMS) expect(text).not.toMatch(pattern)
}

async function assertExplainer(page: Page, title: string, tone?: string): Promise<void> {
  const explainer = page.locator(`[data-explainer-title="${title}"]`)
  await expect(explainer).toBeVisible()
  if (tone) await expect(explainer).toHaveAttribute('data-explainer-tone', tone)
}

test.describe('post-OTP access resolution', () => {
  test('multiple destinations always show the chooser with review explainers', async ({ page }, testInfo) => {
    await completePrototypeLogin(page, 'multiple')
    await expect(page).toHaveURL(/\/access$/)
    await expect(page.getByRole('heading', { name: 'What would you like to manage?', level: 1 })).toBeVisible()
    await expect(page.locator('.access-card')).toHaveCount(6)
    await expect(page.getByRole('heading', { name: 'Customer product access', level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Partner workspaces', level: 2 })).toBeVisible()

    for (const destination of DESTINATIONS) {
      await expect(page.locator(`[data-experience-id="${destination.id}"]`)).toContainText(destination.heading)
      await expect(page.locator(`[data-experience-id="${destination.id}"]`)).toContainText(destination.role)
    }

    await assertExplainer(page, 'This screen appears only when the identity has more than one destination', 'purpose')
    await assertExplainer(page, 'The portal asks again on every new login', 'decision')
    await assertExplainer(page, 'Product labels follow the Product-approved legacy-to-current mapping', 'terminology')
    await assertExplainer(page, 'Partner access is separated from the business\'s own financing', 'role')
    await assertNoLegacyTerminology(page)
    await assertNoOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('multi-destination-access-chooser-with-explainers.png'), fullPage: true })
  })

  test('a single ABF destination routes directly after OTP', async ({ page }, testInfo) => {
    await completePrototypeLogin(page, 'abf-only')
    await expect(page).toHaveURL(/\/experience\/abf\/home$/)
    await expect(page.getByRole('heading', { name: 'Agri Buyer Financing - ABF', level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'What would you like to manage?', level: 1 })).toHaveCount(0)
    await expect(page.locator('.experience-context-menu')).toHaveCount(0)
    await assertExplainer(page, 'This Home answers the first product-specific questions', 'purpose')
    await assertNoLegacyTerminology(page)
    await assertNoOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('single-abf-direct-home.png'), fullPage: true })
  })

  test('a single Partner Buyer destination routes directly after OTP', async ({ page }, testInfo) => {
    await completePrototypeLogin(page, 'partner-only')
    await expect(page).toHaveURL(/\/experience\/invoice-partner\/home$/)
    await expect(page.getByRole('heading', { name: 'Invoice Financing - Partner Buyer', level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Upload invoices' })).toBeVisible()
    await expect(page.locator('button[data-action="funds-request"]')).toHaveCount(0)
    await assertExplainer(page, 'The Partner Buyer uploads invoices but does not borrow for the Client Supplier', 'role')
    await assertNoLegacyTerminology(page)
    await assertNoOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('single-partner-direct-home.png'), fullPage: true })
  })
})

test.describe('contextual product and role shell', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, 'multiple')
  })

  for (const destination of DESTINATIONS) {
    test(`${destination.id} has a product- or role-specific Home with explainers`, async ({ page }, testInfo) => {
      await page.goto(`/experience/${destination.id}/home`)
      await expect(page.getByRole('heading', { name: destination.heading, level: 1 })).toBeVisible()
      await expect(page.locator('.contextual-metric')).toHaveCount(3)
      await expect(page.locator('.experience-context-copy')).toContainText(destination.heading)
      await expect(page.locator('.experience-context-copy')).toContainText(destination.role)
      await assertExplainer(page, 'You are viewing one product or Partner role at a time', 'decision')
      await assertExplainer(page, 'This Home answers the first product-specific questions', 'purpose')
      await assertExplainer(page, 'The figures and actions on this branch are fictional review data', 'limitation')
      expect(await page.locator(EXPLAINER).count()).toBeGreaterThanOrEqual(4)
      await assertNoLegacyTerminology(page)
      await assertNoOverflow(page)
      await page.screenshot({ path: testInfo.outputPath(`${destination.id}-home-with-explainers.png`), fullPage: true })
    })
  }

  test('customer and Partner Buyer navigation expose only the current context', async ({ page }, testInfo) => {
    const mobile = isMobile(testInfo)

    await page.goto('/experience/abf/home')
    if (mobile) {
      await expect(page.locator('.experience-bottom-nav a')).toHaveText(['Home', 'Financing', 'Support'])
      await expect(page.locator('.experience-sidebar')).toBeHidden()
    } else {
      await expect(page.locator('.experience-sidebar-nav .experience-nav-link span')).toHaveText(['Home', 'Financing', 'Support', 'Manage Users'])
    }

    await page.goto('/experience/invoice-partner/home')
    if (mobile) {
      await expect(page.locator('.experience-bottom-nav a')).toHaveText(['Home', 'Invoice Uploads', 'Obligations', 'Suppliers'])
    } else {
      await expect(page.locator('.experience-sidebar-nav .experience-nav-link span')).toHaveText(['Home', 'Invoice Uploads', 'Obligations', 'Suppliers', 'Support', 'Manage Users'])
    }
    await assertNoOverflow(page)
  })

  test('the context switcher changes product during the session and logout clears it', async ({ page }, testInfo) => {
    await page.goto('/experience/abf/home')
    const contextTrigger = isMobile(testInfo)
      ? page.locator('.experience-mobile-context')
      : page.locator('.experience-context-trigger')
    await contextTrigger.click()
    const menu = page.getByRole('menu', { name: 'Switch product or access' })
    await expect(menu).toBeVisible()
    await menu.locator('button').filter({ hasText: 'Invoice Financing' }).filter({ hasText: 'Client Supplier' }).first().click()
    await expect(page).toHaveURL(/\/experience\/invoice-financing\/home$/)
    await expect(page.getByRole('heading', { name: 'Invoice Financing', level: 1 })).toBeVisible()

    const profileTrigger = isMobile(testInfo)
      ? page.locator('.experience-avatar-trigger')
      : page.locator('.experience-profile-button')
    await profileTrigger.click()
    await page.getByRole('menuitem', { name: 'Log out' }).click()
    await expect(page).toHaveURL(/\/login$/)
    const stored = await page.evaluate(({ scenarioKey, contextKey }) => ({
      scenario: sessionStorage.getItem(scenarioKey),
      context: sessionStorage.getItem(contextKey),
    }), { scenarioKey: SCENARIO_KEY, contextKey: CONTEXT_KEY })
    expect(stored).toEqual({ scenario: null, context: null })
  })

  test('desktop Developer menu toggles all explainers without changing context', async ({ page }, testInfo) => {
    test.skip(isMobile(testInfo), 'Developer review controls are desktop only')

    await page.goto('/experience/abf/home')
    await expect(page.locator(EXPLAINER).first()).toBeVisible()
    const originalUrl = page.url()

    await page.locator('.experience-developer-tools__trigger').click()
    const menu = page.getByRole('menu', { name: 'Developer experience shortcuts' })
    const toggleOn = menu.getByRole('menuitem', { name: 'Explainers: On' })
    await expect(toggleOn).toBeVisible()
    await toggleOn.click()
    await expect(page.locator(EXPLAINER)).toHaveCount(0)
    expect(page.url()).toBe(originalUrl)

    const toggleOff = menu.getByRole('menuitem', { name: 'Explainers: Off' })
    await expect(toggleOff).toBeVisible()
    await toggleOff.click()
    await expect(page.locator(EXPLAINER).first()).toBeVisible()
    expect(page.url()).toBe(originalUrl)
  })
})

test.describe('product-specific action placement and Handbook boundaries', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, 'multiple')
  })

  for (const item of FINANCING_EXPLAINERS) {
    test(`${item.id} Financing states its governing rule`, async ({ page }, testInfo) => {
      await page.goto(`/experience/${item.id}/financing`)
      await assertExplainer(page, item.title)
      await assertNoLegacyTerminology(page)
      await assertNoOverflow(page)
      await page.screenshot({ path: testInfo.outputPath(`${item.id}-financing-with-explainers.png`), fullPage: true })
    })
  }

  test('ACL collects approved transaction evidence inside its Funds Request', async ({ page }) => {
    await page.goto('/experience/acl/financing')
    await expect(page.locator('[data-upload-placement="inside-funds-request"]')).toBeVisible()
    await expect(page.locator('[data-action="upload-invoices"]')).toHaveCount(0)
    await page.getByRole('button', { name: 'Start Funds Request' }).first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('Approved transaction evidence')
    await assertExplainer(page, 'This is not the final ACL application form', 'limitation')
    await assertNoLegacyTerminology(page)
  })

  test('ABF begins with Fully Paid or Unpaid Invoice', async ({ page }) => {
    await page.goto('/experience/abf/financing')
    await page.getByRole('button', { name: 'Start Funds Request' }).first().click()
    const dialog = page.getByRole('dialog')
    await assertExplainer(page, 'This decision controls the rest of the ABF request', 'action')
    await expect(dialog.getByRole('button', { name: /Fully Paid Invoice/ })).toBeVisible()
    await expect(dialog.getByRole('button', { name: /Unpaid Invoice/ })).toBeVisible()

    await dialog.getByRole('button', { name: /Fully Paid Invoice/ }).click()
    await expect(dialog).toContainText('Proof of Payment')
    await expect(dialog).toContainText('reimbursement to the Client Buyer')
    await dialog.getByRole('button', { name: 'Change invoice type' }).click()
    await dialog.getByRole('button', { name: /Unpaid Invoice/ }).click()
    await expect(dialog).toContainText('direct payment to the Supplier')
    await assertNoLegacyTerminology(page)
  })

  test('STF and INFX keep invoice evidence inside the Funds Request', async ({ page }) => {
    for (const id of ['stf', 'infx']) {
      await page.goto(`/experience/${id}/financing`)
      await expect(page.locator('[data-upload-placement="inside-funds-request"]')).toBeVisible()
      await expect(page.locator('[data-action="upload-invoices"]')).toHaveCount(0)
      await page.getByRole('button', { name: 'Start Funds Request' }).first().click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.getByRole('button', { name: 'Close' }).click()
    }
  })

  test('Invoice Financing separates relationship upload from Dynamic Period Funds Requests', async ({ page }, testInfo) => {
    await page.goto('/experience/invoice-financing/financing')
    await assertExplainer(page, 'Funds Requests belong to the Dynamic Period, not the product or relationship', 'action')
    await assertExplainer(page, 'Who uploads invoices changes; who borrows does not', 'role')

    const partnerRelationship = page.locator('[data-relationship-model="partner-buyer"]')
    const counterpartyRelationship = page.locator('[data-relationship-model="counterparty-buyer"]')
    await expect(partnerRelationship).toHaveAttribute('data-can-upload-invoices', 'false')
    await expect(partnerRelationship.getByRole('button', { name: 'Upload invoices' })).toHaveCount(0)
    await expect(partnerRelationship).toContainText('Invoices are provided by Twiga Foods Ltd.')
    await expect(counterpartyRelationship).toHaveAttribute('data-can-upload-invoices', 'true')
    await expect(counterpartyRelationship.getByRole('button', { name: 'Upload invoices' })).toBeVisible()

    const openPeriod = isMobile(testInfo)
      ? page.locator('.contextual-period-cards [data-dynamic-period-id="twiga-2026-09-15"]')
      : page.locator('.contextual-period-table [data-dynamic-period-id="twiga-2026-09-15"]')
    await expect(openPeriod.locator('[data-action-scope="dynamic-period"]')).toBeVisible()
    await openPeriod.locator('[data-action-scope="dynamic-period"]').click()
    await expect(page).toHaveURL(/\/experience\/invoice-financing\/financing\/period\/twiga-2026-09-15$/)
    await expect(page.getByRole('heading', { name: 'Twiga Foods Ltd', level: 1 })).toBeVisible()
    await expect(page.getByText('Available to Withdraw', { exact: true }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Invoices in this Dynamic Period', level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Advances against this Dynamic Period', level: 2 })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Request funds' })).toBeEnabled()
    await assertExplainer(page, 'This is the correct level for the Client Supplier\'s Funds Request', 'action')
    await assertExplainer(page, 'Availability is constrained by both receivables and approved credit', 'handbook')
    await assertExplainer(page, 'The Partner Buyer normally supplies these invoices', 'role')
    await assertExplainer(page, 'Settlement instructions are not connected on this prototype', 'limitation')
    await expect(page.locator('[data-partner-rebate]')).toHaveCount(0)
    await expect(page.getByText(/rebate.*KES/i)).toHaveCount(0)
    await assertNoLegacyTerminology(page)
    await assertNoOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('invoice-financing-dynamic-period-with-explainers.png'), fullPage: true })
  })

  test('Partner Buyer uploads invoices and never receives a Funds Request action', async ({ page }, testInfo) => {
    await page.goto('/experience/invoice-partner/invoice-uploads')
    await expect(page.getByRole('heading', { name: 'Invoice Uploads', level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Upload invoices' })).toBeVisible()
    await expect(page.locator('[data-funds-request-available="false"]')).toContainText('No Funds Request action')
    await expect(page.locator('button[data-action="funds-request"]')).toHaveCount(0)
    await assertExplainer(page, 'The Partner Buyer supplies invoice information but does not submit the Client Supplier\'s Funds Request', 'role')
    await assertExplainer(page, 'Per-row batch outcomes are a proposed future-state Partner experience', 'limitation')
    await expect(page.locator('[data-future-state="batch-outcomes"]')).toBeVisible()
    await assertNoLegacyTerminology(page)
    await assertNoOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('partner-buyer-invoice-uploads-with-explainers.png'), fullPage: true })
  })

  test('Partner Buyer obligations expose no invented settlement identifiers', async ({ page }, testInfo) => {
    await page.goto('/experience/invoice-partner/obligations')
    await assertExplainer(page, 'This page answers what the Partner Buyer must pay and when', 'purpose')
    await assertExplainer(page, 'No production bank account or payment reference is available on this branch', 'limitation')
    await expect(page.getByText('0123 456 789', { exact: true })).toHaveCount(0)
    await expect(page.getByText('TWIGA-15SEP26', { exact: true })).toHaveCount(0)
    await expect(page.getByText('To be supplied by Avenews', { exact: true })).toBeVisible()
    await assertNoLegacyTerminology(page)
    await assertNoOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('partner-buyer-obligations-with-explainers.png'), fullPage: true })
  })

  test('Partner Buyer Suppliers page keeps onboarding separate from Client financing', async ({ page }, testInfo) => {
    await page.goto('/experience/invoice-partner/suppliers')
    await assertExplainer(page, 'A Partner Buyer may provide access to its Supplier network and support onboarding', 'role')
    await assertExplainer(page, 'Supplier invitation and onboarding are prototype placeholders', 'limitation')
    await expect(page.getByRole('button', { name: 'View Client Supplier' }).first()).toBeVisible()
    await assertNoLegacyTerminology(page)
    await assertNoOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('partner-buyer-suppliers-with-explainers.png'), fullPage: true })
  })
})

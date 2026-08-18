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
  { id: 'acl', cardLabel: 'Agri Credit Line', homeHeading: 'Agri Credit Line' },
  { id: 'abf', cardLabel: 'Agri Buyer Financing', homeHeading: 'Agri Buyer Financing' },
  { id: 'stf', cardLabel: 'Stockist Financing', homeHeading: 'Stockist Financing' },
  { id: 'invoice-financing', cardLabel: 'Invoice Financing', homeHeading: 'Invoice Financing' },
  { id: 'infx', cardLabel: 'Invoice Financing Express', homeHeading: 'Invoice Financing Express' },
  { id: 'invoice-partner', cardLabel: 'Invoice Financing - Partner Buyer', homeHeading: 'Invoice Financing - Partner Buyer' },
] as const

const FINANCING_EXPLAINERS = [
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

const WELCOME_MESSAGES = [
  'Welcome back',
  'Good to see you again',
  'Ready when you are',
  'Welcome to Avenews',
  "Let's get started",
] as const

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

async function customerFacingText(page: Page): Promise<string> {
  return page.locator('body').evaluate((body) => {
    const clone = body.cloneNode(true) as HTMLElement
    clone.querySelectorAll('app-prototype-explainer, .developer-tools, .experience-developer-tools, .access-developer')
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

async function assertCenteredOrBottomSheet(dialog: ReturnType<Page['locator']>, page: Page, testInfo: TestInfo): Promise<void> {
  const box = await dialog.boundingBox()
  const viewport = page.viewportSize()
  expect(box).not.toBeNull()
  expect(viewport).not.toBeNull()
  if (!box || !viewport) return

  if (isMobile(testInfo)) {
    expect(Math.abs((box.y + box.height) - viewport.height)).toBeLessThanOrEqual(2)
  } else {
    const centerX = box.x + box.width / 2
    const centerY = box.y + box.height / 2
    expect(Math.abs(centerX - viewport.width / 2)).toBeLessThanOrEqual(3)
    expect(Math.abs(centerY - viewport.height / 2)).toBeLessThanOrEqual(12)
  }
}

test.describe('post-OTP access resolution', () => {
  test('multiple customer products open the simplified selector', async ({ page }, testInfo) => {
    await completePrototypeLogin(page, 'multiple')
    await expect(page).toHaveURL(/\/access$/)
    await expect(page.getByText('Avenews portal', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'What would you like to manage?', level: 2 })).toBeVisible()
    await expect(page.locator('.access-hero h1')).toHaveText(new RegExp(WELCOME_MESSAGES.join('|')))
    await expect(page.getByText('Choose the business, role, and financing experience you need for this session. This selection is not remembered after you log out.', { exact: true })).toBeVisible()
    await expect(page.locator('.access-card')).toHaveCount(6)
    await expect(page.getByRole('heading', { name: 'Your available products', level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Partner workspace', level: 2 })).toBeVisible()
    await expect(page.getByText(/Signed in as/i)).toHaveCount(0)
    await expect(page.locator('.access-card__role')).toHaveCount(0)
    await expect(page.locator('.access-card__action')).toHaveText(Array(6).fill('Open Product ->'))

    for (const destination of DESTINATIONS) {
      await expect(page.locator(`[data-experience-id="${destination.id}"]`)).toContainText(destination.cardLabel)
    }
    await expect(page.locator('[data-experience-id="acl"] .access-card__summary')).toContainText('Available Credit')
    await expect(page.locator('[data-experience-id="acl"] .access-card__summary')).toContainText('Outstanding Principal')

    await assertExplainer(page, 'Customer financing now starts at this selector', 'purpose')
    await assertExplainer(page, 'The portal asks again on every new login', 'decision')
    await assertExplainer(page, 'Internal financing-party labels are hidden from customer product cards', 'terminology')
    await assertExplainer(page, 'Partner workspace access is operationally separate from customer financing', 'role')
    await assertNoLegacyTerminology(page)
    await assertNoOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('product-selector-simplified.png'), fullPage: true })
  })

  test('a single customer product still opens the selector before the product', async ({ page }, testInfo) => {
    await completePrototypeLogin(page, 'abf-only')
    await expect(page).toHaveURL(/\/access$/)
    await expect(page.locator('.access-card')).toHaveCount(1)
    await expect(page.getByRole('heading', { name: 'Your available products', level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Partner workspace', level: 2 })).toHaveCount(0)
    await page.getByRole('button').filter({ hasText: 'Agri Buyer Financing' }).click()
    await expect(page).toHaveURL(/\/experience\/abf\/home$/)
    await expect(page.getByRole('heading', { name: 'Agri Buyer Financing', level: 1 })).toBeVisible()
    await assertNoOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('single-customer-selector-first.png'), fullPage: true })
  })

  test('a single Partner Buyer destination routes directly after OTP', async ({ page }, testInfo) => {
    await completePrototypeLogin(page, 'partner-only')
    await expect(page).toHaveURL(/\/experience\/invoice-partner\/home$/)
    await expect(page.getByRole('heading', { name: 'Invoice Financing - Partner Buyer', level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Upload invoices' })).toBeVisible()
    await expect(page.locator('button[data-action="funds-request"]')).toHaveCount(0)
    await assertExplainer(page, 'The Partner Buyer uploads invoices but does not borrow for the participating Supplier', 'role')
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
    test(`${destination.id} has a clean product-specific Home`, async ({ page }, testInfo) => {
      await page.goto(`/experience/${destination.id}/home`)
      await expect(page.getByRole('heading', { name: destination.homeHeading, level: 1 })).toBeVisible()
      await expect(page.locator('.contextual-metric')).toHaveCount(3)
      await expect(page.locator('.experience-context-copy')).toContainText(destination.cardLabel)
      await expect(page.locator('.experience-context-copy')).not.toContainText('Client Buyer')
      await expect(page.locator('.experience-context-copy')).not.toContainText('Client Supplier')
      await assertExplainer(page, 'You are viewing one product or Partner role at a time', 'decision')
      if (destination.id === 'acl') {
        await assertExplainer(page, 'Agri Credit Line uses one customer workspace', 'decision')
      } else {
        await assertExplainer(page, 'This Home answers the first product-specific questions', 'purpose')
      }

      await assertNoLegacyTerminology(page)
      await assertNoOverflow(page)
      await page.screenshot({ path: testInfo.outputPath(`${destination.id}-home-clean-shell.png`), fullPage: true })
    })
  }

  test('primary navigation keeps frequent tasks and moves Support to the profile menu', async ({ page }, testInfo) => {
    const mobile = isMobile(testInfo)

    await page.goto('/experience/acl/home')
    if (mobile) {
      await expect(page.locator('.experience-bottom-nav a')).toHaveText(['Home', 'Manage Users'])
      await expect(page.locator('.experience-sidebar')).toBeHidden()
    } else {
      await expect(page.locator('.experience-sidebar-nav .experience-nav-link span')).toHaveText(['Home', 'Manage Users'])
    }

    await page.goto('/experience/abf/home')
    if (mobile) {
      await expect(page.locator('.experience-bottom-nav a')).toHaveText(['Home', 'Financing', 'Manage Users'])
    } else {
      await expect(page.locator('.experience-sidebar-nav .experience-nav-link span')).toHaveText(['Home', 'Financing', 'Manage Users'])
    }

    await page.goto('/experience/invoice-partner/home')
    const partnerItems = ['Home', 'Invoice Uploads', 'Obligations', 'Suppliers', 'Manage Users']
    if (mobile) {
      await expect(page.locator('.experience-bottom-nav a')).toHaveText(partnerItems)
    } else {
      await expect(page.locator('.experience-sidebar-nav .experience-nav-link span')).toHaveText(partnerItems)
    }

    const profileTrigger = mobile
      ? page.locator('.experience-avatar-trigger')
      : page.locator('.experience-profile-button')
    await profileTrigger.click()
    const profileMenu = page.getByRole('menu', { name: 'Profile menu' })
    await expect(profileMenu.getByRole('menuitem')).toHaveText(['View Profile', 'Support', 'Switch product or access', 'Log out'])
    await expect(profileMenu.getByRole('menuitem', { name: 'Manage Users' })).toHaveCount(0)
    await assertNoOverflow(page)
  })

  test('the context switcher changes product without exposing internal customer roles', async ({ page }, testInfo) => {
    await page.goto('/experience/abf/home')
    const contextTrigger = isMobile(testInfo)
      ? page.locator('.experience-mobile-context')
      : page.locator('.experience-context-trigger')
    await contextTrigger.click()
    const menu = page.getByRole('menu', { name: 'Switch product or access' })
    await expect(menu).toBeVisible()
    await expect(menu).not.toContainText('Client Buyer')
    await expect(menu).not.toContainText('Client Supplier')
    await menu.locator('button').filter({ hasText: 'Invoice Financing' }).filter({ hasText: 'Kioko Agri Supplies Ltd' }).first().click()
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

    await page.goto('/experience/acl/home')
    await expect(page.locator(EXPLAINER).first()).toBeVisible()
    const originalUrl = page.url()

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

test.describe('product-specific action placement and Handbook boundaries', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, 'multiple')
  })

  for (const item of FINANCING_EXPLAINERS) {
    test(`${item.id} Financing states its governing rule`, async ({ page }, testInfo) => {
      await page.goto(`/experience/${item.id}/financing`)
      await assertExplainer(page, item.title)
      await expect(page.locator('.contextual-financing__hero .page-eyebrow')).toBeHidden()
      await assertNoLegacyTerminology(page)
      await assertNoOverflow(page)
      await page.screenshot({ path: testInfo.outputPath(`${item.id}-financing-with-explainers.png`), fullPage: true })
    })
  }

  test('Agri Credit Line activity filters, paginates, and opens record-specific repayment details', async ({ page }, testInfo) => {
    await page.goto('/experience/acl/home')

    await expect(page.getByRole('heading', { name: 'Agri Credit Line', level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Submit Funds Request' }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Financing activity', level: 2 })).toBeVisible()
    await expect(page.locator('.acl-financing-activity .page-eyebrow')).toHaveCount(0)
    await expect(page.locator('app-customer-filter-bar')).toBeVisible()
    await expect(page.getByRole('searchbox', { name: 'Search Agri Credit Line financing activity' })).toBeVisible()
    await expect(page.locator('.acl-activity-table th')).toHaveText([
      'Financing',
      'Disbursement Date',
      'Repayment Due Date',
      'Amount Financed',
      'Status',
      'Total Repaid',
      'Outstanding Balance',
    ])
    await expect(page.getByText('Purpose', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Next Instalment', { exact: true })).toBeVisible()
    await expect(page.locator('.acl-next-installment')).toContainText('FR-2026-0318')
    await expect(page.locator('.acl-pagination')).toContainText('Showing 1-2 of 2 financing records')
    await expect(page.locator('.acl-pagination .baseline-pagination__controls .is-active')).toHaveText('1')
    await expect(page.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled()
    await expect(page.getByRole('heading', { name: 'Submitting a Funds Request', level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Making a repayment', level: 2 })).toBeVisible()

    await assertExplainer(page, 'Agri Credit Line uses one customer workspace', 'decision')
    await assertExplainer(page, 'The summary connects the next repayment to its financing record', 'purpose')
    await assertExplainer(page, 'Search and filters reuse the established customer-list pattern', 'decision')
    await assertExplainer(page, 'Financing details are centered on desktop and a bottom drawer on mobile', 'decision')
    await assertExplainer(page, 'Repayment instructions belong to a specific financing record', 'decision')

    const customerText = await customerFacingText(page)
    expect(customerText).not.toMatch(/\bClient Buyer\b/)
    expect(customerText).not.toMatch(/\bprototype\b/i)
    expect(customerText).not.toMatch(/\bACL\b/)

    const search = page.getByRole('searchbox', { name: 'Search Agri Credit Line financing activity' })
    await search.fill('FR-2026-0510')
    if (isMobile(testInfo)) {
      await expect(page.locator('.acl-activity-cards .baseline-record-card')).toHaveCount(1)
      await expect(page.locator('.acl-activity-cards')).toContainText('FR-2026-0510')
    } else {
      await expect(page.locator('.acl-activity-table .acl-activity-row')).toHaveCount(1)
      await expect(page.locator('.acl-activity-table')).toContainText('FR-2026-0510')
    }
    await search.fill('')

    if (isMobile(testInfo)) {
      const firstCard = page.locator('.acl-activity-cards .acl-record-card-button').first()
      await expect(firstCard).toContainText('FR-2026-0318')
      await firstCard.click()
    } else {
      const firstRow = page.locator('.acl-activity-table .acl-activity-row').first()
      await expect(firstRow).toContainText('FR-2026-0318')
      await firstRow.click()
    }
    const recordDialog = page.locator('.acl-record-modal')
    await expect(recordDialog).toBeVisible()
    await expect(recordDialog).toContainText('FR-2026-0318')
    await expect(recordDialog).toContainText('Disbursement Date')
    await expect(recordDialog).toContainText('Repayment Due Date')
    await expect(recordDialog).toContainText('Amount Financed')
    await expect(recordDialog).toContainText('Outstanding Balance')
    await assertCenteredOrBottomSheet(recordDialog, page, testInfo)
    await recordDialog.getByRole('button', { name: /View repayment details for FR-2026-0318/i }).click()

    const repaymentDialog = page.locator('.acl-repayment-modal')
    await expect(repaymentDialog).toBeVisible()
    await expect(repaymentDialog).toContainText('Repayment details')
    await expect(repaymentDialog).toContainText('FR-2026-0318')
    await expect(repaymentDialog).toContainText('Financing reference')
    await expect(repaymentDialog).toContainText('ABSA Bank Kenya PLC')
    await expect(repaymentDialog).toContainText('2046346095')
    await repaymentDialog.getByRole('tab', { name: 'M-Pesa Paybill' }).click()
    await expect(repaymentDialog).toContainText('4567121')
    await expect(repaymentDialog).toContainText('+254712345678')
    await expect(repaymentDialog).toContainText('Use your registered phone number')
    await assertCenteredOrBottomSheet(repaymentDialog, page, testInfo)
    await repaymentDialog.getByRole('button', { name: 'Close' }).click()

    await page.locator('.acl-help-card').filter({ hasText: 'How to request funds' }).getByRole('button', { name: 'Submit Funds Request' }).click()
    const fundsRequestDialog = page.getByRole('dialog', { name: 'Submit Funds Request' })
    await expect(fundsRequestDialog).toContainText('Financing amount')
    await expect(fundsRequestDialog).toContainText('Instalment option')
    await expect(fundsRequestDialog).toContainText('Transaction evidence')
    await expect(fundsRequestDialog).toContainText('Disbursement recipient')
    await assertExplainer(page, 'This is one product-level Funds Request flow', 'action')
    await fundsRequestDialog.getByRole('button', { name: 'Close' }).click()

    await page.goto('/experience/acl/financing')
    await expect(page).toHaveURL(/\/experience\/acl\/home$/)
    await assertNoOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('agri-credit-line-refined-home.png'), fullPage: true })
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
    await expect(page.locator('button:visible').filter({ hasText: 'View Client Supplier' }).first()).toBeVisible()
    await assertNoLegacyTerminology(page)
    await assertNoOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('partner-buyer-suppliers-with-explainers.png'), fullPage: true })
  })
})

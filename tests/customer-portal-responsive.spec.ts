import { expect, test, type Page, type TestInfo } from '@playwright/test'

const SESSION_KEY = 'av_customer_portal_session'
const SESSION = {
  contactId: 'usr_001',
  contactFirstName: 'Amara',
  contactLastName: 'Osei',
  contactEmail: 'amara.osei@kiokoagri.co.ke',
  businessId: 'biz_demo_001',
  businessName: 'Kioko Agri Supplies Ltd',
  role: 'admin',
}

const ROUTES = [
  { slug: 'home', path: '/', heading: 'Kioko Agri Supplies Ltd', desktopActiveLabel: 'Home', mobileActiveLabel: 'Home', list: false },
  { slug: 'available-financing', path: '/available-financing', heading: 'Available Financing', desktopActiveLabel: 'Available Financing', mobileActiveLabel: 'Available Financing', list: true },
  { slug: 'available-financing-detail', path: '/available-financing/cl_asf_twiga', heading: 'Invoice Financing (INF)', desktopActiveLabel: 'Available Financing', mobileActiveLabel: 'Available Financing', list: false },
  { slug: 'financing-activity', path: '/financing-activity', heading: 'Financing Activity', desktopActiveLabel: 'Financing Activity', mobileActiveLabel: 'Financing Activity', list: true },
  { slug: 'invoices', path: '/invoices', heading: 'Invoices & Documents', desktopActiveLabel: 'Invoices & Documents', mobileActiveLabel: 'Invoices & Documents', list: true },
  { slug: 'support', path: '/support', heading: 'Support', desktopActiveLabel: 'Support', mobileActiveLabel: null, list: false },
  { slug: 'manage-users', path: '/manage-users', heading: 'Manage Users', desktopActiveLabel: 'Manage Users', mobileActiveLabel: null, list: true },
  { slug: 'profile', path: '/profile', heading: 'Profile', desktopActiveLabel: null, mobileActiveLabel: null, list: false },
] as const

const DESKTOP_NAV = [
  'Home',
  'Available Financing',
  'Financing Activity',
  'Invoices & Documents',
  'Support',
  'Manage Users',
]

const MOBILE_NAV = [
  'Home',
  'Available Financing',
  'Financing Activity',
  'Invoices & Documents',
]

function isMobileProject(testInfo: TestInfo): boolean {
  return testInfo.project.name === 'mobile' || testInfo.project.name === 'minimum-mobile'
}

async function signIn(page: Page): Promise<void> {
  await page.addInitScript(
    ({ key, session }) => localStorage.setItem(key, JSON.stringify(session)),
    { key: SESSION_KEY, session: SESSION },
  )
}

async function assertNoDocumentOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1)
}

async function gridColumnCount(page: Page, selector: string): Promise<number> {
  return page.locator(selector).evaluate((element) => {
    const columns = getComputedStyle(element).gridTemplateColumns.trim()
    if (!columns || columns === 'none') return 0
    return columns.split(/\s+/).length
  })
}

test.beforeEach(async ({ page }) => {
  await signIn(page)
})

test('shared navigation shell matches the customer portal contract', async ({ page }, testInfo) => {
  await page.goto('/')
  await expect(page.locator('h1')).toContainText('Kioko Agri Supplies Ltd')

  const mobile = isMobileProject(testInfo)
  const sidebar = page.locator('.sidebar')
  const mobileHeader = page.locator('.mobile-header')
  const bottomNav = page.locator('.bottom-nav')

  if (mobile) {
    await expect(sidebar).toBeHidden()
    await expect(mobileHeader).toBeVisible()
    await expect(bottomNav).toBeVisible()
    await expect(bottomNav.locator('.bottom-nav__label')).toHaveText(MOBILE_NAV)

    const active = bottomNav.locator('.bottom-nav__item[aria-current="page"]')
    await expect(active).toContainText('Home')
    const activeBackground = await active.evaluate((element) => getComputedStyle(element).backgroundColor)
    expect(activeBackground).not.toBe('rgba(0, 0, 0, 0)')

    await page.locator('.avatar-trigger').click()
    const menu = page.locator('.profile-menu')
    await expect(menu).toBeVisible()
    await expect(menu).toContainText('View Profile')
    await expect(menu).toContainText('Manage Users')
    await expect(menu).toContainText('Support')
    const menuBox = await menu.boundingBox()
    expect(menuBox).not.toBeNull()
    expect(menuBox!.y).toBeGreaterThanOrEqual(48)
  } else {
    await expect(sidebar).toBeVisible()
    await expect(mobileHeader).toBeHidden()
    await expect(bottomNav).toBeHidden()
    await expect(sidebar.locator('.nav-link span')).toHaveText(DESKTOP_NAV)

    const active = sidebar.locator('.nav-link[aria-current="page"]')
    await expect(active).toContainText('Home')

    const sidebarBox = await sidebar.boundingBox()
    expect(sidebarBox).not.toBeNull()
    expect(Math.round(sidebarBox!.width)).toBe(240)

    await page.locator('.profile-button').click()
    const menu = page.locator('.profile-menu')
    await expect(menu).toBeVisible()
    const menuBox = await menu.boundingBox()
    const triggerBox = await page.locator('.profile-button').boundingBox()
    expect(menuBox).not.toBeNull()
    expect(triggerBox).not.toBeNull()
    expect(menuBox!.y + menuBox!.height).toBeLessThanOrEqual(triggerBox!.y + 1)
  }

  await assertNoDocumentOverflow(page)
  await page.screenshot({ path: testInfo.outputPath('shared-shell.png'), fullPage: true })
})

for (const route of ROUTES) {
  test(`${route.slug} matches the responsive baseline`, async ({ page }, testInfo) => {
    await page.goto(route.path)
    await expect(page.locator('h1').first()).toContainText(route.heading)

    const mobile = isMobileProject(testInfo)

    const activeLabel = mobile ? route.mobileActiveLabel : route.desktopActiveLabel
    if (activeLabel) {
      const activeSelector = mobile
        ? '.bottom-nav__item[aria-current="page"]'
        : '.nav-link[aria-current="page"]'
      await expect(page.locator(activeSelector)).toContainText(activeLabel)
    }

    if (route.list) {
      if (mobile) {
        await expect(page.locator('.baseline-table-wrap').first()).toBeHidden()
        await expect(page.locator('.baseline-cards').first()).toBeVisible()
      } else {
        await expect(page.locator('.baseline-table-wrap').first()).toBeVisible()
        await expect(page.locator('.baseline-cards').first()).toBeHidden()
      }
    }

    if (route.slug === 'home') {
      const count = await gridColumnCount(page, '.summary-metrics')
      expect(count).toBe(mobile ? 1 : 3)
    }

    if (route.slug === 'support') {
      const count = await gridColumnCount(page, '.support-grid')
      expect(count).toBe(mobile ? 1 : 2)
    }

    if (route.slug === 'profile') {
      const count = await gridColumnCount(page, '.profile-grid')
      expect(count).toBe(mobile ? 1 : 2)
    }

    await assertNoDocumentOverflow(page)
    await page.screenshot({ path: testInfo.outputPath(`${route.slug}.png`), fullPage: true })
  })
}

test('Home summary links hand off the correct Financing Activity view', async ({ page }) => {
  await page.goto('/')
  await page.getByText('Payments Overdue', { exact: true }).click()
  await expect(page).toHaveURL(/\/financing-activity\?view=overdue$/)
  await expect(page.locator('.baseline-view-chip')).toContainText('Payments overdue')
})

test('mobile dialogs preserve centered and sheet behaviours', async ({ page }, testInfo) => {
  test.skip(!isMobileProject(testInfo), 'Mobile modal placement check')

  await page.goto('/manage-users')
  await page.getByRole('button', { name: /invite user/i }).click()
  const dialog = page.locator('.baseline-modal').first()
  await expect(dialog).toBeVisible()
  const dialogBox = await dialog.boundingBox()
  const viewport = page.viewportSize()
  expect(dialogBox).not.toBeNull()
  expect(viewport).not.toBeNull()
  expect(dialogBox!.y).toBeGreaterThan(8)
  expect(dialogBox!.y + dialogBox!.height).toBeLessThan(viewport!.height - 8)
  await page.getByRole('button', { name: 'Close' }).click()

  await page.goto('/available-financing/cl_asf_twiga')
  await page.getByRole('button', { name: 'Upload invoices' }).click()
  const sheet = page.locator('.baseline-modal--sheet')
  await expect(sheet).toBeVisible()
  const sheetBox = await sheet.boundingBox()
  expect(sheetBox).not.toBeNull()
  expect(Math.abs(sheetBox!.y + sheetBox!.height - viewport!.height)).toBeLessThanOrEqual(2)
})

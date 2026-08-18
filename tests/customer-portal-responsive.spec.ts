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

const CUSTOMER_ROUTES = [
  { slug: 'home', path: '/', heading: 'Kioko Agri Supplies Ltd', desktopActiveLabel: 'Home', mobileActiveLabel: 'Home', list: false },
  { slug: 'available-financing', path: '/available-financing', heading: 'Available Financing', desktopActiveLabel: 'Available Financing', mobileActiveLabel: 'Available Financing', list: true },
  { slug: 'available-financing-detail', path: '/available-financing/cl_asf_twiga', heading: 'Invoice Financing (INF)', desktopActiveLabel: 'Available Financing', mobileActiveLabel: 'Available Financing', list: false },
  { slug: 'financing-activity', path: '/financing-activity', heading: 'Financing Activity', desktopActiveLabel: 'Financing Activity', mobileActiveLabel: 'Financing Activity', list: true },
  { slug: 'invoices', path: '/invoices', heading: 'Invoices & Documents', desktopActiveLabel: 'Invoices & Documents', mobileActiveLabel: 'Invoices & Documents', list: true },
  { slug: 'support', path: '/support', heading: 'Support', desktopActiveLabel: 'Support', mobileActiveLabel: null, list: false },
  { slug: 'manage-users', path: '/manage-users', heading: 'Manage Users', desktopActiveLabel: 'Manage Users', mobileActiveLabel: null, list: true },
  { slug: 'profile', path: '/profile', heading: 'Profile', desktopActiveLabel: null, mobileActiveLabel: null, list: false },
] as const

const FILTER_ROUTES = [
  { path: '/available-financing', fieldCount: 2 },
  { path: '/financing-activity', fieldCount: 3 },
  { path: '/invoices', fieldCount: 3 },
  { path: '/manage-users', fieldCount: 1 },
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

function boxesOverlap(
  first: { x: number; y: number; width: number; height: number },
  second: { x: number; y: number; width: number; height: number },
): boolean {
  return !(
    first.x + first.width <= second.x ||
    second.x + second.width <= first.x ||
    first.y + first.height <= second.y ||
    second.y + second.height <= first.y
  )
}

test.describe('signed-in customer portal', () => {
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

  for (const route of CUSTOMER_ROUTES) {
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

        if (!mobile) {
          const heights = await page.locator('.support-grid > .baseline-card').evaluateAll((elements) =>
            elements.map((element) => Math.round(element.getBoundingClientRect().height)),
          )
          expect(heights).toHaveLength(2)
          expect(Math.abs(heights[0] - heights[1])).toBeLessThanOrEqual(1)
        }
      }

      if (route.slug === 'profile') {
        const count = await gridColumnCount(page, '.profile-grid')
        expect(count).toBe(mobile ? 1 : 2)
      }

      await assertNoDocumentOverflow(page)
      await page.screenshot({ path: testInfo.outputPath(`${route.slug}.png`), fullPage: true })
    })
  }

  test('prototype typography, table alignment, selects, and email truncation stay locked', async ({ page }, testInfo) => {
    const mobile = isMobileProject(testInfo)

    await page.goto('/financing-activity')
    const heading = page.locator('.baseline-hero h1')
    await expect(heading).toBeVisible()
    const headingSize = await heading.evaluate((element) => getComputedStyle(element).fontSize)
    expect(headingSize).toBe(mobile ? '26px' : '32px')

    const filterBar = page.locator('app-customer-filter-bar')
    let firstSelect
    if (mobile) {
      const mobileFilters = filterBar.locator('[data-filter-layout="mobile"]')
      await expect(mobileFilters).toBeVisible()
      await mobileFilters.getByRole('button', { name: 'Filters' }).click()
      firstSelect = mobileFilters.locator('select.baseline-control').first()
    } else {
      const desktopFilters = filterBar.locator('[data-filter-layout="desktop"]')
      await expect(desktopFilters).toBeVisible()
      firstSelect = desktopFilters.locator('select.baseline-control').first()
    }

    await expect(firstSelect).toBeVisible()
    const selectStyle = await firstSelect.evaluate((element) => {
      const style = getComputedStyle(element)
      return {
        appearance: style.appearance,
        paddingRight: style.paddingRight,
        backgroundImage: style.backgroundImage,
      }
    })
    expect(selectStyle.appearance).toBe('none')
    expect(selectStyle.paddingRight).toBe('40px')
    expect(selectStyle.backgroundImage).not.toBe('none')

    if (!mobile) {
      const alignments = await page.locator('.baseline-table th, .baseline-table td').evaluateAll((elements) =>
        elements.map((element) => getComputedStyle(element).textAlign),
      )
      expect(alignments.length).toBeGreaterThan(0)
      expect(alignments.every((alignment) => alignment === 'left')).toBeTruthy()

      await page.goto('/manage-users')
      const emailCell = page.locator('.baseline-table tbody tr').first().locator('td').nth(1)
      await expect(emailCell).toBeVisible()
      const emailStyle = await emailCell.evaluate((element) => {
        const style = getComputedStyle(element)
        return {
          overflow: style.overflow,
          textOverflow: style.textOverflow,
          whiteSpace: style.whiteSpace,
        }
      })
      expect(emailStyle.overflow).toBe('hidden')
      expect(emailStyle.textOverflow).toBe('ellipsis')
      expect(emailStyle.whiteSpace).toBe('nowrap')
    }
  })

  test('shared customer filter bar is compact on desktop and disclosed on mobile', async ({ page }, testInfo) => {
    const mobile = isMobileProject(testInfo)

    for (const route of FILTER_ROUTES) {
      await page.goto(route.path)
      const pageRoot = page.locator('.customer-list-page')
      const filterBar = pageRoot.locator('app-customer-filter-bar')
      await expect(pageRoot).toBeVisible()
      await expect(filterBar).toBeVisible()

      const rowGap = await pageRoot.evaluate((element) => getComputedStyle(element).rowGap)
      expect(rowGap).toBe('16px')

      const spacingAnchor = route.path === '/manage-users'
        ? pageRoot.locator('.manage-users-head')
        : pageRoot.locator('.baseline-hero').first()
      const anchorBox = await spacingAnchor.boundingBox()
      const filterBox = await filterBar.boundingBox()
      expect(anchorBox).not.toBeNull()
      expect(filterBox).not.toBeNull()
      const anchorToFilterGap = filterBox!.y - (anchorBox!.y + anchorBox!.height)
      expect(anchorToFilterGap).toBeGreaterThanOrEqual(12)
      expect(anchorToFilterGap).toBeLessThanOrEqual(20)

      const desktopFilters = filterBar.locator('[data-filter-layout="desktop"]')
      const mobileFilters = filterBar.locator('[data-filter-layout="mobile"]')

      if (mobile) {
        await expect(desktopFilters).toBeHidden()
        await expect(mobileFilters).toBeVisible()
        await expect(mobileFilters.locator('.customer-filter-panel')).toHaveCount(0)

        const trigger = mobileFilters.getByRole('button', { name: 'Filters' })
        await expect(trigger).toBeVisible()
        await trigger.click()

        const panel = mobileFilters.locator('.customer-filter-panel')
        await expect(panel).toBeVisible()
        await expect(panel.locator('select')).toHaveCount(route.fieldCount)
        await expect(panel.getByRole('button', { name: 'Clear all' })).toBeVisible()
        await expect(panel.getByRole('button', { name: 'Apply' })).toBeVisible()
        await panel.getByRole('button', { name: 'Clear all' }).click()
        await panel.getByRole('button', { name: 'Apply' }).click()
        await expect(panel).toHaveCount(0)
      } else {
        await expect(desktopFilters).toBeVisible()
        await expect(mobileFilters).toBeHidden()
        await expect(desktopFilters.locator('select')).toHaveCount(route.fieldCount)

        if (testInfo.project.name === 'desktop') {
          const searchBox = await desktopFilters.locator('input[type="search"]').boundingBox()
          const selectBoxes = await desktopFilters.locator('select').evaluateAll((elements) =>
            elements.map((element) => {
              const box = element.getBoundingClientRect()
              return { x: box.x, y: box.y }
            }),
          )
          expect(searchBox).not.toBeNull()
          expect(selectBoxes.length).toBe(route.fieldCount)
          expect(selectBoxes.every((box) => Math.abs(box.y - searchBox!.y) <= 1)).toBeTruthy()
          expect(selectBoxes.every((box) => box.x > searchBox!.x)).toBeTruthy()
        }
      }

      await assertNoDocumentOverflow(page)
    }
  })

  test('WhatsApp actions remain text-only', async ({ page }) => {
    for (const path of ['/support', '/profile']) {
      await page.goto(path)
      await expect(page.locator('app-whatsapp-icon')).toHaveCount(0)
      await expect(page.locator('av-icon[name="whatsapp"]')).toHaveCount(0)
    }
  })

  test('desktop Developer tools are isolated from customer actions and routes', async ({ page }, testInfo) => {
    await page.goto('/manage-users')

    const trigger = page.locator('.developer-tools__trigger')
    if (isMobileProject(testInfo)) {
      await expect(trigger).toBeHidden()
      return
    }

    await expect(trigger).toBeVisible()
    const invite = page.getByRole('button', { name: /invite user/i })
    const triggerBox = await trigger.boundingBox()
    const inviteBox = await invite.boundingBox()
    expect(triggerBox).not.toBeNull()
    expect(inviteBox).not.toBeNull()
    expect(boxesOverlap(triggerBox!, inviteBox!)).toBeFalsy()

    await trigger.click()
    const menu = page.getByRole('menu', { name: 'Developer tools' })
    await expect(menu).toBeVisible()
    await expect(menu.getByRole('menuitem')).toHaveText(['Design Lab', 'Changelog'])

    await menu.getByRole('menuitem', { name: 'Design Lab' }).click()
    await expect(page).toHaveURL(/\/design-lab$/)
    await expect(page.getByRole('heading', { name: 'Customer portal design lab', level: 1 })).toBeVisible()

    await page.locator('.developer-tools__trigger').click()
    await page.getByRole('menuitem', { name: 'Changelog' }).click()
    await expect(page).toHaveURL(/\/changelog$/)
    await expect(page.getByRole('heading', { name: 'Changelog', level: 1 })).toBeVisible()
  })

  test('Design Lab reflects the pinned package, terminology and locked assets', async ({ page }, testInfo) => {
    await page.goto('/design-lab')
    await expect(page.getByRole('heading', { name: 'Customer portal design lab', level: 1 })).toBeVisible()
    await expect(page.getByText('@avenews/design-system 1.9.0', { exact: true })).toBeVisible()
    await expect(page.getByText('4dd1b7b28e9e9a7744c73eb9bb7c8dd1a560900e', { exact: true })).toBeVisible()
    await expect(page.locator('.locked-brand__logo')).toBeVisible()
    await expect(page.locator('.locked-nav-item')).toHaveCount(6)
    await expect(page.getByText('Supplier Financing (INF)', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Supplier Financing Express (SFX)', { exact: true })).toHaveCount(0)

    const productSelect = page.getByRole('combobox', { name: 'Product' })
    await productSelect.click()
    await expect(page.getByRole('option', { name: 'Invoice Financing (INF)' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Invoice Financing Express (INFX)' })).toBeVisible()
    await page.getByRole('option', { name: 'Invoice Financing Express (INFX)' }).click()
    await expect(productSelect).toContainText('Invoice Financing Express (INFX)')

    if (isMobileProject(testInfo)) {
      await expect(page.locator('.lab-table')).toBeHidden()
      await expect(page.locator('.lab-cards')).toBeVisible()
    } else {
      await expect(page.locator('.lab-table')).toBeVisible()
      await expect(page.locator('.lab-cards')).toBeHidden()
    }

    await assertNoDocumentOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('design-lab.png'), fullPage: true })
  })

  test('prepared staging changelog renders the complete PR baseline entry', async ({ page }, testInfo) => {
    await page.goto('/changelog')
    await expect(page.getByRole('heading', { name: 'Changelog', level: 1 })).toBeVisible()
    await expect(page.getByText('PR #1', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Design-ready Angular customer portal foundation', level: 2 })).toBeVisible()
    await expect(page.getByText('Stefan — ChatGPT-assisted', { exact: true })).toBeVisible()
    await expect(page.getByText('No staging changes recorded yet', { exact: true })).toHaveCount(0)
    await assertNoDocumentOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('changelog.png'), fullPage: true })
  })

  test('Home summary links hand off the correct Financing Activity view', async ({ page }) => {
    await page.goto('/')
    await page.getByText('Payments Overdue', { exact: true }).click()
    await expect(page).toHaveURL(/\/financing-activity\?view=overdue$/)
    await expect(page.locator('.baseline-view-chip')).toContainText('Payments overdue')
  })

  test('Invite User dialog preserves source fields, consent and responsive bounds', async ({ page }, testInfo) => {
    await page.goto('/manage-users')
    await page.getByRole('button', { name: /invite user/i }).click()

    const dialog = page.locator('.invite-user-modal')
    await expect(dialog).toBeVisible()
    await expect(page.getByLabel('First name*')).toBeVisible()
    await expect(page.getByLabel('Last name*')).toBeVisible()
    await expect(page.getByLabel('Email*')).toBeVisible()
    await expect(page.getByLabel('Phone number*')).toBeVisible()
    await expect(page.getByText('Funds Request Terms & Conditions.', { exact: true })).toBeVisible()

    const dialogBox = await dialog.boundingBox()
    const viewport = page.viewportSize()
    expect(dialogBox).not.toBeNull()
    expect(viewport).not.toBeNull()
    expect(dialogBox!.y).toBeGreaterThan(8)
    expect(dialogBox!.y + dialogBox!.height).toBeLessThan(viewport!.height - 8)
    if (!isMobileProject(testInfo)) expect(dialogBox!.width).toBeLessThanOrEqual(480)

    await assertNoDocumentOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('invite-user-modal.png'), fullPage: true })
    await page.getByRole('button', { name: 'Close' }).click()
  })

  test('mobile action sheets remain bottom anchored', async ({ page }, testInfo) => {
    test.skip(!isMobileProject(testInfo), 'Mobile action-sheet placement check')

    await page.goto('/available-financing/cl_asf_twiga')
    await page.getByRole('button', { name: 'Upload invoices' }).click()
    const sheet = page.locator('.baseline-modal--sheet')
    await expect(sheet).toBeVisible()
    const sheetBox = await sheet.boundingBox()
    const viewport = page.viewportSize()
    expect(sheetBox).not.toBeNull()
    expect(viewport).not.toBeNull()
    expect(Math.abs(sheetBox!.y + sheetBox!.height - viewport!.height)).toBeLessThanOrEqual(2)
  })
})

test.describe('prototype login flow', () => {
  test('email OTP routes through verification before entering the product selector', async ({ page }, testInfo) => {
    await page.goto('/login')
    await page.locator('input[type="email"]').fill('qa.customer@example.com')
    await page.getByRole('button', { name: /send code/i }).click()

    await expect(page.getByRole('heading', { name: 'Verification code', level: 1 })).toBeVisible()
    await expect(page.locator('.login-destination')).toHaveText('qa.customer@example.com')
    await expect(page.locator('.login-resend')).toContainText(/Resend code in \d+/)
    await assertNoDocumentOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('verification-code-email.png'), fullPage: true })

    await page.locator('input[autocomplete="one-time-code"]').fill('123456')
    await page.getByRole('button', { name: 'Verify' }).click()
    await expect(page).toHaveURL(/\/access$/)
    await expect(page.getByRole('heading', { name: 'What would you like to manage?', level: 2 })).toBeVisible()
  })

  test('phone OTP routes through verification before entering the product selector', async ({ page }, testInfo) => {
    await page.goto('/login')
    await page.getByRole('tab', { name: 'Phone number' }).click()
    await page.locator('input[type="tel"]').fill('712 345 678')
    await page.getByRole('button', { name: /send code/i }).click()

    await expect(page.getByRole('heading', { name: 'Verification code', level: 1 })).toBeVisible()
    await expect(page.locator('.login-destination')).toHaveText('712 345 678')
    await assertNoDocumentOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('verification-code-phone.png'), fullPage: true })

    await page.locator('input[autocomplete="one-time-code"]').fill('654321')
    await page.getByRole('button', { name: 'Verify' }).click()
    await expect(page).toHaveURL(/\/access$/)
    await expect(page.getByRole('heading', { name: 'What would you like to manage?', level: 2 })).toBeVisible()
  })
})

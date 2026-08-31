import { expect, test, type Page, type TestInfo } from '@playwright/test'

const SESSION_KEY = 'av_customer_portal_session'
const SCENARIO_KEY = 'av_experience_scenario'
const SESSION = {
  contactId: 'usr_001',
  contactFirstName: 'Amara',
  contactLastName: 'Osei',
  contactEmail: 'amara.osei@kiokoagri.co.ke',
  businessId: 'biz_demo_001',
  businessName: 'Kioko Agri Supplies Ltd',
  role: 'admin',
}

const LIST_ROUTES = [
  { path: '/available-financing', container: '.customer-list-page' },
  { path: '/financing-activity', container: '.customer-list-page' },
  { path: '/invoices', container: '.customer-list-page' },
  { path: '/manage-users', container: '.customer-list-page' },
  { path: '/experience/abf/financing', container: '.contextual-financing' },
  { path: '/experience/invoice-financing/invoices', container: '.invoice-workspace' },
  { path: '/experience/invoice-financing/request-funds', container: '.request-hub' },
] as const

function expectedIntroToFiltersGap(testInfo: TestInfo): number {
  return testInfo.project.name === 'mobile' || testInfo.project.name === 'minimum-mobile' ? 20 : 24
}

async function signIn(page: Page): Promise<void> {
  await page.addInitScript(({ sessionKey, scenarioKey, session }) => {
    localStorage.setItem(sessionKey, JSON.stringify(session))
    sessionStorage.setItem(scenarioKey, 'multiple')
  }, { sessionKey: SESSION_KEY, scenarioKey: SCENARIO_KEY, session: SESSION })
}

test.describe('list intro and filter spacing', () => {
  test.beforeEach(async ({ page }) => signIn(page))

  for (const route of LIST_ROUTES) {
    test(`${route.path} keeps the shared intro-to-filter spacing`, async ({ page }, testInfo) => {
      await page.goto(route.path)

      const container = page.locator(route.container).first()
      const filterBar = container.locator('app-customer-filter-bar').first()
      await expect(container).toBeVisible()
      await expect(filterBar).toBeVisible()

      const display = await container.evaluate(element => getComputedStyle(element).display)
      expect(display).toBe('grid')

      const firstChild = container.locator(':scope > *').first()
      const introBox = await firstChild.boundingBox()
      const filterBox = await filterBar.boundingBox()
      expect(introBox).not.toBeNull()
      expect(filterBox).not.toBeNull()

      const gap = Math.round(filterBox!.y - (introBox!.y + introBox!.height))
      expect(gap).toBe(expectedIntroToFiltersGap(testInfo))
    })
  }
})

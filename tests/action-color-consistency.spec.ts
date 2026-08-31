import { expect, test, type Locator, type Page } from '@playwright/test'

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

const PRIMARY_ACTION_BLUE = 'rgb(22, 179, 196)'
const INVOICE_UPLOAD_GREEN = 'rgb(57, 193, 115)'
const NEUTRAL_ACTION = 'rgb(255, 255, 255)'

async function signIn(page: Page): Promise<void> {
  await page.addInitScript(
    ({ sessionKey, scenarioKey, session }) => {
      localStorage.setItem(sessionKey, JSON.stringify(session))
      sessionStorage.setItem(scenarioKey, 'multiple')
    },
    { sessionKey: SESSION_KEY, scenarioKey: SCENARIO_KEY, session: SESSION },
  )
}

async function expectActionColor(button: Locator, expected: string): Promise<void> {
  await expect(button).toBeVisible()
  await expect(button).toHaveCSS('background-color', expected)
}

test.describe('action colour consistency', () => {
  test.beforeEach(async ({ page }) => signIn(page))

  test('financing requests use the same primary action blue across customer products', async ({ page }) => {
    for (const productId of ['acl', 'abf', 'stf', 'infx'] as const) {
      await page.goto(`/experience/${productId}/home`)
      const request = page.locator('[data-action="request-financing"]:visible').first()
      await expect(request).toHaveText('Request funds')
      await expectActionColor(request, PRIMARY_ACTION_BLUE)
    }

    await page.goto('/experience/invoice-financing/home')
    const periodRequest = page.locator('[data-action="request-financing"]:visible').first()
    await expect(periodRequest).toHaveText('Request funds')
    await expectActionColor(periodRequest, PRIMARY_ACTION_BLUE)

    await page.goto('/experience/abf/financing')
    const relationshipRequest = page.locator('[data-action="request-financing"]:visible:not(:disabled)')
      .filter({ hasText: 'Request funds' })
      .first()
    await expectActionColor(relationshipRequest, PRIMARY_ACTION_BLUE)
  })

  test('invoice upload actions use the same green in customer and Partner Buyer flows', async ({ page }) => {
    await page.goto('/experience/invoice-financing/invoices')
    const customerUpload = page.locator('[data-action="invoice-upload"]:visible').first()
    await expect(customerUpload).toHaveText('Upload invoices')
    await expectActionColor(customerUpload, INVOICE_UPLOAD_GREEN)

    await page.goto('/experience/invoice-financing/financing')
    const relationshipUpload = page.locator('[data-action="invoice-upload"]:visible').first()
    await expect(relationshipUpload).toHaveText('Upload invoices')
    await expectActionColor(relationshipUpload, INVOICE_UPLOAD_GREEN)
    await relationshipUpload.click()
    const submitInvoice = page.locator('.invoice-upload-modal').getByRole('button', { name: 'Submit invoice', exact: true })
    await expectActionColor(submitInvoice, INVOICE_UPLOAD_GREEN)

    await page.goto('/experience/invoice-partner/home')
    const partnerHomeUpload = page.locator('[data-action="invoice-upload"]:visible').first()
    await expect(partnerHomeUpload).toHaveText('Upload invoices')
    await expectActionColor(partnerHomeUpload, INVOICE_UPLOAD_GREEN)

    await page.goto('/experience/invoice-partner/invoice-uploads')
    const uploadPageAction = page.locator('[data-action="upload-invoices"]:visible').first()
    await expectActionColor(uploadPageAction, INVOICE_UPLOAD_GREEN)

    await page.goto('/experience/invoice-partner/suppliers')
    const supplierUpload = page.getByRole('button', { name: 'Upload invoices', exact: true }).first()
    await expectActionColor(supplierUpload, INVOICE_UPLOAD_GREEN)

    await supplierUpload.click()
    const modalUpload = page.locator('section[aria-labelledby="partner-upload-title"]')
      .getByRole('button', { name: 'Upload invoices', exact: true })
    await expectActionColor(modalUpload, INVOICE_UPLOAD_GREEN)
  })

  test('view and navigation actions remain neutral instead of borrowing action colours', async ({ page }) => {
    await page.goto('/experience/invoice-partner/home')
    await expectActionColor(page.getByRole('button', { name: 'View suppliers', exact: true }).first(), NEUTRAL_ACTION)

    await page.goto('/experience/invoice-partner/obligations')
    const viewPayment = page.locator('button:visible').filter({ hasText: /^View payment$/ }).first()
    await expectActionColor(viewPayment, NEUTRAL_ACTION)

    await page.goto('/experience/abf/financing')
    const viewRelationship = page.locator('button:visible').filter({ hasText: /^View more$/ }).first()
    await expectActionColor(viewRelationship, NEUTRAL_ACTION)
  })
})

import { test, expect, type Page, type Locator } from '@playwright/test'

const session = { contactId: 'usr_001', contactFirstName: 'Amara', contactLastName: 'Osei', contactEmail: 'amara@example.test', businessId: 'biz_demo_001', businessName: 'Kioko Agri Supplies Ltd', role: 'admin' }
const file = (name: string) => ({ name, mimeType: name.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.ms-excel', buffer: Buffer.from('Independent review fixture') })
const periods = (page: Page) => page.locator('.customer-activity-table tbody tr:visible,.customer-activity-cards .customer-financing-card:visible')
async function home(page: Page) {
  await page.goto('/experience/invoice-financing/home')
  await expect(page.locator('h1').first()).toHaveText('Invoice Financing')
  await page.evaluate(() => document.fonts.ready)
}
async function openUpload(page: Page) {
  await home(page)
  await page.getByRole('button', { name: 'Upload invoices', exact: true }).click()
  const modal = page.getByRole('dialog')
  await expect(modal.locator('.invoice-upload-group')).toHaveCount(1)
  return modal
}
async function chooseFresh(section: Locator) {
  await section.getByRole('combobox').fill('FreshProduce')
  await section.getByRole('option').filter({ hasText: 'FreshProduce Kenya Ltd' }).click()
}
async function complete(section: Locator, date = '2026-09-30', name = 'invoice.xlsx') {
  await chooseFresh(section)
  await section.locator('input[type="date"]').fill(date)
  await section.locator('input[type="file"]').first().setInputFiles(file(name))
  await section.locator('input[type="file"]').last().setInputFiles(file('delivery.pdf'))
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(s => localStorage.setItem('av_customer_portal_session', JSON.stringify(s)), session)
})

test('second pass: keyboard selection skips buyer-managed uploads and Escape preserves form state', async ({ page }) => {
  const modal = await openUpload(page)
  const input = modal.getByRole('combobox')
  await input.focus()
  await expect(modal.getByRole('option').filter({ hasText: 'Twiga Foods' })).toBeDisabled()
  await input.press('ArrowDown')
  await input.press('Enter')
  await expect(input).toHaveValue('FreshProduce Kenya Ltd')
  await modal.locator('input[type="date"]').fill('2026-09-30')
  await modal.locator('input[type="file"]').first().setInputFiles(file('invoice.xlsx'))
  await modal.locator('input[type="file"]').last().setInputFiles(file('delivery.pdf'))
  await modal.getByRole('checkbox').check()
  await input.fill('No such buyer exists')
  await expect(modal.getByRole('listbox')).toContainText('No matching buyers')
  await input.press('Escape')
  await expect(modal.getByRole('listbox')).toHaveCount(0)
  await expect(input).toHaveValue('FreshProduce Kenya Ltd')
  await expect(modal.getByRole('checkbox')).toBeChecked()
  await expect(modal).toContainText('delivery.pdf')
  await input.press('Escape')
  await expect(modal).toContainText('Discard the invoices')
  await modal.getByRole('button', { name: 'Keep editing' }).click()
  await expect(modal.getByRole('combobox')).toHaveValue('FreshProduce Kenya Ltd')
  await expect(modal).toContainText('invoice.xlsx')
  await expect(modal.getByRole('checkbox')).toBeChecked()
})

test('second pass: file chooser is clickable and accepts spreadsheet files through the real input', async ({ page }) => {
  const modal = await openUpload(page)
  await chooseFresh(modal)
  const chooserEvent = page.waitForEvent('filechooser')
  await modal.locator('.invoice-file-chooser').first().click()
  const picker = await chooserEvent
  expect(picker.isMultiple()).toBeTruthy()
  await picker.setFiles([file('selected.xls'), file('selected.csv')])
  await expect(modal).toContainText('selected.xls')
  await expect(modal).toContainText('selected.csv')
  await modal.getByRole('button', { name: 'Remove selected.xls', exact: true }).click()
  await expect(modal.locator('.invoice-upload-file').filter({ hasText: 'selected.xls' })).toHaveCount(0)
  await expect(modal).toContainText('selected.csv')
})

test('second pass: file-count boundary blocks eleven invoices without losing files', async ({ page }) => {
  const modal = await openUpload(page)
  await complete(modal)
  const input = modal.locator('input[type="file"]').first()
  await modal.getByRole('button', { name: 'Remove invoice.xlsx', exact: true }).click()
  await input.setInputFiles(Array.from({ length: 11 }, (_, i) => file(`batch-${i + 1}.xlsx`)))
  await modal.getByRole('checkbox').check()
  await modal.getByRole('button', { name: 'Submit invoices', exact: true }).click()
  await expect(modal.getByRole('alert')).toContainText('1 to 10 invoice files')
  await expect(modal.locator('.invoice-upload-file')).toHaveCount(12)
  await modal.getByRole('button', { name: 'Remove batch-11.xlsx', exact: true }).click()
  await expect(modal.getByRole('checkbox')).not.toBeChecked()
  await modal.getByRole('checkbox').check()
  await modal.getByRole('button', { name: 'Submit invoices', exact: true }).click()
  await expect(modal.getByRole('status')).toContainText('awaiting review')
})

test('second pass: copied sections require files and prevent duplicate buyer due-date groups', async ({ page }) => {
  const modal = await openUpload(page)
  await complete(modal)
  await modal.getByRole('button', { name: 'Copy section 1', exact: true }).click()
  const second = modal.locator('.invoice-upload-group').nth(1)
  await expect(second.getByRole('combobox')).toHaveValue('FreshProduce Kenya Ltd')
  await expect(second.locator('.invoice-upload-file')).toHaveCount(0)
  await second.locator('input[type="file"]').first().setInputFiles(file('second.xlsx'))
  await second.locator('input[type="file"]').last().setInputFiles(file('second-delivery.pdf'))
  await modal.getByRole('checkbox').check()
  await modal.getByRole('button', { name: 'Submit invoices', exact: true }).click()
  await expect(modal.getByRole('alert')).toContainText('one section for the same buyer, supplier and due date')
  await second.locator('input[type="date"]').fill('2026-10-15')
  await expect(modal.getByRole('checkbox')).not.toBeChecked()
  await modal.getByRole('checkbox').check()
  await modal.getByRole('button', { name: 'Submit invoices', exact: true }).click()
  await expect(modal.getByRole('status')).toContainText('2 sets of invoices are awaiting review')
  await modal.getByRole('button', { name: 'Done', exact: true }).click()
  await expect(page.locator('.customer-summary-card').first()).toContainText('970,000')
  await expect(page.locator('.customer-summary-card').nth(1)).toContainText('1,300,000')
  await expect(page.locator('.customer-summary-card').nth(2)).toContainText('2 payments due')
})

test('second pass: empty filtered results remain clearable and a card action replaces old filters', async ({ page }) => {
  await home(page)
  await page.getByRole('button', { name: 'View available periods', exact: true }).click()
  await page.locator('.customer-filter-search input:visible').fill('No matching business')
  const summary = page.locator('.customer-filter-summary')
  await expect(summary).toContainText('Available to request')
  await expect(page.locator('.baseline-empty:visible').first()).toBeVisible()
  await expect(summary.getByRole('button', { name: 'Clear filters' })).toBeEnabled()
  await summary.getByRole('button', { name: 'Clear filters' }).click()
  await expect(periods(page)).toHaveCount(6)
  await page.getByRole('button', { name: 'View available periods', exact: true }).click()
  await page.getByRole('button', { name: 'View payments due in Financing', exact: true }).click()
  await expect(summary).toContainText('Payments due')
  await expect(summary).not.toContainText('Available to request')
  await expect(periods(page)).toHaveCount(2)
})

test('second pass: all three period actions align correctly and Files Back keeps period context', async ({ page }, info) => {
  await home(page)
  await periods(page).filter({ hasText: 'DP-2026-09-15-TWIGA' }).click()
  let modal = page.getByRole('dialog')
  const actions = modal.locator('.customer-period-footer-actions > button')
  await expect(actions).toHaveCount(3)
  const boxes = await Promise.all((await actions.all()).map(action => action.boundingBox()))
  if (page.viewportSize()!.width >= 768) {
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i]!.y).toBeCloseTo(boxes[0]!.y, 0)
      expect(boxes[i]!.x).toBeGreaterThan(boxes[i - 1]!.x + boxes[i - 1]!.width)
    }
  } else {
    for (let i = 1; i < boxes.length; i++) expect(boxes[i]!.y).toBeGreaterThan(boxes[i - 1]!.y + boxes[i - 1]!.height)
  }
  await modal.getByRole('button', { name: 'Files', exact: true }).click()
  modal = page.getByRole('dialog')
  await expect(modal).toContainText('DP-2026-09-15-TWIGA')
  await expect(modal.getByRole('button', { name: 'Back', exact: true }).locator('svg')).toHaveCount(1)
  await modal.getByRole('button', { name: 'Back', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('Twiga Foods Ltd')
  await page.screenshot({ path: info.outputPath('three-actions-and-back.png') })
})

test('second pass: dropdown remains clickable and bounded in a short viewport', async ({ page }, info) => {
  const modal = await openUpload(page)
  const width = page.viewportSize()!.width
  await page.setViewportSize({ width, height: 480 })
  await modal.getByRole('combobox').scrollIntoViewIfNeeded()
  await modal.getByRole('combobox').fill('FreshProduce')
  const option = modal.getByRole('option').filter({ hasText: 'FreshProduce Kenya Ltd' })
  const box = await option.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.y).toBeGreaterThanOrEqual(0)
  expect(box!.y + box!.height).toBeLessThanOrEqual(480)
  // Visibility alone does not prove that a clipped overlay can receive a click.
  expect(await option.evaluate(element => {
    const r = element.getBoundingClientRect()
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    return !!hit && element.contains(hit)
  })).toBeTruthy()
  await page.screenshot({ path: info.outputPath('short-viewport-dropdown.png') })
  await option.click()
  await expect(modal.getByRole('combobox')).toHaveValue('FreshProduce Kenya Ltd')
  await expect(modal.locator('.party-select__hint')).toHaveText('You upload invoices')
})

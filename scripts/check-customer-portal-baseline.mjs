import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const errors = []

function read(path) {
  const absolute = resolve(root, path)
  if (!existsSync(absolute)) {
    errors.push(`Missing required baseline file: ${path}`)
    return ''
  }
  return readFileSync(absolute, 'utf8')
}

function requireText(content, value, description) {
  if (!content.includes(value)) {
    errors.push(`${description}: expected ${JSON.stringify(value)}`)
  }
}

function forbidText(content, value, description) {
  if (content.includes(value)) {
    errors.push(`${description}: found forbidden ${JSON.stringify(value)}`)
  }
}

const shellTs = read('src/app/layouts/portal-shell/portal-shell.component.ts')
const shellHtml = read('src/app/layouts/portal-shell/portal-shell.component.html')
const shellCss = read('src/app/layouts/portal-shell/portal-shell.component.css')
const homeHtml = read('src/app/features/home/home.component.html')
const detailHtml = read('src/app/features/available-financing/available-financing-detail.component.html')
const rootStyles = read('src/styles.css')
const parityCss = read('src/app/shared/customer-portal-parity-overrides.css')
const contract = read('docs/CUSTOMER_PORTAL_BASELINE.md')
const responsiveSpec = read('tests/customer-portal-responsive.spec.ts')
const playwrightConfig = read('playwright.config.ts')
const responsiveWorkflow = read('.github/workflows/responsive-audit.yml')

const iconContract = [
  ["label: 'Home', icon: 'home'", 'Home navigation icon'],
  ["label: 'Available Financing', icon: 'wallet'", 'Available Financing navigation icon'],
  ["label: 'Financing Activity', icon: 'bar-chart'", 'Financing Activity navigation icon'],
  ["label: 'Invoices & Documents', icon: 'receipt'", 'Invoices navigation icon'],
  ["label: 'Support', icon: 'help-circle'", 'Support navigation icon'],
  ["label: 'Manage Users',\n  icon: 'person'", 'Manage Users navigation icon'],
]

for (const [value, description] of iconContract) {
  requireText(shellTs, value, description)
}

forbidText(shellTs, "label: 'Financing Activity', icon: 'cash'", 'Approximate activity icon is not allowed')
forbidText(shellTs, "label: 'Manage Users', icon: 'users'", 'Approximate Manage Users icon is not allowed')
forbidText(shellHtml, 'name="users"', 'Hard-coded users icon is not allowed in the customer shell')

requireText(shellHtml, '@for (item of mobileNavItems; track item.path)', 'Mobile navigation must use the locked four-item list')
requireText(shellHtml, 'ariaCurrentWhenActive="page"', 'Navigation links must expose the active page')
requireText(shellHtml, 'aria-label="Customer portal (mobile)"', 'Mobile navigation landmark')

requireText(shellCss, 'height: 56px;', 'Mobile toolbar height')
requireText(shellCss, '@media (min-width: 768px)', 'Desktop shell breakpoint')
requireText(shellCss, 'width: var(--portal-sidebar-width, 240px);', 'Desktop sidebar width')
requireText(shellCss, 'background: var(--av-color-primary-subtle, #eefbfc);', 'Active navigation background')
requireText(shellCss, 'grid-template-columns: repeat(var(--cols), minmax(0, 1fr));', 'Four-column mobile navigation')

requireText(rootStyles, '--portal-sidebar-width: 240px;', 'Root sidebar token')
requireText(rootStyles, '--portal-content-max: 1200px;', 'Root content-width token')
requireText(rootStyles, "@import './app/shared/customer-portal-parity-overrides.css';", 'Responsive parity stylesheet import')

for (const view of ['active', 'due', 'overdue']) {
  requireText(homeHtml, `[queryParams]="{ view: '${view}' }"`, `Home summary hand-off for ${view}`)
}

requireText(detailHtml, 'baseline-modal-backdrop--sheet', 'Credit-line action backdrop must remain a sheet')
requireText(detailHtml, 'baseline-modal--sheet', 'Credit-line action modal must remain a sheet')
requireText(parityCss, '@media (min-width: 768px)', 'Cross-route tablet/desktop breakpoint')
requireText(parityCss, '@media (max-width: 480px)', 'Home summary narrow-mobile breakpoint')
requireText(parityCss, '@media (max-width: 400px)', 'Invite form narrow-mobile breakpoint')
requireText(parityCss, '.baseline-modal-backdrop--sheet', 'Sheet-only modal modifier')

requireText(contract, '| Financing Activity | `BarChart3` | `bar-chart` |', 'Documented activity icon contract')
requireText(contract, '| Manage Users | `User` | `person` |', 'Documented Manage Users icon contract')
requireText(contract, '1440 × 900', 'Desktop audit viewport')
requireText(contract, '768 × 1024', 'Tablet audit viewport')
requireText(contract, '390 × 844', 'Mobile audit viewport')

requireText(playwrightConfig, "name: 'desktop'", 'Desktop responsive test project')
requireText(playwrightConfig, "name: 'tablet'", 'Tablet responsive test project')
requireText(playwrightConfig, "name: 'mobile'", 'Mobile responsive test project')
requireText(playwrightConfig, "name: 'minimum-mobile'", 'Minimum-width responsive test project')
requireText(responsiveSpec, "shared navigation shell matches the customer portal contract", 'Shared shell responsive test')
requireText(responsiveWorkflow, 'Customer portal responsive audit', 'Responsive audit workflow')

if (errors.length > 0) {
  console.error('Customer portal baseline check failed:\n')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log('Customer portal baseline contract is intact.')

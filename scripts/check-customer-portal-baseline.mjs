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
const navIcon = read('src/app/layouts/portal-shell/portal-nav-icon.component.ts')
const shellCss = read('src/app/layouts/portal-shell/portal-shell.component.css')
const homeHtml = read('src/app/features/home/home.component.html')
const detailHtml = read('src/app/features/available-financing/available-financing-detail.component.html')
const rootStyles = read('src/styles.css')
const parityCss = read('src/app/shared/customer-portal-parity-overrides.css')
const precisionCss = read('src/app/shared/customer-portal-precision-fixes.css')
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
forbidText(shellHtml, '<av-icon [name]="item.icon"', 'Customer navigation must not use substituted design-system glyphs')
requireText(shellHtml, '<app-portal-nav-icon [name]="item.icon"></app-portal-nav-icon>', 'Desktop and mobile navigation must render the locked source glyph component')
requireText(shellHtml, '<app-portal-nav-icon [name]="adminNavItem.icon"></app-portal-nav-icon>', 'Manage Users must render the locked source glyph component')

const exactGlyphPaths = [
  ['M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8', 'Home Lucide geometry'],
  ['M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15', 'Wallet Lucide geometry'],
  ['M3 3v16a2 2 0 0 0 2 2h16', 'BarChart3 Lucide geometry'],
  ['M12 17V7', 'Receipt Lucide geometry'],
  ['M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3', 'HelpCircle Lucide geometry'],
  ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 'User Lucide geometry'],
]

for (const [value, description] of exactGlyphPaths) {
  requireText(navIcon, value, description)
}
requireText(navIcon, 'stroke-width="2"', 'Navigation glyph stroke width')
requireText(navIcon, 'width="16"', 'Navigation glyph size')

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
requireText(rootStyles, "@import './app/shared/customer-portal-precision-fixes.css';", 'Precision parity stylesheet import')

requireText(precisionCss, '.baseline-hero h1 {\n  font-size: 32px;', 'Desktop customer page heading size')
requireText(precisionCss, '@media (max-width: 767px)', 'Mobile precision breakpoint')
requireText(precisionCss, 'font-size: 26px;', 'Mobile customer page heading size')
requireText(precisionCss, 'padding-right: 40px;', 'Select chevron content clearance')
requireText(precisionCss, 'background-position: right 12px center;', 'Select chevron right inset')
requireText(precisionCss, '.baseline-table th.is-right,\n.baseline-table td.is-right {\n  text-align: left;', 'All customer table columns remain left aligned')
requireText(precisionCss, '.manage-users-page .baseline-table td:nth-child(2)', 'Manage Users email-cell truncation selector')
requireText(precisionCss, 'text-overflow: ellipsis;', 'Manage Users email ellipsis')
requireText(precisionCss, '.profile-button .avenews-avatar__initials', 'Sidebar avatar initial size')

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
requireText(contract, 'exact Lucide artwork', 'Documented exact navigation artwork rule')
requireText(contract, '1440 × 900', 'Desktop audit viewport')
requireText(contract, '768 × 1024', 'Tablet audit viewport')
requireText(contract, '390 × 844', 'Mobile audit viewport')

requireText(playwrightConfig, "name: 'desktop'", 'Desktop responsive test project')
requireText(playwrightConfig, "name: 'tablet'", 'Tablet responsive test project')
requireText(playwrightConfig, "name: 'mobile'", 'Mobile responsive test project')
requireText(playwrightConfig, "name: 'minimum-mobile'", 'Minimum-width responsive test project')
requireText(responsiveSpec, 'shared navigation shell matches the customer portal contract', 'Shared shell responsive test')
requireText(responsiveSpec, 'prototype typography, table alignment, selects, and email truncation stay locked', 'Precision prototype regression test')
requireText(responsiveWorkflow, 'Customer portal responsive audit', 'Responsive audit workflow')

if (errors.length > 0) {
  console.error('Customer portal baseline check failed:\n')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log('Customer portal baseline contract is intact.')

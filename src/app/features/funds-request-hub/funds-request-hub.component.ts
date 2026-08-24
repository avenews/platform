import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import {
  customerWorkspaceById,
  type CustomerFinancingPeriod,
  type CustomerRelationship,
  type CustomerWorkspace,
} from '../../core/experience/customer-product-workspace.data'
import { experienceById, type PortalExperience } from '../../core/experience/contextual-experience.data'
import { ACL_FUNDS_REQUEST_DEMO_URL } from '../../core/experience/experience-links'
import { formatDate, formatKes } from '../../shared/customer-portal.data'

@Component({
  selector: 'app-funds-request-hub',
  standalone: true,
  template: `
    <div class="portal-page request-hub">
      <section class="request-hub__hero">
        <div>
          <h1>Request funds</h1>
          <p>{{ intro }}</p>
        </div>
      </section>

      @if (workspace?.id === 'acl') {
        <section class="baseline-card request-hub__acl">
          <div>
            <h2>Start a Funds Request</h2>
            <p>Request financing for an approved purchase and upload the transaction documents in the Funds Request form.</p>
          </div>
          <button type="button" class="baseline-button baseline-button--primary" (click)="openAclRequest()">Request funds</button>
        </section>
      } @else if (workspace?.id === 'invoice-financing') {
        <section class="baseline-section" aria-labelledby="available-periods-title">
          <div class="baseline-section-heading">
            <div>
              <h2 id="available-periods-title">Available financing periods</h2>
              <p>Choose a buyer and due date with financing available.</p>
            </div>
          </div>

          <div class="baseline-table-wrap">
            <table class="baseline-table request-hub__table">
              <thead><tr><th>Buyer</th><th>Invoice Due Date</th><th>Available Financing</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                @for (period of availablePeriods; track period.id) {
                  <tr>
                    <td><span class="baseline-financing-cell"><strong>{{ period.relationshipName }}</strong><span>{{ period.reference }}</span></span></td>
                    <td>{{ formatDate(period.repaymentDueDate, true) }}</td>
                    <td><strong>{{ formatKes(period.availableToWithdraw ?? 0) }}</strong></td>
                    <td><span class="baseline-status" [class]="'baseline-status ' + period.statusTone">{{ period.statusLabel }}</span></td>
                    <td><button type="button" class="baseline-button baseline-button--primary" (click)="requestFromPeriod(period)">Request funds</button></td>
                  </tr>
                } @empty {
                  <tr><td colspan="5"><div class="baseline-empty"><strong>No financing is available to request right now</strong><p>New availability will appear here when eligible invoices are approved.</p></div></td></tr>
                }
              </tbody>
            </table>
          </div>

          <div class="baseline-cards request-hub__cards">
            @for (period of availablePeriods; track period.id) {
              <article class="baseline-record-card">
                <div class="baseline-record-card__head">
                  <span class="baseline-financing-cell"><strong>{{ period.relationshipName }}</strong><span>{{ period.reference }}</span></span>
                  <span class="baseline-status" [class]="'baseline-status ' + period.statusTone">{{ period.statusLabel }}</span>
                </div>
                <div class="baseline-metrics">
                  <span class="baseline-metric"><small>Invoice Due Date</small><strong>{{ formatDate(period.repaymentDueDate, true) }}</strong></span>
                  <span class="baseline-metric"><small>Available Financing</small><strong>{{ formatKes(period.availableToWithdraw ?? 0) }}</strong></span>
                </div>
                <button type="button" class="baseline-button baseline-button--primary baseline-button--block" (click)="requestFromPeriod(period)">Request funds</button>
              </article>
            } @empty {
              <div class="baseline-empty"><strong>No financing is available to request right now</strong><p>New availability will appear here when eligible invoices are approved.</p></div>
            }
          </div>
        </section>
      } @else {
        <section class="baseline-section" aria-labelledby="request-relationships-title">
          <div class="baseline-section-heading">
            <div>
              <h2 id="request-relationships-title">{{ relationshipHeading }}</h2>
              <p>{{ relationshipIntro }}</p>
            </div>
          </div>

          <div class="baseline-table-wrap">
            <table class="baseline-table request-hub__table">
              <thead><tr><th>{{ relationshipLabel }}</th><th>Available Financing</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                @for (relationship of requestRelationships; track relationship.id) {
                  <tr>
                    <td><strong>{{ relationship.name }}</strong></td>
                    <td><strong>{{ formatKes(relationship.available) }}</strong></td>
                    <td><span class="baseline-status" [class]="relationship.available > 0 ? 'baseline-status status-success' : 'baseline-status status-neutral'">{{ relationship.available > 0 ? 'Available' : 'Unavailable' }}</span></td>
                    <td><button type="button" class="baseline-button baseline-button--primary" [disabled]="!canRequest(relationship)" (click)="requestFromRelationship(relationship)">Request funds</button></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="baseline-cards request-hub__cards">
            @for (relationship of requestRelationships; track relationship.id) {
              <article class="baseline-record-card">
                <div class="baseline-record-card__head"><strong>{{ relationship.name }}</strong><span class="baseline-status" [class]="relationship.available > 0 ? 'baseline-status status-success' : 'baseline-status status-neutral'">{{ relationship.available > 0 ? 'Available' : 'Unavailable' }}</span></div>
                <div class="baseline-metrics"><span class="baseline-metric"><small>Available Financing</small><strong>{{ formatKes(relationship.available) }}</strong></span></div>
                <button type="button" class="baseline-button baseline-button--primary baseline-button--block" [disabled]="!canRequest(relationship)" (click)="requestFromRelationship(relationship)">Request funds</button>
              </article>
            }
          </div>
        </section>
      }
    </div>

    @if (toast) { <button type="button" class="baseline-toast" (click)="toast = ''">{{ toast }}</button> }
  `,
  styles: [`
    :host { display: block; }
    .request-hub { gap: 20px; }
    .request-hub__hero { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; }
    .request-hub__hero > div { display: grid; gap: 6px; }
    .request-hub__hero h1, .request-hub__hero p { margin: 0; }
    .request-hub__hero h1 { color: var(--av-color-text-heading, #0d343f); font-size: 32px; line-height: 1.15; }
    .request-hub__hero p, .request-hub__acl p { max-width: 720px; color: var(--av-color-text-muted, #66788a); font-size: 13px; line-height: 1.55; }
    .request-hub__acl { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 22px; }
    .request-hub__acl > div { display: grid; gap: 6px; }
    .request-hub__acl h2, .request-hub__acl p { margin: 0; }
    .request-hub__table { min-width: 760px; }
    .request-hub__cards { display: none; }
    @media (max-width: 767px) {
      .request-hub__hero h1 { font-size: 26px; }
      .request-hub__acl { display: grid; }
      .request-hub__acl .baseline-button { width: 100%; }
      .baseline-table-wrap { display: none; }
      .request-hub__cards { display: grid; gap: 12px; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FundsRequestHubComponent {
  private readonly route = inject(ActivatedRoute)

  readonly experience: PortalExperience = this.resolveExperience()
  readonly workspace: CustomerWorkspace | undefined = customerWorkspaceById(this.experience.id)
  readonly formatDate = formatDate
  readonly formatKes = formatKes
  toast = ''

  private resolveExperience(): PortalExperience {
    const id = this.route.parent?.snapshot.paramMap.get('experienceId')
    return experienceById(id) ?? experienceById('acl')!
  }

  get intro(): string {
    if (this.workspace?.id === 'invoice-financing') return 'Choose a financing period with funds available and submit a request.'
    if (this.workspace?.id === 'abf') return 'Choose a supplier and request financing for an eligible invoice.'
    if (this.workspace?.id === 'stf') return 'Choose a Partner Supplier and request financing for an approved purchase.'
    if (this.workspace?.id === 'infx') return 'Choose a buyer and request financing for one approved invoice.'
    return 'Request financing for an approved purchase.'
  }

  get relationshipLabel(): string {
    if (this.workspace?.id === 'abf' || this.workspace?.id === 'stf') return 'Supplier'
    return 'Buyer'
  }

  get relationshipHeading(): string {
    return this.relationshipLabel === 'Supplier' ? 'Choose a supplier' : 'Choose a buyer'
  }

  get relationshipIntro(): string {
    return `Select a ${this.relationshipLabel.toLowerCase()} with financing available.`
  }

  get requestRelationships(): readonly CustomerRelationship[] {
    return this.workspace?.relationships ?? []
  }

  get availablePeriods(): readonly CustomerFinancingPeriod[] {
    if (this.workspace?.id !== 'invoice-financing') return []
    return [...this.workspace.periods]
      .filter(period => this.canRequestFromPeriod(period))
      .sort((a, b) => a.repaymentDueDate.localeCompare(b.repaymentDueDate))
  }

  canRequest(relationship: CustomerRelationship): boolean {
    return relationship.available > 0 && relationship.fundsRequestEnabled !== false
  }

  requestFromRelationship(relationship: CustomerRelationship): void {
    if (!this.canRequest(relationship)) return
    if (relationship.fundsRequestUrl) {
      const opened = window.open(relationship.fundsRequestUrl, '_blank', 'noopener,noreferrer')
      if (opened) opened.opener = null
      else this.toast = 'Your browser blocked the Funds Request tab. Allow pop-ups and try again.'
      return
    }
    this.toast = `Funds Request started for ${relationship.name}.`
  }

  requestFromPeriod(period: CustomerFinancingPeriod): void {
    if (!this.canRequestFromPeriod(period)) return
    this.toast = `You can request up to ${formatKes(period.availableToWithdraw ?? 0)} from this financing period.`
  }

  openAclRequest(): void {
    const opened = window.open(ACL_FUNDS_REQUEST_DEMO_URL, '_blank', 'noopener,noreferrer')
    if (opened) opened.opener = null
    else this.toast = 'Your browser blocked the Funds Request tab. Allow pop-ups and try again.'
  }

  private canRequestFromPeriod(period: CustomerFinancingPeriod): boolean {
    if ((period.availableToWithdraw ?? 0) <= 0) return false
    if (period.statusKey !== 'live' && period.statusKey !== 'requested') return false
    const dueDate = new Date(`${period.repaymentDueDate}T00:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const daysToDue = Math.ceil((dueDate.getTime() - today.getTime()) / 86_400_000)
    return daysToDue >= 7 && daysToDue <= 60
  }
}

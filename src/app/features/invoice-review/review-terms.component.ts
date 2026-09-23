import { Component, Input } from '@angular/core'
import { formatKes } from '../../shared/customer-portal.data'
import { InvoiceRole, ReviewRelationship, percent } from './invoice-review.store'
import { ReviewHelpComponent } from './review-help.component'

@Component({
  selector: 'app-review-terms', standalone: true, imports: [ReviewHelpComponent],
  styleUrl: './invoice-review.shared.css',
  template: `
    <section class="review-stack" aria-label="Relationship terms">
      <div><h3 class="review-section-title">Relationship terms<app-review-help label="Relationship terms" text="Terms apply to this supplier and buyer relationship. These are clearly labelled sample values for review, not a statement of approved customer terms." /></h3><p class="review-small">Sample terms for review. Production values must come from the approved relationship.</p></div>
      <dl class="review-definition-grid">
        <div><dt>Payment terms<app-review-help label="Payment terms" text="The buyer pays the full invoice balance on the agreed invoice due date. Invoices are grouped into periods by supplier, buyer and due date." /></dt><dd>{{ relationship.paymentTerms }}</dd></div>
        <div><dt>Invoice uploads<app-review-help label="Invoice uploads" text="The party configured to upload invoices for this relationship. This can differ from the normal partner or counterparty arrangement." /></dt><dd>{{ uploadLabel }}</dd></div>
        <div><dt>Proof of Delivery<app-review-help label="Proof of Delivery" text="Delivery evidence is required only where configured for this relationship. Missing configuration must be resolved before submission." /></dt><dd>{{ relationship.pod === null ? 'Not configured' : relationship.pod ? 'Required with invoice upload' : 'Not required at upload' }}</dd></div>
        <div><dt>Settlement destination<app-review-help label="Settlement destination" text="The designated client clearing account managed by Avenews, not a generic collections account. See the specific payment for its account details and reference." /></dt><dd>{{ relationship.clearing ? 'Designated client clearing account' : 'Awaiting clearing-account details' }}</dd></div>
        @if (role === 'supplier') {
          <div><dt>Buyer sub-limit<app-review-help label="Buyer sub-limit" text="The financing exposure permitted for this buyer within your total approved limit. Buyer sub-limits are not additional credit and must not be added together to calculate your total limit." /></dt><dd>{{ formatKes(relationship.sublimit) }}</dd></div>
          <div><dt>Advance rate<app-review-help label="Advance rate" text="The percentage of eligible receivables that can support financing. Available financing is also limited by credit, amounts already drawn, reservations and the funding window." /></dt><dd>{{ percent(relationship.advanceRate) }} of eligible receivables</dd></div>
          <div><dt>Daily markup<app-review-help label="Daily markup" text="The financing charge per financed day, applied to the approved and disbursed principal. Unused credit does not incur markup." /></dt><dd>{{ percent(relationship.dailyMarkup) }} per financed day</dd></div>
          <div><dt>Funds Request window<app-review-help label="Funds Request window" text="Requests can be submitted from 60 through 7 days before the invoice due date under the standard configuration. Uploads after the cutoff do not add financing capacity." /></dt><dd>{{ relationship.maxDays }} to {{ relationship.minDays }} days before the invoice due date</dd></div>
          <div><dt>Disbursement recipient<app-review-help label="Disbursement recipient" text="Once a Funds Request is approved, the financing is disbursed to the Client Supplier. An upload or pending request is not a disbursement." /></dt><dd>Your business</dd></div>
          <div><dt>Early settlement<app-review-help label="Early settlement" text="Invoice Financing has no early-settlement reward by default. A reward applies only where explicitly approved for the relationship." /></dt><dd>No early-settlement reward configured in this review</dd></div>
        } @else {
          <div><dt>Your rebate rate<app-review-help label="Your rebate rate" text="The partner rebate percentage agreed for this relationship. Rebate rates can differ between suppliers. The displayed rates are sample review values." /></dt><dd>{{ percent(relationship.rebateRate) }}</dd></div>
          <div><dt>Rebate basis<app-review-help label="Rebate basis" text="Rebate is earned on financed principal successfully collected by Avenews, not on invoice value, amounts disbursed, markup or uncollected principal." /></dt><dd>Principal collected by Avenews</dd></div>
        }
      </dl>
      @if (role === 'supplier') {
        <details class="review-note"><summary>How late payment and settlement work</summary><p>Buyer payments settle outstanding principal and applicable markup through the designated clearing account. Any remaining proceeds are transferred according to your financing agreement.</p><p>Under the standard terms, days 1–14 form a conditional grace period. When principal remains unpaid on day 15, late markup applies retroactively from day 1. From day 31, the base late rate increases to 1.5 times, subject to the applicable maximum charge cap.</p></details>
      } @else { <p class="review-note">Your rebate is separate from the supplier’s financing obligations. Do not deduct it from the invoice amount you need to pay.</p> }
    </section>
  `,
})
export class ReviewTermsComponent {
  @Input({required:true}) relationship!: ReviewRelationship
  @Input() role: InvoiceRole = 'supplier'
  readonly formatKes = formatKes
  readonly percent = percent
  get uploadLabel(): string {
    if (this.role === 'supplier') return this.relationship.owner === 'supplier' ? 'You upload invoices' : 'Buyer uploads invoices'
    return this.relationship.owner === 'buyer' ? 'You upload invoices' : 'Supplier uploads invoices'
  }
}

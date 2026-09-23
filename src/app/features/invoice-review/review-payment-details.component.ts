import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, inject } from '@angular/core'
import { InvoiceReviewStore, ReviewPeriod } from './invoice-review.store'
import { ReviewHelpComponent } from './review-help.component'

@Component({
  selector: 'app-review-payment-details', standalone: true, imports: [ReviewHelpComponent],
  styleUrl: './invoice-review.shared.css',
  template: `
    <section class="review-stack" aria-label="Clearing account payment instructions">
      <div><h3 class="review-section-title">Where to pay<app-review-help label="Where to pay" text="Use the designated clearing account for this supplier relationship and the payment reference for this period. Do not substitute the general Avenews collections account." /></h3><p class="review-small">Pay the outstanding invoice balance using these instructions.</p></div>
      @if (account; as details) {
        <p class="review-note"><strong>Demonstration only — do not pay.</strong> These non-payable sample details show the intended layout. Production must use the verified account assigned to this relationship.</p>
        @if (details.paybill) {
          <div class="review-tabs" role="tablist" aria-label="Payment method">
            <button type="button" role="tab" [attr.aria-selected]="method === 'bank'" (click)="method = 'bank'">Bank transfer</button>
            <button type="button" role="tab" [attr.aria-selected]="method === 'mpesa'" (click)="method = 'mpesa'">M-Pesa Paybill</button>
          </div>
        }
        <div class="review-copy-list">
          @for (field of fields; track field.label) {
            <div class="review-copy-row"><span><small>{{ field.label }}<app-review-help [label]="field.label" [text]="field.help" /></small><strong>{{ field.value }}</strong></span><button type="button" class="baseline-button baseline-button--secondary" [attr.aria-label]="'Copy ' + field.label.toLowerCase()" (click)="copy(field.value, field.label)">Copy</button></div>
          }
          <div class="review-copy-row"><span><small>Payment reference<app-review-help label="Payment reference" text="Include this reference with the transfer so the payment can be matched to the supplier and invoice period." /></small><strong>{{ store.paymentReference(period) }}</strong></span><button type="button" class="baseline-button baseline-button--secondary" aria-label="Copy payment reference" (click)="copy(store.paymentReference(period), 'Payment reference')">Copy</button></div>
        </div>
      } @else {
        <div class="review-note" role="status"><strong>Clearing-account details are not available yet.</strong><p>Contact Avenews to confirm the designated account before paying. Do not send money to a general collections account or another supplier’s account.</p><p>Payment reference: <strong>{{ store.paymentReference(period) }}</strong></p></div>
      }
      @if (message) { <p class="review-small" role="status" aria-live="polite">{{ message }}</p> }
      <p class="review-small">Avenews confirms and allocates received payments. Copying these details does not make a payment or change its status.</p>
    </section>
  `,
})
export class ReviewPaymentDetailsComponent implements OnChanges, OnDestroy {
  @Input({required:true}) period!: ReviewPeriod
  readonly store = inject(InvoiceReviewStore)
  private readonly cdr = inject(ChangeDetectorRef)
  private copyAttempt = 0
  private destroyed = false
  private timeout: ReturnType<typeof setTimeout> | undefined
  method: 'bank' | 'mpesa' = 'bank'
  message = ''
  ngOnChanges(): void { this.method = 'bank'; this.message = ''; this.copyAttempt++; clearTimeout(this.timeout) }
  ngOnDestroy(): void { this.destroyed = true; clearTimeout(this.timeout) }
  get account() { return this.store.relationship(this.period.relationshipId).clearing }
  get fields(): {label:string; value:string; help:string}[] {
    const account = this.account
    if (!account) return []
    if (this.method === 'mpesa' && account.paybill) return [
      {label:'Paybill number', value:account.paybill, help:'The Paybill configured for this designated clearing account. This is a non-payable demonstration value.'},
      {label:'Account name', value:account.name, help:'The beneficiary of the designated clearing account.'},
      {label:'M-Pesa account reference', value:account.mpesaReference ?? this.store.paymentReference(this.period), help:'Use the reference assigned to this clearing account; do not substitute a generic phone-number instruction.'},
    ]
    return [
      {label:'Bank', value:account.bank, help:'The bank holding the designated clearing account for this relationship.'},
      {label:'Account name', value:account.name, help:'The beneficiary of this relationship’s designated clearing account.'},
      {label:'Account number', value:account.number, help:'The account assigned to this supplier relationship. Demonstration values cannot be used for payment.'},
      {label:'Branch', value:account.branch, help:'The branch of the designated clearing account.'},
      {label:'Branch code', value:account.branchCode, help:'The routing branch code for this designated account.'},
    ]
  }
  async copy(value: string, label: string): Promise<void> {
    const attempt = ++this.copyAttempt
    clearTimeout(this.timeout)
    const update = (message: string): void => {
      if (this.destroyed || attempt !== this.copyAttempt) return
      this.message = message
      this.cdr.markForCheck()
    }
    this.message = `Copying ${label.toLowerCase()}...`
    const fallback = `Copy was blocked by your browser. Select and copy this ${label.toLowerCase()}: ${value}`
    this.timeout = setTimeout(() => update(fallback), 2500)
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(value)
      update(`${label} copied.`)
    } catch { update(fallback) }
    finally { if (attempt === this.copyAttempt) clearTimeout(this.timeout) }
  }
}

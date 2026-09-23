import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { formatDate, formatKes } from '../../shared/customer-portal.data'
import { InvoiceReviewStore, InvoiceRole, ReviewPeriod, percent } from './invoice-review.store'
import { ReviewDialogComponent } from './review-dialog.component'
import { ReviewHelpComponent } from './review-help.component'
import { ReviewInvoicesComponent } from './review-invoices.component'
import { ReviewPaymentDetailsComponent } from './review-payment-details.component'

type DetailView = 'main' | 'files' | 'payment' | 'request'
@Component({
  selector: 'app-review-period-dialog', standalone: true,
  imports: [FormsModule, ReviewDialogComponent, ReviewHelpComponent, ReviewInvoicesComponent, ReviewPaymentDetailsComponent],
  styleUrl: './invoice-review.shared.css',
  template: `
    <app-review-dialog [title]="period.reference" [subtitle]="counterpartName + ' · Due ' + formatDate(period.dueDate, true)" [backLabel]="view !== 'main' ? 'Back to period' : returnLabel" (back)="goBack()" (close)="close.emit()">
      <div class="review-stack">
        @if (view === 'main') {
          <div class="review-tabs" role="tablist" aria-label="Financing period details" (keydown)="tabKey($event)">
            <button type="button" role="tab" [id]="period.id + '-overview-tab'" [attr.aria-controls]="period.id + '-overview'" [attr.aria-selected]="tab === 'overview'" [attr.tabindex]="tab === 'overview' ? 0 : -1" (click)="tab = 'overview'">Overview</button>
            <button type="button" role="tab" [id]="period.id + '-invoices-tab'" [attr.aria-controls]="period.id + '-invoices'" [attr.aria-selected]="tab === 'invoices'" [attr.tabindex]="tab === 'invoices' ? 0 : -1" (click)="tab = 'invoices'">Invoices ({{ store.periodInvoices(period).length }})</button>
          </div>
          @if (tab === 'invoices') {
            <section role="tabpanel" [id]="period.id + '-invoices'" [attr.aria-labelledby]="period.id + '-invoices-tab'" class="review-stack">
              <p class="review-small">Only invoices linked to this financing period. Records without an attached file remain visible.</p>
              <app-review-invoices [role]="role" [periodId]="period.id" />
            </section>
          } @else {
            <section role="tabpanel" [id]="period.id + '-overview'" [attr.aria-labelledby]="period.id + '-overview-tab'" class="review-stack">
              @if (role === 'partner') {
                <article class="review-card review-metric"><span class="review-metric-label">Amount to pay<app-review-help label="Amount to pay" text="Full invoice value less buyer payments received and allocated. This is not the amount Avenews financed, and your rebate must not be deducted." /></span><strong class="review-metric-value">{{ formatKes(store.amountToPay(period)) }}</strong><small>{{ store.paymentStatus(period) }}</small></article>
                <dl class="review-definition-grid"><div><dt>Invoice value<app-review-help label="Invoice value" text="The sum of known invoice amounts linked to this period." /></dt><dd>{{ formatKes(store.invoiceValue(period)) }}</dd></div><div><dt>Payments allocated<app-review-help label="Payments allocated" text="Buyer payments received and matched to this invoice period. A copied payment reference or an initiated transfer is not an allocated payment." /></dt><dd>{{ formatKes(period.buyerPaid) }}</dd></div></dl>
                @if (store.amountToPay(period) > 0) { <app-review-payment-details [period]="period" /> }
                @else { <p class="review-success" role="status">This period’s invoice balance is fully paid. No further invoice payment is due.</p> }
              } @else {
                <dl class="review-definition-grid">
                  <div><dt>Available financing<app-review-help label="Available financing" text="The maximum additional financing you can request for this period now, subject to eligible invoices, the advance rate, your shared credit, buyer sub-limit, reservations and the funding window." /></dt><dd>{{ formatKes(store.available(period)) }}</dd></div>
                  <div><dt>Outstanding amount<app-review-help label="Outstanding amount" text="Disbursed principal that has not yet been repaid or collected. Pending requests, markup and late charges are not included in this figure." /></dt><dd>{{ formatKes(store.outstanding(period)) }}</dd></div>
                  <div><dt>Amount disbursed<app-review-help label="Amount disbursed" text="The total principal actually transferred to you against this period. Requests awaiting disbursement are excluded." /></dt><dd>{{ formatKes(period.disbursed) }}</dd></div>
                  <div><dt>Principal repaid<app-review-help label="Principal repaid" text="Payments successfully allocated to the principal financed against this period." /></dt><dd>{{ formatKes(period.principalCollected) }}</dd></div>
                  <div><dt>Reserved requests<app-review-help label="Reserved requests" text="Pending requested amounts set aside from your financing availability. They are not yet disbursed and cannot be used for another request." /></dt><dd>{{ formatKes(period.reserved) }}</dd></div>
                  <div><dt>Period status<app-review-help label="Period status" text="The state of this invoice period, not the approval status of an individual Funds Request." /></dt><dd>{{ store.periodStatus(period) }}</dd></div>
                  <div><dt>Disbursement date<app-review-help label="Disbursement date" text="The date of the disbursement represented by this review record. A period can have multiple advances in production." /></dt><dd>{{ period.disbursedDate ? formatDate(period.disbursedDate, true) : 'Not disbursed' }}</dd></div>
                  <div><dt>Eligible receivables<app-review-help label="Eligible receivables" text="The invoice amounts currently eligible to support financing. Applying the advance rate does not override limits, reservations or the funding cutoff." /></dt><dd>{{ formatKes(store.eligibleValue(period)) }}</dd></div>
                </dl>
                <p class="review-note">{{ store.availabilityReason(period) }} {{ percent(relationship.advanceRate) }} advance rate applies to eligible receivables.</p>
                @if (store.available(period) > 0) { <button type="button" class="baseline-button baseline-button--primary" (click)="startRequest()">Request funds</button> }
              }
            </section>
          }
          <div class="review-actions"><button type="button" class="baseline-button baseline-button--secondary" (click)="view = 'files'">Files</button>@if (role === 'supplier' && store.amountToPay(period) > 0) { <button type="button" class="baseline-button baseline-button--secondary" (click)="view = 'payment'">Repayment details</button> }</div>
        } @else if (view === 'files') {
          <div><h3 class="review-section-title">Files</h3><p class="review-small">Available source files for this period. The Invoices tab also includes records without files.</p></div>
          @if (role === 'supplier' && (period.disbursed > 0 || period.reserved > 0)) {
            <div class="review-file-row"><span><strong>Funds Request snapshot</strong><small>Sample PDF for review — not a new legal submission</small></span><a class="baseline-button baseline-button--secondary" href="/demo-documents/funds-request-snapshot-demo.pdf" target="_blank" rel="noopener noreferrer">View PDF</a></div>
          }
          @for (invoice of fileInvoices; track invoice.id) { <div class="review-file-row"><span><strong>{{ invoice.reference }}</strong><small>{{ invoice.fileName }}</small></span><a class="baseline-button baseline-button--secondary" [href]="invoice.fileUrl" target="_blank" rel="noopener noreferrer">View invoice</a></div> }
          @for (attachment of deliveryFiles; track attachment.id) { <div class="review-file-row"><span><strong>Proof of Delivery</strong><small>{{ attachment.fileName }}</small></span><a class="baseline-button baseline-button--secondary" [href]="attachment.fileUrl" target="_blank" rel="noopener noreferrer">View file</a></div> }
          @if (!fileInvoices.length && !deliveryFiles.length && !(role === 'supplier' && (period.disbursed > 0 || period.reserved > 0))) { <p class="review-note">No files are attached to this period.</p> }
          @if (role === 'supplier') { <p class="review-small">Production must attach the immutable snapshot generated for each submitted Funds Request. The existing sample PDF is retained for this review.</p> }
        } @else if (view === 'payment') {
          <article class="review-card review-metric"><span class="review-metric-label">Buyer invoice balance<app-review-help label="Buyer invoice balance" text="The full invoice amount your buyer still needs to pay, distinct from your outstanding financed principal." /></span><strong class="review-metric-value">{{ formatKes(store.amountToPay(period)) }}</strong><small>Payable by {{ relationship.buyer }}</small></article>
          <app-review-payment-details [period]="period" />
          <p class="review-note">Avenews allocates the buyer’s payment, settles the financing and applicable charges, then transfers the remaining proceeds according to your financing agreement.</p>
        } @else {
          @if (requestSaved) { <div class="review-success" role="status"><strong>Review request saved</strong><p>{{ formatKes(savedAmount) }} is now reserved in this tab. Your available financing has updated, but your disbursed outstanding amount has not changed.</p></div><p class="review-note">This is a simulation. No Funds Request was submitted to Avenews, no legal agreement was signed and no funds were disbursed.</p><button type="button" class="baseline-button baseline-button--secondary" (click)="view = 'main'">Back to period</button> }
          @else {
            <form class="review-stack" (ngSubmit)="saveRequest()" novalidate>
              <div><h3 class="review-section-title">Request funds</h3><p class="review-small">Review simulation — no real financing request is sent.</p></div>
              <p class="review-note">You can request up to {{ formatKes(store.available(period)) }} from this period. It shares your total approved credit with your other buyer relationships.</p>
              <div class="review-field"><label for="review-request-amount">Amount to request (KES)</label><input id="review-request-amount" name="request-amount" type="number" min="0.01" step="0.01" [max]="store.available(period)" [(ngModel)]="requestAmount" required></div>
              @if (requestError) { <p class="review-error" role="alert">{{ requestError }}</p> }
              <p class="review-small">The production Funds Request must confirm pricing and capture the required agreement before approval. This review action only demonstrates the reservation and updated availability.</p>
              <button type="submit" class="baseline-button baseline-button--primary">Save review request</button>
            </form>
          }
        }
      </div>
    </app-review-dialog>
  `,
})
export class ReviewPeriodDialogComponent implements OnChanges {
  readonly store = inject(InvoiceReviewStore)
  private readonly element: ElementRef<HTMLElement> = inject(ElementRef)
  @Input({required:true}) period!: ReviewPeriod
  @Input() role: InvoiceRole = 'supplier'
  @Input() returnLabel = ''
  @Input() initialRequest = false
  @Output() close = new EventEmitter<void>()
  @Output() back = new EventEmitter<void>()
  view: DetailView = 'main'
  tab: 'overview' | 'invoices' = 'overview'
  requestAmount: number | null = null
  requestError = ''
  requestSaved = false
  savedAmount = 0
  readonly formatKes = formatKes
  readonly formatDate = formatDate
  readonly percent = percent
  ngOnChanges(): void { this.view = this.initialRequest && this.role === 'supplier' ? 'request' : 'main'; this.tab = 'overview'; this.requestError=''; this.requestAmount=null; this.requestSaved=false }
  get relationship() { return this.store.relationship(this.period.relationshipId) }
  get counterpartName(): string { return this.role === 'supplier' ? this.relationship.buyer : this.relationship.supplier }
  get fileInvoices() { return this.store.periodInvoices(this.period).filter(i => !!i.fileUrl) }
  get deliveryFiles() { return this.store.attachments.filter(a => a.periodId === this.period.id) }
  goBack(): void { if (this.view !== 'main') this.view = 'main'; else this.back.emit() }
  startRequest(): void { this.view='request'; this.requestAmount=null; this.requestError=''; this.requestSaved=false }
  saveRequest(): void {
    if (this.role !== 'supplier' || this.requestSaved) return
    try {
      this.store.reserveForReview(this.period, Number(this.requestAmount))
      this.savedAmount = Number(this.requestAmount); this.requestSaved = true; this.requestError=''
    } catch (error) { this.requestError = error instanceof Error ? error.message : 'The review request could not be saved.' }
  }
  tabKey(event: KeyboardEvent): void {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return
    event.preventDefault()
    this.tab = event.key === 'Home' ? 'overview' : event.key === 'End' ? 'invoices' : this.tab === 'overview' ? 'invoices' : 'overview'
    this.element.nativeElement.querySelector<HTMLButtonElement>(`#${this.period.id}-${this.tab}-tab`)?.focus()
  }
}

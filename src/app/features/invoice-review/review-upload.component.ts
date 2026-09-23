import { Component, ElementRef, EventEmitter, Input, OnInit, Output, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { AuthService } from '../../core/auth/auth.service'
import { InvoiceReviewStore, InvoiceRole, UploadGroup, UploadReceipt, DELIVERY_CONFIRMATION, FILE_POLICY, dateDays } from './invoice-review.store'
import { ReviewDialogComponent } from './review-dialog.component'

let nextGroupId = 0
@Component({
  selector: 'app-review-upload', standalone: true, imports: [FormsModule, ReviewDialogComponent],
  styleUrl: './invoice-review.shared.css',
  template: `
    <app-review-dialog title="Upload invoices" [subtitle]="role === 'supplier' ? store.customer : store.partner" (close)="attemptClose()">
      @if (receipt; as saved) {
        <div class="review-stack">
          <div class="review-success" role="status"><strong>Review upload saved</strong><br>{{ saved.fileCount }} invoice file(s) in {{ saved.groupCount }} section(s). Nothing has been sent to Avenews.</div>
          <p class="review-note">The files and receipt are available in this browser tab until you reload. Invoice amounts and references remain pending review; this upload does not increase available financing.</p>
          <dl class="review-definition-grid"><div><dt>Receipt</dt><dd>{{ saved.id }}</dd></div><div><dt>Saved by</dt><dd>{{ saved.actor }}</dd></div><div><dt>Confirmation recorded</dt><dd>{{ readableTime(saved.confirmedAt) }}</dd></div><div><dt>Files</dt><dd>{{ saved.fileCount }} invoice files</dd></div></dl>
          <p class="review-small">{{ saved.confirmation }}</p>
          <div class="review-actions"><button type="button" class="baseline-button baseline-button--primary" (click)="done()">View invoices</button><button type="button" class="baseline-button baseline-button--secondary" (click)="downloadReceipt()">Save review receipt</button></div>
        </div>
      } @else {
        <form class="review-stack" (ngSubmit)="submit()" novalidate>
          <p class="review-note"><strong>Review mode.</strong> Use sample files only. Files stay in this tab; no CRM record, email or production upload is created.</p>
          <p class="review-subtitle">Use one section for each {{ counterpart.toLowerCase() }} and invoice due date. Add up to 10 invoice files per section, then add another section for a different relationship or due date.</p>
          @if (error) { <p class="review-error" id="review-upload-error" tabindex="-1" role="alert">{{ error }}</p> }
          @if (notice) { <p class="review-small" role="status">{{ notice }}</p> }
          @for (group of groups; track group.id; let index = $index) {
            <section class="review-group" [attr.aria-labelledby]="group.id + '-title'">
              <div class="review-group-head"><h3 [id]="group.id + '-title'">Section {{ index + 1 }}</h3><div class="review-actions">
                <button type="button" class="baseline-button baseline-button--secondary" [disabled]="groups.length >= policy.maxGroups" [attr.aria-label]="'Copy section ' + (index + 1)" (click)="copyGroup(group)">Copy</button>
                <button type="button" class="baseline-button baseline-button--secondary" [disabled]="groups.length === 1" [attr.aria-label]="'Delete section ' + (index + 1)" (click)="deleteGroup(group)">Delete</button>
              </div></div>
              <div class="review-fields">
                <div class="review-field"><label [for]="group.id + '-relationship'">{{ counterpart }} *</label><select [id]="group.id + '-relationship'" [name]="group.id + '-relationship'" [(ngModel)]="group.relationshipId" (ngModelChange)="relationshipChanged(group)" required><option value="">Choose a {{ counterpart.toLowerCase() }}</option>@for (r of uploadRelationships; track r.id) { <option [value]="r.id">{{ role === 'supplier' ? r.buyer : r.supplier }}</option> }</select></div>
                <div class="review-field"><label [for]="group.id + '-date'">Invoice due date *</label><input type="date" [id]="group.id + '-date'" [name]="group.id + '-date'" [(ngModel)]="group.dueDate" [min]="store.asOf" (ngModelChange)="changed()" required><small class="review-small">{{ store.asOf }} or later in this review.</small></div>
              </div>
              @if (cutoffNotice(group)) { <p class="review-note">{{ cutoffNotice(group) }}</p> }
              <div class="review-field"><label [for]="group.id + '-files'">Invoice files *</label><input type="file" multiple [id]="group.id + '-files'" [accept]="invoiceAccept" (change)="addFiles(group, 'files', $event)"><small class="review-small">{{ invoiceFormats }}. Up to 10 files, 10 MB each. Keep all files in this section for the selected {{ counterpart.toLowerCase() }} and due date.</small></div>
              <div class="review-file-list">@for (file of group.files; track $index) { <div class="review-file-row"><span>{{ file.name }}<small>{{ fileSize(file.size) }}</small></span><button type="button" class="baseline-button baseline-button--secondary" [attr.aria-label]="'Remove invoice ' + file.name" (click)="removeFile(group, 'files', $index)">Remove</button></div> }</div>
              @if (requiresPod(group)) {
                <div class="review-field"><label [for]="group.id + '-pod'">Proof of Delivery *</label><input type="file" multiple [id]="group.id + '-pod'" accept=".pdf,.jpg,.jpeg,.png" (change)="addFiles(group, 'pod', $event)"><small class="review-small">Required for this relationship. Add matching delivery evidence: PDF, JPG or PNG, up to 10 files, 10 MB each.</small></div>
                <div class="review-file-list">@for (file of group.pod; track $index) { <div class="review-file-row"><span>{{ file.name }}<small>{{ fileSize(file.size) }}</small></span><button type="button" class="baseline-button baseline-button--secondary" [attr.aria-label]="'Remove delivery evidence ' + file.name" (click)="removeFile(group, 'pod', $index)">Remove</button></div> }</div>
              } @else if (group.relationshipId && podUnknown(group)) { <p class="review-error">Proof of Delivery requirements have not been configured. Contact Avenews before uploading for this relationship.</p> }
            </section>
          }
          <div class="review-actions"><button type="button" class="baseline-button baseline-button--secondary" [disabled]="groups.length >= policy.maxGroups" (click)="addGroup()">+ Add section</button><span class="review-small">{{ groups.length }} of {{ policy.maxGroups }} sections</span></div>
          <label class="review-confirmation"><input type="checkbox" name="delivery-confirmation" [(ngModel)]="confirmed" (ngModelChange)="confirm($event)"><span>{{ declaration }} Your identity and confirmation time are included in the review receipt.</span></label>
          <div class="review-actions"><button type="submit" class="baseline-button baseline-button--primary review-upload" [disabled]="saving || !uploadRelationships.length">{{ saving ? 'Saving review upload...' : 'Save review upload' }}</button><button type="button" class="baseline-button baseline-button--secondary" (click)="attemptClose()">Cancel</button></div>
          <p class="review-small">Need help? WhatsApp or call +254-111-133-300. This preview does not replace the signed, verified production submission process.</p>
        </form>
        @if (discardOpen) { <div class="review-error" role="alert"><strong>Discard this upload?</strong><p>The selected files and unfinished sections will be removed.</p><div class="review-actions"><button type="button" class="baseline-button baseline-button--secondary" (click)="discardOpen = false">Keep editing</button><button type="button" class="baseline-button baseline-button--secondary" (click)="close.emit()">Discard upload</button></div></div> }
      }
    </app-review-dialog>
  `,
})
export class ReviewUploadComponent implements OnInit {
  readonly store = inject(InvoiceReviewStore)
  private readonly auth = inject(AuthService)
  private readonly element = inject(ElementRef<HTMLElement>)
  @Input() role: InvoiceRole = 'supplier'
  @Input() relationshipId = ''
  @Output() close = new EventEmitter<void>()
  @Output() saved = new EventEmitter<UploadReceipt>()
  readonly policy = FILE_POLICY
  readonly declaration = DELIVERY_CONFIRMATION
  groups: UploadGroup[] = []
  confirmed = false
  confirmedAt = ''
  saving = false
  discardOpen = false
  error = ''
  notice = ''
  receipt: UploadReceipt | null = null
  private receiptUrl = ''
  ngOnInit(): void { this.groups = [this.newGroup(this.relationshipId)] }
  get counterpart(): string { return this.role === 'supplier' ? 'Buyer' : 'Supplier' }
  get uploadRelationships() { return this.store.relationshipsFor(this.role).filter(r => this.store.canUpload(r, this.role)) }
  get invoiceAccept(): string { return this.role === 'supplier' ? '.pdf,.jpg,.jpeg,.png' : '.pdf,.jpg,.jpeg,.png,.csv,.xlsx' }
  get invoiceFormats(): string { return this.role === 'supplier' ? 'PDF, JPG or PNG' : 'PDF, JPG, PNG, CSV or XLSX' }
  newGroup(relationshipId = ''): UploadGroup { return {id:`upload-group-${++nextGroupId}`, relationshipId, dueDate:'', files:[], pod:[]} }
  addGroup(): void { if (this.groups.length < this.policy.maxGroups) { this.groups.push(this.newGroup()); this.changed() } }
  copyGroup(group: UploadGroup): void {
    if (this.groups.length >= this.policy.maxGroups) return
    this.groups.push({...this.newGroup(group.relationshipId), dueDate:group.dueDate})
    this.changed(); this.notice = 'Section copied without files. Choose a different due date or relationship, then add the matching files.'
  }
  deleteGroup(group: UploadGroup): void { if (this.groups.length > 1) { this.groups = this.groups.filter(g => g !== group); this.changed() } }
  changed(): void { this.confirmed = false; this.confirmedAt = ''; this.error = ''; this.notice = ''; this.discardOpen = false }
  relationshipChanged(group: UploadGroup): void { group.pod = []; this.changed() }
  requiresPod(group: UploadGroup): boolean { return !!group.relationshipId && this.store.relationship(group.relationshipId).pod === true }
  podUnknown(group: UploadGroup): boolean { return this.store.relationship(group.relationshipId).pod === null }
  cutoffNotice(group: UploadGroup): string {
    if (!group.relationshipId || !group.dueDate) return ''
    const days = dateDays(this.store.asOf, group.dueDate), r = this.store.relationship(group.relationshipId)
    if (days >= 0 && days < r.minDays) return 'This due date is past the funding cutoff. You may upload the invoices, but they will not create additional financing availability for this period.'
    if (days > r.maxDays) return `You may upload now. Financing requests open ${r.maxDays} days before the due date, subject to eligibility and available credit.`
    return ''
  }
  addFiles(group: UploadGroup, kind: 'files' | 'pod', event: Event): void {
    const input = event.target as HTMLInputElement, files = Array.from(input.files ?? [])
    input.value = ''
    if (!files.length) return
    this.changed()
    if (group[kind].length + files.length > this.policy.maxFiles) { this.showError('Add no more than 10 files to each file field.'); return }
    const allowed = kind === 'pod' || this.role === 'supplier' ? this.policy.documentExtensions : this.policy.extensions
    if (files.some(file => !allowed.includes(file.name.split('.').pop()?.toLowerCase() ?? '') || file.size === 0 || file.size > this.policy.maxBytes)) {
      this.showError('Check your files: use the listed formats, with a non-empty file no larger than 10 MB. No files from this selection were added.'); return
    }
    group[kind].push(...files)
  }
  removeFile(group: UploadGroup, kind: 'files' | 'pod', index: number): void { group[kind].splice(index,1); this.changed() }
  confirm(value: boolean): void { this.confirmedAt = value ? new Date().toISOString() : ''; this.error = '' }
  submit(): void {
    if (this.saving || this.receipt) return
    this.error = ''
    try {
      this.store.validateUpload(this.groups, this.role)
      if (!this.confirmed) throw new Error('Confirm that the invoices reflect completed, undisputed deliveries before saving.')
      const session = this.auth.getSession()
      if (!session) throw new Error('Your review session has ended. Sign in again before uploading.')
      this.saving = true
      this.receipt = this.store.saveUpload(this.groups, this.role, `${session.contactFirstName} ${session.contactLastName}`, session.contactId, this.confirmedAt)
    } catch (error) { this.showError(error instanceof Error ? error.message : 'The review upload could not be saved. Please try again.') }
    finally { this.saving = false }
  }
  showError(message: string): void { this.error=message; setTimeout(() => this.element.nativeElement.querySelector<HTMLElement>('#review-upload-error')?.focus()) }
  attemptClose(): void {
    if (this.receipt) { this.close.emit(); return }
    if (this.groups.some(g => g.files.length || g.pod.length || g.dueDate) || this.groups.length > 1) { this.discardOpen = true; return }
    this.close.emit()
  }
  done(): void { if (this.receipt) this.saved.emit(this.receipt) }
  fileSize(bytes: number): string { return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB` }
  readableTime(value: string): string { return new Date(value).toLocaleString('en-KE', {timeZone:'Africa/Nairobi'}) + ' EAT' }
  downloadReceipt(): void {
    if (!this.receipt) return
    const blob = new Blob([JSON.stringify({...this.receipt, notice:'Browser-only review receipt. Not a production upload or legal submission.'}, null, 2)], {type:'application/json'})
    const url = URL.createObjectURL(blob), link = document.createElement('a')
    link.href=url; link.download=`${this.receipt.id}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}

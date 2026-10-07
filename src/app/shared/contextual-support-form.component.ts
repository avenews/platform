import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'

@Component({
  selector: 'app-contextual-support-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="contextual-support-form" aria-label="Support request">
      <div class="support-context"><small>About</small><strong>{{ contextLabel }}</strong></div>

      <form class="baseline-form" (ngSubmit)="submitRequest()">
        <input type="hidden" name="period" [value]="periodReference" />
        <input type="hidden" name="relationship" [value]="relationshipId" />
        @if (paymentReference) { <input type="hidden" name="payment" [value]="paymentReference" /> }

        <div class="baseline-field">
          <label for="context-support-type">What do you need help with?</label>
          <select id="context-support-type" class="baseline-control" [(ngModel)]="requestType" name="type" required>
            @for (item of requestTypes; track item.value) {
              <option [value]="item.value">{{ item.label }}</option>
            }
          </select>
        </div>

        <div class="baseline-field">
          <label for="context-support-message">Message</label>
          <textarea id="context-support-message" class="baseline-textarea" placeholder="Tell us what you need help with." [(ngModel)]="message" name="message" rows="4" maxlength="2000"></textarea>
        </div>

        <button type="submit" class="baseline-button baseline-button--primary baseline-button--block" [disabled]="!canSubmit || submitting">{{ submitting ? 'Submitting...' : 'Submit request' }}</button>
      </form>

      @if (confirmation) {
        <div class="support-confirmation" role="status" aria-live="polite">{{ confirmation }}</div>
      }
    </section>
  `,
  styles: [`
    :host{display:block;min-width:0}
    .contextual-support-form{display:grid;gap:16px;min-width:0}
    .support-context{display:grid;gap:3px;padding:12px 14px;border:1px solid var(--av-color-primary-border,#bdeff3);border-radius:8px;background:var(--av-color-primary-subtle,#eefbfc)}
    .support-context small{color:var(--av-color-text-muted,#66788a);font-size:11px}
    .support-context strong{color:var(--av-color-text-heading,#0d343f);font-size:13px;overflow-wrap:anywhere}
    .support-confirmation{padding:12px 14px;border:1px solid var(--av-color-success,#39c173);border-radius:8px;background:var(--av-color-success-subtle,#ecfdf3);color:var(--av-color-success-text,#027a48);font-size:12px;line-height:1.5}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContextualSupportFormComponent {
  private readonly cdr=inject(ChangeDetectorRef)

  @Input() contextLabel=''
  @Input() periodReference=''
  @Input() relationshipId=''
  @Input() paymentReference=''

  private currentDefaultType='financing-period-question'
  @Input() set defaultType(value:string) {
    this.currentDefaultType=value || 'financing-period-question'
    this.requestType=this.currentDefaultType
  }

  readonly requestTypes=[
    {value:'financing-period-question',label:'Financing period question'},
    {value:'funds-request-issue',label:'Problem requesting funds'},
    {value:'cancellation-request',label:'Request cancellation'},
    {value:'payment-question',label:'Payment question'},
    {value:'other',label:'Something else'},
  ]

  requestType='financing-period-question'
  message=''
  submitting=false
  confirmation=''

  get canSubmit():boolean { return Boolean(this.requestType && this.message.trim()) }

  submitRequest():void {
    if(!this.canSubmit)return
    this.submitting=true
    this.confirmation=''
    window.setTimeout(()=>{
      this.submitting=false
      this.message=''
      this.confirmation="Your request has been received. We'll respond within one business day."
      this.cdr.markForCheck()
    },450)
  }
}

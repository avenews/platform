import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support.component.html',
  styleUrl: './support.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportComponent {
  private readonly cdr = inject(ChangeDetectorRef)
  private readonly route = inject(ActivatedRoute)
  readonly requestTypes = [
    { value: 'business-info-wrong', label: 'My business information is wrong' },
    { value: 'contact-info-wrong', label: 'My contact information is wrong' },
    { value: 'repayment-question', label: 'Repayment question' },
    { value: 'funds-request-issue', label: 'Problem requesting funds' },
    { value: 'cancellation-request', label: 'Request cancellation' },
    { value: 'financing-period-question', label: 'Financing period question' },
    { value: 'invoice-processing', label: 'Invoice processing issue' },
    { value: 'other', label: 'Something else' },
  ]

  readonly contextEntries = ['invoice','period','payment','upload','file','supplier','buyer','relationship']
    .map(key=>({key,value:this.route.snapshot.queryParamMap.get(key)??''}))
    .filter(item=>Boolean(item.value))
  get contextLabel():string {
    const period=this.contextEntries.find(item=>item.key==='period')?.value
    const invoice=this.contextEntries.find(item=>item.key==='invoice')?.value
    const payment=this.contextEntries.find(item=>item.key==='payment')?.value
    const upload=this.contextEntries.find(item=>item.key==='upload')?.value
    return invoice?`invoice ${invoice}`:period?`financing period ${period}`:payment?`payment ${payment}`:upload?`upload ${upload}`:''
  }

  type = this.requestTypes.some(item=>item.value===this.route.snapshot.queryParamMap.get('type')) ? this.route.snapshot.queryParamMap.get('type')! : ''
  message = ''
  submitting = false
  toast = ''

  get canSubmit(): boolean {
    return Boolean(this.type && this.message.trim())
  }

  submitRequest(): void {
    if (!this.canSubmit) return
    this.submitting = true
    window.setTimeout(() => {
      this.submitting = false
      this.type = ''
      this.message = ''
      this.toast = "Your request has been received. We'll respond within one business day."
      this.cdr.markForCheck()
    }, 450)
  }

  openWhatsApp(): void {
    window.open('https://wa.me/254111133300', '_blank', 'noopener,noreferrer')
  }

  openFaq(): void {
    window.open('https://www.avenews.io', '_blank', 'noopener,noreferrer')
  }
}

import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { WhatsAppIconComponent } from '../../shared/whatsapp-icon.component'

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, FormsModule, WhatsAppIconComponent],
  templateUrl: './support.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportComponent {
  private readonly cdr = inject(ChangeDetectorRef)
  readonly requestTypes = [
    { value: 'business-info-wrong', label: 'My business information is wrong' },
    { value: 'contact-info-wrong', label: 'My contact information is wrong' },
    { value: 'repayment-question', label: 'Repayment question' },
    { value: 'funds-request-issue', label: 'Funds Request issue' },
    { value: 'invoice-question', label: 'Invoice question' },
    { value: 'other', label: 'Something else' },
  ]

  type = ''
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

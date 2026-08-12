import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core'
import { Router } from '@angular/router'
import {
  AvButtonDirective,
  AvIconComponent,
  AvInputComponent,
  AvSegmentComponent,
  type SegmentOption,
} from '@avenews/design-system/angular'
import { AuthService } from '../../core/auth/auth.service'

type LoginStep = 'idle' | 'loading' | 'success' | 'error'
type InputMethod = 'email' | 'phone'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\+?[0-9\s-]{7,15}$/

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    AvButtonDirective,
    AvIconComponent,
    AvInputComponent,
    AvSegmentComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly auth = inject(AuthService)
  private readonly router = inject(Router)
  private readonly cdr = inject(ChangeDetectorRef)

  step: LoginStep = 'idle'
  method: InputMethod = 'email'
  emailValue = ''
  phoneValue = ''
  touched = false
  serverError = ''

  readonly segmentOptions: SegmentOption[] = [
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone number' },
  ]

  get currentValue(): string {
    return this.method === 'email' ? this.emailValue : this.phoneValue
  }

  get inlineError(): string | null {
    if (!this.touched || !this.currentValue.trim()) return null
    if (this.method === 'email' && !EMAIL_RE.test(this.currentValue)) {
      return 'Enter a valid email address.'
    }
    if (this.method === 'phone' && !PHONE_RE.test(this.currentValue)) {
      return 'Enter a valid phone number.'
    }
    return null
  }

  get displayedError(): string | null {
    return this.inlineError ?? (this.serverError || null)
  }

  get isValid(): boolean {
    return Boolean(this.currentValue.trim()) && this.inlineError === null
  }

  onMethodChange(value: string): void {
    this.method = value as InputMethod
    this.touched = false
    this.serverError = ''
    this.cdr.markForCheck()
  }

  async handleSubmit(): Promise<void> {
    this.touched = true
    this.serverError = ''
    this.cdr.markForCheck()
    if (!this.isValid) return

    this.step = 'loading'
    this.cdr.markForCheck()
    await new Promise(resolve => setTimeout(resolve, 1400))

    if (this.currentValue.toLowerCase().includes('error')) {
      this.step = 'error'
      this.serverError = 'Something went wrong. Please try again.'
      this.cdr.markForCheck()
      return
    }

    this.step = 'success'
    this.cdr.markForCheck()
    await new Promise(resolve => setTimeout(resolve, 1200))

    // The legacy customer portal seeded one customer session after OTP success.
    // Keep the same single-path experience; role review remains available inside
    // the authenticated design workspace rather than on the customer login form.
    this.auth.login('admin')
    void this.router.navigate(['/'])
  }
}

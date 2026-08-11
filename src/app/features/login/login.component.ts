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
  AvSelectComponent,
  type SegmentOption,
  type SelectOption,
} from '@avenews/design-system/angular'
import { AuthService, type PortalRole } from '../../core/auth/auth.service'

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
    AvSelectComponent,
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
  role: PortalRole = 'admin'
  emailValue = 'amina.kamau@example.com'
  phoneValue = '712 345 678'
  touched = false
  serverError = ''

  readonly segmentOptions: SegmentOption[] = [
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone number' },
  ]

  readonly roleOptions: SelectOption[] = [
    { value: 'admin', label: 'Customer Admin' },
    { value: 'user', label: 'Customer User' },
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

  onRoleChange(value: string): void {
    this.role = value as PortalRole
    this.cdr.markForCheck()
  }

  async handleSubmit(): Promise<void> {
    this.touched = true
    this.serverError = ''
    this.cdr.markForCheck()
    if (!this.isValid) return

    this.step = 'loading'
    this.cdr.markForCheck()
    await new Promise(resolve => setTimeout(resolve, 700))

    if (this.currentValue.toLowerCase().includes('error')) {
      this.step = 'error'
      this.serverError = 'Something went wrong. Try the mock account again.'
      this.cdr.markForCheck()
      return
    }

    this.step = 'success'
    this.cdr.markForCheck()
    await new Promise(resolve => setTimeout(resolve, 600))

    this.auth.login(this.role)
    void this.router.navigate(['/'])
  }
}

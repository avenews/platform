import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  inject,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import {
  AvButtonDirective,
  AvIconComponent,
  AvInputComponent,
  AvSegmentComponent,
  type SegmentOption,
} from '@avenews/design-system/angular'
import { AuthService } from '../../core/auth/auth.service'
import { isExperienceScenario } from '../../core/experience/contextual-experience.data'
import { PortalExperienceService } from '../../core/experience/portal-experience.service'

type LoginStep = 'idle' | 'loading' | 'verification' | 'verifying' | 'error'
type InputMethod = 'email' | 'phone'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\+?[0-9\s-]{7,15}$/
const RESEND_COUNTDOWN_SECONDS = 110

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    AvButtonDirective,
    AvIconComponent,
    AvInputComponent,
    AvSegmentComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnDestroy {
  private readonly auth = inject(AuthService)
  private readonly experiences = inject(PortalExperienceService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly cdr = inject(ChangeDetectorRef)

  step: LoginStep = 'idle'
  method: InputMethod = 'email'
  emailValue = ''
  phoneValue = ''
  verificationCode = ''
  sentDestination = ''
  touched = false
  serverError = ''
  resendSeconds = RESEND_COUNTDOWN_SECONDS

  private countdownTimer: ReturnType<typeof setInterval> | null = null

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

  get canVerify(): boolean {
    return Boolean(this.verificationCode.trim()) && this.step !== 'verifying'
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
    await new Promise(resolve => setTimeout(resolve, 900))

    if (this.currentValue.toLowerCase().includes('error')) {
      this.step = 'error'
      this.serverError = 'Something went wrong. Please try again.'
      this.cdr.markForCheck()
      return
    }

    this.sentDestination = this.currentValue.trim()
    this.verificationCode = ''
    this.serverError = ''
    this.step = 'verification'
    this.startResendCountdown()
    this.cdr.markForCheck()
  }

  async verifyCode(): Promise<void> {
    if (!this.canVerify) return

    this.serverError = ''
    this.step = 'verifying'
    this.cdr.markForCheck()
    await new Promise(resolve => setTimeout(resolve, 900))

    // Prototype-only OTP flow: any non-empty verification code succeeds.
    this.auth.login('admin')

    const requestedScenario = this.route.snapshot.queryParamMap.get('access')
    const scenario = isExperienceScenario(requestedScenario) ? requestedScenario : 'multiple'

    // Resolve access again for every login, then always enter the prototype via
    // product selection before a financing product or Partner workspace opens.
    this.experiences.resetForLogin(scenario)
    const target = this.experiences.resolvePostLoginRoute()

    try {
      const navigated = await this.router.navigate(target)
      if (!navigated) throw new Error('Navigation was cancelled')
    } catch {
      // Never leave the customer on an indefinite loading state if routing is
      // cancelled or fails. Return to the code field with a retryable error.
      this.step = 'verification'
      this.serverError = 'We could not open your available products. Please try again.'
      this.cdr.markForCheck()
    }
  }

  resendCode(): void {
    if (this.resendSeconds > 0) return
    this.startResendCountdown()
  }

  ngOnDestroy(): void {
    this.clearCountdown()
  }

  private startResendCountdown(): void {
    this.clearCountdown()
    this.resendSeconds = RESEND_COUNTDOWN_SECONDS
    this.countdownTimer = setInterval(() => {
      this.resendSeconds -= 1
      if (this.resendSeconds <= 0) {
        this.resendSeconds = 0
        this.clearCountdown()
      }
      this.cdr.markForCheck()
    }, 1000)
  }

  private clearCountdown(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer)
      this.countdownTimer = null
    }
  }
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { AuthService, PortalRole } from '../../core/auth/auth.service'

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly auth = inject(AuthService)
  private readonly router = inject(Router)

  email = 'amina.kamau@example.com'
  role: PortalRole = 'admin'

  signIn(): void {
    this.auth.login(this.role)
    void this.router.navigate(['/'])
  }
}

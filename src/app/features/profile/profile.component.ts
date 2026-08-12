import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { PROFILE, fullName } from '../../shared/customer-portal.data'

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  readonly profile = PROFILE
  readonly name = fullName(PROFILE.contact)

  get roleLabel(): string {
    return this.profile.contact.role === 'admin' ? 'Customer Admin' : 'Customer User'
  }

  openWhatsApp(): void {
    window.open('https://wa.me/254111133300', '_blank', 'noopener,noreferrer')
  }
}

import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, HostListener } from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
  BUSINESS,
  INVITATIONS,
  USERS,
  type Invitation,
  type PortalRole,
  type PortalUser,
  formatDate,
  fullName,
} from '../../shared/customer-portal.data'
import {
  CustomerFilterBarComponent,
  type CustomerFilterField,
} from '../../shared/customer-filter-bar.component'

type PendingActionType = 'deactivate' | 'reactivate' | 'cancel-invite' | 'change-role'

interface PendingAction {
  type: PendingActionType
  targetId: string
  targetName: string
  newRole?: PortalRole
}

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomerFilterBarComponent],
  templateUrl: './manage-users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManageUsersComponent {
  readonly businessName = BUSINESS.name
  readonly currentUserId = 'usr_001'
  readonly filterFields: readonly CustomerFilterField[] = [
    {
      key: 'status',
      label: 'Status',
      allLabel: 'All statuses',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'pending', label: 'Pending' },
        { value: 'deactivated', label: 'Deactivated' },
      ],
    },
  ]

  users: PortalUser[] = USERS.map(user => ({ ...user }))
  invitations: Invitation[] = INVITATIONS.map(invitation => ({ ...invitation }))

  statusFilter = ''
  search = ''
  openMenuId = ''
  inviteOpen = false
  termsOpen = false
  pending: PendingAction | null = null
  toast = ''

  inviteFirstName = ''
  inviteLastName = ''
  inviteEmail = ''
  invitePhone = ''
  inviteRole: PortalRole = 'user'
  inviteAccepted = false
  inviteError = ''
  inviteSent = false

  get filterValues(): Readonly<Record<string, string>> {
    return { status: this.statusFilter }
  }

  get filteredUsers(): PortalUser[] {
    const query = this.search.trim().toLowerCase()
    return this.users
      .filter(user => !this.statusFilter || this.statusFilter === 'pending' || user.status === this.statusFilter)
      .filter(user => !query || [fullName(user), user.email].join(' ').toLowerCase().includes(query))
  }

  get visibleUsers(): PortalUser[] {
    if (this.statusFilter === 'pending') return []
    return this.filteredUsers
  }

  get filteredInvitations(): Invitation[] {
    if (this.statusFilter && this.statusFilter !== 'pending') return []
    const query = this.search.trim().toLowerCase()
    return this.invitations.filter(invitation => !query || [fullName(invitation), invitation.email].join(' ').toLowerCase().includes(query))
  }

  get showInvitations(): boolean {
    return !this.statusFilter || this.statusFilter === 'pending'
  }

  get usersSectionTitle(): string {
    return this.statusFilter === 'deactivated' ? 'Deactivated Users' : 'Active Users'
  }

  get inviteValid(): boolean {
    return Boolean(
      this.inviteFirstName.trim() &&
      this.inviteLastName.trim() &&
      this.inviteEmail.includes('@') &&
      this.invitePhone.trim().length >= 7 &&
      this.inviteAccepted,
    )
  }

  onFilterValuesChange(values: Record<string, string>): void {
    this.statusFilter = values['status'] ?? ''
  }

  onSearchValueChange(value: string): void {
    this.search = value
  }

  resetFilters(): void {
    this.statusFilter = ''
    this.search = ''
  }

  toggleMenu(id: string): void {
    this.openMenuId = this.openMenuId === id ? '' : id
  }

  closeMenus(): void {
    this.openMenuId = ''
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenus()
    if (this.termsOpen) {
      this.termsOpen = false
      return
    }
    if (this.pending) {
      this.pending = null
      return
    }
    if (this.inviteOpen) this.closeInvite()
  }

  userActions(user: PortalUser): { label: string; action: string; danger?: boolean }[] {
    if (user.status === 'deactivated') return [{ label: 'Reactivate', action: 'reactivate' }]
    const actions: { label: string; action: string; danger?: boolean }[] = []
    if (user.role === 'user') actions.push({ label: 'Make Admin', action: 'make-admin' })
    if (user.role === 'admin' && user.id !== this.currentUserId && this.activeAdminCount > 1) {
      actions.push({ label: 'Change to User', action: 'make-user' })
    }
    if (user.id !== this.currentUserId && !(user.role === 'admin' && this.activeAdminCount <= 1)) {
      actions.push({ label: 'Deactivate', action: 'deactivate', danger: true })
    }
    return actions
  }

  get activeAdminCount(): number {
    return this.users.filter(user => user.role === 'admin' && user.status === 'active').length
  }

  handleUserAction(user: PortalUser, action: string): void {
    this.closeMenus()
    if (action === 'make-admin') {
      this.pending = { type: 'change-role', targetId: user.id, targetName: fullName(user), newRole: 'admin' }
      return
    }
    if (action === 'make-user') {
      this.pending = { type: 'change-role', targetId: user.id, targetName: fullName(user), newRole: 'user' }
      return
    }
    this.pending = {
      type: action === 'reactivate' ? 'reactivate' : 'deactivate',
      targetId: user.id,
      targetName: fullName(user),
    }
  }

  resendInvitation(invitation: Invitation): void {
    this.closeMenus()
    const index = this.invitations.findIndex(item => item.id === invitation.id)
    if (index >= 0) {
      const today = '2026-08-12'
      const expires = '2026-08-19'
      this.invitations[index] = { ...this.invitations[index], invitedAt: today, expiresAt: expires }
      this.invitations = [...this.invitations]
    }
    this.toast = `Invite resent to ${fullName(invitation)}.`
  }

  cancelInvitation(invitation: Invitation): void {
    this.closeMenus()
    this.pending = { type: 'cancel-invite', targetId: invitation.id, targetName: fullName(invitation) }
  }

  get confirmTitle(): string {
    if (!this.pending) return ''
    if (this.pending.type === 'deactivate') return `Deactivate ${this.pending.targetName}?`
    if (this.pending.type === 'reactivate') return `Reactivate ${this.pending.targetName}?`
    if (this.pending.type === 'cancel-invite') return `Cancel invite for ${this.pending.targetName}?`
    return `Change role for ${this.pending.targetName}?`
  }

  get confirmBody(): string {
    if (!this.pending) return ''
    if (this.pending.type === 'deactivate') return `${this.pending.targetName} will no longer be able to log in. You can reactivate them at any time.`
    if (this.pending.type === 'reactivate') return `${this.pending.targetName} will be able to log in again with their previous role.`
    if (this.pending.type === 'cancel-invite') return `The invite link for ${this.pending.targetName} will no longer work. You can re-invite them at any time.`
    return this.pending.newRole === 'admin'
      ? `${this.pending.targetName} will gain admin permissions and be able to manage users.`
      : `${this.pending.targetName} will lose admin permissions and will no longer be able to manage users.`
  }

  get confirmLabel(): string {
    if (!this.pending) return 'Confirm'
    if (this.pending.type === 'deactivate') return 'Deactivate'
    if (this.pending.type === 'reactivate') return 'Reactivate'
    if (this.pending.type === 'cancel-invite') return 'Cancel invite'
    return 'Change role'
  }

  get confirmDanger(): boolean {
    return Boolean(this.pending && (
      this.pending.type === 'deactivate' ||
      this.pending.type === 'cancel-invite' ||
      (this.pending.type === 'change-role' && this.pending.newRole !== 'admin')
    ))
  }

  confirmAction(): void {
    if (!this.pending) return
    const action = this.pending
    if (action.type === 'cancel-invite') {
      this.invitations = this.invitations.filter(invitation => invitation.id !== action.targetId)
      this.toast = `Invite for ${action.targetName} cancelled.`
    } else {
      this.users = this.users.map(user => {
        if (user.id !== action.targetId) return user
        if (action.type === 'deactivate') return { ...user, status: 'deactivated' as const }
        if (action.type === 'reactivate') return { ...user, status: 'active' as const }
        return { ...user, role: action.newRole ?? user.role }
      })
      this.toast = action.type === 'deactivate'
        ? `${action.targetName} has been deactivated.`
        : action.type === 'reactivate'
          ? `${action.targetName} has been reactivated.`
          : `Role updated for ${action.targetName}.`
    }
    this.pending = null
  }

  openInvite(): void {
    this.resetInvite()
    this.inviteOpen = true
  }

  closeInvite(): void {
    this.inviteOpen = false
    this.termsOpen = false
    this.resetInvite()
  }

  resetInvite(): void {
    this.inviteFirstName = ''
    this.inviteLastName = ''
    this.inviteEmail = ''
    this.invitePhone = ''
    this.inviteRole = 'user'
    this.inviteAccepted = false
    this.inviteError = ''
    this.inviteSent = false
  }

  sendInvite(): void {
    if (!this.inviteValid) return
    const email = this.inviteEmail.trim().toLowerCase()
    const phone = this.invitePhone.replace(/\s+/g, '')
    if ([...this.users, ...this.invitations].some(value => value.email.toLowerCase() === email)) {
      this.inviteError = 'A user with this email address already exists.'
      return
    }
    if ([...this.users, ...this.invitations].some(value => (value.phone ?? '').replace(/\s+/g, '') === phone)) {
      this.inviteError = 'A user with this phone number already exists.'
      return
    }
    const invitation: Invitation = {
      id: `invite_${Date.now()}`,
      firstName: this.inviteFirstName.trim(),
      lastName: this.inviteLastName.trim(),
      email: this.inviteEmail.trim(),
      phone: this.invitePhone.trim(),
      role: this.inviteRole,
      invitedAt: '2026-08-12',
      expiresAt: '2026-08-19',
    }
    this.invitations = [invitation, ...this.invitations]
    this.inviteSent = true
    this.inviteError = ''
    this.toast = `Invite sent to ${invitation.email}.`
  }

  roleLabel(role: PortalRole): string {
    return role === 'admin' ? 'Admin' : 'User'
  }

  initials(value: PortalUser | Invitation): string {
    return `${value.firstName[0]}${value.lastName[0]}`
  }

  readonly fullName = fullName
  readonly formatDate = formatDate
}

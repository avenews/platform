import { Injectable } from '@angular/core'

export type PortalRole = 'admin' | 'user'

export interface MockSession {
  contactId: string
  contactFirstName: string
  contactLastName: string
  contactEmail: string
  businessId: string
  businessName: string
  role: PortalRole
}

const SESSION_KEY = 'av_customer_portal_session'

const DEMO_CONTACT = {
  contactId: 'usr_001',
  contactFirstName: 'Winnie',
  contactLastName: 'Oduor',
  contactEmail: 'winnie.oduor@avenews-gt.com',
} as const

@Injectable({ providedIn: 'root' })
export class AuthService {
  getSession(): MockSession | null {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null

    try {
      const stored = JSON.parse(raw) as MockSession
      const session: MockSession = { ...stored, ...DEMO_CONTACT }
      if (
        stored.contactId !== session.contactId ||
        stored.contactFirstName !== session.contactFirstName ||
        stored.contactLastName !== session.contactLastName ||
        stored.contactEmail !== session.contactEmail
      ) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      }
      return session
    } catch {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
  }

  isAuthenticated(): boolean {
    return this.getSession() !== null
  }

  login(role: PortalRole): void {
    const session: MockSession = {
      ...DEMO_CONTACT,
      businessId: 'biz_demo_001',
      businessName: 'Kioko Agri Supplies Ltd',
      role,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY)
  }
}

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

@Injectable({ providedIn: 'root' })
export class AuthService {
  getSession(): MockSession | null {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null

    try {
      return JSON.parse(raw) as MockSession
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
      contactId: 'contact_demo_001',
      contactFirstName: 'Amara',
      contactLastName: 'Osei',
      contactEmail: 'amara.osei@example.com',
      businessId: 'business_demo_001',
      businessName: 'Kioko Agri Supplies Ltd',
      role,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY)
  }
}

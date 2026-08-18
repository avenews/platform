import { Injectable } from '@angular/core'
import {
  experienceById,
  experiencesForScenario,
  type ExperienceId,
  type ExperienceScenario,
  type PortalExperience,
} from './contextual-experience.data'

const EXPERIENCE_SCENARIO_KEY = 'av_experience_scenario'
const EXPERIENCE_SELECTION_KEY = 'av_experience_context'

@Injectable({ providedIn: 'root' })
export class PortalExperienceService {
  getScenario(): ExperienceScenario {
    if (typeof window === 'undefined') return 'multiple'
    const value = sessionStorage.getItem(EXPERIENCE_SCENARIO_KEY)
    return value === 'abf-only' || value === 'partner-only' ? value : 'multiple'
  }

  setScenario(scenario: ExperienceScenario): void {
    if (typeof window === 'undefined') return
    sessionStorage.setItem(EXPERIENCE_SCENARIO_KEY, scenario)
    sessionStorage.removeItem(EXPERIENCE_SELECTION_KEY)
  }

  resetForLogin(scenario: ExperienceScenario): void {
    this.setScenario(scenario)
  }

  availableExperiences(): readonly PortalExperience[] {
    return experiencesForScenario(this.getScenario())
  }

  selectedExperience(): PortalExperience | undefined {
    if (typeof window === 'undefined') return undefined
    return experienceById(sessionStorage.getItem(EXPERIENCE_SELECTION_KEY))
  }

  selectExperience(id: ExperienceId): PortalExperience | undefined {
    const experience = experienceById(id)
    if (!experience) return undefined
    if (!this.availableExperiences().some(item => item.id === id)) return undefined
    if (typeof window !== 'undefined') sessionStorage.setItem(EXPERIENCE_SELECTION_KEY, id)
    return experience
  }

  resolvePostLoginRoute(): string[] {
    const available = this.availableExperiences()

    // Customer financing always starts at the product selector, even when the
    // identity currently has only one customer product. Partner-only access is
    // operationally narrower, so it may continue directly into its workspace.
    if (available.length === 1 && available[0].kind === 'partner') {
      this.selectExperience(available[0].id)
      return this.routeFor(available[0].id, 'home')
    }

    return ['/access']
  }

  routeFor(id: ExperienceId, section = 'home'): string[] {
    return ['/experience', id, section]
  }

  clear(): void {
    if (typeof window === 'undefined') return
    sessionStorage.removeItem(EXPERIENCE_SCENARIO_KEY)
    sessionStorage.removeItem(EXPERIENCE_SELECTION_KEY)
  }
}

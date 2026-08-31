import { Injectable, signal } from '@angular/core'

const EXPLAINER_VISIBILITY_KEY = 'av_contextual_explainers'

@Injectable({ providedIn: 'root' })
export class PrototypeExplainerService {
  readonly enabled = signal(this.readInitialState())

  toggle(): void {
    this.setEnabled(!this.enabled())
  }

  setEnabled(value: boolean): void {
    this.enabled.set(value)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(EXPLAINER_VISIBILITY_KEY, value ? 'on' : 'off')
    }
  }

  private readInitialState(): boolean {
    if (typeof window === 'undefined') return true
    return sessionStorage.getItem(EXPLAINER_VISIBILITY_KEY) !== 'off'
  }
}

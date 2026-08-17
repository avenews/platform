import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core'
import { PrototypeExplainerService } from './prototype-explainer.service'

export type PrototypeExplainerTone =
  | 'handbook'
  | 'terminology'
  | 'purpose'
  | 'action'
  | 'role'
  | 'decision'
  | 'limitation'

@Component({
  selector: 'app-prototype-explainer',
  standalone: true,
  template: `
    @if (visibility.enabled()) {
      <aside
        class="prototype-explainer"
        [class]="'prototype-explainer prototype-explainer--' + tone"
        [attr.data-explainer-tone]="tone"
        [attr.data-explainer-title]="title"
      >
        <div class="prototype-explainer__header">
          <span>{{ label }}</span>
          <strong>{{ title }}</strong>
        </div>
        <div class="prototype-explainer__content">
          <ng-content />
        </div>
      </aside>
    }
  `,
  styles: [`
    :host { display: contents; }
    .prototype-explainer {
      --explainer-border: #bdeff3;
      --explainer-bg: #eefbfc;
      --explainer-label: #087f90;
      min-width: 0;
      display: grid;
      grid-template-columns: minmax(150px, 220px) minmax(0, 1fr);
      gap: 16px;
      padding: 14px 16px;
      border: 1px solid var(--explainer-border);
      border-left-width: 4px;
      border-radius: 10px;
      background: var(--explainer-bg);
    }
    .prototype-explainer--decision { --explainer-border: #c9b8ff; --explainer-bg: #f5f1ff; --explainer-label: #6941c6; }
    .prototype-explainer--limitation { --explainer-border: #f5d87b; --explainer-bg: #fff9e8; --explainer-label: #a15c00; }
    .prototype-explainer--role { --explainer-border: #b8d5ff; --explainer-bg: #f1f7ff; --explainer-label: #175cd3; }
    .prototype-explainer--terminology { --explainer-border: #d0d5dd; --explainer-bg: #f8f9fb; --explainer-label: #475467; }
    .prototype-explainer__header { display: grid; align-content: start; gap: 3px; }
    .prototype-explainer__header span {
      color: var(--explainer-label);
      font-size: 10px;
      font-weight: 800;
      letter-spacing: .06em;
      text-transform: uppercase;
    }
    .prototype-explainer__header strong {
      color: var(--av-color-text-heading, #0d343f);
      font-size: 13px;
      line-height: 1.4;
    }
    .prototype-explainer__content {
      min-width: 0;
      color: var(--av-color-text-muted, #66788a);
      font-size: 12px;
      line-height: 1.55;
    }
    .prototype-explainer__content :where(p, ul, ol) { margin: 0; }
    .prototype-explainer__content :where(ul, ol) { display: grid; gap: 4px; padding-left: 18px; }
    .prototype-explainer__content :where(strong) { color: var(--av-color-text-heading, #0d343f); }
    @media (max-width: 767px) {
      .prototype-explainer { grid-template-columns: 1fr; gap: 8px; padding: 13px 14px; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrototypeExplainerComponent {
  readonly visibility = inject(PrototypeExplainerService)

  @Input({ required: true }) title = ''
  @Input() tone: PrototypeExplainerTone = 'purpose'

  get label(): string {
    const labels: Record<PrototypeExplainerTone, string> = {
      handbook: 'Handbook rule',
      terminology: 'Product terminology decision',
      purpose: 'Why this screen exists',
      action: 'Action placement',
      role: 'Role boundary',
      decision: 'Prototype decision',
      limitation: 'Current limitation',
    }
    return labels[this.tone]
  }
}

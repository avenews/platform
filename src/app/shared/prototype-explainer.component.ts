import { ChangeDetectionStrategy, Component, Input } from '@angular/core'

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
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrototypeExplainerComponent {
  @Input({ required: true }) title = ''
  @Input() tone: PrototypeExplainerTone = 'purpose'
}

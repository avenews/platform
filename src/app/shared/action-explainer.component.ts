import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core'

@Component({
  selector: 'app-action-explainer',
  standalone: true,
  template: `
    <div class="action-row">
      <button type="button" class="baseline-button baseline-button--secondary" (click)="secondary.emit()">{{ secondaryLabel }}</button>
      <button type="button" class="baseline-button baseline-button--primary" [disabled]="disabled" (click)="primary.emit()">{{ primaryLabel }}</button>
    </div>
    <section class="explanation" [class.explanation--warning]="warning">
      <div><strong>{{ heading }}</strong><p>{{ description }}</p></div>
      <span>{{ supportingText }}</span>
    </section>
  `,
  styles: [`
    :host{display:grid;gap:16px}.action-row{display:flex;justify-content:flex-end;gap:10px}.explanation{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;border:1px solid var(--av-color-primary-border,#bdeff3);border-radius:12px;background:var(--av-color-primary-subtle,#eefbfc);padding:16px 18px}.explanation--warning{border-color:#fde68c;background:#fffbeb}.explanation strong,.explanation p,.explanation span{margin:0}.explanation strong{color:var(--av-color-text-heading,#0d343f)}.explanation p{margin-top:4px;color:var(--av-color-text-muted,#66788a);font-size:13px}.explanation span{color:var(--av-color-text-muted,#66788a);font-size:12px;white-space:nowrap}@media(max-width:767px){.action-row{display:grid;grid-template-columns:1fr}.action-row .baseline-button{width:100%}.explanation{display:grid;gap:10px}}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionExplainerComponent {
  @Input() secondaryLabel = 'View details'
  @Input() primaryLabel = 'Continue'
  @Input() disabled = false
  @Input() heading = ''
  @Input() description = ''
  @Input() supportingText = ''
  @Input() warning = false
  @Output() secondary = new EventEmitter<void>()
  @Output() primary = new EventEmitter<void>()
}

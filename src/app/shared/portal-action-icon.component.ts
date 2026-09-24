import { ChangeDetectionStrategy, Component, Input } from '@angular/core'

/** Lucide artwork for the requested action controls; navigation artwork is unchanged. */
@Component({
  selector: 'app-portal-action-icon', standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    @switch (name) {
      @case ('arrow-left') { <path d="m12 19-7-7 7-7" /><path d="M5 12h14" /> }
      @case ('chevron-down') { <path d="m6 9 6 6 6-6" /> }
      @case ('upload') { <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5" /><path d="M12 3v12" /> }
    }
  </svg>`,
  styles: [':host{display:inline-flex;align-items:center;justify-content:center;flex:0 0 16px;width:16px;height:16px;vertical-align:middle}svg{display:block}'],
})
export class PortalActionIconComponent {
  @Input() name: 'arrow-left' | 'chevron-down' | 'upload' = 'arrow-left'
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { PageScrollService } from './core/experience/page-scroll.service'
import { RouterOutlet } from '@angular/router'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent { private readonly pageScroll = inject(PageScrollService) }

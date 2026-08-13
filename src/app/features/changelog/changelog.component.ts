import { ChangeDetectionStrategy, Component } from '@angular/core'
import { STAGING_CHANGELOG } from '../../shared/staging-changelog.data'

@Component({
  selector: 'app-changelog',
  standalone: true,
  template: `
    <div class="portal-page baseline-page changelog-page">
      <div class="baseline-hero">
        <h1>Changelog</h1>
        <p>Approved changes recorded when pull requests are merged into staging.</p>
      </div>

      @if (entries.length === 0) {
        <div class="baseline-empty changelog-empty">
          <strong>No staging changes recorded yet</strong>
          <p>The first entry will be locked in when an approved pull request is merged into staging.</p>
        </div>
      } @else {
        <div class="changelog-list">
          @for (entry of entries; track entry.id) {
            <article class="baseline-card changelog-entry">
              <div class="baseline-card__header">
                <div class="changelog-entry__meta">
                  <span>{{ entry.stagingDate }}</span>
                  <span>PR #{{ entry.prNumber }}</span>
                  <span>{{ entry.contributor }}</span>
                </div>
                <h2>{{ entry.title }}</h2>
              </div>
              <div class="baseline-card__body">
                <ul>
                  @for (item of entry.summary; track item) {
                    <li>{{ item }}</li>
                  }
                </ul>
              </div>
            </article>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .changelog-list { display: grid; gap: var(--av-space-4, 16px); }
    .changelog-entry__meta { display: flex; flex-wrap: wrap; gap: var(--av-space-2, 8px) var(--av-space-4, 16px); color: var(--av-color-text-muted, #9ca3af); font-size: var(--av-font-size-xs, 12px); }
    .changelog-entry ul { margin: 0; padding-left: 20px; color: var(--av-color-text, #111827); font-size: var(--av-font-size-sm, 13px); }
    .changelog-entry li + li { margin-top: var(--av-space-2, 8px); }
    .changelog-empty { min-height: 220px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangelogComponent {
  readonly entries = STAGING_CHANGELOG
}

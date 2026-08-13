export interface StagingChangelogEntry {
  id: string
  stagingDate: string
  prNumber: number
  title: string
  contributor: string
  summary: readonly string[]
}

/**
 * Source of truth for changes that have actually been accepted into staging.
 *
 * Do not add feature-branch work here merely because a PR exists. The entry is
 * prepared as part of final staging review and becomes history when that PR is
 * merged into `staging`.
 */
export const STAGING_CHANGELOG: readonly StagingChangelogEntry[] = []

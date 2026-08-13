# Avenews Platform Deployment Workflow

This document is the operational source of truth for how changes to `avenews/platform` are defined, implemented, reviewed, and moved through GitHub and Netlify.

The purpose of this workflow is to keep design and product iteration safe, repeatable, reviewable, traceable, and cost-conscious. Every piece of work starts with a GitHub Issue. Feature work must be reviewed in Netlify before it is promoted to staging or production. `main` must never be used simply to generate a preview.

## 1. Issue-first work intake

Every new piece of work must have a GitHub Issue before implementation begins.

### Small work

If the requested work is small and self-contained, create one issue that defines the outcome and scope.

Examples include a focused bug fix, one UI adjustment, one interaction change, one copy change, or another change that can be reviewed and accepted as a single unit.

A small change should normally map cleanly to:

```text
1 issue -> 1 focused branch -> 1 pull request
```

### Larger work

If the requested work is large, do not put the entire initiative into one oversized implementation issue. Break it into logical issues before implementation starts.

Each issue should represent a coherent, reviewable unit that can be implemented, previewed, reviewed, revised, accepted, rejected, or merged independently where practical.

The issue breakdown should follow logical product or technical boundaries, for example separate user journeys, screens, components, infrastructure changes, or independently testable behaviors.

A larger body of work may therefore map to:

```text
larger initiative
       |
       +-- issue A -> branch/PR A
       +-- issue B -> branch/PR B
       +-- issue C -> branch/PR C
```

### Intake rules

- Create the issue or logical set of issues before creating implementation branches.
- Do not begin unrelated implementation first and create the issue afterward merely for bookkeeping.
- Human and agent-driven work follow the same issue-first rule.
- Branches and pull requests must reference the relevant issue or issues.
- Before starting implementation, check existing open issues and pull requests to avoid duplicating work already underway.
- If the scope grows materially while work is underway, create additional logical issues rather than silently expanding a focused issue into a large unrelated body of work.

## 2. Branch model

The repository uses three levels of change:

```text
feature/<scope> or agent/<scope>
        |
        | Pull Request
        v
     staging
        |
        | Pull Request
        v
       main
```

### Feature branches

New work starts from the latest `staging` branch after the relevant issue or issues have been created.

Use a focused branch for each coherent change. Human-created branches should normally use `feature/<scope>`. Automated or agent tooling may use `agent/<scope>` where required by the tool, but it must follow the same promotion path.

The branch and its pull request must reference the GitHub Issue that defines the work.

Feature branches must not be created from `main` unless there is an explicit production hotfix instruction.

### `staging`

`staging` is the integration and review branch. Approved feature work is merged here after its pull request, GitHub checks, and Netlify Deploy Preview have been reviewed.

`staging` is not production and must not be treated as the production release branch.

### `main`

`main` is the production branch. Changes reach `main` only through a pull request from `staging`, after the staging state has been approved for release.

Do not push directly to `main` for normal product or design work. Do not merge to `main` merely to make a change visible for review.

## 3. Netlify deployment model

The Netlify project for this repository is `avenews-platform`.

Once GitHub continuous deployment is authorized and connected, Netlify should be configured as follows:

- Production branch: `main`
- Branch deploys: `staging`
- Deploy Previews: enabled for pull requests
- Build command: `npm run build`
- Publish directory: `dist/platform/browser`
- Repository build settings: governed by `netlify.toml`

The intended deployment behavior is:

| Git state | Netlify result | Purpose |
| --- | --- | --- |
| Pull request from a feature/agent branch into `staging` | Deploy Preview | Review the exact proposed change before merge |
| `staging` branch | Branch Deploy | Persistent integrated staging environment |
| Pull request from `staging` into `main` | Deploy Preview where available | Final release review before production merge |
| `main` branch | Production Deploy | Production release only |

Production deploys must be kept deliberate. Normal UI iteration belongs in Deploy Previews and the `staging` branch deploy, not in repeated production deploys from `main`.

## 4. Standard change flow

For every normal change:

1. Define the requested work in GitHub Issues before implementation begins.
2. If the work is small, use one focused issue. If it is large, break it into logical issues first.
3. Check existing open issues and pull requests for overlapping work.
4. Confirm the latest `staging` state.
5. Create or continue a focused feature branch from `staging` for the relevant issue.
6. Implement only the scope represented by that issue on the branch.
7. Run the available local/project validation, normally `npm run check` when a local checkout is available.
8. Push the branch to GitHub.
9. Open or update a pull request targeting `staging` and reference the issue it implements.
10. Confirm the GitHub `Angular checks` workflow passes for the current branch head.
11. Locate the Netlify Deploy Preview generated for that pull request.
12. Confirm the preview is built from the current pull-request head, not an older commit.
13. Open and review the Netlify Deploy Preview, with particular attention to the user flow or screen that changed.
14. Report the issue number, preview URL, and validation status to the requester.
15. Make any requested revisions on the same feature branch and repeat the validation and preview check.
16. Merge the feature pull request into `staging` only after approval.
17. Review the resulting `staging` branch deployment when the change needs integrated staging validation.
18. When a release is approved, open a pull request from `staging` into `main`.
19. Merge to `main` only after final release approval. Netlify then performs the production deployment.

## 5. Mandatory Netlify preview check

For work delivered through a feature or agent pull request, the person or agent making the change must always check the Netlify Deploy Preview before declaring the work complete.

The delivery response must include:

- issue number or issue numbers
- working branch
- pull-request target
- current commit or branch-head SHA when available
- GitHub CI status
- Netlify Deploy Preview status
- Netlify Deploy Preview URL
- a short statement of what was checked in the preview

A change must not be described as visually verified unless the current Netlify preview has actually been opened and checked.

If the Netlify preview is still building, report that it is still building rather than claiming completion. If the preview failed, investigate or report the failure before merge. If the preview belongs to an older commit, wait for or locate the preview for the current branch head.

### Until GitHub-to-Netlify automation is connected

GitHub continuous deployment is not yet fully authorized for this repository. Until the repository is connected by the authorized GitHub manager:

- do not pretend that an automatic Deploy Preview exists
- do not substitute the production site URL and call it a Deploy Preview
- report clearly that the Deploy Preview is unavailable because Git-based Netlify deployment is not yet connected
- continue to use the issue -> feature -> staging -> main structure
- do not merge to `main` just to obtain a visible Netlify build

Once the Git integration is enabled, the mandatory preview-check rule applies to every feature pull request.

## 6. Merge rules

No agent or contributor should merge a pull request into `staging` or `main` merely because implementation is complete.

Unless the requester explicitly asks for a merge, the default action is:

- implement the issue on the feature branch
- validate it
- provide the pull request and Netlify preview for review
- leave the pull request open

A merge into `staging` requires approval of the feature change.

A merge into `main` requires explicit production/release approval.

An issue should not be treated as fully delivered merely because code exists on a feature branch. Its associated pull request and review state are part of the delivery record.

## 7. GitHub checks

The repository uses the `Angular checks` GitHub Actions workflow as the baseline automated validation.

At minimum, the current branch head should successfully complete the configured TypeScript/build checks before merge.

A successful check on an older commit is not sufficient. Validation must correspond to the current branch head.

If CI is failing, resolve the failure or clearly report it before requesting approval to merge.

## 8. Manual Netlify deployments

Manual Netlify deployments are not the normal workflow once Git integration is enabled.

Do not manually deploy to production as a substitute for the GitHub branch flow.

Do not run a production deploy from a feature branch.

A manual production deployment should happen only when it is explicitly requested for an exceptional reason and the requester understands that it bypasses the normal Git-driven release process.

## 9. Release flow

The normal release path is:

```text
GitHub Issue
        |
        v
feature/<scope> or agent/<scope>
        |
        | PR + GitHub checks + Netlify Deploy Preview
        v
     staging
        |
        | integrated staging review
        v
PR: staging -> main
        |
        | final approval
        v
       main
        |
        v
Netlify production deployment
```

For larger initiatives, create multiple logical issues and run each issue through this path as an independently reviewable unit where practical.

The key rule is simple: define the work in issues first, preview feature work before merge, integrate approved work in `staging`, and reserve `main` for approved production releases.

## 10. Required delivery response format

After making a repository change, the delivery response should contain a concise deployment checkpoint such as:

```text
Issue: #123
Branch: feature/example
PR target: staging
Commit: <sha>
GitHub checks: passed
Netlify preview: ready
Preview URL: <deploy-preview-url>
Preview check: opened and verified <changed flow/screen>
Merge status: left open for review
```

If multiple issues are involved, list all relevant issue numbers.

If Netlify Git deployment is not yet connected, use:

```text
Netlify preview: unavailable - GitHub continuous deployment is not yet connected
Preview URL: not available
```

Never invent a preview URL or claim a preview was checked when it was not.

## 11. Relationship to other repository sources

This document governs work intake, Git promotion, and Netlify deployment behavior.

For UI implementation, design-system ownership, responsive review, source hierarchy, and prototype-data rules, follow `docs/DESIGN_WORKFLOW.md`.

For build and deploy configuration, `netlify.toml` remains the executable Netlify configuration source.

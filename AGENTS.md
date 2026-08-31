# Avenews Platform Agent Rules

These rules apply to any coding or design agent working in this repository.

## Mandatory issue-first work intake

Every new piece of work must start with a GitHub Issue before implementation begins.

- If the work is small and self-contained, create one issue that describes the requested outcome and acceptance scope.
- If the work is large, first break it into multiple logical issues. Each issue should represent a coherent, reviewable unit of work that can be implemented, reviewed, accepted, rejected, or revised independently.
- Do not create one oversized issue for a large body of work merely to satisfy the issue requirement.
- Do not begin unrelated implementation first and create an issue afterward only for bookkeeping.
- Human and agent-driven work follow the same rule.
- Feature branches and pull requests must reference the relevant GitHub Issue or Issues.
- Before starting implementation, check existing open issues and pull requests to avoid duplicating work that is already underway.

The issue structure should be decided before creating implementation branches. A small change normally maps to one issue, one focused branch, and one pull request. Larger initiatives map to multiple logical issues and may therefore use multiple branches and pull requests.

## Mandatory customer-portal baseline

Before changing the signed-in customer portal, read and follow [`docs/CUSTOMER_PORTAL_BASELINE.md`](docs/CUSTOMER_PORTAL_BASELINE.md).

During baseline work:

- `apps/customer-portal` is the primary behavioural and visual source.
- Do not redesign, simplify, or substitute a merely similar pattern without an issue and explicit approval.
- Navigation labels, order, destinations, breakpoint behaviour, mobile/desktop visibility, modal type, and the six customer-navigation icon artworks are locked by the baseline contract.
- The locked customer-navigation icons reproduce the exact source Lucide artwork. Do not replace them with a similarly named design-system icon or newer glyph. Financing Activity uses the locked `BarChart3` artwork and Manage Users uses the locked `User` artwork.
- Run `npm run check:baseline` before reporting the work complete.
- Keep the baseline PR in Draft until the requester explicitly approves making it ready or merging it.

Intentional deviations after the baseline is accepted must identify the prior behaviour, explain the reason, include desktop/mobile evidence, and receive explicit approval.

## Mandatory deployment workflow

Read and follow [`docs/DEPLOYMENT_WORKFLOW.md`](docs/DEPLOYMENT_WORKFLOW.md) before changing, publishing, promoting, or reporting repository work.

The required branch path is:

```text
feature/<scope> or agent/<scope> -> staging -> main
```

Normal feature work starts from `staging` and targets `staging` by pull request. `main` is production and must not be used merely to generate previews.

Do not merge into `staging` or `main` unless the requester explicitly approves that merge. By default, leave the pull request open for review.

## Mandatory staging changelog

Read and follow [`docs/STAGING_CHANGELOG.md`](docs/STAGING_CHANGELOG.md) for every pull request that is approved for `staging`.

Before an approved feature/agent PR is merged into `staging`:

- add or update its entry in `src/app/shared/staging-changelog.data.ts` in that same PR;
- record the PR number, staging date, human work owner/contributor, title, and concise accepted change summary;
- do not add an entry merely because a PR was opened; rejected or closed work must not appear in the staging changelog;
- documentation-only or internal maintenance work may omit an entry only when the reviewer explicitly agrees that there is no portal/staging change to record.

The changelog entry becomes locked staging history when the PR itself is merged. This requirement does not grant permission to merge; explicit merge approval is still required.

## Mandatory Netlify verification

For every feature or agent pull request, once GitHub-to-Netlify continuous deployment is connected:

1. Find the Netlify Deploy Preview for the current pull-request head.
2. Confirm it corresponds to the current branch-head commit rather than an older build.
3. Open the preview and check the changed screen or flow.
4. Include the Netlify Deploy Preview URL and preview status in the delivery response.
5. State what was checked in the preview.

Never claim visual verification without opening the current preview. Never invent or guess a preview URL.

If GitHub-to-Netlify continuous deployment is not connected, explicitly report that the Deploy Preview is unavailable. Do not use or merge to `main` simply to obtain a Netlify build.

## Delivery checkpoint

Every repository-change response should report, when available:

- issue number(s)
- branch
- PR target
- current commit/head SHA
- GitHub CI status
- Netlify Deploy Preview status
- Netlify Deploy Preview URL
- what was checked in the preview
- whether the PR remains open or was merged

## Other repository sources

Follow [`docs/DESIGN_WORKFLOW.md`](docs/DESIGN_WORKFLOW.md) for design and implementation ownership rules. `netlify.toml` is the executable Netlify build/deploy configuration source.

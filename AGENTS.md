# Avenews Platform Agent Rules

These rules apply to any coding or design agent working in this repository.

## Mandatory issue-first work intake

Every new piece of work must start with a GitHub Issue before implementation begins.

- If the work is small and self-contained, create one issue that describes the requested outcome and acceptance scope.
- If the work is large, first break it into multiple logical issues. Each issue should represent a coherent, reviewable unit of work that can be implemented, reviewed, accepted, rejected, or revised independently.
- Do not create one oversized issue for a large body of work merely to satisfy the issue requirement.
- Do not begin unrelated implementation first and create an issue afterward only for bookkeeping.
- Human and agent-driven work follow the same rule.
- Branches and pull requests must reference the relevant GitHub Issue or Issues.
- Before starting implementation, check existing open issues and pull requests to avoid duplicating work that is already underway.

## Mandatory contributor branch boundaries

The active collaboration model is:

```text
ishai -> stefan -> staging -> main
```

For Ishai:

- Work only on the dedicated `ishai` branch.
- Push changes only to `ishai`.
- Open or update Draft pull requests from `ishai` to `stefan` for review.
- Treat `stefan` as the review/integration branch.
- Treat `staging` as the protected accepted baseline.
- Never commit or push directly to `stefan`, `staging`, or `main` unless explicitly instructed by the owner of that branch.
- Never merge into `stefan`, `staging`, or `main` without explicit human approval.
- Before making changes, verify that the current branch is `ishai`.
- When Ishai needs Stefan's latest reviewed work, intentionally sync `ishai` from `stefan`; do not use `staging` as a scratch or conflict-resolution branch.

For Stefan:

- Work only on the dedicated `stefan` branch unless explicitly instructed otherwise.
- Push changes only to `stefan`.
- Stefan's review/promotion PR targets `staging`.
- `staging` remains protected and must not be changed without explicit approval.
- Before making changes, verify that the current branch is `stefan`.

If older repository documentation describes a generic `feature/* -> staging` path, these dedicated contributor branch boundaries take precedence for Stefan and Ishai.

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

For the named contributor branches, the required promotion path is:

```text
ishai -> stefan -> staging -> main
```

Ishai's normal review PR is `ishai` -> `stefan`. Stefan's normal promotion PR is `stefan` -> `staging`. `main` is production and must not be used merely to generate previews.

Do not merge into `stefan`, `staging`, or `main` unless the requester explicitly approves that merge. By default, leave the pull request open for review.

## Mandatory staging changelog

Read and follow [`docs/STAGING_CHANGELOG.md`](docs/STAGING_CHANGELOG.md) for every pull request that is approved for `staging`.

Before an approved PR is merged into `staging`:

- add or update its entry in `src/app/shared/staging-changelog.data.ts` in that same PR;
- record the PR number, staging date, human work owner/contributor, title, and concise accepted change summary;
- do not add an entry merely because a PR was opened; rejected or closed work must not appear in the staging changelog;
- documentation-only or internal maintenance work may omit an entry only when the reviewer explicitly agrees that there is no portal/staging change to record.

The changelog entry becomes locked staging history when the PR itself is merged. This requirement does not grant permission to merge; explicit merge approval is still required.

## Mandatory Netlify verification

Netlify is Git-connected to `avenews/platform`.

Persistent branch deploys are configured for `staging`, `stefan`, and `ishai`.

Expected stable branch URLs:

- `https://staging--avenews-platform.netlify.app`
- `https://stefan--avenews-platform.netlify.app`
- `https://ishai--avenews-platform.netlify.app`

For every repository change:

1. Confirm the current branch head after the push.
2. Wait for the corresponding Netlify branch deploy and, when a review PR exists, the Deploy Preview for that exact head.
3. Confirm the Netlify deploy `commit_ref` matches the current branch-head commit.
4. Open the relevant current Netlify URL and check the changed screen or flow. For UI work, check relevant desktop and mobile states.
5. Do not send a successful delivery response while the current deploy is still building.
6. Include the verified Netlify URL and deploy status in the delivery response.
7. If the deploy fails, report the failure and available build details instead of presenting the work as ready.
8. Never invent, infer, or reuse an older URL as proof of the current build without verifying the commit.

For Ishai, the PR Deploy Preview is the authoritative review URL for each `ishai` -> `stefan` change and must be returned after every fix, change, or update.

For Stefan, `https://stefan--avenews-platform.netlify.app` is the persistent latest working environment; a `stefan` -> `staging` PR should additionally use its exact Deploy Preview for promotion review.

## Delivery checkpoint

Every repository-change response should report:

- issue number(s)
- branch
- PR target when applicable
- current commit/head SHA
- GitHub CI status
- Netlify branch deploy status and URL
- Netlify Deploy Preview status and URL when a review PR exists
- what was checked in Netlify
- whether the PR remains open or was merged

## Other repository sources

Follow [`docs/DESIGN_WORKFLOW.md`](docs/DESIGN_WORKFLOW.md) for design and implementation ownership rules. `netlify.toml` is the executable Netlify build/deploy configuration source.

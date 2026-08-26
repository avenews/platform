# Avenews Platform Deployment Workflow

This document is the operational source of truth for how changes to `avenews/platform` are defined, implemented, reviewed, and moved through GitHub and Netlify.

The purpose of this workflow is to keep design and product iteration safe, repeatable, reviewable, traceable, and cost-conscious. Every piece of work starts with a GitHub Issue. Review work must be validated in Netlify before it is promoted to staging or production. `main` must never be used simply to generate a preview.

## 1. Issue-first work intake

Every new piece of work must have a GitHub Issue before implementation begins.

- Small, self-contained work should use one focused issue.
- Larger work should be split into logical, independently reviewable issues before implementation begins.
- Human and agent-driven work follow the same issue-first rule.
- Branches and pull requests must reference the relevant issue or issues.
- Before starting implementation, check existing open issues and pull requests to avoid duplicating work already underway.

## 2. Active contributor branch model

The current collaboration path for the named long-lived contributor branches is:

```text
ishai
  |
  | Draft PR for review
  v
stefan
  |
  | PR after approval
  v
staging
  |
  | release PR after approval
  v
main
```

### Ishai

Ishai works only on `ishai`.

- Push changes only to `ishai`.
- Review PRs target `stefan`.
- PRs remain Draft while under review unless explicitly approved otherwise.
- Do not push directly to `stefan`, `staging`, or `main`.
- Do not merge into `stefan`, `staging`, or `main` without explicit human approval.
- When Ishai needs Stefan's latest reviewed state, sync `ishai` intentionally from `stefan`.

### Stefan

Stefan works on `stefan` for the normal integration/review workflow.

- Push changes only to `stefan` unless explicitly instructed otherwise.
- Promotion PRs target `staging`.
- Do not change `staging` or `main` without explicit approval.

### `staging`

`staging` is the accepted integration baseline. It is protected from direct contributor work.

Do not:

- commit or push directly to it;
- use it as a scratch branch;
- rewrite its history;
- merge into it without explicit approval.

### `main`

`main` is production. Changes reach `main` only through an approved release PR from `staging`.

Do not push directly to `main` for normal product or design work. Do not merge to `main` merely to make a change visible for review.

### Generic feature branches

Where explicitly requested for other contributors or isolated work, focused `feature/<scope>` or `agent/<scope>` branches may still be used. They do not override the dedicated `ishai` and `stefan` branch boundaries above.

## 3. Netlify deployment model

The Netlify project for this repository is `avenews-platform`.

The repository configuration is:

- Production branch: `main`
- Persistent branch deploys: `staging`, `stefan`, and `ishai`
- Deploy Previews: enabled for pull requests against the production branch or configured branch-deploy branches
- Build command: `npm run build`
- Publish directory: `dist/platform/browser`
- Repository build settings: governed by `netlify.toml`

The intended behavior is:

| Git state | Netlify result | Purpose |
| --- | --- | --- |
| Push to `ishai` | Branch Deploy | Persistent latest Ishai environment |
| PR `ishai` -> `stefan` | Deploy Preview | Review Ishai's exact proposed PR state before integration |
| Push to `stefan` | Branch Deploy | Persistent latest Stefan environment |
| PR `stefan` -> `staging` | Deploy Preview | Review Stefan's consolidated changes before baseline promotion |
| `staging` branch | Branch Deploy | Persistent accepted integration environment |
| PR `staging` -> `main` | Deploy Preview where available | Final release review |
| `main` branch | Production Deploy | Production release only |

For Ishai, the persistent branch URL is expected to follow Netlify's branch-deploy convention, while the PR Deploy Preview remains the authoritative review URL for a specific pull-request head. The agent should return the verified PR Deploy Preview URL after each completed change and may also include the persistent `ishai` branch URL as a convenience link when available.

Production deploys must remain deliberate. Normal UI iteration belongs in Deploy Previews and the staging environment, not repeated production deploys from `main`.

## 4. Ishai standard change flow

For normal Ishai work:

1. Define the requested work in a GitHub Issue before implementation begins.
2. Check existing open issues and pull requests for overlapping work.
3. Confirm the current working branch is `ishai`.
4. If needed, intentionally sync the latest reviewed `stefan` state into `ishai` before beginning.
5. Implement only the issue scope on `ishai`.
6. Run the available project validation, normally `npm run check` when a local checkout/runtime is available.
7. Push changes to `ishai` only.
8. Open or update a Draft pull request from `ishai` to `stefan`, referencing the issue.
9. Confirm GitHub checks correspond to the current `ishai` branch head.
10. Locate the Netlify Deploy Preview for the current PR head.
11. Wait until that exact preview is either `ready` or has definitively failed; do not send the final delivery response while it is still building.
12. Confirm the preview is built from the current commit rather than an older build.
13. Open and review the changed screen or flow on the preview. For UI work, verify the relevant desktop and mobile states.
14. If the preview is ready, return the actual Netlify Deploy Preview URL prominently in the final response.
15. If the preview failed, report the failed status and available build details instead of presenting the change as ready.
16. Report the issue, branch, PR target, current head, checks, preview status, preview URL, and what was validated.
17. Implement review feedback on the same `ishai` branch and repeat the full validation and preview cycle.
18. Leave the PR open/Draft until explicit approval is given for integration.

After Ishai's work is accepted, integration into `stefan` is an explicit review action. Promotion from `stefan` to `staging`, and from `staging` to `main`, are separate approval stages.

## 5. Mandatory Netlify preview-return rule for Ishai

For every fix, change, or update delivered from `ishai`, Netlify preview handling is part of the work, not an optional follow-up.

The person or agent making the change must:

- push the current change to `ishai`;
- ensure the active Draft PR targets `stefan`;
- wait for the Netlify Deploy Preview for the exact current PR head;
- verify the preview belongs to the current commit;
- open the preview and check the changed flow or screen;
- return the actual preview URL in the same final response used to hand the work back to Ishai.

Ishai should not need to know how to operate Netlify manually and should not need to ask for the preview separately.

A normal successful Ishai delivery is **not complete** until the current Netlify Deploy Preview is ready and its URL has been returned.

Never describe work as visually verified unless the current preview has actually been opened and checked. Never invent, infer, or reuse an older preview URL without verification.

If the preview fails, report that failure instead of presenting the work as ready. If GitHub-to-Netlify deployment is not connected or no preview can be generated, report that as a deployment setup problem that must be resolved; do not use `main` to obtain a visible build.

## 6. Merge rules

No agent or contributor should merge into `stefan`, `staging`, or `main` merely because implementation is complete.

By default:

- implement on the contributor branch;
- validate it;
- provide the PR and Netlify preview for review;
- leave the PR open.

A merge into `stefan` requires approval of Ishai's reviewed change.

A merge into `staging` requires explicit baseline/integration approval.

A merge into `main` requires explicit production/release approval.

## 7. GitHub checks

The repository uses the `Angular checks` GitHub Actions workflow as baseline automated validation.

At minimum, the current branch head should successfully complete the configured TypeScript/build checks before promotion. A successful check on an older commit is not sufficient.

If CI is failing, resolve the failure or clearly report it before requesting approval to merge.

## 8. Manual Netlify deployments

Manual Netlify deployments are not the normal workflow once Git integration is enabled.

- Do not manually deploy to production as a substitute for the GitHub branch flow.
- Do not run a production deploy from `ishai`, `stefan`, or another working branch.
- A manual production deployment should happen only when explicitly requested for an exceptional reason.

## 9. Release flow

The normal named-contributor release path is:

```text
GitHub Issue
    |
    v
  ishai
    |
    | Draft PR + checks + Netlify preview
    v
  stefan
    |
    | approved promotion PR
    v
 staging
    |
    | approved release PR
    v
   main
    |
    v
Netlify production deployment
```

The key rule is simple: Ishai works only on `ishai`, Stefan reviews/integrates through `stefan`, `staging` remains the accepted baseline, and `main` is reserved for approved production releases.

## 10. Required delivery response format

After making a repository change for Ishai, use a concise checkpoint such as:

```text
Issue: #123
Branch: ishai
PR target: stefan
Commit: <sha>
GitHub checks: passed / failed
Netlify preview: ready / failed / unavailable
Preview URL: <verified deploy-preview URL when ready>
Preview check: <what was checked>
Merge status: left open for review
```

Do not send a normal successful final delivery while the current preview is still building. Never invent a preview URL or claim a preview was checked when it was not.

## 11. Relationship to other repository sources

This document governs work intake, Git promotion, and Netlify deployment behavior.

For contributor branch ownership, `AGENTS.md` and the Avenews Platform Collaboration Rulebook are authoritative. For UI implementation, design-system ownership, responsive review, source hierarchy, and prototype-data rules, follow `docs/DESIGN_WORKFLOW.md`. For build and deploy configuration, `netlify.toml` remains the executable Netlify configuration source.

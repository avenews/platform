# Avenews Platform Deployment Workflow

This document is the operational source of truth for how changes to `avenews/platform` are implemented, reviewed, previewed, and promoted through GitHub and Netlify.

## 1. Active contributor branch model

```text
ishai -> stefan -> staging -> main
```

- `ishai` is Ishai's dedicated working branch. Ishai pushes only to `ishai`; review PRs target `stefan`.
- `stefan` is Stefan's dedicated working and integration branch. Stefan pushes only to `stefan`; promotion PRs target `staging`.
- `staging` is the accepted baseline. Do not commit or push directly to it.
- `main` is production. Changes reach it only through an approved `staging` -> `main` release PR.

Never merge into `stefan`, `staging`, or `main` without explicit human approval for that integration step.

## 2. Issue-first rule

Every new piece of work starts with a GitHub Issue. Reuse the current issue when a correction belongs to the same review cycle instead of creating unnecessary duplicates.

## 3. Netlify deployment model

Netlify project: `avenews-platform`.

Configured deployment model:

- Production branch: `main`
- Persistent branch deploys: `staging`, `stefan`, `ishai`
- Deploy Previews: enabled for pull requests against `main` or configured branch-deploy branches
- Build command: `npm run build`
- Publish directory: `dist/platform/browser`
- Build configuration: `netlify.toml`

Expected stable environments:

| Git state | Netlify environment | Purpose |
| --- | --- | --- |
| `main` | `https://avenews-platform.netlify.app` | Production |
| `staging` | `https://staging--avenews-platform.netlify.app` | Accepted baseline |
| `stefan` | `https://stefan--avenews-platform.netlify.app` | Latest Stefan working state |
| `ishai` | `https://ishai--avenews-platform.netlify.app` | Latest Ishai working state |
| PR `ishai` -> `stefan` | Deploy Preview | Exact Ishai review state |
| PR `stefan` -> `staging` | Deploy Preview | Exact Stefan promotion state |
| PR `staging` -> `main` | Deploy Preview | Final release review where available |

A persistent branch URL is useful for the latest branch state. A PR Deploy Preview is the authoritative review URL for the exact PR head.

## 4. Stefan standard change flow

1. Confirm the requested work has a current GitHub Issue.
2. Verify the active branch is `stefan`.
3. Confirm `staging` is the intended accepted baseline; do not change it while iterating.
4. Implement the requested work on `stefan` only.
5. Run the relevant project checks.
6. Push only to `stefan`.
7. Wait for the Netlify `stefan` branch deploy for the exact new head.
8. Verify Netlify's `commit_ref` matches the current `stefan` SHA.
9. Open the persistent Stefan URL and check the changed flow. For UI work, check relevant desktop and mobile states.
10. Report the verified URL and status.
11. When promotion is requested, open/update a PR `stefan` -> `staging`, wait for its Deploy Preview, and leave it open until explicit merge approval.

## 5. Ishai standard change flow

1. Confirm the requested work has a current GitHub Issue.
2. Verify the active branch is `ishai`.
3. Implement and push only to `ishai`.
4. Keep the active review PR as Draft `ishai` -> `stefan`.
5. Wait for both the persistent `ishai` branch deploy and the PR Deploy Preview for the exact current head.
6. Verify the deploy commit matches the current `ishai` SHA.
7. Open/check the changed flow.
8. Return the PR Deploy Preview URL in the same final response after every fix, change, or update.
9. Do not make Ishai operate Netlify manually for the normal workflow.
10. Leave the PR open/Draft until explicit integration approval.

## 6. Validation rules

Before saying work is ready for review:

- run the available baseline/type/build checks applicable to the change;
- run responsive checks for UI work where applicable;
- do not report a running check as passed;
- wait for the current Netlify build to become `ready` or definitively fail;
- never use an older deploy as proof for a newer commit.

For visual work, opening the current Netlify environment and checking the changed screen is required before claiming visual verification.

## 7. Netlify verification requirements

For any branch or PR deploy used as evidence:

1. Identify the current GitHub head SHA.
2. Identify the Netlify deploy associated with that branch/PR.
3. Confirm `commit_ref` equals the current head SHA.
4. Wait while state is `building`.
5. If state becomes `ready`, open/check the URL and return it.
6. If state fails, report the failure and available build details.
7. Never invent or guess a Netlify URL.

## 8. Promotion rules

Normal promotion order:

```text
ishai -> stefan -> staging -> main
```

- `ishai` -> `stefan`: explicit review/integration approval.
- `stefan` -> `staging`: explicit accepted-baseline approval.
- `staging` -> `main`: explicit production/release approval.

Do not merge merely because checks and previews pass.

## 9. Staging changelog

For application changes approved for `staging`, follow `docs/STAGING_CHANGELOG.md` and add/update the staging changelog entry in the same promotion PR unless the reviewer explicitly agrees that the change is documentation-only/internal maintenance.

## 10. Delivery checkpoint

After a repository change, report a concise checkpoint:

```text
Issue: #123
Branch: stefan or ishai
PR target: <target when applicable>
Commit: <current SHA>
GitHub checks: passed / running / failed / not applicable
Netlify branch deploy: ready / building / failed
Branch URL: <verified stable branch URL>
Netlify PR preview: ready / building / failed / not applicable
Preview URL: <verified PR preview URL when applicable>
Preview check: <what was checked>
Merge status: left open / merged only with explicit approval
```

## 11. Related sources

- Contributor ownership and agent rules: `AGENTS.md`
- Customer portal baseline: `docs/CUSTOMER_PORTAL_BASELINE.md`
- Design implementation rules: `docs/DESIGN_WORKFLOW.md`
- Staging history rules: `docs/STAGING_CHANGELOG.md`
- Executable build/deploy config: `netlify.toml`

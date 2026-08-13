# Staging Changelog Process

The customer portal Changelog records work that has actually been accepted into the `staging` branch. It is not a list of experiments or open pull requests.

## Source of truth

Entries live in:

`src/app/shared/staging-changelog.data.ts`

The `/changelog` screen renders that data and is linked from the desktop-only Developer menu.

## When an entry is added

Before an approved feature/agent pull request is merged into `staging`, the PR owner updates the changelog data in that same PR. The entry must identify:

- the pull request number;
- the staging date;
- the contributor / work owner;
- the PR title;
- a concise list of user-visible or material technical changes.

Because the changelog change is part of the PR itself, merging the PR into `staging` locks the entry into the same Git history as the implementation. Closing or rejecting the PR leaves no staging changelog entry.

## Entry shape

```ts
{
  id: 'pr-123',
  stagingDate: '2026-08-13',
  prNumber: 123,
  title: 'Example change',
  contributor: 'Stefan',
  summary: [
    'Changed the customer-facing flow.',
    'Updated responsive behaviour.',
  ],
}
```

Use the human work owner/contributor name when known. Do not use the shared automation/GitHub identity as a substitute when it would obscure who requested or owned the work.

## Review rule

A PR into `staging` is not ready to merge until its changelog entry is present and accurately describes the accepted scope. Documentation-only or internal maintenance PRs may explicitly state `No changelog entry — no portal/staging change` in the PR description when a reviewer agrees.

This process does not enable automatic merging. The existing explicit-approval rule for `staging` and `main` remains unchanged.

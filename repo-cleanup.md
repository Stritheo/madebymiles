# Repo Cleanup Checklist

Work through these steps in order from your desktop.

## 1. Enable auto-delete of merged branch heads

This is a one-time setting. After this, every merged PR automatically deletes its branch.

1. Go to **github.com/Stritheo/madebymiles/settings**
2. Scroll to **Pull Requests** section
3. Tick **"Automatically delete head branches"**
4. Save

## 2. Merge the 3 Dependabot PRs

These bump your GitHub Actions to current versions. Safe to merge.

- [ ] PR #4 - Bump actions/checkout from 4 to 6
- [ ] PR #3 - Bump actions/upload-pages-artifact from 3 to 4
- [ ] PR #2 - Bump actions/setup-node to 6

For each one: open the PR, click **Merge pull request**, confirm. With auto-delete enabled (step 1), the `dependabot/...` branches delete themselves.

## 3. Close stale PRs

- [ ] PR #1 - Old Next.js upgrade from a previous Claude session. Click **Close pull request** (not merge).

## 4. Delete stale remote branches

After closing PR #1, delete these leftover branches:

1. Go to **github.com/Stritheo/madebymiles/branches**
2. Delete each of these by clicking the trash icon:
   - [ ] `claude/nextjs-upgrade-timeline-01CgxGemU6Lrpo55VcLawrLr`
   - [ ] `claude/revert-tailwind-dD5uZ`
   - [ ] `claude/review-website-roadmap-rst4k`

## 5. Verify

After all steps, you should have only:
- `main`
- `claude/update-content-verified-dD5uZ` (current working branch, delete after merge)

Going forward, auto-delete handles everything. No manual cleanup needed.

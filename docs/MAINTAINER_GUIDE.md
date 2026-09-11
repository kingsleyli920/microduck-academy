# Maintainer guide

[简体中文](MAINTAINER_GUIDE.zh-CN.md) · English

## Before merging

1. Confirm the pull request explains the learner-facing behavior and its simulator or hardware boundary.
2. Require the repository CI to pass.
3. Run the affected flow in the real browser simulator when UI, bridge, policy, or rollout behavior changes.
4. Confirm generated runtimes, policies, profiles, secrets, and machine-specific paths are absent from the diff.
5. Update the changelog and release-status documentation when capability claims change.

## Preview release checklist

1. Merge a reviewed pull request into `main`.
2. From a clean checkout, run `npm ci`, `npm run setup:runtime`, `npm run verify`, and `npm run academy`.
3. Exercise the introductory course and every changed 3D Lab level in a browser.
4. Update the version in `package.json`, move Unreleased changelog entries under the release version, and update both release-status documents.
5. Tag the exact `main` commit and create a GitHub prerelease with installation steps, verified capabilities, and explicit limitations.

Do not attach generated simulator builds or policies to a release until the upstream redistribution terms have been confirmed.

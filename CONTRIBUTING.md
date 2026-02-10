# Contributing

Lumi is proprietary software. External contributions are not currently accepted without written permission from the copyright owner.

If you have approved access, follow the guidelines below.

## Code style guidelines

- Use TypeScript and prefer strict typing; avoid `any` unless justified.
- Keep functions small and focused; split large modules when they grow.
- Prefer async/await over chained promises.
- Add tests for new logic and update existing tests when behavior changes.
- Keep changes scoped; avoid reformatting unrelated code.

## PR process

1. Create a focused branch from `main`.
2. Keep PRs small and tie them to a checklist step or issue.
3. Run `npm test` and `npm run build` before requesting review.
4. Include a summary, testing notes, and screenshots for UI changes.
5. Do not include user data, backups, or logs in commits.

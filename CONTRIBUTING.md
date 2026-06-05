# Contributing

Thanks for taking interest in Builder Thinking. The project is currently in alpha, so contributions should stay focused, practical, and easy to review.

## Project Status

Builder Thinking is an early-stage visual editor project. Some APIs, component schemas, and file formats can still change.

Good contribution areas:

- Editor UX polish
- Canvas interaction fixes
- Layout and resizing behavior
- Import/export reliability
- Responsive behavior
- Documentation
- Small, focused bug fixes

Avoid large rewrites unless there is an issue or discussion that explains the problem and tradeoffs.

## Local Setup

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Build before opening a pull request:

```bash
npm run build
```

## Development Guidelines

- Prefer small, surgical changes.
- Keep editor behavior consistent with the current Craft.js and Lexical integration.
- Do not commit `.env`, generated local files, or screenshots that are not part of documentation.
- Keep UI changes responsive across desktop and mobile/tablet drawer modes.
- Reuse existing components and styles before adding new abstractions.
- Document new user-facing features in `README.md` when relevant.

## Pull Request Checklist

Before submitting a PR:

- `npm run build` passes.
- The main route loads.
- The `#editor` route loads.
- Desktop layout is not broken.
- Mobile/tablet drawer sidebars still work.
- Import/export changes have been tested manually.
- The change is described clearly in the PR.

## Reporting Bugs

When reporting a bug, include:

- What happened
- What you expected
- Steps to reproduce
- Browser and OS
- Screenshot or screen recording if it is visual
- Any console error if available

## Feature Requests

Feature requests are welcome, but please describe the workflow, not only the UI. For editor work, explain which node type, panel, canvas behavior, or export/import flow should change.

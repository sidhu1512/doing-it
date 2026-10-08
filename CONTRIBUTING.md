# Contributing to Doing It

Thank you for your interest in contributing to **Doing It**! We welcome contributions from the community to help make Doing It the fastest, cleanest, and most reliable desktop productivity overlay for Windows.

Please take a moment to review this document before submitting issues or pull requests.

---

## Code of Conduct

This project and everyone participating in it is governed by the [Doing It Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to project maintainers.

---

## Ways to Contribute

- **Reporting Bugs**: Check existing [GitHub Issues](https://github.com/sidhu1512/doing-it/issues) to see if the bug has already been reported. If not, open a new issue using the **Bug Report** template.
- **Suggesting Features**: Open a feature proposal via the **Feature Request** issue template. Explain the use case and why it benefits users without cluttering the interface.
- **Code Contributions**: Fix bugs, improve performance, optimize themes, or refine documentation.

---

## Development Setup

### Prerequisites
- **Node.js**: Version 18.x or 20.x LTS
- **OS**: Windows 10 (1809+) or Windows 11 (64-bit)
- **Git**

### Installation
```bash
# Clone the repository
git clone https://github.com/sidhu1512/doing-it.git
cd doing-it

# Install dependencies
npm install

# Run the app in development mode
npm start
# or with DevTools enabled:
npm run dev
```

---

## Project Invariants & Design Principles

All contributions must adhere to our core engineering invariants:

1. **Local-First & Privacy First**:
   - All user data must be stored locally in `%APPDATA%/doing-it/doing-it-data.json`.
   - Never introduce telemetry, tracking pixels, third-party analytics, or remote logging.
   - Network calls are strictly limited to user-initiated features (RFC 5545 calendar feeds and rich link previews).

2. **Zero-Emoji UI Rule**:
   - The user interface uses clean, vector SVGs for all iconography.
   - Verified automatically in `test/components.test.js`. Do not introduce raw emoji characters into UI components or buttons.

3. **Window Invariants**:
   - `main.js`: Windows use `frame: false, transparent: true, backgroundColor: '#00000000'`.
   - Window borders and corners are shaped via `clip-path` in CSS to preserve anti-aliased rendering.
   - Never replace or alter the protected app icon (`build/icon.ico`, `assets/icon.ico`, `assets/icon.png`).

4. **Atomic Persistence**:
   - File writes must use staging files (`.tmp`) and atomic renames to prevent file corruption during abrupt shutdowns.

5. **Security & Context Isolation**:
   - `contextIsolation: true`, `nodeIntegration: false`.
   - All IPC channels must be explicitly declared and validated in `preload.js` and `src/main/ipc.js`.

---

## Testing & Quality Assurance

Before submitting a pull request, ensure all automated tests and linter checks pass:

```bash
# Run unit and component test suite
npm test

# Run syntax and static analysis checks
npm run lint

# (Optional) Run full-day QA simulation / E2E smoke tests
npm run test:qa
```

---

## Pull Request Guidelines

1. **Fork and branch**: Create a descriptive feature branch from `main` (e.g. `fix/calendar-timezone`, `feat/keyboard-nav`).
2. **Commit clearly**: Write concise commit messages that describe what was changed and why.
3. **Keep PRs focused**: Avoid bundling unrelated changes or reformatting files outside the scope of your PR.
4. **Fill out the PR template**: Provide testing evidence and explain any design decisions.
5. **Continuous Integration**: Ensure all checks pass and resolve any review feedback.

---

## Community & Questions

If you have questions about the codebase or architecture, consult [`DOCUMENTATION.md`](DOCUMENTATION.md) or open an issue on GitHub. Thank you for helping build Doing It!

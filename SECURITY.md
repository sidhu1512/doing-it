# Security Policy

The Doing It team takes security and user privacy seriously. As a local-first desktop application handling personal productivity data, notes, and task records, our priority is safeguarding your workstation and local data integrity.

---

## Supported Versions

Security updates and patches are actively applied to the following release series:

| Version | Supported          |
| ------- | ------------------ |
| 4.4.x   | :white_check_mark: |
| < 4.4.0 | :x:                |

We strongly advise all users to remain on the latest release of Doing It.

---

## Reporting a Vulnerability

If you discover a security vulnerability or potential threat in Doing It, please do **NOT** disclose it in a public GitHub issue.

Instead, please report it via one of the following methods:

1. **GitHub Private Vulnerability Reporting**: Submit a private advisory directly on GitHub under the repository's [Security Advisory](https://github.com/sidhu1512/doing-it/security/advisories) tab.
2. **Direct Contact**: Contact the maintainer [sidhu1512](https://github.com/sidhu1512) through GitHub.

### What to Include in Your Report
Please include as much detail as possible to help us understand and resolve the issue:
- Clear description of the vulnerability and attack vector.
- Step-by-step reproduction instructions or a minimal proof of concept (PoC).
- Potential impact on the user or workstation.
- Operating system version and app version tested.

### Our Commitment
- We will acknowledge receipt of your vulnerability report within **48 hours**.
- We will provide a status assessment and coordinate a security fix.
- We will credit reporters in our release notes and changelog (unless requested to remain anonymous).

---

## Security Model & Architecture

Doing It adheres to strict Electron security guidelines:

- **Context Isolation**: `contextIsolation: true` is strictly enforced. The Node.js runtime is never exposed directly to renderer processes.
- **Node Integration Disabled**: `nodeIntegration: false` across all main, modal, and companion windows.
- **Protocol Sandboxing**: All user images and audio recordings are served through a custom local protocol (`doingit-media://`) with strict path sanitation and drive letter normalization to prevent arbitrary local filesystem reads.
- **Local Data Only**: All notes, tasks, habits, and journals are stored strictly in your local `%APPDATA%/doing-it/` directory. No telemetry, third-party trackers, or cloud sync servers are utilized by default.
- **Safe External Sync**: Calendar fetching (`RFC 5545`) communicates directly with your chosen iCal endpoint without intermediary proxies or credential transmission.
- **DOM Sanitization**: All markdown rendering passes through `DOMPurify` to prevent cross-site scripting (XSS) vectors.

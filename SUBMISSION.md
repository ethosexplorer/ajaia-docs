# Submission Checklist

## Project: Ajaia Docs — Collaborative Document Editor

**Author:** Moazzam Waheed  
**Stack:** Next.js 16.2.1 · React 19 · Tiptap 3 · SQLite · TypeScript

---

## Deliverables

### Documentation

| File                                    | Description                                          |
|-----------------------------------------|------------------------------------------------------|
| [README.md](./README.md)               | Local setup instructions, project structure, scripts |
| [ARCHITECTURE.md](./ARCHITECTURE.md)   | Design decisions and architectural rationale         |
| [AI_WORKFLOW.md](./AI_WORKFLOW.md)     | AI tools used and contribution breakdown             |
| [SUBMISSION.md](./SUBMISSION.md)       | This file — complete submission inventory            |

---

### Source Code — Application Layer

| File                                          | Type             | Description                                                    |
|-----------------------------------------------|------------------|----------------------------------------------------------------|
| `src/app/layout.tsx`                          | Server Component | Root layout — Inter font, global CSS, Header                  |
| `src/app/page.tsx`                            | Server Component | Dashboard — "My Documents" and "Shared with Me" lists         |
| `src/app/globals.css`                         | Stylesheet       | Design tokens, light/dark theme, editor & modal styles         |
| `src/app/page.module.css`                     | CSS Module       | Scoped styles for the landing page                             |
| `src/app/d/[id]/page.tsx`                     | Server Component | Document editor page — access control, data fetching           |

### Source Code — Server Actions

| File                                          | Type             | Description                                                    |
|-----------------------------------------------|------------------|----------------------------------------------------------------|
| `src/app/actions/auth.ts`                     | Server Action    | `setMockUser` — writes mock user ID to cookie                 |
| `src/app/actions/document.ts`                 | Server Action    | CRUD: create, read, update title/content for documents         |
| `src/app/actions/share.ts`                    | Server Action    | Add/update/remove shares, Brevo email notifications            |
| `src/app/actions/comment.ts`                  | Server Action    | Add/delete inline comments, thread management                  |

### Source Code — Client Components

| File                                          | Type             | Description                                                    |
|-----------------------------------------------|------------------|----------------------------------------------------------------|
| `src/components/Editor.tsx`                   | Client Component | Tiptap rich-text editor, toolbar, BubbleMenu, comments sidebar |
| `src/components/ShareDialog.tsx`              | Client Component | Google Docs–style share modal with role management             |
| `src/components/TitleInput.tsx`               | Client Component | Inline-editable document title with auto-save on blur          |
| `src/components/FileUploader.tsx`             | Client Component | .txt/.md file import with client-side parsing                  |
| `src/components/Header.tsx`                   | Server Component | App header with branding and mock-auth user switcher           |
| `src/components/UserSwitcher.tsx`             | Client Component | Dropdown for switching between mock users                      |

### Source Code — Library / Utilities

| File                                          | Type             | Description                                                    |
|-----------------------------------------------|------------------|----------------------------------------------------------------|
| `src/lib/db.ts`                               | Module           | SQLite init, schema creation, migrations, user seeds           |
| `src/lib/auth.ts`                             | Module           | `getCurrentUser()`, `getAllUsers()` — cookie-based mock auth   |

---

### Configuration Files

| File                   | Description                                                        |
|------------------------|--------------------------------------------------------------------|
| `package.json`         | Dependencies, scripts (dev, build, start, lint)                    |
| `tsconfig.json`        | TypeScript config — strict mode, `@/*` path alias, React JSX      |
| `next.config.ts`       | Next.js configuration (default/minimal)                            |
| `eslint.config.mjs`    | ESLint configuration with Next.js preset                           |
| `playwright.config.ts` | Playwright E2E test config — Chromium, Firefox, WebKit             |

---

### Tests

| File                        | Framework   | Description                                             |
|-----------------------------|-------------|---------------------------------------------------------|
| `tests/example.spec.ts`    | Playwright  | E2E: dashboard renders with title; new document flow    |

---

### Data

| File               | Description                                                              |
|--------------------|--------------------------------------------------------------------------|
| `database.sqlite`  | Auto-generated SQLite database (created on first run, gitignored in prod)|

---

## Features Implemented

- [x] **Rich Text Editing** — Bold, italic, underline, H1/H2, bullet/ordered lists, undo/redo
- [x] **Inline Commenting** — Highlight-to-comment with BubbleMenu, sidebar thread view, resolve/delete
- [x] **Document Sharing** — Google Docs share modal, email invite, Viewer/Commenter/Editor roles
- [x] **Role-Based Access Control** — UI + data layer enforcement of permissions
- [x] **Auto-Save** — Debounced 1s save with visual status indicator
- [x] **File Upload** — Import .txt and .md files as new documents
- [x] **Email Notifications** — Brevo transactional emails on document share
- [x] **Mock Authentication** — Cookie-based user switching for demo/testing
- [x] **Dark Mode** — Automatic via `prefers-color-scheme` media query
- [x] **E2E Tests** — Playwright tests covering core user flows

---

## How to Run

```bash
npm install
npm run dev
# Open http://localhost:3000
```

See [README.md](./README.md) for detailed setup instructions.

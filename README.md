# Ajaia Docs — Collaborative Document Editor

A Google Docs–inspired collaborative document editor built with **Next.js 16**, **Tiptap**, and **SQLite**. Supports rich-text editing, inline commenting, role-based sharing (Viewer / Commenter / Editor), file uploads, and email notifications via Brevo.

---

## Prerequisites

| Tool    | Version  |
|---------|----------|
| Node.js | ≥ 18 LTS |
| npm     | ≥ 9      |

No external database server is required — the app uses an embedded SQLite file (`database.sqlite`) created automatically on first run.

---

## Quick Start

```bash
# 1. Clone the repository and enter the project directory
cd assignment

# 2. Install dependencies
npm install

# 3. Start the development server (Turbopack)
npm run dev
```

The app will be available at **http://localhost:3000**.

---

## Environment Variables (Optional)

Create a `.env.local` file in the project root to configure optional integrations:

| Variable               | Purpose                                                        | Default                   |
|------------------------|----------------------------------------------------------------|---------------------------|
| `BREVO_API_KEY`        | Brevo (Sendinblue) API key for sending share-invitation emails | Falls back to a dev key   |
| `NEXT_PUBLIC_APP_URL`  | Base URL used in email links                                   | `http://localhost:3000`   |

> **Note:** The app functions fully without these variables — email notifications will simply fail silently.

---

## Available Scripts

| Command           | Description                                      |
|-------------------|--------------------------------------------------|
| `npm run dev`     | Start dev server with Turbopack on port 3000     |
| `npm run build`   | Create a production build                        |
| `npm run start`   | Serve the production build                       |
| `npm run lint`    | Run ESLint across the project                    |
| `npx playwright test` | Run end-to-end Playwright tests (requires dev server running) |

---

## Mock Authentication

The app ships with three pre-seeded users. Switch between them using the **Mock Auth** dropdown in the header to test sharing & permission flows:

| User ID          | Name               | Email                      |
|------------------|--------------------|----------------------------|
| `user_moazzam`   | Moazzam Waheed     | moazzamwaheed@gmail.com    |
| `user_reviewer`  | Ajaia Reviewer     | reviewer@ajaia.io          |
| `user_collab`    | Alex Collaborator  | alex@ajaia.io              |

---

## Project Structure

```
assignment/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Dashboard — lists owned & shared documents
│   │   ├── layout.tsx            # Root layout (Inter font, Header)
│   │   ├── globals.css           # Design tokens & global styles
│   │   ├── d/[id]/page.tsx       # Document editor page (dynamic route)
│   │   └── actions/
│   │       ├── auth.ts           # Server Action — mock user switching
│   │       ├── document.ts       # Server Actions — CRUD for documents
│   │       ├── share.ts          # Server Actions — sharing + Brevo emails
│   │       └── comment.ts        # Server Actions — inline comments
│   ├── components/
│   │   ├── Editor.tsx            # Tiptap rich-text editor + comments sidebar
│   │   ├── ShareDialog.tsx       # Google Docs–style share modal
│   │   ├── TitleInput.tsx        # Editable document title (inline rename)
│   │   ├── FileUploader.tsx      # .txt/.md file import
│   │   ├── Header.tsx            # App header with branding + user switcher
│   │   └── UserSwitcher.tsx      # Client-side user-switching dropdown
│   └── lib/
│       ├── db.ts                 # SQLite setup, schema, seeds, migrations
│       └── auth.ts               # Cookie-based mock auth helpers
├── tests/
│   └── example.spec.ts           # Playwright E2E tests
├── database.sqlite               # Auto-generated SQLite database
├── package.json
├── tsconfig.json
├── next.config.ts
└── playwright.config.ts
```

---

## Key Features

- **Rich Text Editing** — Bold, italic, underline, headings, bullet & ordered lists, undo/redo via Tiptap + ProseMirror
- **Inline Commenting** — Highlight text to add comments; comments appear in a right sidebar with thread UI
- **Role-Based Access Control** — Owner, Editor, Commenter, and Viewer roles with enforced permissions
- **Google Docs–Style Sharing** — Modal with email invite, role selection, and "People with access" list
- **File Upload** — Import `.txt` and `.md` files as new documents (Markdown rendered to HTML via `marked`)
- **Auto-Save** — Debounced (1 s) content persistence with save-status indicator
- **Email Notifications** — Sharing invitations sent via Brevo transactional email API
- **E2E Tests** — Playwright tests covering dashboard rendering and document creation flow

---

## Troubleshooting

| Issue                          | Fix                                                    |
|--------------------------------|--------------------------------------------------------|
| `Module not found: @floating-ui/dom` | Run `npm install @floating-ui/dom`              |
| Database errors                | Delete `database.sqlite` and restart — it auto-recreates |
| Port 3000 in use               | Kill the process or set `PORT=3001 npm run dev`        |

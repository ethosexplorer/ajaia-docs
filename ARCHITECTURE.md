# Architecture & Design Decisions

## Technology Stack

| Layer        | Technology                     | Rationale                                                                                           |
|--------------|--------------------------------|-----------------------------------------------------------------------------------------------------|
| Framework    | Next.js 16.2.1 (App Router)   | Server Components + Server Actions eliminate the need for a separate API layer                      |
| Runtime      | React 19.2.4                   | Enables `useTransition`, `use server` directives, and async Server Components                      |
| Bundler      | Turbopack                      | Fastest iteration speed during development (built into Next.js 16)                                 |
| Rich Editor  | Tiptap 3 + ProseMirror        | Extensible, schema-driven editor with first-class React bindings; supports custom marks (comments) |
| Database     | SQLite via better-sqlite3      | Zero-config, file-based — perfect for a local-first assignment with no external infra              |
| Styling      | Vanilla CSS + CSS Variables    | Lightweight design-token system with automatic light/dark theme via `prefers-color-scheme`          |
| Email        | Brevo (Sendinblue) SDK         | Transactional email API for share-invitation notifications                                         |
| Testing      | Playwright                     | Cross-browser E2E tests against a real dev server                                                  |
| Icons        | Lucide React                   | Tree-shakeable SVG icon library consistent with modern UI conventions                              |

---

## Architectural Decisions

### 1. Server Actions over REST APIs

All data mutations (create/update documents, share, comment) are implemented as **Next.js Server Actions** (`'use server'` functions) rather than traditional REST endpoints.

**Why:**
- Eliminates boilerplate: no route handlers, no fetch wrappers, no request/response serialisation
- Type-safe end-to-end: the client calls a TypeScript function and receives a typed return value
- Automatic `revalidatePath` integration keeps the Server Component tree fresh after mutations

**Trade-off:** Server Actions are tightly coupled to the Next.js runtime and cannot be called from external clients (mobile apps, third-party integrations). For a pure assignment-scope app, this trade-off is acceptable.

### 2. SQLite as the Persistence Layer

The application uses an embedded **SQLite** database (`database.sqlite` at project root) managed through `better-sqlite3`.

**Why:**
- Zero infrastructure: no Docker, no hosted DB, no connection strings
- Synchronous API: `better-sqlite3` is synchronous, which aligns perfectly with Next.js Server Actions running in a Node.js process
- Schema auto-creates on startup via `db.exec(CREATE TABLE IF NOT EXISTS ...)`, so there is no separate migration step

**Schema overview:**

```
users ──1:N──► documents ──1:N──► document_comments
                  │
                  └──M:N──► document_shares (junction table with role)
```

### 3. Cookie-Based Mock Authentication

Instead of implementing a full OAuth or session-based auth system, the app uses a **mock auth cookie** (`ajaia_mock_user_id`).

**Why:**
- Assignment scope: the focus is on collaborative editing features, not auth infrastructure
- The `UserSwitcher` dropdown in the header lets evaluators instantly switch between three pre-seeded users to test ownership, sharing, and commenting flows
- `getCurrentUser()` reads the cookie on every Server Action / Server Component render, providing a consistent auth facade

### 4. Tiptap with a Custom Comment Mark

The editor uses **Tiptap 3** (a React wrapper around ProseMirror) with a custom `CommentMark` extension.

**How inline comments work:**
1. User selects text → a `BubbleMenu` appears with an "Add Comment" button
2. Clicking it creates a ProseMirror mark (`<span data-comment-id="t_...">`) around the selected text
3. The comment text is saved to the `document_comments` table via a Server Action
4. The highlighted span is persisted inside the document's HTML content
5. Clicking a highlighted span in the editor activates the corresponding comment in the right sidebar

**Design note — Commenter role bypass:**  
TipTap's `editable: false` blocks all keyboard input, but Commenters still need to apply highlight marks. The Editor component works around this by directly dispatching a ProseMirror transaction (`view.dispatch(...)`) to apply the mark even when the editor is read-only, then force-saves the HTML. This preserves the security invariant (Commenters cannot type) while allowing mark application.

### 5. Role-Based Access Control (RBAC)

Three user roles are enforced at both the **UI** and **data** layers:

| Role       | Can Edit Content | Can Comment | Can View | Can Share |
|------------|:----------------:|:-----------:|:--------:|:---------:|
| Owner      | ✅               | ✅          | ✅       | ✅        |
| Editor     | ✅               | ✅          | ✅       | ❌        |
| Commenter  | ❌               | ✅          | ✅       | ❌        |
| Viewer     | ❌               | ❌          | ✅       | ❌        |

- **UI enforcement:** The `Editor` component conditionally renders the toolbar (Editors only) and the BubbleMenu (Editors + Commenters). The `ShareDialog` disables invite inputs for non-owners.
- **Data enforcement:** Every Server Action calls `getCurrentUser()` and checks ownership / share-role before mutating data.

### 6. Debounced Auto-Save

Content changes are auto-saved with a **1-second debounce**:

```
User types → onUpdate fires → timer resets → after 1s of inactivity → Server Action saves HTML
```

A visual status indicator shows "Saving..." → "All changes saved" in the editor header area.

### 7. Email Notification via Brevo

When a document owner shares a document, the `addShare` Server Action sends a transactional email via the **Brevo SDK** containing:
- Document title
- Granted role
- A direct link to the document

This call is **non-blocking**: if it fails (missing API key, network issue), the share is still created in the database and the user receives a success response. The error is only logged server-side.

### 8. File Upload Strategy

The `FileUploader` component handles `.txt` and `.md` files entirely **client-side**:
- `.md` files are parsed to HTML using the `marked` library
- `.txt` files are wrapped in `<p>` tags per line
- The resulting HTML and a title (derived from the filename) are passed to `createDocument()` — a Server Action — which inserts them into SQLite

This avoids the need for file-upload API endpoints or cloud storage.

---

## Component Architecture

```
RootLayout (Server)
├── Header (Server)
│   └── UserSwitcher (Client) — mock auth dropdown
│
├── Home / page.tsx (Server)
│   ├── FileUploader (Client) — .txt/.md import
│   └── DocumentCard (Server) — document list items
│
└── DocumentPage / d/[id]/page.tsx (Server)
    ├── TitleInput (Client) — inline editable title
    ├── ShareDialog (Client) — sharing modal + role management
    └── Editor (Client) — Tiptap editor + BubbleMenu + comments sidebar
```

**Server vs. Client boundary:** Data fetching and access-control checks happen in Server Components. Interactive UI (editor, dialogs, dropdowns) is rendered in Client Components that receive data as props.

---

## Database Initialisation Flow

```
1. db.ts is imported (module-level execution)
2. SQLite file is opened or created at process.cwd()/database.sqlite
3. Schema tables are created (IF NOT EXISTS)
4. Migration: adds 'role' column to document_shares if missing
5. Indices are created for owner_id and user_id lookups
6. seedUsers() inserts 3 mock users if the users table is empty
```

This runs once per Node.js process start, ensuring the database is always ready with no manual setup.

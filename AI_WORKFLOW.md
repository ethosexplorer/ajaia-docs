# AI Workflow — How AI Was Used in This Project

## Overview

AI coding assistants were used as a **pair-programming partner** throughout the development of Ajaia Docs. The AI accelerated implementation by generating boilerplate, suggesting architectural patterns, debugging runtime errors, and producing documentation. All AI-generated code was reviewed, tested, and modified by the developer before integration.

---

## AI Tools Used

| Tool                  | Role                                                                                       |
|-----------------------|--------------------------------------------------------------------------------------------|
| **Claude (Anthropic)**| Primary coding assistant — architecture planning, component scaffolding, debugging, docs   |
| **Gemini (Google)**   | Secondary reference — API documentation lookups, alternative approaches                    |

---

## How AI Was Applied at Each Stage

### 1. Project Setup & Architecture Planning

- **Prompt:** "Design a Google Docs-like collaborative editor with Next.js 16, Tiptap, and SQLite"
- **AI contribution:** Recommended the Server Actions–first architecture (no REST API layer), suggested `better-sqlite3` for synchronous SQLite access, and outlined the schema design (users, documents, document_shares, document_comments)
- **Human refinement:** Chose cookie-based mock auth over the AI's initial suggestion of NextAuth for faster evaluation workflows; adjusted table schemas to include `role` in `document_shares`

### 2. Database Schema & Server Actions

- **AI contribution:** Generated the initial `db.ts` schema creation script, seed data, and CRUD Server Actions for documents, shares, and comments
- **Human refinement:** Added the migration logic for the `role` column, tuned SQL queries for access-control joins, and implemented the `ON CONFLICT ... DO UPDATE` upsert pattern for share creation

### 3. Rich Text Editor (Tiptap)

- **AI contribution:** Scaffolded the `Editor.tsx` component with Tiptap 3 setup, toolbar buttons, and the debounced auto-save pattern
- **Human refinement:** Developed the custom `CommentMark` extension, implemented the ProseMirror transaction bypass for Commenter-role mark application, and wired the BubbleMenu for context-aware comment triggers

### 4. Sharing & Permissions UI

- **AI contribution:** Generated the `ShareDialog.tsx` component structure inspired by Google Docs' share modal, including the email input, role selector, and "People with access" list
- **Human refinement:** Added optimistic UI updates, Brevo email integration, auto-creation of shadow users for unknown email addresses, and role-change/revoke functionality

### 5. Inline Commenting System

- **AI contribution:** Suggested the approach of using ProseMirror marks to anchor comments to text ranges, and generated the comment CRUD Server Actions
- **Human refinement:** Implemented the comment-sidebar interaction (clicking highlighted text activates the comment), the draft-comment workflow with cancel/save, and the `editable=false` workaround for Commenters

### 6. File Upload

- **AI contribution:** Generated the `FileUploader.tsx` component with client-side file reading and Markdown-to-HTML conversion
- **Human refinement:** Added file-type validation, error handling, and the title-extraction logic (stripping file extensions)

### 7. Debugging & Error Resolution

AI was used extensively for diagnosing and fixing runtime errors:

| Error                                        | AI Diagnosis                                                                         |
|----------------------------------------------|--------------------------------------------------------------------------------------|
| `Module not found: @floating-ui/dom`         | Identified as a missing peer dependency of `@tiptap/extension-bubble-menu`; fix: `npm install @floating-ui/dom` |
| `BubbleMenu` import path errors              | Identified the correct Tiptap 3 import: `@tiptap/react/menus` instead of `@tiptap/react` |
| Hydration mismatches                         | Added `suppressHydrationWarning` to `<html>` and `<body>` for cookie-based dynamic rendering |

### 8. Documentation Generation

- **AI contribution:** Generated the initial drafts of `README.md`, `ARCHITECTURE.md`, `AI_WORKFLOW.md`, and `SUBMISSION.md` based on comprehensive source-code analysis
- **Human refinement:** Reviewed for accuracy, added project-specific context, and ensured alignment with the actual implementation

---

## AI Usage Principles

1. **AI as Accelerator, Not Replacement** — Every AI-generated code block was reviewed, tested, and often modified before committing. The AI did not write code unsupervised.

2. **Architecture Decisions Were Human-Driven** — The AI proposed options; final choices (e.g., mock auth over OAuth, SQLite over Postgres, Server Actions over REST) were made by the developer based on project constraints.

3. **Debugging Was Collaborative** — Error messages were shared with the AI for diagnosis. The AI identified root causes and suggested fixes, but the developer verified each fix against the actual runtime environment.

4. **No Blind Copy-Paste** — All generated code was adapted to fit the existing codebase's conventions, naming patterns, and architectural boundaries.

---

## Approximate AI Contribution Breakdown

| Area                     | AI-Generated | Human-Modified/Written |
|--------------------------|:------------:|:----------------------:|
| Database schema & seeds  | ~60%         | ~40%                   |
| Server Actions (CRUD)    | ~50%         | ~50%                   |
| Editor component         | ~40%         | ~60%                   |
| Comment system           | ~30%         | ~70%                   |
| Share dialog UI          | ~50%         | ~50%                   |
| CSS & theming            | ~40%         | ~60%                   |
| Debugging & fixes        | ~70%         | ~30%                   |
| Documentation            | ~80%         | ~20%                   |

# Backend API — Admin REST Endpoints

All routes live under `/api/admin/` and require an authenticated session (NextAuth JWT).
Any unauthenticated request returns `401 Unauthorized`.

---

## Authentication

Login is handled by NextAuth at `POST /api/auth/callback/credentials`.

```http
POST /api/auth/callback/credentials
Content-Type: application/x-www-form-urlencoded

email=admin@example.com&password=secret&callbackUrl=%2Fadmin
```

The session cookie is set automatically. All subsequent requests to `/api/admin/*` are authenticated via that cookie.

To create the first admin account:
```bash
cp .env.example .env       # set ADMIN_EMAIL, ADMIN_PASSWORD
npm run seed:admin
```

---

## Pages

### `GET /api/admin/pages`
Returns all pages ordered by `order` (ascending).

**Response 200:**
```json
[
  {
    "id": 1,
    "slug": "home",
    "title": "Обо мне",
    "order": 0,
    "isVisible": true,
    "headerVariant": "default",
    "footerVariant": "default",
    "updatedAt": "2026-03-07T12:00:00.000Z",
    "_count": { "sections": 3 }
  }
]
```

---

### `POST /api/admin/pages`
Create a new page.

**Body:**
```json
{
  "slug": "projects",
  "title": "Проекты",
  "description": "Optional meta description",
  "headerVariant": "default",
  "footerVariant": "default",
  "isVisible": false,
  "order": 1
}
```
- `slug` — required, lowercase letters, numbers, hyphens only (`[a-z0-9-]+`)
- `title` — required
- All other fields optional (have defaults)

**Response 201:** full Page object.
**Response 409:** slug already exists.

---

### `GET /api/admin/pages/:id`
Returns the page with all its sections (ordered by `section.order` asc).

**Response 200:**
```json
{
  "id": 1,
  "slug": "home",
  "title": "Обо мне",
  "sections": [
    { "id": 10, "type": "hero", "content": {}, "order": 0, "isVisible": true, ... }
  ],
  ...
}
```
**Response 404:** page not found.

---

### `PATCH /api/admin/pages/:id`
Update any subset of page fields. All fields are optional (partial update).

**Body** (any combination):
```json
{
  "title": "New title",
  "isVisible": true,
  "order": 2
}
```
`title` and `description` are automatically processed through `formatText()` (typographic quotes, non-breaking spaces, etc.) by the Prisma middleware in `lib/prisma.ts`.

**Response 200:** updated Page object.

---

### `DELETE /api/admin/pages/:id`
Deletes the page and **all its sections** (cascade delete defined in schema).

**Response 204:** no content.

---

## Sections

### `POST /api/admin/pages/:id/sections`
Create a section on the given page.

**Body:**
```json
{
  "type": "text",
  "content": {
    "heading": "Hello",
    "body": "Some text here"
  },
  "order": 0,
  "isVisible": true
}
```

Valid `type` values: `text` | `image` | `stat_card` | `hero` | `grid` | `divider` | `figma_block`

All **string values inside `content`** are automatically run through `formatText()` before saving. Non-string values (numbers, booleans, nested objects) are saved as-is.

**Response 201:** created Section object.
**Response 404:** page not found.

---

### `GET /api/admin/sections/:id`
Returns a single section.

**Response 200:** Section object.
**Response 404:** not found.

---

### `PATCH /api/admin/sections/:id`
Update any fields of a section. All fields optional.

```json
{
  "content": { "heading": "Updated heading" },
  "isVisible": false
}
```

String values inside `content` are processed by `formatText()`.

**Response 200:** updated Section object.

---

### `DELETE /api/admin/sections/:id`
Delete a single section.

**Response 204:** no content.

---

### `PATCH /api/admin/sections/reorder`
Batch-update the `order` field of multiple sections in a single transaction. Used for drag-and-drop reordering in the admin UI.

**Body:**
```json
{
  "items": [
    { "id": 10, "order": 0 },
    { "id": 11, "order": 1 },
    { "id": 12, "order": 2 }
  ]
}
```

**Response 200:** `{ "ok": true }`

> Note: All sections being reordered should belong to the same page. The API does not enforce this — it's up to the frontend.

---

## Media

### `GET /api/admin/media`
Returns all uploaded files ordered by `createdAt` (newest first).

**Response 200:**
```json
[
  {
    "id": 1,
    "filename": "550e8400-e29b-41d4-a716-446655440000.jpg",
    "originalName": "photo.jpg",
    "mimeType": "image/jpeg",
    "size": 204800,
    "url": "/uploads/550e8400-e29b-41d4-a716-446655440000.jpg",
    "createdAt": "2026-03-07T12:00:00.000Z"
  }
]
```

---

### `POST /api/admin/media`
Upload a file.

**Request:** `multipart/form-data` with a single field `file`.

```bash
curl -X POST /api/admin/media \
  -F "file=@/path/to/photo.jpg"
```

**Security checks performed (in `lib/mediaStorage.ts`):**
- Max size: **10 MB**
- MIME type verified from **magic bytes** (not the Content-Type header)
- Allowed formats: JPEG, PNG, GIF, WebP, SVG, PDF
- Saved as `/public/uploads/<uuid>.<ext>` — original filename is never used on disk

**Response 201:** Media record (same shape as GET item above).
**Response 422:** validation failed (too large, wrong type).

---

### `DELETE /api/admin/media/:id`
Deletes the file from disk and removes the database record.

**Response 204:** no content.
**Response 404:** record not found.

> If the file is already missing from disk, the DB record is still deleted successfully.

---

## Figma Import

### `POST /api/admin/import`
Creates a `figma_block` section on a page from Figma pipeline output.

**Body:**
```json
{
  "pageId": 1,
  "content": {
    "html": "<div>...</div>",
    "css": "...",
    "assets": []
  },
  "order": 5
}
```
- `pageId` — required
- `content` — arbitrary JSON object from `lib/figmaTransform.ts`
- `order` — optional; if omitted, section is appended after the last existing section

**Response 201:** created Section of type `figma_block`.

> `content` is saved as-is without running through `formatText()` — the Figma pipeline is responsible for its own content formatting.

---

## Validation Errors

All routes return a consistent error shape:

```json
{
  "error": "Validation error",
  "issues": [
    {
      "path": ["slug"],
      "message": "Only lowercase letters, numbers and hyphens"
    }
  ]
}
```

Zod schemas are defined in `lib/validate.ts`.

---

## Supporting Files

| File | Purpose |
|---|---|
| `lib/apiAuth.ts` | `requireSession()` — session check helper used by every route |
| `lib/validate.ts` | Zod schemas: `PageCreateSchema`, `SectionCreateSchema`, `ReorderSchema`, etc. |
| `lib/mediaStorage.ts` | `saveUploadedFile()`, `deleteUploadedFile()` — file I/O with MIME verification |
| `lib/prisma.ts` | Prisma client with `formatText` middleware on `page.title` and `page.description` |
| `lib/formatText.ts` | Typography formatter — do not modify without understanding DB impact |

---

## Database Schema Quick Reference

```
User      id, email, hashedPassword
Page      id, slug, title, description, headerVariant, footerVariant, isVisible, order
Section   id, pageId → Page, type (enum), content (Json), order, isVisible
Media     id, filename, originalName, mimeType, size, url
```

Cascade: deleting a Page deletes all its Sections (`onDelete: Cascade`).

---

## Running Migrations

```bash
# First time setup
npx prisma migrate dev --name init

# After schema changes
npx prisma migrate dev --name describe_change

# Production
npx prisma migrate deploy
```

-- AlterTable: add nullable sandboxSlug to Media
-- Existing records keep sandboxSlug = NULL (served at /media/:id as before).
-- Sandbox-scoped images use sandboxSlug = 'slug' and are served at /media/:slug/:id.

ALTER TABLE "Media" ADD COLUMN "sandboxSlug" TEXT;

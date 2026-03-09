-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "isVisible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Content_slug_key" ON "Content"("slug");

-- MigrateData: seed existing content from data/content.json
INSERT INTO "Content" ("id", "name", "slug", "description", "isVisible", "createdAt", "updatedAt")
VALUES (
    'f2738bd3-dbd4-4a52-a2ab-2fda868b96bd',
    'Обо мне',
    'obo-mne',
    '',
    true,
    '2026-03-09 17:05:42.448',
    '2026-03-09 17:05:42.448'
)
ON CONFLICT ("id") DO NOTHING;

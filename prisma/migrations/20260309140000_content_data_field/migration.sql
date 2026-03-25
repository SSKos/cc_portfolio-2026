-- AlterTable: add data column for sandbox text key-value store
ALTER TABLE "Content" ADD COLUMN IF NOT EXISTS "data" JSONB;

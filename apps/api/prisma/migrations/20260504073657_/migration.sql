-- AlterTable
ALTER TABLE "users" ADD COLUMN     "legacy" JSONB[] DEFAULT ARRAY[]::JSONB[];

-- CreateEnum
CREATE TYPE "DocumentVisibility" AS ENUM ('PUBLIC', 'RESTRICTED');

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "visibility" "DocumentVisibility" NOT NULL DEFAULT 'PUBLIC';

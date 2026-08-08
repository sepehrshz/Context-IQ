/*
  Warnings:

  - A unique constraint covering the columns `[hash]` on the table `Document` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `hash` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "hash" TEXT NOT NULL,
ADD COLUMN     "text" TEXT,
ALTER COLUMN "status" DROP NOT NULL,
ALTER COLUMN "createdAt" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Document_hash_key" ON "Document"("hash");

/*
  Warnings:

  - You are about to drop the `SheetProblem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SheetProblem" DROP CONSTRAINT "SheetProblem_problemId_fkey";

-- DropForeignKey
ALTER TABLE "SheetProblem" DROP CONSTRAINT "SheetProblem_sheetId_fkey";

-- DropTable
DROP TABLE "SheetProblem";

-- CreateTable
CREATE TABLE "SheetSection" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "sheetId" TEXT NOT NULL,

    CONSTRAINT "SheetSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionProblem" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "note" TEXT,

    CONSTRAINT "SectionProblem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SheetSection_sheetId_order_idx" ON "SheetSection"("sheetId", "order");

-- CreateIndex
CREATE INDEX "SectionProblem_sectionId_order_idx" ON "SectionProblem"("sectionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "SectionProblem_sectionId_problemId_key" ON "SectionProblem"("sectionId", "problemId");

-- AddForeignKey
ALTER TABLE "SheetSection" ADD CONSTRAINT "SheetSection_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "Sheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionProblem" ADD CONSTRAINT "SectionProblem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "SheetSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionProblem" ADD CONSTRAINT "SectionProblem_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

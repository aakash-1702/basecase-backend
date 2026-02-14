-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "profilePhoto" TEXT,
ADD COLUMN     "refreshToken" TEXT,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

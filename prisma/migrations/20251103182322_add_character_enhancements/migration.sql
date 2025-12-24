/*
  Warnings:

  - You are about to drop the column `copper` on the `characters` table. All the data in the column will be lost.
  - You are about to drop the column `electrum` on the `characters` table. All the data in the column will be lost.
  - You are about to drop the column `gold` on the `characters` table. All the data in the column will be lost.
  - You are about to drop the column `platinum` on the `characters` table. All the data in the column will be lost.
  - You are about to drop the column `silver` on the `characters` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SkillCategory" AS ENUM ('DANO', 'AYUDA', 'OTRO');

-- AlterTable
ALTER TABLE "attacks" ADD COLUMN     "sourceSkillId" TEXT;

-- AlterTable
ALTER TABLE "characters" DROP COLUMN "copper",
DROP COLUMN "electrum",
DROP COLUMN "gold",
DROP COLUMN "platinum",
DROP COLUMN "silver",
ADD COLUMN     "age" INTEGER,
ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "backpack" TEXT,
ADD COLUMN     "copperCoins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "electrumCoins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "eyes" TEXT,
ADD COLUMN     "goldCoins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "hair" TEXT,
ADD COLUMN     "height" TEXT,
ADD COLUMN     "initiative" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "languages" TEXT,
ADD COLUMN     "passivePerception" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "platinumCoins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "silverCoins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "skin" TEXT,
ADD COLUMN     "subrace" TEXT,
ADD COLUMN     "weight" TEXT,
ALTER COLUMN "race" DROP NOT NULL,
ALTER COLUMN "class" DROP NOT NULL;

-- AlterTable
ALTER TABLE "skills" ADD COLUMN     "category" "SkillCategory" NOT NULL DEFAULT 'OTRO',
ADD COLUMN     "description" TEXT;

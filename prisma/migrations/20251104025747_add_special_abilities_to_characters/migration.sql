-- CreateEnum
CREATE TYPE "AbilityType" AS ENUM ('ACTION', 'BONUS_ACTION', 'REACTION', 'PASSIVE');

-- CreateTable
CREATE TABLE "special_abilities" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "diceFormula" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "usesPerRest" INTEGER,
    "usesRemaining" INTEGER,
    "abilityType" "AbilityType" NOT NULL DEFAULT 'ACTION',

    CONSTRAINT "special_abilities_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "special_abilities" ADD CONSTRAINT "special_abilities_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "combat_actions" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "maxUses" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,

    CONSTRAINT "combat_actions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "combat_actions" ADD CONSTRAINT "combat_actions_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

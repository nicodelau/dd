import { requireDMOrAdmin } from '~/server/utils/auth'
import prisma from '~/server/utils/prisma'
import type { ApiResponse } from '~/types/dtos'

interface AssignCharacterRequest {
  characterId: string
  playerId: string | null // null to unassign
}

export default defineEventHandler(async (event) => {
  try {
    // Only DMs and Admins can assign characters
    await requireDMOrAdmin(event)

    const { characterId, playerId } = await readBody(event) as AssignCharacterRequest

    if (!characterId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Character ID is required'
      })
    }

    // Verify character exists
    const character = await prisma.character.findUnique({
      where: { id: characterId }
    })

    if (!character) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Character not found'
      })
    }

    // If playerId is provided, verify player exists and is a PLAYER role
    if (playerId) {
      const player = await prisma.user.findUnique({
        where: { id: playerId }
      })

      if (!player) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Player not found'
        })
      }

      if (player.role !== 'PLAYER') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Can only assign characters to users with PLAYER role'
        })
      }
    }

    // Update character assignment
    const updatedCharacter = await prisma.character.update({
      where: { id: characterId },
      data: { userId: playerId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    })

    return {
      success: true,
      data: updatedCharacter,
      message: playerId 
        ? `Character assigned to ${updatedCharacter.user?.username}` 
        : 'Character unassigned'
    } as ApiResponse<typeof updatedCharacter>

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal Server Error'
    })
  }
})
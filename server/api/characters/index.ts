import { CharacterService } from '../../application/services/CharacterService'
import type { ApiResponse, CreateCharacterDTO } from '../../../types/dtos'
import { PrismaCharacterRepository } from '../../infrastructure/repositories/PrismaCharacterRepository'
import { requireDMOrAdmin, authenticateUser } from '~/server/utils/auth'
import prisma from '../../utils/prisma'

let characterService: CharacterService | null = null

// This would normally be injected via DI container
function getCharacterService(): CharacterService {
  if (!characterService) {
    const characterRepository = new PrismaCharacterRepository(prisma)
    characterService = new CharacterService(characterRepository)
  }
  return characterService
}

export default defineEventHandler(async (event) => {
  const method = event.method
  const query = getQuery(event)
  
  try {
    switch (method) {
      case 'GET':
        // Authentication required for character access
        const user = await authenticateUser(event)
        const service = getCharacterService()
        
        if (query.player) {
          // Only allow users to view their own characters, or DMs/Admins to view any
          const targetPlayerId = query.player as string
          if (user.role === 'PLAYER' && user.id !== targetPlayerId) {
            throw createError({
              statusCode: 403,
              statusMessage: 'Can only view your own characters'
            })
          }
          
          // Use the new method to get characters by userId
          const characters = await service.getCharactersByUserId(targetPlayerId)
          return {
            success: true,
            data: characters
          } as ApiResponse<typeof characters>
        }
        
        // Only DMs and Admins can view all characters
        if (user.role === 'PLAYER') {
          throw createError({
            statusCode: 403,
            statusMessage: 'Insufficient permissions to view all characters'
          })
        }
        
        const allCharacters = await service.getAllCharacters()
        return {
          success: true,
          data: allCharacters
        } as ApiResponse<typeof allCharacters>
        
      case 'POST':
        // Only DMs and Admins can create characters
        const dmUser = await requireDMOrAdmin(event)
        
        const createData = await readBody(event) as CreateCharacterDTO
        
        // Set the owner to the creating DM/Admin
        createData.ownerId = dmUser.id
        
        // Ensure DMs and Admins are not assigned to characters they create
        // Characters should be unassigned by default and assigned separately via the assign endpoint
        createData.userId = null
        
        const newCharacter = await getCharacterService().createCharacter(createData)
        
        return {
          success: true,
          data: newCharacter,
          message: 'Character created successfully. Use the assign endpoint to assign it to a player.'
        } as ApiResponse<typeof newCharacter>
        
      default:
        throw createError({
          statusCode: 405,
          statusMessage: 'Method Not Allowed'
        })
    }
  } catch (error: any) {
    // Re-throw authentication/authorization errors
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal Server Error'
    })
  }
})
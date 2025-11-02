import { CharacterService } from '../../application/services/CharacterService'
import type { ApiResponse, UpdateCharacterDTO } from '../../../types/dtos'
import { PrismaCharacterRepository } from '../../infrastructure/repositories/PrismaCharacterRepository'
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
  const characterId = getRouterParam(event, 'id')
  
  if (!characterId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid character ID'
    })
  }
  
  try {
    const service = getCharacterService()
    
    switch (method) {
      case 'GET':
        const character = await service.getCharacterById(characterId)
        
        if (!character) {
          throw createError({
            statusCode: 404,
            statusMessage: 'Character not found'
          })
        }
        
        return {
          success: true,
          data: character
        } as ApiResponse<typeof character>
        
      case 'PUT':
        const updateData = await readBody(event) as UpdateCharacterDTO
        const updatedCharacter = await service.updateCharacter(characterId, updateData)
        
        if (!updatedCharacter) {
          throw createError({
            statusCode: 404,
            statusMessage: 'Character not found'
          })
        }
        
        return {
          success: true,
          data: updatedCharacter,
          message: 'Character updated successfully'
        } as ApiResponse<typeof updatedCharacter>
        
      case 'DELETE':
        const deleted = await service.deleteCharacter(characterId)
        
        if (!deleted) {
          throw createError({
            statusCode: 404,
            statusMessage: 'Character not found'
          })
        }
        
        return {
          success: true,
          message: 'Character deleted successfully'
        } as ApiResponse<null>
        
      default:
        throw createError({
          statusCode: 405,
          statusMessage: 'Method Not Allowed'
        })
    }
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
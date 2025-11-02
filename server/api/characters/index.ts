import { CharacterService } from '../../application/services/CharacterService'
import type { ApiResponse, CreateCharacterDTO } from '../../../types/dtos'
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
  const query = getQuery(event)
  
  try {
    switch (method) {
      case 'GET':
        const service = getCharacterService()
        
        if (query.player) {
          const characters = await service.getCharactersByPlayer(query.player as string)
          return {
            success: true,
            data: characters
          } as ApiResponse<typeof characters>
        }
        
        const allCharacters = await service.getAllCharacters()
        return {
          success: true,
          data: allCharacters
        } as ApiResponse<typeof allCharacters>
        
      case 'POST':
        const createData = await readBody(event) as CreateCharacterDTO
        const newCharacter = await getCharacterService().createCharacter(createData)
        
        return {
          success: true,
          data: newCharacter,
          message: 'Character created successfully'
        } as ApiResponse<typeof newCharacter>
        
      default:
        throw createError({
          statusCode: 405,
          statusMessage: 'Method Not Allowed'
        })
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal Server Error'
    })
  }
})
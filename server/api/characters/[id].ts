import { CharacterService } from '../../application/services/CharacterService'
import type { ApiResponse, UpdateCharacterDTO } from '../../../types/dtos'
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
  const characterId = getRouterParam(event, 'id')

  console.log('Character ID:', characterId)

  if (!characterId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid character ID'
    })
  }

  try {
    console.log('DATABASE_URL:', process.env.DATABASE_URL)
    const user = await authenticateUser(event)

    console.log('Authenticated user:', user.id, user.username)

    // Get character directly from Prisma to access userId field
    const character = await prisma.character.findUnique({
      where: { id: characterId },
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

    console.log('Character found:', character ? character.name : 'null')

    if (!character) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Character not found'
      })
    }
    
    // Check if user has access to this character
    const hasAccess = user.role === 'DM' || user.role === 'ADMIN' || character.userId === user.id
    
    if (!hasAccess) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied to this character'
      })
    }
    
    switch (method) {
      case 'GET':
        // Use the character service to get properly mapped data
        const getService = getCharacterService()
        const mappedCharacter = await getService.getCharacterById(characterId)
        
        if (!mappedCharacter) {
          throw createError({
            statusCode: 404,
            statusMessage: 'Character not found'
          })
        }
        
        return {
          success: true,
          data: mappedCharacter
        } as ApiResponse<typeof mappedCharacter>
        
       case 'PUT':
       case 'PATCH':
         // Allow character owners, DMs and Admins to modify characters
         if (user.role !== 'DM' && user.role !== 'ADMIN' && character.userId !== user.id) {
           throw createError({
             statusCode: 403,
             statusMessage: 'Access denied to modify this character'
           })
         }
        
        const updateData = await readBody(event) as UpdateCharacterDTO
        const updateService = getCharacterService()
        const updatedCharacter = await updateService.updateCharacter(characterId, updateData)
        
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
        // Only DMs and Admins can delete characters
        await requireDMOrAdmin(event)
        
        const deleteService = getCharacterService()
        const deleted = await deleteService.deleteCharacter(characterId)
        
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
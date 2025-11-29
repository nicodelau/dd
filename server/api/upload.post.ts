import { writeFile, unlink } from 'fs/promises'
import { resolve, join } from 'path'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
  const files = await readMultipartFormData(event)
  if (!files || files.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No file uploaded'
    })
  }

  const file = files[0]
  if (!file.filename) {
     throw createError({
      statusCode: 400,
      statusMessage: 'Invalid file'
    })
  }

  // Simple validation for images
  if (!file.type?.startsWith('image/')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File must be an image'
    })
  }

  const ext = file.filename.split('.').pop()
  const fileName = `${randomUUID()}.${ext}`
  
  // Ensure directory exists
  const uploadDir = resolve(process.cwd(), 'public', 'uploads')
  const filePath = join(uploadDir, fileName)

  await writeFile(filePath, file.data)

  // Delete file after 10 seconds
  setTimeout(async () => {
    try {
      await unlink(filePath)
      console.log(`Deleted temporary file: ${filePath}`)
    } catch (error) {
      console.error(`Failed to delete temporary file: ${filePath}`, error)
    }
  }, 10000)

  return {
    url: `/uploads/${fileName}`
  }
})

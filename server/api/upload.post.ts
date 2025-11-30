import { put, del } from '@vercel/blob'
import { randomUUID } from 'crypto'
import { requireDMOrAdmin } from '../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    console.log('Upload endpoint called')
    
    // Check authentication - only DMs and Admins can upload images
    console.log('Checking authentication...')
    await requireDMOrAdmin(event)
    console.log('Authentication successful')

    console.log('Reading multipart form data...')
    const files = await readMultipartFormData(event)
    if (!files || files.length === 0) {
      console.log('No files found in request')
      throw createError({
        statusCode: 400,
        statusMessage: 'No file uploaded'
      })
    }

    const file = files[0]
    console.log('File details:', { 
      filename: file.filename, 
      type: file.type, 
      size: file.data?.length 
    })
    
    if (!file.filename) {
      console.log('File has no filename')
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid file'
      })
    }

    // Simple validation for images
    if (!file.type?.startsWith('image/')) {
      console.log('File is not an image:', file.type)
      throw createError({
        statusCode: 400,
        statusMessage: 'File must be an image'
      })
    }

    const ext = file.filename.split('.').pop()
    const fileName = `uploads/${randomUUID()}.${ext}`
    console.log('Generated blob filename:', fileName)

    console.log('Uploading to Vercel Blob...')
    const blob = await put(fileName, file.data, { 
      access: 'public',
      contentType: file.type
    })
    console.log('File uploaded successfully to:', blob.url)

    // Delete file after 10 seconds
    setTimeout(async () => {
      try {
        await del(blob.url)
        console.log(`Deleted temporary file: ${blob.url}`)
      } catch (error) {
        console.error(`Failed to delete temporary file: ${blob.url}`, error)
      }
    }, 10000)

    console.log('Upload successful, returning URL')
    return {
      url: blob.url
    }
  } catch (error) {
    console.error('Upload endpoint error:', error)
    
    // If it's already a createError, just re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    // Otherwise, create a generic 500 error
    throw createError({
      statusCode: 500,
      statusMessage: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }
})

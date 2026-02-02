import { put, del } from '@vercel/blob'
import { randomUUID } from 'crypto'
import { requireDMOrAdmin } from '../utils/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

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

    // Check if we're in development or production
    const isProduction = process.env.NODE_ENV === 'production'
    const hasVercelBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN

    if (isProduction && hasVercelBlobToken) {
      // Use Vercel Blob in production
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

      console.log('Upload successful, returning Vercel Blob URL')
      return {
        url: blob.url
      }
    } else {
      // Use local file storage for development
      const ext = file.filename.split('.').pop()
      const fileName = `${randomUUID()}.${ext}`
      const publicDir = join(process.cwd(), 'public', 'uploads')
      const filePath = join(publicDir, fileName)
      
      try {
        await mkdir(publicDir, { recursive: true })
      } catch (error) {
        console.log('Upload directory already exists or created successfully')
      }
      
      await writeFile(filePath, file.data)
      console.log('File saved locally to:', filePath)
      
      const localUrl = `/uploads/${fileName}`
      console.log('Upload successful, returning local URL:', localUrl)

      // Delete file after 10 seconds for temporary use
      setTimeout(async () => {
        try {
          const { unlink } = await import('fs/promises')
          await unlink(filePath)
          console.log(`Deleted temporary file: ${filePath}`)
        } catch (error) {
          console.error(`Failed to delete temporary file: ${filePath}`, error)
        }
      }, 10000)

      return {
        url: localUrl
      }
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

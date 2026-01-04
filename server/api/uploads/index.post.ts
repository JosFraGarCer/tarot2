// server/api/uploads/index.post.ts
import { createError, getQuery, readMultipartFormData } from 'h3'
import { promises as fs } from 'node:fs'
import { join, extname, basename } from 'node:path'
import crypto from 'crypto'
import sharp from 'sharp'
import { logger } from '../../plugins/logger'

const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15 MB
const VALID_TYPE_REGEX = /^[a-z0-9_-]+$/i
const FALLBACK_EXTENSION = '.png'
const SUPPORTED_IMAGE_FORMATS = new Set(['jpeg', 'jpg', 'png', 'webp', 'gif', 'svg', 'avif'])
const OPTIMIZABLE_FORMATS = new Set(['jpeg', 'jpg', 'png', 'webp'])
const _LOSSLESS_TARGET_FORMAT = 'avif' // Reserved for future use
const MAX_DIMENSION = 1600

const createUploadError = (statusCode: number, code: string, message: string) =>
  createError({
    statusCode,
    statusMessage: message,
    data: { code, message },
  })

const sanitizeFilename = (filename: string, mimeType?: string) => {
  let extension = extname(filename).toLowerCase()

  if (!extension && mimeType?.startsWith('image/')) {
    extension = `.${mimeType.split('/')[1] || 'png'}`
  }
  if (!extension) {
    extension = FALLBACK_EXTENSION
  }

  const name =
    basename(filename, extension)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-') || 'upload'

  return { extension, base: name }
}

type FormDataFile = {
  data: Buffer
  filename?: string
  type?: string
}

const isFormDataFile = (item: unknown): item is FormDataFile =>
  !!item && typeof item === 'object' && (item as FormDataFile).data instanceof Buffer && typeof (item as FormDataFile).filename === 'string'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const type = (query.type as string) || 'general'

  if (!VALID_TYPE_REGEX.test(type)) {
    throw createUploadError(400, 'INVALID_UPLOAD_TYPE', 'Invalid upload type')
  }

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createUploadError(400, 'FILE_MISSING', 'No file provided')
  }

  const file = formData.find((item) => isFormDataFile(item)) as FormDataFile | undefined
  if (!file || !file.data || !file.filename) {
    throw createUploadError(400, 'INVALID_FILE', 'Invalid file upload')
  }

  const mimeType = file.type || ''

  // 🧩 Validamos metadatos y formato
  let metadata
  try {
    metadata = await sharp(file.data, { failOn: 'warning' }).metadata()
  } catch {
    throw createUploadError(415, 'CORRUPTED_IMAGE', 'Invalid or corrupted image file')
  }

  const detectedFormat = metadata?.format?.toLowerCase()
  if (!detectedFormat || !SUPPORTED_IMAGE_FORMATS.has(detectedFormat)) {
    throw createUploadError(415, 'UNSUPPORTED_IMAGE_FORMAT', 'Unsupported image format')
  }

  const normalizedFormat = detectedFormat === 'jpg' ? 'jpeg' : detectedFormat

  // 🚫 Validamos MIME vs formato real
  const reportedSubtype = mimeType.split('/')[1]?.split(';')[0]?.toLowerCase()
  const allowedSubtypes: Record<string, string[]> = {
    jpeg: ['jpeg', 'pjpeg', 'jpg'],
    png: ['png'],
    webp: ['webp'],
    gif: ['gif'],
    svg: ['svg', 'svg+xml'],
    avif: ['avif'],
  }

  if (mimeType && !allowedSubtypes[normalizedFormat]?.includes(reportedSubtype || '')) {
    throw createUploadError(415, 'MIME_MISMATCH', 'MIME type does not match image contents')
  }

  if (file.data.length > MAX_FILE_SIZE) {
    throw createUploadError(413, 'FILE_TOO_LARGE', 'File size exceeds 15MB limit')
  }

  // 🧾 Nombre final único
  const { base } = sanitizeFilename(file.filename, mimeType)
  const timestamp = Date.now()
  const hash = crypto.randomBytes(4).toString('hex')

  let finalExtension = `.${normalizedFormat}`
  let finalFilename = `${base}-${timestamp}-${hash}${finalExtension}`

  const uploadDir = join(process.cwd(), 'public', 'img', type)
  await fs.mkdir(uploadDir, { recursive: true })

  let optimizedBuffer = file.data

  // ⚡ Evita reconvertir si ya es AVIF o WEBP
  const shouldOptimize = OPTIMIZABLE_FORMATS.has(normalizedFormat)

  if (shouldOptimize) {
    try {
        optimizedBuffer = await sharp(file.data, { failOn: 'warning' })
          .resize({
            width: MAX_DIMENSION,
            height: MAX_DIMENSION,
            fit: 'inside',
            withoutEnlargement: true,
          })
          .rotate() // corrige orientación y elimina metadatos EXIF
          .avif({
            lossless: false,
            quality: 72,
            effort: 4,
            chromaSubsampling: '4:4:4',
          })
          .toBuffer()

      finalExtension = '.avif'
      finalFilename = `${base}-${timestamp}-${hash}${finalExtension}`
    } catch (err) {
      logger.warn({ err }, 'AVIF optimization failed, using original file')
    }
  }

  const filePath = join(uploadDir, finalFilename)
  await fs.writeFile(filePath, optimizedBuffer)

  const relativePath = `${type}/${finalFilename}`

  return {
    success: true,
    type,
    filename: finalFilename,
    path: relativePath,
    url: `/img/${relativePath}`,
  }
})

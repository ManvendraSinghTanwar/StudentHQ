import Tesseract from 'tesseract.js'

let worker: Tesseract.Worker | null = null

/**
 * Initialize or get the Tesseract worker
 */
async function getOCRWorker(): Promise<Tesseract.Worker> {
  if (worker) {
    return worker
  }

  try {
    worker = await Tesseract.createWorker('eng')
    return worker
  } catch (error) {
    console.error('[v0] Failed to initialize OCR worker:', error)
    throw error
  }
}

/**
 * Extract text from an image file using OCR
 * Returns the extracted text or null if OCR fails
 */
export async function extractTextFromImage(file: File): Promise<string | null> {
  try {
    // Only process image files
    if (!file.type.startsWith('image/')) {
      return null
    }

    console.log('[v0] Starting OCR on image:', file.name)

    const worker = await getOCRWorker()
    
    // Create a temporary URL for the file
    const imageUrl = URL.createObjectURL(file)
          // Set a timeout for OCR recognition (20 seconds max)
          const recognizePromise = worker.recognize(imageUrl)
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('OCR recognition timeout')), 20000)
          )
          const result = await Promise.race([recognizePromise, timeoutPromise])
    
    try {
      const result = await worker.recognize(imageUrl)
      const extractedText = result.data.text.trim()
      
      console.log('[v0] OCR extraction complete. Text length:', extractedText.length)
        console.log('[v0] OCR extracted text preview:', extractedText.substring(0, 200))
      
      URL.revokeObjectURL(imageUrl)
      
      return extractedText || null
      console.error('[v0] OCR recognize error:', error)
    } catch (error) {
      URL.revokeObjectURL(imageUrl)
      throw error
    }
  } catch (error) {
    console.error('[v0] OCR extraction failed:', error)
    // Return null on failure, don't throw - let the app continue
    return null
  }
}

/**
 * Terminate the OCR worker to free resources
 */
export async function terminateOCRWorker() {
  if (worker) {
    try {
      await worker.terminate()
      worker = null
      console.log('[v0] OCR worker terminated')
    } catch (error) {
      console.error('[v0] Error terminating OCR worker:', error)
    }
  }
}

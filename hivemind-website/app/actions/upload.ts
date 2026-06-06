'use server'

import cloudinary from "@/lib/cloudinary"

export async function uploadImages(formData: FormData) {
  const files = formData.getAll("file") as File[]
  
  if (!files || files.length === 0) {
    return { error: "No files provided" }
  }

  const uploadPromises = files.map(async (file) => {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    return new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "hivemind-uploads",
          resource_type: "auto",
          moderation: "webpurify",
        },
        // FIX: Add ': any' to result so TS stops complaining
        (error, result: any) => {
          if (error) reject(error)
          else if (result?.moderation?.[0]?.status === "rejected") {
             cloudinary.uploader.destroy(result.public_id)
             reject(new Error("Image rejected"))
          }
          else resolve(result!.secure_url)
        }
      ).end(buffer)
    })
  })

  try {
    const urls = await Promise.all(uploadPromises)
    return { urls }
  } catch (error) {
    console.error("Upload error:", error)
    return { error: "One or more images failed to upload" }
  }
}
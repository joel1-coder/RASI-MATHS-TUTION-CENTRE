import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

// Default credentials provided by the user
export const CLOUDINARY_DEFAULTS = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "bp9b7ok6",
  api_key: process.env.CLOUDINARY_API_KEY || "265169523477216",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
};

export function initCloudinary(customSecret?: string) {
  const secret = customSecret || process.env.CLOUDINARY_API_SECRET || CLOUDINARY_DEFAULTS.api_secret;
  cloudinary.config({
    cloud_name: CLOUDINARY_DEFAULTS.cloud_name,
    api_key: CLOUDINARY_DEFAULTS.api_key,
    api_secret: secret,
    secure: true,
  });
  return Boolean(secret);
}

// Initial configuration call
initCloudinary();

export type CloudinaryUploadResult = {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  resourceType: string;
  bytes: number;
  originalFilename?: string;
  optimizeUrl?: string;
  autoCropUrl?: string;
};

export async function uploadToCloudinary(options: {
  fileData: string; // Base64 string or image/document URL
  folder?: string;
  publicId?: string;
  apiSecret?: string;
  resourceType?: "auto" | "image" | "raw" | "video";
}): Promise<CloudinaryUploadResult> {
  const { fileData, folder = "rasi_maths_uploads", publicId, apiSecret, resourceType = "auto" } = options;

  if (apiSecret) {
    initCloudinary(apiSecret);
  } else if (!process.env.CLOUDINARY_API_SECRET && !CLOUDINARY_DEFAULTS.api_secret) {
    throw new Error(
      "Cloudinary API Secret is required. Please set CLOUDINARY_API_SECRET in your environment or provide it in the upload request."
    );
  }

  const uploadOptions: Record<string, any> = {
    folder,
    resource_type: resourceType,
    use_filename: true,
    unique_filename: true,
  };

  if (publicId) {
    uploadOptions.public_id = publicId;
  }

  const result: UploadApiResponse = await cloudinary.uploader.upload(fileData, uploadOptions);

  // Generate Cloudinary transformations as requested by user
  let optimizeUrl: string | undefined;
  let autoCropUrl: string | undefined;

  if (result.resource_type === "image") {
    optimizeUrl = cloudinary.url(result.public_id, {
      fetch_format: "auto",
      quality: "auto",
      secure: true,
    });

    autoCropUrl = cloudinary.url(result.public_id, {
      crop: "auto",
      gravity: "auto",
      width: 500,
      height: 500,
      secure: true,
    });
  }

  return {
    url: result.url,
    secureUrl: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    resourceType: result.resource_type,
    bytes: result.bytes,
    originalFilename: result.original_filename,
    optimizeUrl,
    autoCropUrl,
  };
}

export function getCloudinaryTransformations(publicId: string) {
  return {
    optimizeUrl: cloudinary.url(publicId, {
      fetch_format: "auto",
      quality: "auto",
      secure: true,
    }),
    autoCropUrl: cloudinary.url(publicId, {
      crop: "auto",
      gravity: "auto",
      width: 500,
      height: 500,
      secure: true,
    }),
  };
}

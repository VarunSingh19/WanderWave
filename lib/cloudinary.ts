import { v2 as cloudinary } from "cloudinary";

// Use environment variables or fallback to hardcoded values as backup
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "dvbw76boh";
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || "988965663417232";
const CLOUDINARY_API_SECRET =
  process.env.CLOUDINARY_API_SECRET || "Vo8HobpUEydUNcPg8GNw916jupI";

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

export const uploadMedia = async (
  file: string,
  resourceType: "image" | "video" = "image"
): Promise<string> => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: "wanderwave-messages",
      resource_type: resourceType,
    });
    return result.secure_url;
  } catch (error) {
    console.error("Error uploading media to Cloudinary:", error);
    throw new Error("Failed to upload media");
  }
};

export const uploadImage = uploadMedia;

export default cloudinary;
